CREATE INDEX IF NOT EXISTS "internet_check_team_round_id_pc_hash_status_idx" ON "internet_check" USING btree ("team_round_id","pc_hash","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_task_score_team_id_idx" ON "team_task_score" USING btree ("team_id");
