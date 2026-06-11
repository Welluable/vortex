import fs from "node:fs";
import path from "node:path";
import { openDatabase } from "@/db";
import { ingestRuns } from "@/db/schema/ingest-runs";
import { jobs } from "@/db/schema/jobs";
import { sources } from "@/db/schema/sources";
import { spaces } from "@/db/schema/spaces";
import { sourcesStore } from "@/lib/sources/store";
import { SpaceConflictError } from "@/lib/spaces/errors";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { count, eq } from "drizzle-orm";
import type {
  CreateSpaceRequest,
  Space,
  SpaceDetail,
  SpaceListResponse,
  UpdateSpaceRequest,
} from "@/types/spaces";

function isSqliteUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = "code" in err ? err.code : undefined;
  const message = "message" in err && typeof err.message === "string" ? err.message : "";
  return code === "SQLITE_CONSTRAINT_UNIQUE" || message.includes("UNIQUE constraint failed");
}

export const SEED_SPACES: Space[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Acme Corp",
    description: null,
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Side Project",
    description: null,
    created_at: 1_700_000_100_000,
    updated_at: 1_700_000_100_000,
  },
];

function rowToSpace(row: typeof spaces.$inferSelect): Space {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const spacesStore = {
  listSpaces(limit = 50, offset = 0): SpaceListResponse {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);

    const [{ total }] = drizzleDb.select({ total: count() }).from(spaces).all();
    const rows = drizzleDb
      .select()
      .from(spaces)
      .limit(limit)
      .offset(offset)
      .all();

    return {
      items: rows.map(rowToSpace),
      pagination: { total, limit, offset },
    };
  },

  getSpace(id: string): Space | null {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const row = drizzleDb.select().from(spaces).where(eq(spaces.id, id)).get();
    return row ? rowToSpace(row) : null;
  },

  getSpaceDetail(id: string): SpaceDetail | null {
    const space = this.getSpace(id);
    if (!space) return null;
    return {
      ...space,
      counts: {
        sources: sourcesStore.countBySpace(id),
        entities: 0,
        open_conflicts: 0,
        pending_review: 0,
      },
    };
  },

  updateSpace(id: string, patch: UpdateSpaceRequest): Space | null {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const existing = drizzleDb.select().from(spaces).where(eq(spaces.id, id)).get();
    if (!existing) return null;

    const now = Date.now();
    const updates: Partial<typeof spaces.$inferInsert> = { updated_at: now };

    if ("name" in patch) {
      updates.name = patch.name!.trim();
    }
    if ("description" in patch) {
      const desc = patch.description;
      updates.description =
        desc === null ? null : (desc?.trim() ?? null) || null;
    }

    try {
      drizzleDb.update(spaces).set(updates).where(eq(spaces.id, id)).run();
    } catch (err) {
      if (isSqliteUniqueViolation(err)) throw new SpaceConflictError();
      throw err;
    }

    const row = drizzleDb.select().from(spaces).where(eq(spaces.id, id)).get();
    return row ? rowToSpace(row) : null;
  },

  createSpace(input: CreateSpaceRequest): Space {
    const { db } = openDatabase();
    const drizzleDb = drizzle(db);
    const now = Date.now();
    const space: Space = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      created_at: now,
      updated_at: now,
    };

    try {
      drizzleDb
        .insert(spaces)
        .values({
          id: space.id,
          name: space.name,
          description: space.description,
          created_at: space.created_at,
          updated_at: space.updated_at,
        })
        .run();
    } catch (err) {
      if (isSqliteUniqueViolation(err)) throw new SpaceConflictError();
      throw err;
    }

    return space;
  },
};

export function resetSpacesForTest(): void {
  const { db, dataDir } = openDatabase();
  const drizzleDb = drizzle(db);
  drizzleDb.delete(jobs).run();
  drizzleDb.delete(ingestRuns).run();
  drizzleDb.delete(sources).run();
  drizzleDb.delete(spaces).run();

  const spacesDir = path.join(dataDir, "spaces");
  if (fs.existsSync(spacesDir)) {
    for (const spaceId of fs.readdirSync(spacesDir)) {
      const assetsDir = path.join(spacesDir, spaceId, "assets");
      if (fs.existsSync(assetsDir)) {
        fs.rmSync(assetsDir, { recursive: true, force: true });
      }
    }
  }
}

export function restoreSeedSpacesForTest(): void {
  const { db } = openDatabase();
  const drizzleDb = drizzle(db);
  for (const seed of SEED_SPACES) {
    drizzleDb
      .insert(spaces)
      .values({
        id: seed.id,
        name: seed.name,
        description: seed.description,
        created_at: seed.created_at,
        updated_at: seed.updated_at,
      })
      .onConflictDoUpdate({
        target: spaces.id,
        set: {
          name: seed.name,
          description: seed.description,
          created_at: seed.created_at,
          updated_at: seed.updated_at,
        },
      })
      .run();
  }
}
