import { Categoriser } from "./categoriser";

describe("Receipt Categoriser Acceptance Tests", () => {

  test("AC-01 Happy path meal receipt", async () => {
    const categoriser = new Categoriser();

    const result = await categoriser.categorise({
      claimId: "123",
      mimeType: "image/jpeg",
      fileSizeBytes: 1000,
      ocrText: `
        Burger King
        Cheeseburger
        Coke
        Total LKR 2400
      `
    });

    expect(result.category).toBe("Meals");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.source).toBe("llm");
  });

  test("AC-02 Ambiguous receipt", async () => {
    const categoriser = new Categoriser();

    const result = await categoriser.categorise({
      claimId: "123",
      mimeType: "image/png",
      fileSizeBytes: 1000,
      ocrText: `
        Notebook
        Pen
        Coffee
        Total LKR 1500
      `
    });

    expect(result.confidence).toBeLessThan(0.6);
    expect(result.needsReview).toBe(true);
  });

  test("AC-03 LLM unavailable fallback", async () => {
    const categoriser = new Categoriser();

    const result = await categoriser.categorise(
      {
        claimId: "123",
        mimeType: "image/jpeg",
        fileSizeBytes: 1000,
        ocrText: "Burger King Coke"
      },
      true
    );

    expect(result.source).toBe("rule-based");
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  test("AC-04 OCR failure", async () => {
    const categoriser = new Categoriser();

    const result = await categoriser.categorise({
      claimId: "123",
      mimeType: "image/jpeg",
      fileSizeBytes: 1000,
      ocrText: ""
    });

    expect(result.category).toBe("Other");
    expect(result.confidence).toBe(0);
  });

  test("AC-05 Oversized payload", async () => {
    const categoriser = new Categoriser();

    await expect(
      categoriser.categorise({
        claimId: "123",
        mimeType: "image/jpeg",
        fileSizeBytes: 11 * 1024 * 1024,
        ocrText: "Burger King"
      })
    ).rejects.toThrow("413");
  });

  test("AC-06 Telemetry contains no PII", () => {
    const categoriser = new Categoriser();

    const event = categoriser.buildTelemetryPayload(
      "123",
      "Meals",
      0.91,
      "llm",
      true
    );

    expect(event).not.toHaveProperty("customerName");
    expect(event).not.toHaveProperty("cardNumber");
    expect(Object.keys(event)).toEqual([
      "claimId",
      "category",
      "confidence",
      "source",
      "accepted"
    ]);
  });

});