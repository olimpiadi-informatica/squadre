# squadre.olinfo.it

## Gather the JSON data

1. Go to the OIS private task repository.
1. `cd` into the `util/export_stats` folder.
1. `./exporter.py ~/git/www.squadre.olinfo.it/data -a`.

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```

### Lint

```sh
pnpm lint
```
