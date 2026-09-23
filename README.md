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
