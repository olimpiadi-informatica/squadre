CREATE TABLE "proctoring_unavailable" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"team_id" integer,
	"start_ts" timestamp with time zone NOT NULL,
	"end_ts" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proctoring_unavailable" ADD CONSTRAINT "proctoring_unavailable_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctoring_unavailable" ADD CONSTRAINT "proctoring_unavailable_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proctoring_unavailable_round_id_idx" ON "proctoring_unavailable" USING btree ("round_id");