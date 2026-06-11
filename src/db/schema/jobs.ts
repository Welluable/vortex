import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { spaces } from "./spaces";

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    space_id: text("space_id").references(() => spaces.id),
    job_type: text("job_type").notNull(),
    payload_json: text("payload_json").notNull(),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull(),
    max_attempts: integer("max_attempts").notNull(),
    error_message: text("error_message"),
    run_after: integer("run_after").notNull(),
    started_at: integer("started_at"),
    finished_at: integer("finished_at"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("jobs_status_run_after_idx").on(t.status, t.run_after)],
);
