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
  const shouldMigrate =
    options.migrate === true ||
    (options.migrate !== false && process.env.NODE_ENV !== "production");
  if (shouldMigrate) {
    runMigrations(db);
  }
  singleton = { db, dataDir };
  return singleton;
}

export function pingDatabase(): { connected: true; dataDir: string } {
  const { db, dataDir } = openDatabase({
    migrate: process.env.NODE_ENV !== "production" ? true : false,
  });
  db.prepare("SELECT 1").get();
  return { connected: true, dataDir };
}

export function closeDatabase(handle: DatabaseHandle = singleton!): void {
  handle.db.close();
  if (singleton === handle) singleton = null;
}
