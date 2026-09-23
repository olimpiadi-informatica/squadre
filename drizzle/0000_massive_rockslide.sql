CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" text NOT NULL,
	"round_id" integer NOT NULL,
	"email_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edition" (
	"id" text PRIMARY KEY NOT NULL,
	"year" text NOT NULL,
	"title" text NOT NULL,
	"public" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"status" text NOT NULL,
	"html" text
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlight" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"link" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institute" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"email" text,
	"school_email" text
);
--> statement-breakpoint
CREATE TABLE "institute_penalization" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"round_id" integer NOT NULL,
	"institute_id" text NOT NULL,
	CONSTRAINT "institute_penalization_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "internet_check" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_round_id" integer NOT NULL,
	"start_ts" timestamp NOT NULL,
	"end_ts" timestamp NOT NULL,
	"status" text NOT NULL,
	"pc_hash" text NOT NULL,
	"user_agent" text,
	"browser_name" text,
	"browser_major" integer,
	"os_name" text
);
--> statement-breakpoint
CREATE TABLE "penalization" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"appealAllowed" boolean NOT NULL,
	"allow_appeal_until" timestamp,
	"appeal_approved" boolean
);
--> statement-breakpoint
CREATE TABLE "penalization_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"institute_penalization_id" integer NOT NULL,
	"email_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"edition_id" text NOT NULL,
	"title" text NOT NULL,
	"fullscore" integer NOT NULL,
	"public" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp DEFAULT '1970-01-01 00:00:00' NOT NULL,
	"ends_at" timestamp DEFAULT '1970-01-01 00:00:00' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"team_round_id" integer NOT NULL,
	"task_id" integer NOT NULL,
	"score" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"round_id" integer NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"junior" boolean DEFAULT false NOT NULL,
	"regular" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"edition_id" text NOT NULL,
	"name" text NOT NULL,
	"inst_id" text NOT NULL,
	"coach" text NOT NULL,
	"junior" boolean DEFAULT false NOT NULL,
	"finalist" boolean,
	"hidden" boolean DEFAULT false NOT NULL,
	"unrestricted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_round" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"password" text DEFAULT '' NOT NULL,
	"delay" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_round_penalization" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_round_id" integer NOT NULL,
	"submission_id" integer,
	"penalization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_score" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_email" ADD CONSTRAINT "credential_email_institute_id_institute_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_email" ADD CONSTRAINT "credential_email_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_email" ADD CONSTRAINT "credential_email_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institute" ADD CONSTRAINT "institute_region_region_id_fk" FOREIGN KEY ("region") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institute_penalization" ADD CONSTRAINT "institute_penalization_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institute_penalization" ADD CONSTRAINT "institute_penalization_institute_id_institute_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internet_check" ADD CONSTRAINT "internet_check_team_round_id_team_round_id_fk" FOREIGN KEY ("team_round_id") REFERENCES "public"."team_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalization_email" ADD CONSTRAINT "penalization_email_institute_penalization_id_institute_penalization_id_fk" FOREIGN KEY ("institute_penalization_id") REFERENCES "public"."institute_penalization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalization_email" ADD CONSTRAINT "penalization_email_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_team_round_id_team_round_id_fk" FOREIGN KEY ("team_round_id") REFERENCES "public"."team_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_inst_id_institute_id_fk" FOREIGN KEY ("inst_id") REFERENCES "public"."institute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round" ADD CONSTRAINT "team_round_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round" ADD CONSTRAINT "team_round_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round_penalization" ADD CONSTRAINT "team_round_penalization_team_round_id_team_round_id_fk" FOREIGN KEY ("team_round_id") REFERENCES "public"."team_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round_penalization" ADD CONSTRAINT "team_round_penalization_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round_penalization" ADD CONSTRAINT "team_round_penalization_penalization_id_penalization_id_fk" FOREIGN KEY ("penalization_id") REFERENCES "public"."penalization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_task_score" ADD CONSTRAINT "team_task_score_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_task_score" ADD CONSTRAINT "team_task_score_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credential_email_institute_id_round_id_unique" ON "credential_email" USING btree ("institute_id","round_id");--> statement-breakpoint
CREATE INDEX "idx_highlight_page_id" ON "highlight" USING btree ("page","id");--> statement-breakpoint
CREATE UNIQUE INDEX "institute_penalization_institute_id_round_id_unique" ON "institute_penalization" USING btree ("institute_id","round_id");--> statement-breakpoint
CREATE INDEX "idx_penalization_type" ON "penalization" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_submission_team_round" ON "submission" USING btree ("team_round_id");--> statement-breakpoint
CREATE INDEX "idx_submission_task" ON "submission" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_submission_timestamp" ON "submission" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "task_slug_round_id" ON "task" USING btree ("slug","round_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_slug_edition_id" ON "team" USING btree ("slug","edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_round_round_id_team_id_unique" ON "team_round" USING btree ("round_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_round_penalization_unique" ON "team_round_penalization" USING btree ("team_round_id","penalization_id","submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_score_task_id_team_id_unique" ON "team_task_score" USING btree ("task_id","team_id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v00a_task_stats" AS (select "team_task_score"."task_id", count(distinct "team_task_score"."team_id") as "team_scored", COALESCE(sum("team_task_score"."score"), 0) as "total_scores", COALESCE(max("team_task_score"."score"), 0) as "max_score", COALESCE(avg("team_task_score"."score"), 0) as "avg_score", COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "team_task_score"."score"), 0) as "median_score" from "team_task_score" inner join "team" on ("team"."id" = "team_task_score"."team_id" and "team"."junior" = false) inner join "task" on "task"."id" = "team_task_score"."task_id" inner join "round" on ("round"."id" = "task"."round_id" and "round"."public" = true) inner join "edition" on ("edition"."id" = "round"."edition_id" and "edition"."public" = true) where ("team_task_score"."score" > 0 and not exists (select "penalized_team_round"."id" from "team_round" "penalized_team_round" inner join "team_round_penalization" on "team_round_penalization"."team_round_id" = "penalized_team_round"."id" inner join "penalization" on "penalization"."id" = "team_round_penalization"."penalization_id" where ("penalized_team_round"."team_id" = "team"."id" and "penalization"."level" = 'red' and "penalization"."sent_at" is not null and ("penalization"."appeal_approved" is null or "penalization"."appeal_approved" = false)))) group by "team_task_score"."task_id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v01a_team_task_score_stats" AS (select "team_task_score"."id", RANK() OVER (PARTITION BY "team_task_score"."task_id" ORDER BY "team_task_score"."score" DESC) as "rank_tot" from "team_task_score" inner join "team" on ("team"."id" = "team_task_score"."team_id" and "team"."junior" = false) inner join "task" on "task"."id" = "team_task_score"."task_id" inner join "round" on ("round"."id" = "task"."round_id" and "round"."public" = true) inner join "edition" on ("edition"."id" = "round"."edition_id" and "edition"."public" = true) where not exists (select "penalized_team_round"."id" from "team_round" "penalized_team_round" inner join "team_round_penalization" on "team_round_penalization"."team_round_id" = "penalized_team_round"."id" inner join "penalization" on "penalization"."id" = "team_round_penalization"."penalization_id" where ("penalized_team_round"."team_id" = "team"."id" and "penalization"."level" = 'red' and "penalization"."sent_at" is not null and ("penalization"."appeal_approved" is null or "penalization"."appeal_approved" = false))));--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v02b_team_round_stats" AS (select "team_round"."id", COALESCE(sum("team_task_score"."score"), 0) as "total_scores", RANK() OVER (PARTITION BY "team_round"."round_id" ORDER BY COALESCE(sum("team_task_score"."score"), 0) DESC) as "rank_tot", RANK() OVER (PARTITION BY "team_round"."round_id", "institute"."region" ORDER BY COALESCE(sum("team_task_score"."score"), 0) DESC) as "rank_reg", CASE
                                  WHEN PERCENT_RANK() OVER (PARTITION BY "team_round"."round_id" ORDER BY COALESCE(sum("team_task_score"."score"), 0) DESC) = 0    THEN 0
                                  WHEN PERCENT_RANK() OVER (PARTITION BY "team_round"."round_id" ORDER BY COALESCE(sum("team_task_score"."score"), 0) DESC) < 0.05 THEN 1
                                  WHEN PERCENT_RANK() OVER (PARTITION BY "team_round"."round_id" ORDER BY COALESCE(sum("team_task_score"."score"), 0) DESC) < 0.15 THEN 2
                                  WHEN PERCENT_RANK() OVER (PARTITION BY "team_round"."round_id" ORDER BY COALESCE(sum("team_task_score"."score"), 0) DESC) < 0.30 THEN 3
                                  ELSE null
                                END as "medal" from "team" inner join "edition" on ("edition"."id" = "team"."edition_id" and "edition"."public" = true) inner join "round" on ("round"."edition_id" = "edition"."id" and "round"."public" = true and ("team"."finalist" or "round"."slug" <> 'final')) left join "team_round" on ("team_round"."team_id" = "team"."id" and "team_round"."round_id" = "round"."id") left join "task" on "task"."round_id" = "round"."id" left join "team_task_score" on ("team_task_score"."team_id" = "team"."id" and "team_task_score"."task_id" = "task"."id") inner join "institute" on "institute"."id" = "team"."inst_id" where ("team"."junior" = false and not exists (select "team_round_penalization"."id" from "team_round_penalization" inner join "penalization" on "penalization"."id" = "team_round_penalization"."penalization_id" where ("team_round_penalization"."team_round_id" = "team_round"."id" and "penalization"."level" = 'yellow' and "penalization"."sent_at" is not null and ("penalization"."appeal_approved" is null or "penalization"."appeal_approved" = false))) and not exists (select "penalized_team_round"."id" from "team_round" "penalized_team_round" inner join "team_round_penalization" on "team_round_penalization"."team_round_id" = "penalized_team_round"."id" inner join "penalization" on "penalization"."id" = "team_round_penalization"."penalization_id" where ("penalized_team_round"."team_id" = "team"."id" and "penalization"."level" = 'red' and "penalization"."sent_at" is not null and ("penalization"."appeal_approved" is null or "penalization"."appeal_approved" = false)))) group by "team_round"."id", "institute"."region");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v03b_round_stats" AS (select "round"."id", count(distinct "team_round"."team_id") as "team_scored", COALESCE(sum("total_scores"), 0) as "total_scores", COALESCE(max("total_scores"), 0) as "max_score", COALESCE(avg("total_scores"), 0) as "avg_score", COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "total_scores"), 0) as "median_score" from "round" inner join "team_round" on "team_round"."round_id" = "round"."id" inner join "v02b_team_round_stats" on "v02b_team_round_stats"."id" = "team_round"."id" inner join "edition" on ("edition"."id" = "round"."edition_id" and "edition"."public" = true) where "total_scores" > 0 group by "round"."id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v04a_team_stats" AS (select "team"."id", COALESCE(sum("total_scores"), 0) as "total_scores", RANK() OVER (PARTITION BY "team"."edition_id" ORDER BY COALESCE(sum("total_scores"), 0) DESC) as "rank_tot", RANK() OVER (PARTITION BY "team"."edition_id", "institute"."region" ORDER BY COALESCE(sum("total_scores"), 0) DESC) as "rank_reg", COALESCE(avg("rank_tot"), 0) as "avg_round_rank", COALESCE(min("rank_tot"), 0) as "best_round_rank", JSON_BUILD_OBJECT(
        0, COUNT(*) FILTER (WHERE "medal" = 0),
        1, COUNT(*) FILTER (WHERE "medal" = 1),
        2, COUNT(*) FILTER (WHERE "medal" = 2),
        3, COUNT(*) FILTER (WHERE "medal" = 3)
      ) as "total_medals" from "team" inner join "edition" on ("edition"."id" = "team"."edition_id" and "edition"."public" = true) inner join "round" on ("round"."edition_id" = "edition"."id" and "round"."public" = true and ("team"."finalist" = true or "round"."slug" <> 'final')) left join "team_round" on ("team_round"."team_id" = "team"."id" and "team_round"."round_id" = "round"."id") left join "v02b_team_round_stats" on "v02b_team_round_stats"."id" = "team_round"."id" inner join "institute" on "institute"."id" = "team"."inst_id" where ("team"."junior" = false and not exists (select "penalized_team_round"."id" from "team_round" "penalized_team_round" inner join "team_round_penalization" on "team_round_penalization"."team_round_id" = "penalized_team_round"."id" inner join "penalization" on "penalization"."id" = "team_round_penalization"."penalization_id" where ("penalized_team_round"."team_id" = "team"."id" and "penalization"."level" = 'red' and "penalization"."sent_at" is not null and ("penalization"."appeal_approved" is null or "penalization"."appeal_approved" = false)))) group by "team"."id", "team"."edition_id", "institute"."region");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v05a_edition_stats" AS (select "team"."edition_id", count(distinct "team"."id") as "total_teams", COALESCE(sum("total_scores"), 0) as "total_scores", COALESCE(max("total_scores"), 0) as "highest_score" from "v04a_team_stats" inner join "team" on "team"."id" = "v04a_team_stats"."id" inner join "edition" on ("edition"."id" = "team"."edition_id" and "edition"."public" = true) group by "team"."edition_id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v06a_edition_stats2" AS (select "round"."edition_id", count(distinct "team"."inst_id") as "total_institutes", count(distinct "task"."id") as "total_tasks" from "v02b_team_round_stats" inner join "team_round" on "team_round"."id" = "v02b_team_round_stats"."id" inner join "team" on "team"."id" = "team_round"."team_id" inner join "task" on "task"."round_id" = "team_round"."round_id" inner join "round" on ("round"."id" = "team_round"."round_id" and "round"."public" = true) inner join "edition" on ("edition"."id" = "round"."edition_id" and "edition"."public" = true) group by "round"."edition_id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v07a_institute_stats" AS (select "team"."inst_id", count(distinct "team"."edition_id") as "total_editions", count(distinct "team"."id") as "total_teams", COALESCE(sum(v02b_team_round_stats.total_scores), 0) as "total_scores", JSON_BUILD_OBJECT(
        0, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 0),
        1, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 1),
        2, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 2),
        3, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 3)
      ) as "total_medals", COALESCE(min(v04a_team_stats.rank_tot), 0) as "best_edition_rank", COALESCE(min(v02b_team_round_stats.rank_tot), 0) as "best_round_rank" from "v02b_team_round_stats" inner join "team_round" on "team_round"."id" = "v02b_team_round_stats"."id" inner join "team" on "team"."id" = "team_round"."team_id" inner join "v04a_team_stats" on "v04a_team_stats"."id" = "team"."id" inner join "round" on ("round"."id" = "team_round"."round_id" and "round"."public" = true) inner join "edition" on ("edition"."id" = "round"."edition_id" and "edition"."public" = true) group by "team"."inst_id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."v08a_region_stats" AS (select "institute"."region", count(distinct "edition"."id") as "total_editions", count(distinct "institute"."id") as "total_institutes", count(distinct "team"."id") as "total_teams", COALESCE(sum(v02b_team_round_stats.total_scores), 0) as "total_scores", JSON_BUILD_OBJECT(
        0, COUNT(*) FILTER (WHERE "medal" = 0),
        1, COUNT(*) FILTER (WHERE "medal" = 1),
        2, COUNT(*) FILTER (WHERE "medal" = 2),
        3, COUNT(*) FILTER (WHERE "medal" = 3)
      ) as "total_medals", COALESCE(min(v04a_team_stats.rank_tot), 0) as "best_edition_rank", COALESCE(min(v02b_team_round_stats.rank_tot), 0) as "best_round_rank" from "v02b_team_round_stats" inner join "team_round" on "team_round"."id" = "v02b_team_round_stats"."id" inner join "team" on "team"."id" = "team_round"."team_id" inner join "v04a_team_stats" on "v04a_team_stats"."id" = "team"."id" inner join "round" on ("round"."id" = "team_round"."round_id" and "round"."public" = true) inner join "edition" on ("edition"."id" = "round"."edition_id" and "edition"."public" = true) inner join "institute" on "institute"."id" = "team"."inst_id" group by "institute"."region");