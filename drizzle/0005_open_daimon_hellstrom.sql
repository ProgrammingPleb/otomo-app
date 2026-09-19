ALTER TABLE `channels` ADD `romaji` text;--> statement-breakpoint
ALTER TABLE `channels` ADD `is_group_channel` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `channels` ADD `organization` text NOT NULL;