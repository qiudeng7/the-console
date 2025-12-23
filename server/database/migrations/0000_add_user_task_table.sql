CREATE TABLE `task_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT '12/23/2025, 10:53:10 AM' NOT NULL,
	`deletedAt` text DEFAULT '',
	`title` text,
	`category` text,
	`tag` text,
	`description` text,
	`status` text,
	`createdByUserId` integer NOT NULL,
	`assignedToUserId` integer,
	`updatedAt` text DEFAULT '',
	FOREIGN KEY (`createdByUserId`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignedToUserId`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT '12/23/2025, 10:53:10 AM' NOT NULL,
	`deletedAt` text DEFAULT '',
	`email` text NOT NULL,
	`password` text NOT NULL
);
