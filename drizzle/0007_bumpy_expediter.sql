ALTER TABLE "round_email" DROP CONSTRAINT "round_email_institute_id_edition_id_round_id_pk";--> statement-breakpoint
ALTER TABLE "round_email" ADD COLUMN "id" bigserial PRIMARY KEY NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "round_email_institute_id_edition_id_round_id_unique" ON "round_email" USING btree ("institute_id","edition_id","round_id");