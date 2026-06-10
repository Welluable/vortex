import { openDatabase } from "@/db";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import { sources } from "@/db/schema/sources";
import { jobsStore } from "@/lib/jobs/store";
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
  const { db } = openDatabase();
  const drizzleDb = drizzle(db);
  const existing = drizzleDb
    .select()
    .from(ingestRuns)
    .where(eq(ingestRuns.id, ingest_run_id))
    .get();

  drizzleDb
    .update(ingestRuns)
    .set({
      stage: "refresh",
      status: "complete",
      progress_pct: 100,
      started_at: existing?.started_at ?? now,
      finished_at: now,
    })
    .where(eq(ingestRuns.id, ingest_run_id))
    .run();

  drizzleDb
    .update(sources)
    .set({ ingest_status: "complete" })
    .where(eq(sources.id, source_id))
    .run();

  jobsStore.markComplete(job.id, now);
}
