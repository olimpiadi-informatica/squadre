<template>
  <div class="container">
    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">OIS Editions</h5>

          <p class="card-text">
            {{ remote.teams }} teams from {{ remote.instnum }} institutes participated in all OIS editions.
          </p>
          <p class="card-text">
            Overall, {{ remote.points }} points were scored on {{ remote.tasks }} tasks.
          </p>
        </div>
      </div>

      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">Highlights</h5>
          <ol class="mb-0">
            <li v-for="row in remote.highlights" v-bind:row="row" v-bind:key="row.id">
              <router-link :to="row.id" active-class="active">
                <a>{{ row.name }}</a>
              </router-link>
              {{ row.description }}.
            </li>
          </ol>
        </div>
      </div>
    </div>

    <div v-if="!remote">
        Loading...
    </div>
    <table class="table table-sm table-responsive-lg table-striped table-borderless mt-3" v-else>
      <thead>
      <tr class="text-uppercase" style="font-size: small;">
        <th class="align-middle text-center">Edition</th>
        <th class="align-middle text-center">Year</th>
        <th class="align-middle text-center">Schools</th>
        <th class="align-middle text-center">Teams</th>
        <th class="align-middle text-center">Tasks</th>
        <th class="align-middle text-center">Highest</th>
        <th class="align-middle text-center">Median</th>
        <th class="align-middle text-center">Average</th>
        <th class="align-middle text-center">Total</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="row in remote.editions"
          v-bind:row="row"
          v-bind:key="row.id">
        <td class="align-middle text-center">
          <router-link :to="'/edition/' + row.id" active-class="active">
            <a>{{ row.title }}</a>
          </router-link>
        </td>
        <td class="align-middle text-center">{{ row.year }}</td>
        <td class="align-middle text-center">{{ row.instnum }}</td>
        <td class="align-middle text-center">{{ row.teams }}</td>
        <td class="align-middle text-center">{{ row.tasks }}</td>
        <td class="align-middle text-center">{{ row.highest }}</td>
        <td class="align-middle text-center">{{ row.medpos }}</td>
        <td class="align-middle text-center">{{ row.average }}</td>
        <td class="align-middle text-center">{{ row.points }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Editions',

  data () {
    return {
      remote: null,
      searchQuery: null,
    }
  },

  created () {
    this.init()
  },

  watch: {
    // call again the method if the route changes
    '$route': 'init'
  },

  methods: {
    init: function () {
      // fetch JSON data for the regions
      fetch(new Request('/json/edition.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data
          document.title = 'Editions — OIS'
        })
      })
    },

    getQuery: function (ranking, key) {
      return ranking.filter(function (row) {
        return row.name.toLowerCase().indexOf(key) >= 0
      })[0]
    },

    filterQuery: function (ranking) {
      if (this.searchQuery == null) {
        return ranking
      }
      let query = this.searchQuery.toLowerCase()

      return ranking.filter(function (row) {
        return row.name.toLowerCase().indexOf(query) >= 0
      })
    }
  }
}
</script>

<style scoped>
th {
  font-family: monospace;
  border-color: #d9d9d9 !important;
  border-style: solid !important;
  border-width: 1px 0 1px 0 !important;
}

th:hover {
  background-color: #d9d9d9;
  cursor: pointer;
}

th span.score-header {
  width: 8ch;
}
</style>
