# Receipt Categoriser — Acceptance Criteria

## AC-01 happy path: clear meal receipt
**Given** a receipt image of a restaurant bill totalling LKR 2,400
**When** the claimant uploads it via POST /claims/{id}/receipts/categorise
**Then** the response is 200 OK with `{ "category": "Meals", "confidence": >= 0.7, "source": "llm" }`
**And** an Application Insights customEvent `categoriser.suggested` is emitted within 5 seconds
{
  "category": "Meals",
  "confidence": 0.7,
  "source": "llm"
}
## AC-02 ambiguous receipt
**Given** a receipt with mixed items (food + stationery)
**When** categorisation completes
**Then** the suggestion includes confidence and at least one of `category` / `needs_review` is set per the threshold
**And** if confidence < 0.6 the UI displays: Needs Review

## AC-03 LLM unavailable — fallback
**Given** Azure OpenAI is returning 503
**When** the claimant uploads a receipt
**Then** the response is 200 OK with `source: "rule-based"` and confidence <= 0.5

## AC-04 OCR failure
**Given** an image that Document Intelligence cannot parse
**When** categorisation is requested
**Then**
{
  "category": "Other",
  "confidence": 0.0
}
is returned
**And** the user sees:Unable to read receipt contents.

## AC-05 oversized payload
**Given** a receipt image larger than 10 MB
**When** uploaded
**Then**
413 Payload Too Large is returned.

## AC-06 PII boundary
**Given** a receipt with a customer name and credit card last 4
**When** the request is processed
**Then** the customEvent payload contains no PII and no full card number