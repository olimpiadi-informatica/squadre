# GIORGIO (Gestore Innovativo Omnicomprensivo Risultati Gare IIOT-OIS)

Piattaforma di gestione per le gare a squadre ([squadre.olinfo.it](https://squadre.olinfo.it)).

## Requisiti

- [Node.js](https://nodejs.org/) (consigliato v20+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) e Docker Compose (per PostgreSQL)

## Project Setup

```sh
pnpm install
```

### Database (Development)

Avvia il database PostgreSQL locale per lo sviluppo:

```sh
pnpm docker:dev
# oppure: docker compose -f docker/docker-compose.dev.yml up -d
```

Per arrestarlo:

```sh
pnpm docker:dev:down
# oppure: docker compose -f docker/docker-compose.dev.yml down
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000).

### Proctoring (admin)

Le registrazioni dello schermo non sono salvate nel database: la pagina
`/admin/edition/[editionId]/round/[roundId]/proctoring` le legge dalla
directory `screenshots/` (oppure da `SCREENSHOTS_DIR`). Per scaricarle dal
server di gara:

```sh
./scripts/download-screenshots.sh --teams-file teams.txt --with-logs
```

I log del proctoring (`logs.json`) contengono sia i controlli internet sia le
registrazioni: durante il caricamento dei risultati vengono importati entrambi
(tabella `screenshot` per i metadati, `internet_check` per i controlli). Se i
metadati non sono nel database, la pagina usa la directory locale come fallback.

La pagina admin è **Proctoring** (`.../proctoring`): controlli internet e
registrazioni mancanti, con le due timeline affiancate. Entrambe le penalità
vengono create in blocco con delle soglie (check internet falliti/mancanti e
minuti di registrazione mancanti).

Il visualizzatore frame-by-frame delle registrazioni è stato rimosso per ora;
i metadati delle registrazioni restano importati insieme ai risultati, così il
viewer potrà essere ripreso senza rifare il parsing.

### Compile and Minify for Production

```sh
pnpm build
```

### Production with Docker

Avvia l'applicazione completa (App Next.js + PostgreSQL) in produzione:

```sh
pnpm docker:prod
# oppure: docker compose -f docker/docker-compose.prod.yml up -d --build
```

Per arrestarlo:

```sh
pnpm docker:prod:down
# oppure: docker compose -f docker/docker-compose.prod.yml down
```

### Lint

```sh
pnpm lint
```
