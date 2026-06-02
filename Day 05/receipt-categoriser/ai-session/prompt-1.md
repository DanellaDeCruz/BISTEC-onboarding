# Prompt 1

Create a TypeScript implementation for the GreenChit Receipt Categoriser feature.

Requirements:

* Create `categoriser.ts`, `llm-categoriser.ts`, and `rule-based-categoriser.ts`.
* Follow the provided feature specification.
* Output must match:

```json
{
  "category": "string",
  "confidence": 0.0,
  "source": "llm | rule-based"
}
```

* Use Azure OpenAI for categorisation.
* Include fallback logic for failures.
* Include confidence scoring.
* Do not include fields that are not defined in the specification.
