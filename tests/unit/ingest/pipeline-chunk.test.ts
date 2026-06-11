import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { loadSqliteVec } from "@/db";
import { chunks } from "@/db/schema/chunks";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { sources } from "@/db/schema/sources";
import { spaces } from "@/db/schema/spaces";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import type { IngestPipelineCtx } from "@/lib/ingest/types";
import { assetDir, originalPath } from "@/lib/sources/paths";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createTestDb() {
  const db = new Database(":memory:");
  loadSqliteVec(db);
  const drizzleDb = drizzle(db);
  migrate(drizzleDb, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  return { db, drizzleDb };
}

describe("runIngestPipeline through chunk", () => {
  it("extracts text, persists chunks, and advances stage", async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vortex-ingest-"));
    tempDirs.push(dataDir);

    const { db, drizzleDb } = createTestDb();
    const now = Date.now();
    const spaceId = "00000000-0000-4000-8000-000000000099";
    const sourceId = "source-pipeline-1";
    const ingestRunId = "run-pipeline-1";
    const text = Array.from({ length: 4 }, (_, i) => `Section ${i}\n${"content ".repeat(400)}`).join(
      "\n\n",
    );

    drizzleDb
      .insert(spaces)
      .values({ id: spaceId, name: "Pipeline Space", created_at: now, updated_at: now })
      .run();

    drizzleDb
      .insert(sources)
      .values({
        id: sourceId,
        space_id: spaceId,
        original_filename: "notes.txt",
        mime_type: "text/plain",
        byte_size: text.length,
        sha256: "sha",
        asset_path: `spaces/${spaceId}/assets/${sourceId}`,
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

    const assetPath = assetDir(dataDir, spaceId, sourceId);
    fs.mkdirSync(assetPath, { recursive: true });
    fs.writeFileSync(originalPath(dataDir, spaceId, sourceId, ".txt"), text, "utf8");

    const ctx: IngestPipelineCtx = {
      dataDir,
      spaceId,
      sourceId,
      ingestRunId,
      version: 1,
      originalFilename: "notes.txt",
      assetExt: ".txt",
      db: drizzleDb,
    };

    await runIngestPipeline(ctx, { stopAfter: "chunk" });

    const chunkCount = drizzleDb.select({ value: count() }).from(chunks).get()?.value ?? 0;
    const rows = drizzleDb.select().from(chunks).where(eq(chunks.ingest_run_id, ingestRunId)).all();
    const run = drizzleDb.select().from(ingestRuns).where(eq(ingestRuns.id, ingestRunId)).get();

    expect(chunkCount).toBeGreaterThan(0);
    expect(run?.stage).toBe("chunk");
    expect(run?.progress_pct).toBe(50);

    for (let i = 0; i < rows.length; i++) {
      expect(rows[i].ordinal).toBe(i);
      expect(rows[i].char_end).toBeGreaterThan(rows[i].char_start!);
    }

    db.close();
  });
});
