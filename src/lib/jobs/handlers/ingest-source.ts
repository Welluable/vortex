import { openDatabase } from "@/db";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import { sources } from "@/db/schema/sources";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import { markIngestFailed } from "@/lib/ingest/progress";
import type { IngestPipelineCtx } from "@/lib/ingest/types";
import { jobsStore } from "@/lib/jobs/store";
import { deriveExtension } from "@/lib/sources/paths";
import type { IngestSourcePayload } from "@/types/jobs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";

export async function handleIngestSource(
  job: typeof jobs.$inferSelect,
): Promise<void> {
  const { source_id, ingest_run_id } = JSON.parse(
    job.payload_json,
  ) as IngestSourcePayload;
  const now = Date.now();
  const { db, dataDir } = openDatabase();
  const drizzleDb = drizzle(db);
  const source = drizzleDb
    .select()
    .from(sources)
    .where(eq(sources.id, source_id))
    .get();
  const ingestRun = drizzleDb
    .select()
    .from(ingestRuns)
    .where(eq(ingestRuns.id, ingest_run_id))
    .get();
  if (!source || !ingestRun) throw new Error("source or ingest_run not found");

  const ctx: IngestPipelineCtx = {
    dataDir,
    spaceId: source.space_id,
    sourceId: source_id,
    ingestRunId: ingest_run_id,
    version: ingestRun.version,
    originalFilename: source.original_filename,
    assetExt: deriveExtension(source.original_filename),
    db: drizzleDb,
  };

  try {
    await runIngestPipeline(ctx);
    jobsStore.markComplete(job.id, now);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markIngestFailed(ctx, message, now);
    jobsStore.markFailed(job.id, now, message);
  }
}
