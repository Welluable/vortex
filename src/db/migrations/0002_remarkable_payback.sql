CREATE TABLE `ingest_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`source_id` text NOT NULL,
	`version` integer NOT NULL,
	`stage` text NOT NULL,
	`status` text NOT NULL,
	`progress_pct` integer NOT NULL,
	`error_message` text,
	`extraction_path` text,
	`summary_path` text,
	`llm_model` text,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ingest_runs_source_version_idx` ON `ingest_runs` (`source_id`,`version`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text,
	`job_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer NOT NULL,
	`max_attempts` integer NOT NULL,
	`error_message` text,
	`run_after` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `jobs_status_run_after_idx` ON `jobs` (`status`,`run_after`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`asset_path` text NOT NULL,
	`ingest_status` text NOT NULL,
	`latest_ingest_run_id` text,
	`summary_path` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sources_space_created_idx` ON `sources` (`space_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `sources_space_ingest_status_idx` ON `sources` (`space_id`,`ingest_status`);