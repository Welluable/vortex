import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export type IngestStageName = "extract" | "chunk" | "structure" | "refresh";

export type DrizzleDb = BetterSQLite3Database;

export type IngestPipelineCtx = {
  dataDir: string;
  spaceId: string;
  sourceId: string;
  ingestRunId: string;
  version: number;
  originalFilename: string;
  assetExt: string;
  db: DrizzleDb;
};

export type ExtractResult = {
  text: string;
  charLength: number;
};

export type ChunkRecord = {
  id: string;
  space_id: string;
  source_id: string;
  ingest_run_id: string;
  ordinal: number;
  page: null;
  char_start: number;
  char_end: number;
  content: string;
  token_count: null;
  created_at: number;
};

export type IngestArtifacts = {
  extraction_path: string;
  summary_path: string;
};
