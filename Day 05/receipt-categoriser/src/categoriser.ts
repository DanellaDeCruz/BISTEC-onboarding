import { LlmCategoriser } from "./llm-categoriser";
import { RuleBasedCategoriser } from "./rule-based-categoriser";

export interface ReceiptRequest {
  claimId: string;
  fileSizeBytes: number;
  mimeType: string;
  ocrText?: string;
}

export interface CategoriserResponse {
  category: string;
  confidence: number;
  source: "llm" | "rule-based";
  needsReview?: boolean;
}

export class Categoriser {
  private llm = new LlmCategoriser();
  private rules = new RuleBasedCategoriser();

  async categorise(
    request: ReceiptRequest,
    simulateLlm503 = false
  ): Promise<CategoriserResponse> {

    if (
      request.mimeType !== "image/jpeg" &&
      request.mimeType !== "image/png"
    ) {
      throw new Error("400 Invalid image format");
    }

    if (request.fileSizeBytes > 10 * 1024 * 1024) {
      throw new Error("413 Payload Too Large");
    }

    if (!request.ocrText || request.ocrText.trim().length === 0) {
      return {
        category: "Other",
        confidence: 0,
        source: "rule-based"
      };
    }

    let result;

    try {
      if (simulateLlm503) {
        throw new Error("503");
      }

      result = await this.llm.categorise(request.ocrText);
    } catch {
      result = this.rules.categorise(request.ocrText);
    }

    return {
      ...result,
      needsReview: result.confidence < 0.6
    };
  }

  buildTelemetryPayload(
    claimId: string,
    category: string,
    confidence: number,
    source: string,
    accepted: boolean
  ) {
    return {
      claimId,
      category,
      confidence,
      source,
      accepted
    };
  }
}