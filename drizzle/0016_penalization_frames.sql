CREATE TABLE "penalization_frame" (
	"id" serial PRIMARY KEY NOT NULL,
	"penalization_id" integer NOT NULL,
	"screenshot_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "penalization_frame" ADD CONSTRAINT "penalization_frame_penalization_id_penalization_id_fk" FOREIGN KEY ("penalization_id") REFERENCES "public"."penalization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalization_frame" ADD CONSTRAINT "penalization_frame_screenshot_id_screenshot_id_fk" FOREIGN KEY ("screenshot_id") REFERENCES "public"."screenshot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "penalization_frame_penalization_id_screenshot_id_unique" ON "penalization_frame" USING btree ("penalization_id","screenshot_id");--> statement-breakpoint
CREATE INDEX "penalization_frame_penalization_id_idx" ON "penalization_frame" USING btree ("penalization_id");