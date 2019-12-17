# www.squadre.olinfo.it

## Gather the JSON data

1. Go to the OIS private task repository.
1. `cd` into the `util/export_data` folder.
1. `./exporter.py ~/git/www.squadre.olinfo.it/public ois*`.
1. Check and possibly fix the `LATEST_EDITION_ID` in `src/router/index.js`, and the edition navigator in `EditionRanking.vue`.

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn run serve
```

### Compiles and minifies for production
```
yarn run build
```

### Run your tests
```
yarn run test
```

### Lints and fixes files
```
yarn run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).