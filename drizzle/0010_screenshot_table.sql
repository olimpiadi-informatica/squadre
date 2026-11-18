CREATE TABLE "screenshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_round_id" integer NOT NULL,
	"pc_hash" text NOT NULL,
	"ts" timestamp NOT NULL,
	"filename" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "screenshot" ADD CONSTRAINT "screenshot_team_round_id_team_round_id_fk" FOREIGN KEY ("team_round_id") REFERENCES "public"."team_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "screenshot_team_round_id_pc_hash_ts_unique" ON "screenshot" USING btree ("team_round_id","pc_hash","ts");--> statement-breakpoint
CREATE INDEX "screenshot_team_round_id_idx" ON "screenshot" USING btree ("team_round_id");