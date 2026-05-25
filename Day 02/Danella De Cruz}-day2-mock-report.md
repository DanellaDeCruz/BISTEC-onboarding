# BookSwap — Mock Smoke Test Report

## Setup

- Prism command used:

```bash
npx @stoplight/prism-cli mock bookswap-openapi.yaml -p 4011

Tool used for testing:
- VS Code terminal with curl commands

## Results Summary
| Metric | Target | Achieved |
|--------|--------|----------|
| Tests run | 5 | 5 |
| Tests passing against the mock | 5 | 5 |
| Endpoints with explicit error responses | 4+ | 4 |

#Test results
    Endpoint |	Method |  Body / Params |       Expected Status | Actual Status
1   /books	    GET	        page=1&pageSize=20	    200	            200
2	/books	    POST	    valid book payload	    201	            201
3	/books	    POST	missing title / invalid content type	400 or 422	    422
4	/books/999/borrow-requests	POST	borrower JWT	201	        201
5	/books	GET	    no Authorization header	        401	                401

## Findings
- What did the mock reveal that the OpenAPI on its own did not?
The mock server revealed that security requirements in OpenAPI are actively enforced. Requests without the Authorization header immediately returned 401 Unauthorized.
Validation rules defined in the OpenAPI schema were enforced by Prism. Requests using the wrong content type (application/json instead of multipart/form-data) returned 422 Validation Error.
Testing the API through curl and Prism made it easier to understand how request validation and status codes behave before implementing a real backend.

- Which endpoints feel awkward to call?
The /books POST endpoint initially felt awkward to test because file uploads required multipart/form-data, which is harder to send manually from curl.

## Spec changes you would make
- 1.Change the /books POST request body from multipart/form-data to application/json during early development and mock testing.
- 2. Add reusable ErrorResponse schemas under components.schemas to standardize validation and authentication error responses.
- 3. Add stricter validation rules for page and pageSize query parameters using minimum and maximum constraints.
