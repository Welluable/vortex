import { openDatabase } from "@/db";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import type { IngestRun, Job, JobStatus } from "@/types/jobs";
import { and, eq, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";

function rowToIngestRun(row: typeof ingestRuns.$inferSelect): IngestRun {
  return {
    id: row.id,
    space_id: row.space_id,
    source_id: row.source_id,
    version: row.version,
    stage: row.stage as IngestRun["stage"],
    status: row.status as JobStatus,
    progress_pct: row.progress_pct,
    error_message: row.error_message,
    extraction_path: row.extraction_path,
    summary_path: row.summary_path,
    llm_model: row.llm_model,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_at: row.created_at,
  };
}

function rowToJob(
  row: typeof jobs.$inferSelect,
  ingestRun?: IngestRun,
): Job {
  const payload = JSON.parse(row.payload_json) as Job["payload_json"];
  return {
    id: row.id,
    space_id: row.space_id,
    job_type: row.job_type as Job["job_type"],
    payload_json: payload,
    status: row.status as JobStatus,
    attempts: row.attempts,
    max_attempts: row.max_attempts,
    error_message: row.error_message,
    run_after: row.run_after,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_at: row.created_at,
    ...(ingestRun ? { ingest_run: ingestRun } : {}),
  };
}

export const jobsStore = {
  getJob(jobId: string): Job | null {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const row = drizzleDb.select().from(jobs).where(eq(jobs.id, jobId)).get();
    if (!row) return null;

    if (row.job_type === "ingest_source") {
      const payload = JSON.parse(row.payload_json) as {
        source_id: string;
        ingest_run_id: string;
      };
      const ingestRow = drizzleDb
        .select()
        .from(ingestRuns)
        .where(eq(ingestRuns.id, payload.ingest_run_id))
        .get();
      if (ingestRow) {
        return rowToJob(row, rowToIngestRun(ingestRow));
      }
    }

    return rowToJob(row);
  },

  claimNextPending(nowMs: number): typeof jobs.$inferSelect | null {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    return (
      drizzleDb
        .select()
        .from(jobs)
        .where(and(eq(jobs.status, "pending"), lte(jobs.run_after, nowMs)))
        .orderBy(jobs.run_after)
        .limit(1)
        .get() ?? null
    );
  },

  markRunning(jobId: string, nowMs: number): void {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const existing = drizzleDb.select().from(jobs).where(eq(jobs.id, jobId)).get();
    if (!existing) return;
    drizzleDb
      .update(jobs)
      .set({
        status: "running",
        started_at: nowMs,
        attempts: existing.attempts + 1,
      })
      .where(eq(jobs.id, jobId))
      .run();
  },

  markComplete(jobId: string, nowMs: number): void {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    drizzleDb
      .update(jobs)
      .set({ status: "complete", finished_at: nowMs })
      .where(eq(jobs.id, jobId))
      .run();
  },

  markFailed(jobId: string, nowMs: number, message: string): void {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    drizzleDb
      .update(jobs)
      .set({ status: "failed", finished_at: nowMs, error_message: message })
      .where(eq(jobs.id, jobId))
      .run();
  },
};
