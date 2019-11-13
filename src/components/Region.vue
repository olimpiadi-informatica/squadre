<template>
  <div class="mt-3">
    <nav aria-label="Navigation between regions" class="row container">
      <span class="font-weight-light ml-3" style="font-size: x-large">
        <router-link to="/region">Region:</router-link>
      </span>

      <ul class="pagination ml-2 mb-0">
        <router-link class="page-item" to="/region/abr" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">abr</a>
        </router-link>

        <router-link class="page-item" to="/region/alt" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">alt</a>
        </router-link>

        <router-link class="page-item" to="/region/bas" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">bas</a>
        </router-link>

        <router-link class="page-item" to="/region/cal" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">cal</a>
        </router-link>

        <router-link class="page-item" to="/region/cam" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">cam</a>
        </router-link>

        <router-link class="page-item" to="/region/emi" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">emi</a>
        </router-link>

        <router-link class="page-item" to="/region/fri" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">fri</a>
        </router-link>

        <router-link class="page-item" to="/region/laz" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">laz</a>
        </router-link>

        <router-link class="page-item" to="/region/lig" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">lig</a>
        </router-link>

        <router-link class="page-item" to="/region/lom" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">lom</a>
        </router-link>

        <router-link class="page-item" to="/region/mar" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">mar</a>
        </router-link>

        <router-link class="page-item" to="/region/mol" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">mol</a>
        </router-link>

        <router-link class="page-item" to="/region/pie" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">pie</a>
        </router-link>

        <router-link class="page-item" to="/region/pug" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">pug</a>
        </router-link>

        <router-link class="page-item" to="/region/sar" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">sar</a>
        </router-link>

        <router-link class="page-item" to="/region/sic" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">sic</a>
        </router-link>

        <router-link class="page-item" to="/region/tos" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">tos</a>
        </router-link>

        <router-link class="page-item" to="/region/tre" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">tre</a>
        </router-link>

        <router-link class="page-item" to="/region/umb" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">umb</a>
        </router-link>

        <router-link class="page-item" to="/region/val" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">val</a>
        </router-link>

        <router-link class="page-item" to="/region/ven" tag="li" active-class="active">
            <a class="page-link" style="font-size: 11pt">ven</a>
        </router-link>
      </ul>
    </nav>

    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">
            <img style="height: 2rem" :title='this.remote.name' :src="'/flags/' + this.remote.id + '.png'">
            {{ this.remote.name }}
          </h5>

          <p class="card-text">
            {{ remote.teams }} teams from {{ remote.instnum }} institutes participated in all OIS editions from {{ remote.name }}, scoring a total of {{ remote.points }} points.
          </p>
        </div>
      </div>

      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">Interesting facts</h5>
          <ol class="mb-0">
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
        <th class="align-middle text-center">School</th>
        <th class="align-middle text-center">City</th>
        <th class="align-middle text-center">Participations</th>
        <th class="align-middle text-center">Teams</th>
        <th class="align-middle text-center">Medals</th>
        <th class="align-middle text-center">Ranking</th>
        <th class="align-middle text-center">Points</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="row in filterQuery(remote.institutes)"
          v-bind:row="row"
          v-bind:key="row.id">
        <td class="align-middle text-center">
          <router-link :to="'/region/' + $route.params.regionId + '/' + row.id" active-class="active">
            <a>{{ row.name }}</a>
          </router-link>
        </td>
        <td class="align-middle text-center">{{ row.city }}</td>
        <td class="align-middle text-center">{{ row.participations }}</td>
        <td class="align-middle text-center">{{ row.teams }}</td>
        <td class="align-middle text-center">{{ row.medals }}</td>
        <td class="align-middle text-center">{{ row.bestavgrank }}</td>
        <td class="align-middle text-center">{{ row.points }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Region',

  data () {
    return {
      remote: null,
      searchQuery: null
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
      fetch(new Request('/json/region.' + this.$route.params.regionId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data
          document.title = this.remote.name + ' — OIS'
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
        return row.name.toLowerCase().indexOf(query) >= 0 || row.city.toLowerCase().indexOf(query) >= 0
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
