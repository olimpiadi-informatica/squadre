CREATE TABLE "penalization_email_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"penalization_email_id" integer NOT NULL,
	"penalization_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "penalization_email_item" ADD CONSTRAINT "penalization_email_item_penalization_email_id_penalization_email_id_fk" FOREIGN KEY ("penalization_email_id") REFERENCES "public"."penalization_email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalization_email_item" ADD CONSTRAINT "penalization_email_item_penalization_id_penalization_id_fk" FOREIGN KEY ("penalization_id") REFERENCES "public"."penalization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "penalization_email_item_unique" ON "penalization_email_item" USING btree ("penalization_email_id","penalization_id");--> statement-breakpoint
-- Backfill: associa le penalizzazioni già inviate all'ultima email inviata con
-- successo per ciascun istituto, così non vengono rispedite.
INSERT INTO "penalization_email_item" ("penalization_email_id", "penalization_id")
SELECT latest.email_id, p.id
FROM "institute_penalization" ip
JOIN LATERAL (
	SELECT pe.id AS email_id
	FROM "penalization_email" pe
	JOIN "email" e ON e.id = pe.email_id
	WHERE pe.institute_penalization_id = ip.id AND e.status = 'sent'
	ORDER BY pe.email_id DESC
	LIMIT 1
) latest ON true
JOIN "team_round_penalization" trp ON true
JOIN "team_round" tr ON tr.id = trp.team_round_id
JOIN "team" t ON t.id = tr.team_id
JOIN "penalization" p ON p.id = trp.penalization_id
WHERE t.inst_id = ip.institute_id
	AND tr.round_id = ip.round_id
	AND p.sent_at IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Usa la data di invio delle penalizzazioni come data delle email già esistenti.
UPDATE "email" e
SET "created_at" = s.sent_at
FROM (
	SELECT pe.email_id, MAX(p.sent_at) AS sent_at
	FROM "penalization_email" pe
	JOIN "penalization_email_item" i ON i.penalization_email_id = pe.id
	JOIN "penalization" p ON p.id = i.penalization_id
	GROUP BY pe.email_id
) s
WHERE e.id = s.email_id AND s.sent_at IS NOT NULL;