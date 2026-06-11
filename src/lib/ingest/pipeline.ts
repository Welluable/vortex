import { chunkParagraphs, persistChunks } from "./chunk";
import { assertWithinCharLimit, readSourceText } from "./extract";
import { advanceIngestStage, markIngestRunning } from "./progress";
import type { IngestPipelineCtx, IngestStageName } from "./types";

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
  await persistChunks(ctx, spans);
  advanceIngestStage(ctx, "chunk", 50);
  if (opts.stopAfter === "chunk") return;

  // structure + refresh filled in Slice 3
}
