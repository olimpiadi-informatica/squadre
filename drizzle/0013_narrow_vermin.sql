-- Le viste materializzate dipendono da `penalization.sent_at`: vanno salvate,
-- rimosse durante il cambio di tipo e ricreate subito dopo.
DROP TABLE IF EXISTS _drizzle_saved_matviews;--> statement-breakpoint
CREATE TABLE _drizzle_saved_matviews (name text PRIMARY KEY, definition text NOT NULL);--> statement-breakpoint
INSERT INTO _drizzle_saved_matviews (name, definition)
SELECT matviewname, pg_get_viewdef(matviewname::regclass, true)
FROM pg_matviews
WHERE schemaname = current_schema();--> statement-breakpoint
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT name FROM _drizzle_saved_matviews ORDER BY name DESC LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I CASCADE', r.name);
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone USING "access_token_expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone USING "refresh_token_expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "internet_check" ALTER COLUMN "start_ts" SET DATA TYPE timestamp with time zone USING "start_ts" AT TIME ZONE 'Europe/Rome';--> statement-breakpoint
ALTER TABLE "internet_check" ALTER COLUMN "end_ts" SET DATA TYPE timestamp with time zone USING "end_ts" AT TIME ZONE 'Europe/Rome';--> statement-breakpoint
ALTER TABLE "penalization" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "penalization" ALTER COLUMN "sent_at" SET DATA TYPE timestamp with time zone USING "sent_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "penalization" ALTER COLUMN "allow_appeal_until" SET DATA TYPE timestamp with time zone USING "allow_appeal_until" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "round" ALTER COLUMN "starts_at" SET DATA TYPE timestamp with time zone USING "starts_at" AT TIME ZONE 'Europe/Rome';--> statement-breakpoint
ALTER TABLE "round" ALTER COLUMN "starts_at" SET DEFAULT '1970-01-01 00:00:00';--> statement-breakpoint
ALTER TABLE "round" ALTER COLUMN "ends_at" SET DATA TYPE timestamp with time zone USING "ends_at" AT TIME ZONE 'Europe/Rome';--> statement-breakpoint
ALTER TABLE "round" ALTER COLUMN "ends_at" SET DEFAULT '1970-01-01 00:00:00';--> statement-breakpoint
ALTER TABLE "screenshot" ALTER COLUMN "ts" SET DATA TYPE timestamp with time zone USING "ts" AT TIME ZONE 'Europe/Rome';--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone USING "timestamp" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp with time zone USING "ban_expires" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT name, definition FROM _drizzle_saved_matviews ORDER BY name LOOP
    EXECUTE format('CREATE MATERIALIZED VIEW %I AS %s', r.name, r.definition);
  END LOOP;
END $$;--> statement-breakpoint
DROP TABLE _drizzle_saved_matviews;
