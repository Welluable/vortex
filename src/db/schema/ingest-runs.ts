import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { spaces } from "./spaces";
import { sources } from "./sources";

export const ingestRuns = sqliteTable(
  "ingest_runs",
  {
    id: text("id").primaryKey(),
    space_id: text("space_id")
      .notNull()
      .references(() => spaces.id),
    source_id: text("source_id")
      .notNull()
      .references(() => sources.id),
    version: integer("version").notNull(),
    stage: text("stage").notNull(),
    status: text("status").notNull(),
    progress_pct: integer("progress_pct").notNull(),
    error_message: text("error_message"),
    extraction_path: text("extraction_path"),
    summary_path: text("summary_path"),
    llm_model: text("llm_model"),
    started_at: integer("started_at"),
    finished_at: integer("finished_at"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("ingest_runs_source_version_idx").on(t.source_id, t.version)],
);
