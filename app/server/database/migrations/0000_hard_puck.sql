CREATE TABLE `k8s_cluster_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL,
	`description` text,
	`region` varchar(50) DEFAULT 'ap-nanjing',
	`pod_cidr` varchar(50) DEFAULT '10.244.0.0/24',
	`service_cidr` varchar(50) DEFAULT '10.96.0.0/16',
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` datetime(3),
	CONSTRAINT `k8s_cluster_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `k8s_node_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clusterId` int NOT NULL,
	`instance_id` varchar(255) NOT NULL,
	`node_name` varchar(255),
	`role` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` datetime(3),
	CONSTRAINT `k8s_node_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100),
	`tag` varchar(100),
	`description` text,
	`status` varchar(20) NOT NULL,
	`createdByUserId` int NOT NULL,
	`assignedToUserId` int,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`deletedAt` datetime(3),
	CONSTRAINT `task_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'employee',
	`version` int NOT NULL DEFAULT 1,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`deletedAt` datetime(3),
	CONSTRAINT `user_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_table_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `k8s_node_table` ADD CONSTRAINT `k8s_node_table_clusterId_k8s_cluster_table_id_fk` FOREIGN KEY (`clusterId`) REFERENCES `k8s_cluster_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_table` ADD CONSTRAINT `task_table_createdByUserId_user_table_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `user_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_table` ADD CONSTRAINT `task_table_assignedToUserId_user_table_id_fk` FOREIGN KEY (`assignedToUserId`) REFERENCES `user_table`(`id`) ON DELETE no action ON UPDATE no action;