CREATE TABLE `spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spaces_name_unique` ON `spaces` (`name`);
--> statement-breakpoint
INSERT OR IGNORE INTO `spaces` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
('00000000-0000-4000-8000-000000000001', 'Acme Corp', NULL, 1700000000000, 1700000000000);
--> statement-breakpoint
INSERT OR IGNORE INTO `spaces` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
('00000000-0000-4000-8000-000000000002', 'Side Project', NULL, 1700000100000, 1700000100000);