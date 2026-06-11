import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { loadSqliteVec } from "@/db";
import { chunks } from "@/db/schema/chunks";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import { sources } from "@/db/schema/sources";
import { spaces } from "@/db/schema/spaces";
import { InvalidExtractionError } from "@/lib/ingest/errors";
import { markIngestFailed } from "@/lib/ingest/progress";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import type { IngestPipelineCtx } from "@/lib/ingest/types";
import { extractionSchema, type Extraction } from "@/lib/ingest/schemas/extraction";
import * as structureModule from "@/lib/ingest/structure";
import { validateExtractionCitations } from "@/lib/ingest/validate";
import { handleIngestSource } from "@/lib/jobs/handlers/ingest-source";
import { assetDir, extractionArtifactPath, originalPath, summaryArtifactPath } from "@/lib/sources/paths";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it, vi } from "vitest";

const tempDirs: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
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

function seedSourceFixtures(drizzleDb: ReturnType<typeof drizzle>) {
  const now = Date.now();
  const spaceId = "00000000-0000-4000-8000-000000000099";
  const sourceId = "source-failure-1";
  const ingestRunId = "run-failure-1";
  const jobId = "job-failure-1";

  drizzleDb
    .insert(spaces)
    .values({ id: spaceId, name: "Failure Space", created_at: now, updated_at: now })
    .run();

  drizzleDb
    .insert(sources)
    .values({
      id: sourceId,
      space_id: spaceId,
      original_filename: "notes.txt",
      mime_type: "text/plain",
      byte_size: 100,
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

  drizzleDb
    .insert(jobs)
    .values({
      id: jobId,
      space_id: spaceId,
      job_type: "ingest_source",
      payload_json: JSON.stringify({ source_id: sourceId, ingest_run_id: ingestRunId }),
      status: "running",
      attempts: 1,
      max_attempts: 3,
      error_message: null,
      run_after: now,
      started_at: now,
      finished_at: null,
      created_at: now,
    })
    .run();

  return { now, spaceId, sourceId, ingestRunId, jobId };
}

describe("ingest failure paths", () => {
  it("fails extract guard with zero chunks for oversize text", async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vortex-fail-"));
    tempDirs.push(dataDir);
    const { db, drizzleDb } = createTestDb();
    const { spaceId, sourceId, ingestRunId } = seedSourceFixtures(drizzleDb);
    const text = "x".repeat(48_001);

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

    await expect(runIngestPipeline(ctx)).rejects.toThrow(/48,000/);
    markIngestFailed(ctx, "extracted text exceeds 48,000 character limit (got 48001)", Date.now());

    const chunkCount = drizzleDb.select({ value: count() }).from(chunks).get()?.value ?? 0;
    const run = drizzleDb.select().from(ingestRuns).where(eq(ingestRuns.id, ingestRunId)).get();
    expect(chunkCount).toBe(0);
    expect(run?.status).toBe("failed");
    expect(run?.error_message).toContain("48,000");

    db.close();
  });

  it("validateExtractionCitations throws InvalidExtractionError", () => {
    const extraction: Extraction = {
      summary: "s",
      mentions: [{ text: "t", suggested_type: "x", chunk_id: "bad", confidence: 0.5 }],
      candidate_facts: [],
      decision_candidates: [],
    };
    extractionSchema.parse(extraction);
    expect(() => validateExtractionCitations(extraction, new Set(["good"]))).toThrow(
      InvalidExtractionError,
    );
  });

  it("handler marks job failed when pipeline throws", async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vortex-handler-fail-"));
    tempDirs.push(dataDir);
    const { db, drizzleDb } = createTestDb();
    const { jobId } = seedSourceFixtures(drizzleDb);

    const dbModule = await import("@/db");
    vi.spyOn(dbModule, "openDatabase").mockReturnValue({ db, dataDir });

    const pipeline = await import("@/lib/ingest/pipeline");
    vi.spyOn(pipeline, "runIngestPipeline").mockRejectedValue(new Error("pipeline boom"));

    const job = drizzleDb.select().from(jobs).where(eq(jobs.id, jobId)).get()!;
    await handleIngestSource(job);

    const updated = drizzleDb.select().from(jobs).where(eq(jobs.id, jobId)).get();
    expect(updated?.status).toBe("failed");
    expect(updated?.error_message).toBe("pipeline boom");

    db.close();
  });

  it("retains chunks and skips artifacts when structure fails", async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vortex-structure-fail-"));
    tempDirs.push(dataDir);
    const { db, drizzleDb } = createTestDb();
    const { spaceId, sourceId, ingestRunId } = seedSourceFixtures(drizzleDb);
    const text = Array.from({ length: 3 }, (_, i) => `Section ${i}\n${"word ".repeat(200)}`).join(
      "\n\n",
    );

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

    vi.spyOn(structureModule, "runStructure").mockRejectedValue(new Error("structure failed"));

    await expect(runIngestPipeline(ctx)).rejects.toThrow("structure failed");

    const chunkCount = drizzleDb.select({ value: count() }).from(chunks).get()?.value ?? 0;
    const extractionAbs = extractionArtifactPath(dataDir, spaceId, sourceId, 1);
    const summaryAbs = summaryArtifactPath(dataDir, spaceId, sourceId, 1);

    expect(chunkCount).toBeGreaterThan(0);
    expect(fs.existsSync(extractionAbs)).toBe(false);
    expect(fs.existsSync(summaryAbs)).toBe(false);

    markIngestFailed(ctx, "structure failed", Date.now());
    const run = drizzleDb.select().from(ingestRuns).where(eq(ingestRuns.id, ingestRunId)).get();
    expect(run?.status).toBe("failed");

    db.close();
  });
});
