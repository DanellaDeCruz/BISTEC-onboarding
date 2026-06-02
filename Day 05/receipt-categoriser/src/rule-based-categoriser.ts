import { CategorisationResult } from "./llm-categoriser";

export class RuleBasedCategoriser {
  categorise(ocrText: string): CategorisationResult {
    const text = ocrText.toLowerCase();

    if (
      text.includes("burger") ||
      text.includes("restaurant") ||
      text.includes("coke")
    ) {
      return {
        category: "Meals",
        confidence: 0.5,
        source: "rule-based"
      };
    }

    if (
      text.includes("notebook") ||
      text.includes("pen")
    ) {
      return {
        category: "Office Supplies",
        confidence: 0.45,
        source: "rule-based"
      };
    }

    return {
      category: "Other",
      confidence: 0.3,
      source: "rule-based"
    };
  }
}