import type Database from "better-sqlite3";

export type DataDirResolution = {
  dataDir: string;
  dbPath: string;
};

export type OpenDatabaseOptions = {
  migrate?: boolean;
};

export type DatabaseHandle = {
  db: Database.Database;
  dataDir: string;
};
