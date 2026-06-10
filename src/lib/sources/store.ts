import fs from "node:fs";
import { openDatabase } from "@/db";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import { sources } from "@/db/schema/sources";
import { SEED_SPACES } from "@/lib/spaces/store";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { spaceAssetsDir } from "./paths";

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
};

export function resetSourcesForTest(): void {
  const { db, dataDir } = openDatabase();
  const drizzleDb = drizzle(db);
  const seedIds = SEED_SPACES.map((s) => s.id);

  drizzleDb.delete(jobs).where(inArray(jobs.space_id, seedIds)).run();
  drizzleDb.delete(ingestRuns).where(inArray(ingestRuns.space_id, seedIds)).run();
  drizzleDb.delete(sources).where(inArray(sources.space_id, seedIds)).run();

  for (const seedId of seedIds) {
    const assetsDir = spaceAssetsDir(dataDir, seedId);
    if (fs.existsSync(assetsDir)) {
      fs.rmSync(assetsDir, { recursive: true, force: true });
    }
  }
}
