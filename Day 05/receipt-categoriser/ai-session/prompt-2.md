# Prompt 2

Update the Receipt Categoriser implementation to satisfy the acceptance criteria.

Requirements:

* Add fallback behaviour when Azure OpenAI returns 503.
* Return `source: "rule-based"` when fallback is used.
* Ensure fallback confidence is less than or equal to 0.5.
* Handle OCR failures by returning:

```json
{
  "category": "Other",
  "confidence": 0.0
}
```

* Create Jest acceptance tests covering AC-01 through AC-06.
* Verify telemetry does not contain customer names or card numbers.
