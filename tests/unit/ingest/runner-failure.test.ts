import Database from "better-sqlite3";
import path from "node:path";
import { loadSqliteVec } from "@/db";
import { jobs } from "@/db/schema/jobs";
import { tickRunner } from "@/lib/jobs/runner";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db")>();
  let testDb: Database.Database | null = null;
  let testDrizzle: ReturnType<typeof drizzle> | null = null;

  return {
    ...actual,
    openDatabase: () => {
      if (!testDb) {
        testDb = new Database(":memory:");
        loadSqliteVec(testDb);
        testDrizzle = drizzle(testDb);
        migrate(testDrizzle, {
          migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
        });
      }
      return { db: testDb!, dataDir: "/tmp/vortex-test-data" };
    },
    closeDatabase: () => {
      testDb?.close();
      testDb = null;
      testDrizzle = null;
    },
    __getTestDrizzle: () => testDrizzle,
  };
});

import { openDatabase, closeDatabase } from "@/db";

afterEach(() => {
  closeDatabase();
});

describe("tickRunner failure hardening", () => {
  it("marks job failed when handler throws uncaught error", async () => {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const now = Date.now();
    const jobId = "job-runner-fail-1";

    drizzleDb
      .insert(jobs)
      .values({
        id: jobId,
        space_id: "00000000-0000-4000-8000-000000000001",
        job_type: "ingest_source",
        payload_json: JSON.stringify({
          source_id: "missing-source",
          ingest_run_id: "missing-run",
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

    await tickRunner();

    const job = drizzleDb.select().from(jobs).where(eq(jobs.id, jobId)).get();
    expect(job?.status).toBe("failed");
    expect(job?.error_message).toContain("source or ingest_run not found");
  });
});
