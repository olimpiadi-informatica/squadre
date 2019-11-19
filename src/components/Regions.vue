<template>
  <div class="mt-3">
    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">OIS Regions</h5>

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

    <div class="input-group col-4 m-3 p-0">
      <div class="input-group-prepend">
        <span class="input-group-text" id="basic-addon1">
          <font-awesome-icon icon="search" />
        </span>
      </div>
      <input type="text" class="form-control" placeholder="Search" aria-label="Search" aria-describedby="basic-addon1"
          v-model="searchQuery">
    </div>

    <div v-if="!remote">
        Loading...
    </div>
    <table class="table table-sm table-responsive-lg table-striped table-borderless mt-3" v-else>
      <thead>
      <tr class="text-uppercase" style="font-size: small;">
        <th class="align-middle text-center"></th>
        <th class="align-middle text-center">Region</th>
        <th class="align-middle text-center">Participations</th>
        <th class="align-middle text-center">Schools</th>
        <th class="align-middle text-center">Teams</th>
        <th class="align-middle text-center">Awards</th>
        <th class="align-middle text-center">Ranking</th>
        <th class="align-middle text-center">Points</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="row in filterQuery(remote.regions)"
          v-bind:row="row"
          v-bind:key="row.id">
        <td class="align-middle text-center">
          <img style="height: 2rem" :title='row.id' :src="'/flags/' + row.id + '.png'">
        </td>
        <td class="align-middle text-center">
          <router-link :to="'/region/' + row.id" active-class="active">
            <a>{{ row.name }}</a>
          </router-link>
        </td>
        <td class="align-middle text-center">
          <span v-for="p in row.participations" v-bind:p="p" v-bind:key="p">
            <router-link :to="'/edition/' + p" active-class="active">
            {{ p }}th
            </router-link>
          </span>
        </td>
        <td class="align-middle text-center">{{ row.instnum }}</td>
        <td class="align-middle text-center">{{ row.teams }}</td>
        <td class="align-middle text-center">
            <span v-if="row.medals[0] > 0">
              {{ row.medals[0] }}<font-awesome-icon icon="certificate" style="color: green" />
            </span>
            <span v-if="row.medals[1] > 0">
              {{ row.medals[1] }}<font-awesome-icon icon="certificate" style="color: goldenrod" />
            </span>
            <span v-if="row.medals[2] > 0">
              {{ row.medals[2] }}<font-awesome-icon icon="certificate" style="color: silver" />
            </span>
            <span v-if="row.medals[3] > 0">
              {{ row.medals[3] }}<font-awesome-icon icon="certificate" style="color: brown" />
            </span>
        </td>
        <td class="align-middle text-center">{{ row.bestavgrank }}</td>
        <td class="align-middle text-center">{{ row.points }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Regions',

  data () {
    return {
      remote: null,
      searchQuery: null,
      bigRegion : null,
      bestRegion : null
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
      fetch(new Request('/json/region.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data
          this.bigRegion = this.getQuery(data.regions, 'emi')
          this.bestRegion = this.getQuery(data.regions, 'sic')
          document.title = 'Regions — OIS'
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
