CREATE TABLE `task_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT '12/22/2025, 2:23:00 PM' NOT NULL,
	`deletedAt` text DEFAULT '',
	`title` text,
	`category` text,
	`tag` text,
	`description` text,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `user_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT '12/22/2025, 2:23:00 PM' NOT NULL,
	`deletedAt` text DEFAULT '',
	`email` text NOT NULL,
	`password` text NOT NULL
);
