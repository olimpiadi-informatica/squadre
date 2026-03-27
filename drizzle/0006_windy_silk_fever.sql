CREATE TABLE "round_email" (
	"institute_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"round_id" text NOT NULL,
	"address" text,
	"status" text DEFAULT 'not-sent' NOT NULL,
	CONSTRAINT "round_email_institute_id_edition_id_round_id_pk" PRIMARY KEY("institute_id","edition_id","round_id")
);
--> statement-breakpoint
ALTER TABLE "round_email" ADD CONSTRAINT "round_email_institute_id_institute_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_email" ADD CONSTRAINT "round_email_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_email" ADD CONSTRAINT "round_email_round_id_edition_id_round_id_edition_id_fk" FOREIGN KEY ("round_id","edition_id") REFERENCES "public"."round"("id","edition_id") ON DELETE no action ON UPDATE no action;