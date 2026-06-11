import { assertWithinCharLimit } from "@/lib/ingest/extract";
import { TextTooLargeError } from "@/lib/ingest/errors";
import { describe, expect, it } from "vitest";

describe("extract", () => {
  it("assertWithinCharLimit throws TextTooLargeError above 48k", () => {
    expect(() => assertWithinCharLimit("x".repeat(48_001))).toThrow(TextTooLargeError);
  });

  it("assertWithinCharLimit allows exactly 48k", () => {
    expect(() => assertWithinCharLimit("x".repeat(48_000))).not.toThrow();
  });
});
