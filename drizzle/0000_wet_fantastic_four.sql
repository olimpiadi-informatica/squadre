-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `region` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `edition` (
	`id` text PRIMARY KEY NOT NULL,
	`year` text NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `round` (
	`id` text NOT NULL,
	`edition_id` text NOT NULL,
	`title` text NOT NULL,
	`fullscore` integer NOT NULL,
	PRIMARY KEY(`id`, `edition_id`),
	FOREIGN KEY (`edition_id`) REFERENCES `edition`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_round_edition_title_id` ON `round` (`edition_id`,`title`,`id`);--> statement-breakpoint
CREATE TABLE `task` (
	`name` text PRIMARY KEY NOT NULL,
	`edition_id` text NOT NULL,
	`round_id` text NOT NULL,
	`title` text NOT NULL,
	`statement` text NOT NULL,
	FOREIGN KEY (`round_id`,`edition_id`) REFERENCES `round`(`id`,`edition_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `edition`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_task_edition_round_id_name` ON `task` (`edition_id`,`round_id`,`name`);--> statement-breakpoint
CREATE TABLE `institute` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`region` text NOT NULL,
	FOREIGN KEY (`region`) REFERENCES `region`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_institute_region_city_name_id` ON `institute` (`region`,`city`,`name`,`id`);--> statement-breakpoint
CREATE INDEX `idx_institute_name` ON `institute` (`name`);--> statement-breakpoint
CREATE TABLE `team` (
	`id` text NOT NULL,
	`edition_id` text NOT NULL,
	`name` text NOT NULL,
	`inst_id` text NOT NULL,
	`coach` text NOT NULL,
	`finalist` integer,
	`rank_reg` integer NOT NULL,
	`rank_tot` integer NOT NULL,
	`points` integer NOT NULL,
	PRIMARY KEY(`id`, `edition_id`),
	FOREIGN KEY (`inst_id`) REFERENCES `institute`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `edition`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_team_inst_id_points_edition_id_id` ON `team` (`inst_id`,`points`,`edition_id`,`id`);--> statement-breakpoint
CREATE INDEX `idx_team_edition_rank_tot_id_name_points` ON `team` (`edition_id`,`rank_tot`,`id`,`name`,`points`);--> statement-breakpoint
CREATE INDEX `idx_team_edition_name` ON `team` (`edition_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_team_edition_id` ON `team` (`edition_id`,`id`);--> statement-breakpoint
CREATE TABLE `round_score` (
	`round_id` text NOT NULL,
	`edition_id` text NOT NULL,
	`team_id` text NOT NULL,
	`score` integer NOT NULL,
	`rank_tot` integer NOT NULL,
	`rank_reg` integer NOT NULL,
	`medal` integer,
	PRIMARY KEY(`round_id`, `edition_id`, `team_id`),
	FOREIGN KEY (`team_id`,`edition_id`) REFERENCES `team`(`id`,`edition_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`round_id`,`edition_id`) REFERENCES `round`(`id`,`edition_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `edition`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_round_score_medal_team_id_edition_id` ON `round_score` (`medal`,`team_id`,`edition_id`);--> statement-breakpoint
CREATE INDEX `idx_round_score_edition_team_id` ON `round_score` (`edition_id`,`team_id`);--> statement-breakpoint
CREATE INDEX `idx_round_score_edition_round_id_rank_tot_team_id_total_score` ON `round_score` (`edition_id`,`round_id`,`rank_tot`,`team_id`,`score`);--> statement-breakpoint
CREATE TABLE `task_score` (
	`task_name` text NOT NULL,
	`edition_id` text NOT NULL,
	`team_id` text NOT NULL,
	`score` integer NOT NULL,
	PRIMARY KEY(`task_name`, `team_id`),
	FOREIGN KEY (`team_id`,`edition_id`) REFERENCES `team`(`id`,`edition_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_name`,`edition_id`) REFERENCES `task`(`name`,`edition_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `edition`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_name`) REFERENCES `task`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_task_score_task_name_score` ON `task_score` (`task_name`,`score`);--> statement-breakpoint
CREATE INDEX `idx_task_score_edition_team_id` ON `task_score` (`edition_id`,`team_id`);--> statement-breakpoint
CREATE TABLE `highlight` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`page` text NOT NULL,
	`link` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_highlight_page_id` ON `highlight` (`page`,`id`);
*/