-- Unifica le vecchie categorie `screen-recording` e `internet-check` nella
-- nuova categoria `proctoring`. La penalità resta una sola e la pagina
-- Proctoring mostra sia la timeline della registrazione sia quella dei
-- controlli internet.
UPDATE "penalization"
SET "type" = 'proctoring'
WHERE "type" IN ('screen-recording', 'internet-check');
