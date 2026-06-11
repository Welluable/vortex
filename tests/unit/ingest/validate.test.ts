import { InvalidExtractionError } from "@/lib/ingest/errors";
import { extractionSchema, type Extraction } from "@/lib/ingest/schemas/extraction";
import { buildMockExtraction } from "@/lib/ingest/structure";
import { validateExtractionCitations } from "@/lib/ingest/validate";
import type { ChunkRecord } from "@/lib/ingest/types";
import { describe, expect, it } from "vitest";

const sampleChunk: ChunkRecord = {
  id: "chunk-1",
  space_id: "space-1",
  source_id: "source-1",
  ingest_run_id: "run-1",
  ordinal: 0,
  page: null,
  char_start: 0,
  char_end: 10,
  content: "fixture text",
  token_count: null,
  created_at: Date.now(),
};

describe("validateExtractionCitations", () => {
  it("accepts mock extraction with valid chunk ids", () => {
    const extraction = buildMockExtraction([sampleChunk]);
    extractionSchema.parse(extraction);
    expect(() =>
      validateExtractionCitations(extraction, new Set([sampleChunk.id])),
    ).not.toThrow();
  });

  it("throws InvalidExtractionError for orphan chunk_id", () => {
    const extraction: Extraction = {
      summary: "test",
      mentions: [{ text: "x", suggested_type: "t", chunk_id: "missing", confidence: 0.5 }],
      candidate_facts: [],
      decision_candidates: [],
    };
    expect(() =>
      validateExtractionCitations(extraction, new Set([sampleChunk.id])),
    ).toThrow(InvalidExtractionError);
  });
});
