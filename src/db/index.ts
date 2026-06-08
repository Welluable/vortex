import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as sqliteVec from "sqlite-vec";
import type { DatabaseHandle, DataDirResolution, OpenDatabaseOptions } from "./types";

let singleton: DatabaseHandle | null = null;

export function resolveDataDir(): DataDirResolution {
  const dataDir = path.resolve(process.env.VORTEX_DATA_DIR ?? path.join(process.cwd(), "data"));
  fs.mkdirSync(dataDir, { recursive: true });
  return { dataDir, dbPath: path.join(dataDir, "vortex.db") };
}

export function loadSqliteVec(db: Database.Database): void {
  sqliteVec.load(db);
}

export function runMigrations(db: Database.Database): void {
  const drizzleDb = drizzle(db);
  migrate(drizzleDb, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
}

export function openDatabase(options: OpenDatabaseOptions = {}): DatabaseHandle {
  if (singleton) return singleton;
  const { dataDir, dbPath } = resolveDataDir();
  const db = new Database(dbPath);
  loadSqliteVec(db);
  if (options.migrate) {
    runMigrations(db);
  }
  singleton = { db, dataDir };
  return singleton;
}

export function closeDatabase(handle: DatabaseHandle = singleton!): void {
  handle.db.close();
  if (singleton === handle) singleton = null;
}
