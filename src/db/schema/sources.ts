import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { spaces } from "./spaces";

export const sources = sqliteTable(
  "sources",
  {
    id: text("id").primaryKey(),
    space_id: text("space_id")
      .notNull()
      .references(() => spaces.id),
    original_filename: text("original_filename").notNull(),
    mime_type: text("mime_type").notNull(),
    byte_size: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    asset_path: text("asset_path").notNull(),
    ingest_status: text("ingest_status").notNull(),
    latest_ingest_run_id: text("latest_ingest_run_id"),
    summary_path: text("summary_path"),
    deleted_at: integer("deleted_at"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [
    index("sources_space_created_idx").on(t.space_id, t.created_at),
    index("sources_space_ingest_status_idx").on(t.space_id, t.ingest_status),
  ],
);
