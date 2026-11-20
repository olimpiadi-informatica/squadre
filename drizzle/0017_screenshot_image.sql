ALTER TABLE "screenshot" ADD COLUMN "image" "bytea";--> statement-breakpoint
ALTER TABLE "screenshot" ADD COLUMN "content_type" text DEFAULT 'image/jpeg' NOT NULL;