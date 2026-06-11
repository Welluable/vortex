import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { spaces } from "./spaces";
import { sources } from "./sources";
import { ingestRuns } from "./ingest-runs";

export const chunks = sqliteTable(
  "chunks",
  {
    id: text("id").primaryKey(),
    space_id: text("space_id")
      .notNull()
      .references(() => spaces.id),
    source_id: text("source_id")
      .notNull()
      .references(() => sources.id),
    ingest_run_id: text("ingest_run_id")
      .notNull()
      .references(() => ingestRuns.id),
    ordinal: integer("ordinal").notNull(),
    page: integer("page"),
    char_start: integer("char_start"),
    char_end: integer("char_end"),
    content: text("content").notNull(),
    token_count: integer("token_count"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [
    index("chunks_source_run_ordinal_idx").on(t.source_id, t.ingest_run_id, t.ordinal),
    index("chunks_space_source_idx").on(t.space_id, t.source_id),
  ],
);
