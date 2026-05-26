Category  |	Question |	Finding	| Severity (H/M/L)| Mitigation

#1 Authn | Is every non-public endpoint protected by JWT? | Yes, global bearerAuth is enforced. However, error responses (like 422 Validation Failed on POST /books) may leak internal framework stack traces if unhandled.| L | Implement a global exception filter to catch validation/runtime errors and return standardized, sanitized JSON error payloads.

#2 Authz| Does every /{id}-shaped endpoint check object ownership? | No. PATCH /borrow-requests/{requestId} accepts a boolean to accept/decline. The schema does not enforce that the calling user is the actual owner of the book being requested (BOLA vulnerability). |  H | Update backend controller logic to query the database, ensuring the authenticated user's ID matches the ownerId of the book linked to that requestId before processing the patch.

#3 Injection| Are all DB queries parameterised? | The OpenAPI layer defines strict types (string, integer), preventing basic parameter injection at the gateway level. However, internal string concatenation in search filters (GET /books) poses a risk. | M | Ensure the backend uses an ORM (like Entity Framework Core) or parameterized SQL commands for the title, author, and isbn query parameters.

#4 Secrets | Where are connection strings stored? | The API server is defined at https://api.bookswap.local. If connection strings or JWT signing keys are bundled in code or local config files, they are exposed. |  H | Store the database connection string and JWT private keys in Azure Key Vault, injecting them into the App Service environment variables at runtime.

#5 Transport| Is TLS enforced at Front Door?	| The spec specifies https://api.bookswap.local, indicating TLS is intended. However, there is no automatic redirection from HTTP to HTTPS documented. | M | Configure Azure Front Door / App Service to enforce HTTPS-only traffic and reject any incoming plain text HTTP requests on port 80.

#6 Rate limit| Are auth and write endpoints rate-limited? | No. Sensitive write endpoints like POST /books (which processes binary data/photos) and POST /books/{bookId}/borrow-requests have no rate limits defined. | H  | Implement an Azure API Management (APIM) rate-limiting policy limiting write requests to a maximum of 10 requests per minute per authenticated user.

#7 PII | What PII appears in responses, logs, or queues?| GET /books/{bookId} returns BookDetails, which contains an array of Loan objects. This exposes the borrowerId historically to anyone querying the book details, leaking community reading habits. | M  | Mask or strip out historical borrowerId strings from public GET /books/{bookId} responses unless the requester is the book owner or administrator.

## Broken Object Level Authorization (BOLA) Scenario

An attacker can manipulate the requestId parameter in the path of the request approval endpoint to accept borrow requests for books they do not own, or accept their own requests on behalf of other lenders.

Target URL: PATCH https://api.bookswap.local/borrow-requests/req-999-bad-actor

Malicious Request:

HTTP
PATCH /borrow-requests/req-999-bad-actor HTTP/1.1
Host: api.bookswap.local
Authorization: Bearer <Attacker_JWT_Token>
Content-Type: application/json

{
  "accept": true
}
Impact: If the backend only checks if <Attacker_JWT_Token> is a valid login token but fails to verify if the attacker actually owns the book associated with req-999-bad-actor, the attacker can force-approve loans across the entire apartment complex.

## PII Leakage via Logs & Telemetry
When a user lists a new book using POST /books, the endpoint requires a mandatory isbn string and a binary photo.

If validation fails (generating a 422 Validation Failed ) generic logging frameworks often dump the entire inbound Request Body—including raw binary data, metadata, or associated user context—directly into application telemetry logs (e.g., Azure Application Insights or Log Analytics).

## Missing Rate-Limiting on Sensitive Endpoints
The endpoint POST /books allows a user to upload a binary photo representation of their book alongside text details.

The Attack: Because no rate limits are defined, a malicious actor or a broken automated script could execute a loop sending thousands of multi-megabyte binary payloads per minute to the server.

This quickly triggers an application layer Denial of Service (DoS) by saturating server disk space, exhausting network bandwidth and blowing up processing memory, rendering the BookSwap app completely unresponsive for the entire building.

Threats Tracking Spreadsheet (threats.csv)
To generate your required threats.csv file, copy the comma-separated data block below:
Category,Question,Finding,Severity,Mitigation Owner
Authn,Is every non-public endpoint protected by JWT?,Validation errors may leak framework details,L,Backend Team
Authz,Does every /{id}-shaped endpoint check object ownership?,PATCH /borrow-requests/{requestId} vulnerable to BOLA,H,Backend Team
Injection,Are all DB queries parameterised?,Search filters could allow SQL injection if concatenated,M,Backend Team
Secrets,Where are connection strings stored?,Secrets may leak if stored in config files,H,Platform Team
Transport,Is TLS enforced at Front Door?,HTTP to HTTPS redirect not explicitly enforced,M,Infrastructure Team
Rate limit,Are auth and write endpoints rate-limited?,Sensitive write endpoints lack throttling,H,Platform Team
PII,What PII appears in responses logs or queues?,Borrower history leaks borrowerId in BookDetails,M,Backend Team