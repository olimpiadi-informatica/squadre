CREATE TABLE "edition" (
	"id" text PRIMARY KEY NOT NULL,
	"year" text NOT NULL,
	"title" text NOT NULL,
	"public" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlight" (
	"id" bigserial PRIMARY KEY NOT NULL,
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
	"region" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" text NOT NULL,
	"edition_id" text NOT NULL,
	"title" text NOT NULL,
	"fullscore" integer NOT NULL,
	"public" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp DEFAULT '1970-01-01 00:00:00' NOT NULL,
	CONSTRAINT "round_id_edition_id_pk" PRIMARY KEY("id","edition_id")
);
--> statement-breakpoint
CREATE TABLE "task" (
	"name" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"round_id" text NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_score" (
	"task_name" text NOT NULL,
	"edition_id" text NOT NULL,
	"team_id" text NOT NULL,
	"score" integer NOT NULL,
	CONSTRAINT "task_score_task_name_team_id_pk" PRIMARY KEY("task_name","team_id")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text NOT NULL,
	"edition_id" text NOT NULL,
	"name" text NOT NULL,
	"inst_id" text NOT NULL,
	"coach" text NOT NULL,
	"finalist" boolean,
	"rank_reg" integer NOT NULL,
	"rank_tot" integer NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "team_id_edition_id_pk" PRIMARY KEY("id","edition_id")
);
--> statement-breakpoint
CREATE TABLE "team_round" (
	"round_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"team_id" text NOT NULL,
	"score" integer NOT NULL,
	"rank_tot" integer NOT NULL,
	"rank_reg" integer NOT NULL,
	"medal" integer,
	"password" text DEFAULT '' NOT NULL,
	"delay" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "team_round_round_id_edition_id_team_id_pk" PRIMARY KEY("round_id","edition_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "institute" ADD CONSTRAINT "institute_region_region_id_fk" FOREIGN KEY ("region") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_round_id_edition_id_round_id_edition_id_fk" FOREIGN KEY ("round_id","edition_id") REFERENCES "public"."round"("id","edition_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_score" ADD CONSTRAINT "task_score_task_name_task_name_fk" FOREIGN KEY ("task_name") REFERENCES "public"."task"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_score" ADD CONSTRAINT "task_score_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_score" ADD CONSTRAINT "task_score_team_id_edition_id_team_id_edition_id_fk" FOREIGN KEY ("team_id","edition_id") REFERENCES "public"."team"("id","edition_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_inst_id_institute_id_fk" FOREIGN KEY ("inst_id") REFERENCES "public"."institute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round" ADD CONSTRAINT "team_round_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round" ADD CONSTRAINT "team_round_team_id_edition_id_team_id_edition_id_fk" FOREIGN KEY ("team_id","edition_id") REFERENCES "public"."team"("id","edition_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_round" ADD CONSTRAINT "team_round_round_id_edition_id_round_id_edition_id_fk" FOREIGN KEY ("round_id","edition_id") REFERENCES "public"."round"("id","edition_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_highlight_page_id" ON "highlight" USING btree ("page","id");--> statement-breakpoint
CREATE INDEX "idx_institute_region_city_name_id" ON "institute" USING btree ("region","city","name","id");--> statement-breakpoint
CREATE INDEX "idx_institute_name" ON "institute" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_round_edition_title_id" ON "round" USING btree ("edition_id","title","id");--> statement-breakpoint
CREATE INDEX "idx_task_edition_round_id_name" ON "task" USING btree ("edition_id","round_id","name");--> statement-breakpoint
CREATE INDEX "idx_task_score_task_name_score" ON "task_score" USING btree ("task_name","score");--> statement-breakpoint
CREATE INDEX "idx_task_score_edition_team_id" ON "task_score" USING btree ("edition_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_team_inst_id_points_edition_id_id" ON "team" USING btree ("inst_id","points","edition_id","id");--> statement-breakpoint
CREATE INDEX "idx_team_edition_rank_tot_id_name_points" ON "team" USING btree ("edition_id","rank_tot","id","name","points");--> statement-breakpoint
CREATE INDEX "idx_team_edition_name" ON "team" USING btree ("edition_id","name");--> statement-breakpoint
CREATE INDEX "idx_team_edition_id" ON "team" USING btree ("edition_id","id");--> statement-breakpoint
CREATE INDEX "idx_team_round_medal_team_id_edition_id" ON "team_round" USING btree ("medal","team_id","edition_id");--> statement-breakpoint
CREATE INDEX "idx_team_round_edition_team_id" ON "team_round" USING btree ("edition_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_team_round_edition_round_id_rank_tot_team_id_total_score" ON "team_round" USING btree ("edition_id","round_id","rank_tot","team_id","score");