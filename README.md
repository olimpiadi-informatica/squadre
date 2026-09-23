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

### Database

Avvia il database PostgreSQL locale:

```sh
docker compose up -d
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

### Lint

```sh
pnpm lint
```
