<template>
  <div class="container">
    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">
            <img style="height: 2rem" :title='this.remote.fullregion' :src="'/flags/' + this.remote.region + '.png'">
            {{ this.remote.name }}, {{ this.remote.city }} (<router-link :to="'/region/' + this.remote.region" active-class="active">{{ this.remote.fullregion }}</router-link>)
          </h5>
          <p class="card-text">
            {{ remote.teams }} teams from this institute participated in {{ remote.participations.length }} OIS editions, scoring a total of {{ remote.points }} points.
          </p>
          <p class="card-text">
            Teams of {{ remote.name }} have an average ranking of {{ remote.bestavgrank.toFixed(0) }}%, and the best rank ever achieved by a team is {{ remote.bestedrank }} in an edition ({{ remote.bestrank }} in a contest).
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
    <div v-else>
      <div v-for="ed in remote.editions" v-bind:ed="ed" v-bind:key="ed.id">
        <h4 class="mt-3"><router-link :to="'/edition/' + ed.num" active-class="active">{{ ed.title }} ({{ ed.year }})</router-link></h4>
        <table class="table table-sm table-responsive-lg table-striped table-borderless mt-3">
          <thead>
          <tr class="text-uppercase" style="font-size: small;">
            <th class="align-middle text-center">Rank</th>
            <th class="align-middle text-center">Reg. Rank</th>
            <th class="align-middle text-center">Name</th>
            <th class="align-middle text-center">Coach</th>
            <th class="align-middle text-center">To Finals</th>
            <th class="align-middle text-center">Awards</th>
            <th class="align-middle text-center">Ranking</th>
            <th class="align-middle text-center">Points</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="row in filterQuery(ed.teams)" v-bind:row="row" v-bind:key="row.id">
            <td class="align-middle text-center">{{ row.rank_tot }}</td>
            <td class="align-middle text-center">{{ row.rank_reg }}</td>
            <td class="align-middle text-center">
              <router-link :to="'/edition/' + ed.num + '/team/' + row.id" active-class="active">
                <a>{{ row.name }}</a>
              </router-link>
            </td>
            <td class="align-middle text-center">{{ row.coach }}</td>
            <td class="align-middle text-center">
              <font-awesome-icon v-if="row.finalist === true" icon="certificate" style="color: goldenrod" />
            </td>
            <td class="align-middle text-center">
                <span v-if="row.medals[0] > 0" title="platinum medals are awarded for ranking 1st in a contest">
                  {{ row.medals[0] }}<font-awesome-icon icon="medal" style="color: green" />
                </span>
                <span v-if="row.medals[1] > 0" title="gold medals are awarded for ranking in the top 5% of a contest">
                  {{ row.medals[1] }}<font-awesome-icon icon="medal" style="color: goldenrod" />
                </span>
                <span v-if="row.medals[2] > 0" title="silver medals are awarded for ranking in the top 15% of a contest">
                  {{ row.medals[2] }}<font-awesome-icon icon="medal" style="color: silver" />
                </span>
                <span v-if="row.medals[3] > 0" title="bronze medals are awarded for ranking in the top 30% of a contest">
                  {{ row.medals[3] }}<font-awesome-icon icon="medal" style="color: brown" />
                </span>
            </td>
            <td class="align-middle text-center"><span :title="row.avgrank.toFixed(2) + '%'">{{ row.avgrank.toFixed(0) }}%</span></td>
            <td class="align-middle text-center">{{ row.points }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'School',

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
      fetch(new Request('/json/region.' + this.$route.params.regionId + '.' + this.$route.params.schoolId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data
          document.title = this.remote.name + ', ' + this.remote.city + ' — OIS'
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
        return row.name.toLowerCase().indexOf(query) >= 0 || row.coach.toLowerCase().indexOf(query) >= 0
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
