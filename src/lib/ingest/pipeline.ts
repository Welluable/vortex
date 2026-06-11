import { writeExtraction, writeSummary } from "./artifacts";
import { chunkParagraphs, persistChunks } from "./chunk";
import { assertWithinCharLimit, readSourceText } from "./extract";
import {
  advanceIngestStage,
  markIngestComplete,
  markIngestRunning,
} from "./progress";
import { runStructure } from "./structure";
import type { IngestArtifacts, IngestPipelineCtx, IngestStageName } from "./types";
import {
  extractionArtifactPath,
  summaryArtifactPath,
  toRelativeDataPath,
} from "@/lib/sources/paths";

export type RunIngestOptions = { stopAfter?: IngestStageName };

export async function runIngestPipeline(
  ctx: IngestPipelineCtx,
  opts: RunIngestOptions = {},
): Promise<void> {
  const now = Date.now();
  markIngestRunning(ctx, now);
  const { text } = await readSourceText(ctx);
  assertWithinCharLimit(text);
  advanceIngestStage(ctx, "extract", 25);

  const spans = chunkParagraphs(text);
  const chunkRows = await persistChunks(ctx, spans);
  advanceIngestStage(ctx, "chunk", 50);
  if (opts.stopAfter === "chunk") return;

  advanceIngestStage(ctx, "structure", 75);
  const { extraction, llmModel } = await runStructure(ctx, chunkRows);
  const extractionAbs = extractionArtifactPath(
    ctx.dataDir,
    ctx.spaceId,
    ctx.sourceId,
    ctx.version,
  );
  const summaryAbs = summaryArtifactPath(ctx.dataDir, ctx.spaceId, ctx.sourceId, ctx.version);
  writeExtraction(ctx.dataDir, extractionAbs, extraction);
  writeSummary(ctx.dataDir, summaryAbs, extraction.summary);

  const artifacts: IngestArtifacts = {
    extraction_path: toRelativeDataPath(ctx.dataDir, extractionAbs),
    summary_path: toRelativeDataPath(ctx.dataDir, summaryAbs),
  };
  markIngestComplete(ctx, artifacts, llmModel, Date.now());
}
