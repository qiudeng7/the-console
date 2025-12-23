PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_task_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT '12/23/2025, 11:19:32 AM' NOT NULL,
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
INSERT INTO `__new_task_table`("id", "createdAt", "deletedAt", "title", "category", "tag", "description", "status", "createdByUserId", "assignedToUserId", "updatedAt") SELECT "id", "createdAt", "deletedAt", "title", "category", "tag", "description", "status", "createdByUserId", "assignedToUserId", "updatedAt" FROM `task_table`;--> statement-breakpoint
DROP TABLE `task_table`;--> statement-breakpoint
ALTER TABLE `__new_task_table` RENAME TO `task_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_user_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT '12/23/2025, 11:19:32 AM' NOT NULL,
	`deletedAt` text DEFAULT '',
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'employee' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user_table`("id", "createdAt", "deletedAt", "email", "password") SELECT "id", "createdAt", "deletedAt", "email", "password" FROM `user_table`;--> statement-breakpoint
DROP TABLE `user_table`;--> statement-breakpoint
ALTER TABLE `__new_user_table` RENAME TO `user_table`;