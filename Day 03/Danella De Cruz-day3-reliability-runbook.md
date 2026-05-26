# BookSwap — Reliability Runbook v0.1

## Failure 1: Azure SQL primary unavailable for 5 minutes

### What the user sees
- If a user tries to list a new book or request a borrow they won't be able to write data to the database and will experience long waiting time and 5xx network errors.
- Lenders trying to accept a borrow request or mark a returned book will experience errors since physical book handouts won't be marked manually.
- If th esystem does not have a cache layer for searching operations the user will experience 5xx errors.

### Detection
-Azure alert : Database availability dropping to 0? on Azure SQL
-SQL exceptions

### Mitigation in design (timeouts, retries, circuit breaker, fallback)
- Read Fallback: If you have an active Azure SQL replica, the code should instantly catch the connection failure on GET /books and route traffic to the read-only secondary replica. Users can still browse books, even if they can't list new ones.

- Retries with Backoff: Implement a retry policy so that instead of failing immediately, the app will retry transient errors up to 3 times with an exponential backoff starting at 3s before giving up.

- Circuit Breaker: If database calls fail consistently for 10 seconds, a circuit breaker trips open for 30 seconds, immediately returning a clean 503 Service Unavailable to incoming requests without overwhelming the struggling database and move to half open allowing one request to be tested so that if it works requests can be resumed.

- Idempotency Keys: For endpoints like POST /books/borrow-requests, users might hit "Submit" multiple times out of frustration or slow loading and connectivity. Using an Idempotency Key header ensures that if a retried request finally slips through right as the database recovers, it won't create duplicate borrow requests.

### Manual response (who is paged, what they do)
- The On-Call DevOps Engineer is automatically paged via PagerDuty based on the Azure SQL Availability alert.

###what they do

- Log into the Azure Portal and check the status of the Primary Azure SQL database.
- If the database is unresponsive, check the Azure Status Dashboard to see if it is a widespread region outage.
- If it's a local database corruption issue, execute a manual failover to the Secondary Read/Write Replica using the Azure CLI command: az sql db failover.
- Post a status update on the community Slack channel letting users know the BookSwap marketplace is experiencing temporary login and posting issues.

### Post-incident actions
- plan long-term engineering fixes

## Failure 2: Azure Cache for Redis is down
- Redis is typically used for two critical things: session/JWT caching and read caching (storing the active list of books in the apartment building to avoid hitting the database constantly).

### What the user sees
- Degraded Performance: The good news is users can still list and borrow books. The bad news is that GET /books and GET /books/{bookId} will suddenly become much slower. Without Redis, every single search query hits the Azure SQL database directly, increasing page load times from ~50ms to upwards of several seconds.

- Potential Auth Failures: If you use Redis to manage blacklisted JWTs or active session states, users might suddenly find themselves kicked out of the app and forced to log back in or getting 401 Unauthorized errors on endpoints like GET /loans.

### Detection
-Azure Alert: Cache Hits drops to zero and Server Errors spikes on the Azure Cache for Redis resource page.

-Log Exceptions: Application insights will log RedisConnectionException or RedisTimeoutException ("No connection is available to service this operation").

### Mitigation in design

- Cache-Aside Fallback: The application code must treat Redis as an optional optimization, not a hard dependency. If a Redis call fails, the code should catch the exception, log a warning, and fall back directly to querying the Azure SQL database.

- Circuit Breaker: Place a circuit breaker on the Redis client. If Redis goes down, stop trying to reach it for 60 seconds. This avoids adding extra latency (waiting for Redis timeouts) to every single user request.

### Manual response
- Hold a post-mortem meeting within 48 hours with the backend engineering team to review why the application didn't gracefully handle the Redis disconnection.

### Post-incident actions
- Follow-up Engineering Tickets (Jira):

Ticket #BS-402: Update the RedisCacheService implementation to explicitly catch RedisConnectionException and immediately fall back to the Azure SQL DB without bubbling up an error to the user interface.

Ticket #BS-403: Implement a Polly-based Circuit Breaker on the Redis client wrapper to stop sending traffic to Redis for 60 seconds if 5 consecutive connection timeouts occur.

Ticket #BS-404: Set up a weekly automated chaos engineering test (e.g., using Azure Chaos Studio) that drops the Redis connection for 10 minutes in the Staging environment to verify the fallback logic continuously works.

## Failure 3: Sunday tabloid spike — 10× sustained traffic

### What the user sees

- Extreme Slowness: The API servers and database will struggle to keep up with the volume of concurrent requests. Pages like GET /books will take an incredibly long time to load or timeout entirely.

- Intermittent Gateways Errors: Users will start seeing 502 Bad Gateway or 504 Gateway Timeout pages as the load balancer or ingress gateway times out waiting for the congested backend API instances to reply.

### Detection
- Azure Alert: CPU Percentage or Memory Percentage hitting 90%+ on the Azure App Service Plan, alongside a massive surge in Requests per second.

- Database Metrics: Azure SQL DTU Percentage or CPU Percentage hitting 100% capacity.

### Mitigation in design (autoscale, queue depth, throttling)

- Autoscale Rules: Configure your Azure App Service to automatically scale out (add more server instances) when average CPU usage exceeds 70% for more than 5 minutes, up to a maximum cap (e.g. 10 instances).

- Rate Limiting : Implement an API rate limiter. If a single user (or a malicious bot caught up in the hype) requests GET /books more than 60 times a minute, the API immediately cuts them off with an HTTP 429 Too Many Requests.

- Pagination Limits: Your OpenAPI spec already smartly defines pageSize with a maximum of 100. This design choice prevents a user from requesting 10,000 books at once, which would instantly crash the server during a high traffic event.

### Manual response
- The On-Call DevOps/Infrastructure Engineer is paged via PagerDuty due to the CPU Percentage > 90% alert on the Azure App Service Plan.

What they do:

- Acknowledge the Incident: Mark the incident as acknowledged in PagerDuty to stop escalation.

- Check Resource Constraints: Open the Azure Portal and check the Azure SQL Database metrics. If the database DTU/CPU is at 100%, scaling out the app instances won't help; the database is the bottleneck.

- Manual Infrastructure Scaling (Emergency Override): * If the database is fine but the web server is choking, manually bump the Azure App Service scale limit from 10 instances to 20 instances immediately via the portal or CLI: az appservice plan update --name BookSwapPlan --resource-group BookSwapRG --number-of-workers 20.

- If the database is at 100% DTU, scale up the database performance tier (e.g., from Standard S3 to Premium P2) to give it more processing headroom.

- Enact Aggressive Rate Limiting: If traffic continues to climb and threatens to crash the entire system, update the Azure API Management (APIM) policy to temporarily lower the rate limit threshold (e.g., from 60 requests/min to 20 requests/min) to protect the core database.

- Communicate Status: Update the BookSwap status page to reflect "Performance Degradation: We are experiencing unusually high traffic and are scaling up resources to accommodate all readers."

### Post-incident actions
- Root Cause Analysis: Hold a post-incident review to analyze why the configured autoscale rules did not scale out fast enough to handle the sudden 10× spike (e.g., was the "cool-down" period too long, or did the database bottleneck everything?).

- Follow-up Engineering Tickets (Jira):

Ticket #BS-501 (Infrastructure): Adjust Azure App Service Autoscale rules to be more aggressive. Change the trigger from "Average CPU > 70% for 5 minutes" to "Average CPU > 65% for 2 minutes", and increase the scale-out increment from +1 instance to +3 instances at a time.

Ticket #BS-502 (Performance): Implement Azure SQL Database Elastic Scale or read-replicas specifically for the GET /books (Search) query, ensuring that heavy read traffic from a tabloid feature doesn't block the write operations for borrowing or listing books.

Ticket #BS-503 (Caching): Review the TTL (Time-To-Live) configurations in Redis for the book marketplace catalog. Increase the cache lifetime of public book searches during peak hours so that 95% of search traffic never hits the primary database at all.