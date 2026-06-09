import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const spaces = sqliteTable("spaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});
