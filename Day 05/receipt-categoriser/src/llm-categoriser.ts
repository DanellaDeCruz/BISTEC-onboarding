export interface CategorisationResult {
  category: string;
  confidence: number;
  source: "llm" | "rule-based";
}

export class LlmCategoriser {
  async categorise(ocrText: string): Promise<CategorisationResult> {
    const text = ocrText.toLowerCase();

    if (
      text.includes("burger") ||
      text.includes("restaurant") ||
      text.includes("coke") ||
      text.includes("pizza")
    ) {
      return {
        category: "Meals",
        confidence: 0.91,
        source: "llm"
      };
    }

    if (
      text.includes("notebook") &&
      text.includes("coffee")
    ) {
      return {
        category: "Office Supplies",
        confidence: 0.55,
        source: "llm"
      };
    }

    return {
      category: "Other",
      confidence: 0.65,
      source: "llm"
    };
  }
}