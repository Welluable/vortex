import fs from "node:fs";
import { openDatabase } from "@/db";
import { chunks } from "@/db/schema/chunks";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import { sources } from "@/db/schema/sources";
import { SEED_SPACES } from "@/lib/spaces/store";
import type { Source, UploadSourceResponse } from "@/types/sources";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { RequestLog } from "@/lib/api/request-log";
import { writeSourceAsset } from "./asset-writer";
import { assetDir, spaceAssetsDir } from "./paths";

function rowToSource(row: typeof sources.$inferSelect): Source {
  return {
    id: row.id,
    space_id: row.space_id,
    original_filename: row.original_filename,
    mime_type: row.mime_type,
    byte_size: row.byte_size,
    sha256: row.sha256,
    asset_path: row.asset_path,
    ingest_status: row.ingest_status as Source["ingest_status"],
    latest_ingest_run_id: row.latest_ingest_run_id,
    summary_path: row.summary_path,
    deleted_at: row.deleted_at,
    created_at: row.created_at,
  };
}

export const sourcesStore = {
  countBySpace(spaceId: string): number {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const [{ total }] = drizzleDb
      .select({ total: count() })
      .from(sources)
      .where(and(eq(sources.space_id, spaceId), isNull(sources.deleted_at)))
      .all();
    return total;
  },

  async uploadSource(
    spaceId: string,
    file: File,
    log?: RequestLog,
  ): Promise<UploadSourceResponse> {
    const { db, dataDir } = openDatabase();
    log?.step("database opened");
    const drizzleDb = drizzle(db);
    const sourceId = crypto.randomUUID();
    const ingestRunId = crypto.randomUUID();
    const jobId = crypto.randomUUID();
    const now = Date.now();

    log?.step("writeSourceAsset starting", { sourceId });
    const { sha256, asset_path, manifest } = await writeSourceAsset({
      dataDir,
      spaceId,
      sourceId,
      file,
      mimeType: file.type,
      originalFilename: file.name,
      log,
    });
    log?.step("writeSourceAsset complete", {
      sourceId,
      byteSize: manifest.byte_size,
    });

    try {
      log?.step("database transaction starting", { sourceId, jobId });
      drizzleDb.transaction((tx) => {
        tx.insert(sources)
          .values({
            id: sourceId,
            space_id: spaceId,
            original_filename: file.name,
            mime_type: file.type,
            byte_size: manifest.byte_size,
            sha256,
            asset_path,
            ingest_status: "pending",
            latest_ingest_run_id: null,
            summary_path: null,
            deleted_at: null,
            created_at: now,
          })
          .run();

        tx.insert(ingestRuns)
          .values({
            id: ingestRunId,
            space_id: spaceId,
            source_id: sourceId,
            version: 1,
            stage: "store",
            status: "pending",
            progress_pct: 0,
            error_message: null,
            extraction_path: null,
            summary_path: null,
            llm_model: null,
            started_at: null,
            finished_at: null,
            created_at: now,
          })
          .run();

        tx.insert(jobs)
          .values({
            id: jobId,
            space_id: spaceId,
            job_type: "ingest_source",
            payload_json: JSON.stringify({
              source_id: sourceId,
              ingest_run_id: ingestRunId,
            }),
            status: "pending",
            attempts: 0,
            max_attempts: 3,
            error_message: null,
            run_after: now,
            started_at: null,
            finished_at: null,
            created_at: now,
          })
          .run();

        tx.update(sources)
          .set({ latest_ingest_run_id: ingestRunId })
          .where(eq(sources.id, sourceId))
          .run();
      });
      log?.step("database transaction complete", { sourceId, jobId });
    } catch (err) {
      log?.step("database transaction failed", {
        sourceId,
        error: err instanceof Error ? err.message : String(err),
      });
      fs.rmSync(assetDir(dataDir, spaceId, sourceId), { recursive: true, force: true });
      throw err;
    }

    const row = drizzleDb.select().from(sources).where(eq(sources.id, sourceId)).get();
    if (!row) throw new Error("source insert failed");

    return {
      source: rowToSource(row),
      job_id: jobId,
      ingest_run_id: ingestRunId,
    };
  },
};

export function resetSourcesForTest(): void {
  const { db, dataDir } = openDatabase();
  const drizzleDb = drizzle(db);
  const seedIds = SEED_SPACES.map((s) => s.id);

  drizzleDb.delete(jobs).where(inArray(jobs.space_id, seedIds)).run();
  drizzleDb.delete(chunks).where(inArray(chunks.space_id, seedIds)).run();
  drizzleDb.delete(ingestRuns).where(inArray(ingestRuns.space_id, seedIds)).run();
  drizzleDb.delete(sources).where(inArray(sources.space_id, seedIds)).run();

  for (const seedId of seedIds) {
    const assetsDir = spaceAssetsDir(dataDir, seedId);
    if (fs.existsSync(assetsDir)) {
      fs.rmSync(assetsDir, { recursive: true, force: true });
    }
  }
}
