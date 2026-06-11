import fs from "node:fs";
import path from "node:path";
import { generateObject } from "ai";
import { createOpenAiProvider } from "@/lib/llm/client";
import { loadLlmConfig } from "@/lib/llm/config";
import type { ChunkRecord, IngestPipelineCtx } from "./types";
import { extractionSchema, type Extraction } from "./schemas/extraction";
import { validateExtractionCitations } from "./validate";

const PROMPT_PATH = path.join(process.cwd(), "src/lib/ingest/prompts/structure.md");

export function buildMockExtraction(chunks: ChunkRecord[]): Extraction {
  const first = chunks[0];
  const preview = first.content.slice(0, 120).trim();
  return {
    summary: `Mock summary for source based on: ${preview}`,
    mentions: [
      {
        text: preview.slice(0, 40) || "fixture mention",
        suggested_type: "concept",
        chunk_id: first.id,
        confidence: 0.9,
      },
    ],
    candidate_facts: [
      {
        subject_mention: "source",
        predicate: "contains",
        value_text: preview.slice(0, 60) || "content",
        chunk_id: first.id,
        confidence: 0.9,
      },
    ],
    decision_candidates: [
      {
        title: "Review extracted content",
        body: `Initial mock decision from chunk ${first.ordinal}.`,
        chunk_id: first.id,
        entity_mentions: ["source"],
        confidence: 0.9,
      },
    ],
  };
}

export function buildStructurePrompt(filename: string, chunks: ChunkRecord[]): string {
  const template = fs.readFileSync(PROMPT_PATH, "utf8");
  const chunkBlock = chunks
    .map((chunk) => `### Chunk ${chunk.ordinal}\nid: ${chunk.id}\n${chunk.content}`)
    .join("\n\n");
  return template.replace("{{filename}}", filename).replace("{{chunks}}", chunkBlock);
}

export async function runStructure(
  ctx: IngestPipelineCtx,
  chunkRows: ChunkRecord[],
): Promise<{ extraction: Extraction; llmModel: string }> {
  const chunkIds = new Set(chunkRows.map((c) => c.id));

  if (process.env.INGEST_STRUCTURE_MOCK === "1") {
    const extraction = buildMockExtraction(chunkRows);
    validateExtractionCitations(extraction, chunkIds);
    return { extraction, llmModel: "mock" };
  }

  const config = loadLlmConfig();
  const { object } = await generateObject({
    model: createOpenAiProvider(config),
    schema: extractionSchema,
    prompt: buildStructurePrompt(ctx.originalFilename, chunkRows),
  });
  validateExtractionCitations(object, chunkIds);
  return { extraction: object, llmModel: config.modelId };
}
