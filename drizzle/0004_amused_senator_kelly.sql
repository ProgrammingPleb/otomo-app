CREATE TABLE `last_checked` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`time` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `last_checked_name_unique` ON `last_checked` (`name`);