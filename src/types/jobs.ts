export type JobStatus = "pending" | "running" | "complete" | "failed";
export type JobType = "ingest_source" | "reembed_space" | "refresh_entity_summary";
export type IngestStage =
  | "store"
  | "extract"
  | "chunk"
  | "structure"
  | "resolve"
  | "persist"
  | "conflicts"
  | "embed"
  | "refresh";

export type IngestRun = {
  id: string;
  space_id: string;
  source_id: string;
  version: number;
  stage: IngestStage;
  status: JobStatus;
  progress_pct: number;
  error_message: string | null;
  extraction_path: string | null;
  summary_path: string | null;
  llm_model: string | null;
  started_at: number | null;
  finished_at: number | null;
  created_at: number;
};

export type IngestSourcePayload = { source_id: string; ingest_run_id: string };

export type Job = {
  id: string;
  space_id: string | null;
  job_type: JobType;
  payload_json: IngestSourcePayload | Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  run_after: number;
  started_at: number | null;
  finished_at: number | null;
  created_at: number;
  ingest_run?: IngestRun;
};
