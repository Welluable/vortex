export type SourceIngestStatus = "pending" | "processing" | "complete" | "failed";

export type Source = {
  id: string;
  space_id: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  asset_path: string;
  ingest_status: SourceIngestStatus;
  latest_ingest_run_id: string | null;
  summary_path: string | null;
  deleted_at: number | null;
  created_at: number;
};

export type UploadSourceResponse = {
  source: Source;
  job_id: string;
  ingest_run_id: string;
};
