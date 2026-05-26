# BookSwap — Observability Plan
# Setup

## Logs
- Platform: Azure Monitor Logs
- Retention: 30 days
- Redaction rules:
  - Remove JWT tokens before logging
  - Remove phone numbers and addresses from logs
  - Mask borrower IDs in public logs
- Log schema includes:
  - requestId
  - memberId
  - endpoint
  - statusCode
  - timestamp

## Metrics
- Platform: Azure Application Insights
- Metrics collected:
  - Request latency
  - Error rate
  - Listing creation success rate
  - Queue depth
  - Redis cache hit rate
  - SQL dependency duration

## Traces
- Platform: Application Insights distributed tracing
- Trace sample rate:
  - 100% errors
  - 10% successful requests
- Distributed traces include:
  - API
  - Azure SQL
  - Redis
  - Service Bus

# Signal Inventory

| # | Signal Type | Source | What it Answers | Sample Query / Metric |

| 1 | Metric | Application Insights | Is search meeting latency targets? | `requests | summarize percentile(duration, 95) by bin(timestamp, 1m)` |
| 2 | Metric | Application Insights | Are listings being created successfully? | `requests | where name == "POST /books" | summarize successRate = avg(success)` |
| 3 | Log | App Insights traces | Which users are failing authentication? | `traces | where customDimensions.event == "auth.failed"` |
| 4 | Trace | Application Insights | Where is request latency occurring across Redis and SQL? | Distributed trace waterfall view |
| 5 | Metric | Azure Service Bus | Is the email digest queue backing up? | `ActiveMessages` |
| 6 | Metric | Redis metrics | Is cache performance degrading? | `cacheHitRate` |
| 7 | Log | Azure Monitor Logs | Are loan creation events audited correctly? | `traces | where customDimensions.event == "loan.created"` |
| 8 | Trace | App Insights | Which dependency is failing during listing creation? | Dependency duration traces |

# Results Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| SLOs covered by an alert | 100% | 100% |
| Alerts with a clear runbook link | 100% | 100% |
| Dashboards for ops | 1 health, 1 business | 2 |

# Alert Proposal

| Alert | Condition | Severity | Notification | Runbook |
|-------|-----------|----------|--------------|---------|
| Search latency burn | p95 latency > 800 ms for 5 min | Sev2 | PagerDuty + Teams | reliability/runbook.md#search |
| Listing failure spike | POST /books success rate < 99% over 10 min | Sev1 | Pager + SMS | reliability/runbook.md#listings |
| Listings endpoint outage | Availability = 0 for 3 min | Sev1 | Pager + Teams | reliability/runbook.md#outage |
| Redis cache degradation | cache hit rate < 70% | Sev3 | Teams channel | reliability/runbook.md#cache |
| Email queue backlog | Queue depth > 1000 messages | Sev3 | Teams channel | reliability/runbook.md#queue |
| Authentication failure spike | auth.failed events > baseline | Sev2 | Security Teams alert | security/runbook.md#auth |
| SQL dependency latency | SQL duration > 1 second p95 | Sev2 | Pager + Teams | reliability/runbook.md#database |


# What We Are Deliberately NOT Alerting On

1. Individual 404 Not Found responses because these are expected during normal user behaviour and would create noisy alerts.

2. Single failed email digest sends because the notification system is best-effort and retries already exist through Azure Service Bus.

3. Low-severity ZAP informational findings because they do not immediately impact availability or security posture.