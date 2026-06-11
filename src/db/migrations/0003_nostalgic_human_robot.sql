CREATE TABLE `chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`source_id` text NOT NULL,
	`ingest_run_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`page` integer,
	`char_start` integer,
	`char_end` integer,
	`content` text NOT NULL,
	`token_count` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ingest_run_id`) REFERENCES `ingest_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chunks_source_run_ordinal_idx` ON `chunks` (`source_id`,`ingest_run_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `chunks_space_source_idx` ON `chunks` (`space_id`,`source_id`);