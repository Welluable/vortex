import { openDatabase } from "@/db";
import { spaces } from "@/db/schema/spaces";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { count, eq } from "drizzle-orm";
import type { Space, SpaceListResponse } from "@/types/spaces";

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
};
