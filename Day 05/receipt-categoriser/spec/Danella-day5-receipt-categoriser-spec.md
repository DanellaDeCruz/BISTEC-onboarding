# Receipt Categoriser — Feature Spec v0.1

## 1. Why
- The user / business outcome we are solving
GreenChit currently relies on claimants to manually select an expense category when submitting reimbursement claims. This can lead to inconsistent categorisation, slower claim submission and additional review effort by managers and finance.

- Expected business outcomes
Reduce claimant effort when submitting claims
Improve category consistency across claims

- The metric this feature is expected to move

The Receipt Categoriser aims to improve user experience by automatically suggesting an expense category based on receipt contents while allowing users to override the suggestion.

it'll allow for:

≥70% of users accept the suggested category
Suggestion displayed within 4 seconds p95

## 2. Scope
- In scope (1-3 bullets)

OCR extraction from uploaded receipt images
Automatic category suggestion
Confidence scoring and review indication
Logging of accepted and overridden suggestions

- Affects which containers / services from Day 4

| Component                      | Impact                      |
| ------------------------------ | --------------------------- |
| GreenChit Claims API           | New categorisation endpoint |
| Azure AI Document Intelligence | OCR processing              |
| Azure OpenAI                   | Category inference          |
| Application Insights           | Event logging               |
| Azure App Configuration        | Feature flag                |

## 3. Contract
### Inputs
- Receipt image (jpeg/png, <= 10 MB) plus claim ID
{
  "claimId": "string",
  "receiptImage": "jpeg|png",
  "size": "<=10MB"
}
### Outputs
- { category: enum, confidence: float, source: "llm" | "rule-based" }
{
  "category": "Meals",
  "confidence": 0.82,
  "source": "llm"
}
### Errors
- 400: bad input, 413: too large, 502: upstream OCR/LLM unavailable
| Status | Description            |
| ------ | ---------------------- |
| 400    | Invalid image format   |
| 413    | File exceeds 10 MB     |
| 502    | OCR or LLM unavailable |

### Side effects
- Application Insights customEvent emitted
{
  "claimId": "123",
  "category": "Meals",
  "confidence": 0.82,
  "source": "llm",
  "accepted": true
}
## 4. Acceptance criteria
- See deliverable 2
The feature satisfies all acceptance criteria defined in: Danella-day5-receipt-categoriser-acceptance.md
## 5. Examples
- At least 3 in/out examples (happy, ambiguous, error)

Example 1 — Restaurant Receipt

Input OCR:

Burger King
Cheeseburger
Coke
Total LKR 2400

Output:

{
  "category": "Meals",
  "confidence": 0.91,
  "source": "llm"
}

Example 2 — Ambiguous Receipt

Input OCR:

Notebook
Pen
Coffee
Total LKR 1500

Output:

{
  "category": "Office Supplies",
  "confidence": 0.55,
  "source": "llm"
}

UI:

Needs Review

Example 3 — OCR Failure

Output:

{
  "category": "Other",
  "confidence": 0.0,
  "source": "rule-based"
}

Message:

Unable to read receipt contents.
Please verify the category manually.

## 6. Out of scope
- Multi-receipt batch upload
- Auto-submission without claimant confirmation
- Category creation by users
- Receipt fraud detection

## 7. Open questions
- What confidence threshold should trigger "Needs review"?
- Do we want to learn from overrides (active learning) in v1?
- Should finance users see original suggestions after override?
- How long should categorisation telemetry be retained?