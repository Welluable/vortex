import path from "node:path";
import Database from "better-sqlite3";
import { loadSqliteVec } from "@/db";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { sources } from "@/db/schema/sources";
import { spaces } from "@/db/schema/spaces";
import { derivedIngestDir } from "@/lib/sources/paths";
import { advanceIngestStage, markIngestRunning } from "@/lib/ingest/progress";
import type { IngestPipelineCtx } from "@/lib/ingest/types";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it } from "vitest";

function createTestDb() {
  const db = new Database(":memory:");
  loadSqliteVec(db);
  const drizzleDb = drizzle(db);
  migrate(drizzleDb, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  return { db, drizzleDb };
}

describe("ingest progress", () => {
  it("derivedIngestDir ends with derived/ingest/v1", () => {
    const dir = derivedIngestDir("/data", "space-1", "source-1", 1);
    expect(dir.endsWith("derived/ingest/v1")).toBe(true);
  });

  it("advanceIngestStage updates ingest_runs and sources", () => {
    const { db, drizzleDb } = createTestDb();
    const now = Date.now();
    const spaceId = "00000000-0000-4000-8000-000000000099";
    const sourceId = "source-test-1";
    const ingestRunId = "run-test-1";

    drizzleDb
      .insert(spaces)
      .values({
        id: spaceId,
        name: "Test Space",
        created_at: now,
        updated_at: now,
      })
      .run();

    drizzleDb
      .insert(sources)
      .values({
        id: sourceId,
        space_id: spaceId,
        original_filename: "notes.txt",
        mime_type: "text/plain",
        byte_size: 100,
        sha256: "abc",
        asset_path: "spaces/test/assets/source-test-1",
        ingest_status: "pending",
        created_at: now,
      })
      .run();

    drizzleDb
      .insert(ingestRuns)
      .values({
        id: ingestRunId,
        space_id: spaceId,
        source_id: sourceId,
        version: 1,
        stage: "store",
        status: "pending",
        progress_pct: 0,
        created_at: now,
      })
      .run();

    const ctx: IngestPipelineCtx = {
      dataDir: "/data",
      spaceId,
      sourceId,
      ingestRunId,
      version: 1,
      originalFilename: "notes.txt",
      assetExt: ".txt",
      db: drizzleDb,
    };

    markIngestRunning(ctx, now);
    advanceIngestStage(ctx, "extract", 25);

    const run = drizzleDb
      .select()
      .from(ingestRuns)
      .where(eq(ingestRuns.id, ingestRunId))
      .get();
    const source = drizzleDb
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId))
      .get();

    expect(run?.status).toBe("running");
    expect(run?.stage).toBe("extract");
    expect(run?.progress_pct).toBe(25);
    expect(run?.started_at).toBe(now);
    expect(source?.ingest_status).toBe("processing");

    db.close();
  });
});
