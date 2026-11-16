-- Fusione dei round esordienti (OIS 16-17) nei round regolari.
--
-- Nelle OIS 16/17 gli esordienti avevano round dedicati ('1e'..'4e'), tenuti
-- negli stessi orari dei round regolari ('1'..'4'). Da OIS 18 il modello
-- prevede un unico round con task `regular` e `junior`: qui i round 'Ne'
-- vengono fusi nel round 'N' corrispondente.
--
-- I task condivisi (stesso slug, cioè lo stesso problema) diventano un unico
-- task con `junior = true` e `regular = true`; i task esclusivi degli
-- esordienti vengono spostati nel round regolare con `junior = true`.
--
-- Migrazione di soli dati: lo schema non cambia.

-- Round esordienti da fondere e round regolare corrispondente.
CREATE TEMP TABLE junior_round_map AS
SELECT jr.id AS junior_id, rr.id AS regular_id
FROM round jr
JOIN round rr
  ON rr.edition_id = jr.edition_id
 AND rr.slug = regexp_replace(jr.slug, 'e$', '')
WHERE jr.edition_id IN ('16', '17')
  AND jr.slug ~ '^[0-9]+e$';
--> statement-breakpoint

-- Le iscrizioni al round esordienti confluiscono in quelle del round regolare,
-- che esistono già per tutte le squadre. Le penalizzazioni collegate seguono.
CREATE TEMP TABLE team_round_map AS
SELECT jtr.id AS junior_id, rtr.id AS regular_id
FROM team_round jtr
JOIN junior_round_map jr ON jr.junior_id = jtr.round_id
JOIN team_round rtr ON rtr.round_id = jr.regular_id AND rtr.team_id = jtr.team_id;
--> statement-breakpoint

UPDATE internet_check ic SET team_round_id = m.regular_id
FROM team_round_map m WHERE ic.team_round_id = m.junior_id;
--> statement-breakpoint

UPDATE submission s SET team_round_id = m.regular_id
FROM team_round_map m WHERE s.team_round_id = m.junior_id;
--> statement-breakpoint

UPDATE team_round_penalization trp SET team_round_id = m.regular_id
FROM team_round_map m
WHERE trp.team_round_id = m.junior_id
  AND NOT EXISTS (
    SELECT 1
    FROM team_round_penalization x
    WHERE x.team_round_id = m.regular_id
      AND x.penalization_id = trp.penalization_id
      AND x.submission_id IS NOT DISTINCT FROM trp.submission_id
  );
--> statement-breakpoint

-- Eventuali doppioni rimasti (la unique non copre i submission_id NULL).
DELETE FROM team_round_penalization trp USING team_round_map m
WHERE trp.team_round_id = m.junior_id;
--> statement-breakpoint

DELETE FROM team_round tr USING team_round_map m WHERE tr.id = m.junior_id;
--> statement-breakpoint

-- Task esordienti con lo stesso slug di un task regolare: è lo stesso problema,
-- quindi punteggi e submission confluiscono nell'unico task.
CREATE TEMP TABLE task_map AS
SELECT jt.id AS junior_id, rt.id AS regular_id
FROM task jt
JOIN junior_round_map jr ON jr.junior_id = jt.round_id
JOIN task rt ON rt.round_id = jr.regular_id AND rt.slug = jt.slug;
--> statement-breakpoint

UPDATE team_task_score s SET task_id = m.regular_id
FROM task_map m
WHERE s.task_id = m.junior_id
  AND NOT EXISTS (
    SELECT 1
    FROM team_task_score x
    WHERE x.task_id = m.regular_id AND x.team_id = s.team_id
  );
--> statement-breakpoint

DELETE FROM team_task_score s USING task_map m WHERE s.task_id = m.junior_id;
--> statement-breakpoint

UPDATE submission s SET task_id = m.regular_id
FROM task_map m WHERE s.task_id = m.junior_id;
--> statement-breakpoint

UPDATE task t SET junior = true FROM task_map m WHERE t.id = m.regular_id;
--> statement-breakpoint

DELETE FROM task t USING task_map m WHERE t.id = m.junior_id;
--> statement-breakpoint

-- Task esclusivi degli esordienti: si spostano nel round regolare.
UPDATE task t SET round_id = jr.regular_id
FROM junior_round_map jr
WHERE t.round_id = jr.junior_id;
--> statement-breakpoint

-- Email e penalizzazioni di istituto legate al round (vuote nei dati storici,
-- gestite per sicurezza).
UPDATE credential_email ce SET round_id = jr.regular_id
FROM junior_round_map jr
WHERE ce.round_id = jr.junior_id
  AND NOT EXISTS (
    SELECT 1 FROM credential_email x
    WHERE x.round_id = jr.regular_id AND x.institute_id = ce.institute_id
  );
--> statement-breakpoint

DELETE FROM credential_email ce USING junior_round_map jr
WHERE ce.round_id = jr.junior_id;
--> statement-breakpoint

UPDATE institute_penalization ip SET round_id = jr.regular_id
FROM junior_round_map jr
WHERE ip.round_id = jr.junior_id
  AND NOT EXISTS (
    SELECT 1 FROM institute_penalization x
    WHERE x.round_id = jr.regular_id AND x.institute_id = ip.institute_id
  );
--> statement-breakpoint

DELETE FROM institute_penalization ip USING junior_round_map jr
WHERE ip.round_id = jr.junior_id;
--> statement-breakpoint

-- Il round esordienti ora è vuoto: si può eliminare.
DELETE FROM round r USING junior_round_map jr WHERE r.id = jr.junior_id;
--> statement-breakpoint

DROP TABLE task_map;
DROP TABLE team_round_map;
DROP TABLE junior_round_map;
--> statement-breakpoint

-- Gli highlight puntano ai vecchi slug: si aggiornano subito, in attesa della
-- rigenerazione completa (admin -> refresh viste).
UPDATE highlight SET
  page = regexp_replace(page, '/round/([0-9]+)e/', '/round/\1/', 'g'),
  link = regexp_replace(link, '/round/([0-9]+)e/', '/round/\1/', 'g'),
  name = CASE
    WHEN name ~ '^Round [0-9]+E$' THEN regexp_replace(name, 'E$', '')
    ELSE name
  END
WHERE page ~ '/round/[0-9]+e/' OR link ~ '/round/[0-9]+e/';
--> statement-breakpoint

-- Le viste materializzate vanno ricalcolate, dal basso verso l'alto.
REFRESH MATERIALIZED VIEW v00a_task_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v01a_team_task_score_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v02b_team_round_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v03b_round_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v04a_team_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v05a_edition_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v06a_edition_stats2;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v07a_institute_stats;
--> statement-breakpoint

REFRESH MATERIALIZED VIEW v08a_region_stats;
