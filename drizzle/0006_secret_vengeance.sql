ALTER TABLE `streams` ADD `start_scheduled` integer;--> statement-breakpoint
ALTER TABLE `streams` ADD `start_actual` integer;--> statement-breakpoint
ALTER TABLE `streams` ADD `notification` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `streams` DROP COLUMN `time`;