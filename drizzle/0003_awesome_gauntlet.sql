ALTER TABLE `round_score` RENAME TO `team_round`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_team_round` (
	`round_id` text NOT NULL,
	`edition_id` text NOT NULL,
	`team_id` text NOT NULL,
	`score` integer NOT NULL,
	`rank_tot` integer NOT NULL,
	`rank_reg` integer NOT NULL,
	`medal` integer,
	PRIMARY KEY(`round_id`, `edition_id`, `team_id`),
	FOREIGN KEY (`edition_id`) REFERENCES `edition`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`,`edition_id`) REFERENCES `team`(`id`,`edition_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`round_id`,`edition_id`) REFERENCES `round`(`id`,`edition_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_team_round`("round_id", "edition_id", "team_id", "score", "rank_tot", "rank_reg", "medal") SELECT "round_id", "edition_id", "team_id", "score", "rank_tot", "rank_reg", "medal" FROM `team_round`;--> statement-breakpoint
DROP TABLE `team_round`;--> statement-breakpoint
ALTER TABLE `__new_team_round` RENAME TO `team_round`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_team_round_medal_team_id_edition_id` ON `team_round` (`medal`,`team_id`,`edition_id`);--> statement-breakpoint
CREATE INDEX `idx_team_round_edition_team_id` ON `team_round` (`edition_id`,`team_id`);--> statement-breakpoint
CREATE INDEX `idx_team_round_edition_round_id_rank_tot_team_id_total_score` ON `team_round` (`edition_id`,`round_id`,`rank_tot`,`team_id`,`score`);