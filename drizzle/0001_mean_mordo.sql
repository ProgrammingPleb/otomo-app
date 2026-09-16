PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_streams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel_id` integer NOT NULL,
	`title` text NOT NULL,
	`video_id` text NOT NULL,
	`time` integer NOT NULL,
	`ended` integer NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_streams`("id", "channel_id", "title", "video_id", "time", "ended") SELECT "id", "channel_id", "title", "video_id", "time", "ended" FROM `streams`;--> statement-breakpoint
DROP TABLE `streams`;--> statement-breakpoint
ALTER TABLE `__new_streams` RENAME TO `streams`;--> statement-breakpoint
PRAGMA foreign_keys=ON;