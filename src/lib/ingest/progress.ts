import { ingestRuns } from "@/db/schema/ingest-runs";
import { sources } from "@/db/schema/sources";
import { eq } from "drizzle-orm";
import type { IngestArtifacts, IngestPipelineCtx, IngestStageName } from "./types";

export function markIngestRunning(ctx: IngestPipelineCtx, now: number): void {
  ctx.db
    .update(ingestRuns)
    .set({
      status: "running",
      started_at: now,
    })
    .where(eq(ingestRuns.id, ctx.ingestRunId))
    .run();

  ctx.db
    .update(sources)
    .set({ ingest_status: "processing" })
    .where(eq(sources.id, ctx.sourceId))
    .run();
}

export function advanceIngestStage(
  ctx: IngestPipelineCtx,
  stage: IngestStageName,
  progressPct: number,
): void {
  ctx.db
    .update(ingestRuns)
    .set({
      stage,
      progress_pct: progressPct,
    })
    .where(eq(ingestRuns.id, ctx.ingestRunId))
    .run();
}

export function markIngestFailed(
  ctx: IngestPipelineCtx,
  errorMessage: string,
  now: number,
): void {
  ctx.db
    .update(ingestRuns)
    .set({
      status: "failed",
      error_message: errorMessage,
      finished_at: now,
    })
    .where(eq(ingestRuns.id, ctx.ingestRunId))
    .run();

  ctx.db
    .update(sources)
    .set({ ingest_status: "failed" })
    .where(eq(sources.id, ctx.sourceId))
    .run();
}

export function markIngestComplete(
  ctx: IngestPipelineCtx,
  artifacts: IngestArtifacts,
  llmModel: string,
  now: number,
): void {
  ctx.db
    .update(ingestRuns)
    .set({
      stage: "refresh",
      status: "complete",
      progress_pct: 100,
      extraction_path: artifacts.extraction_path,
      summary_path: artifacts.summary_path,
      llm_model: llmModel,
      finished_at: now,
    })
    .where(eq(ingestRuns.id, ctx.ingestRunId))
    .run();

  ctx.db
    .update(sources)
    .set({
      ingest_status: "complete",
      summary_path: artifacts.summary_path,
      latest_ingest_run_id: ctx.ingestRunId,
    })
    .where(eq(sources.id, ctx.sourceId))
    .run();
}
