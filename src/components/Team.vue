<template>
  <div class="container">
    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">
            Team "{{ this.remote.name }}" ({{ this.remote.edition }}, {{ this.remote.year }})
          </h5>
          <p class="card-text">
            <router-link :to="'/region/' + this.remote.region + '/' + this.remote.inst_id" active-class="active">
              {{ this.remote.institute }} ({{ this.remote.fullregion }})
            </router-link>
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

    <div v-if="!remote">
        Loading...
    </div>
    <div v-else>
      <div v-for="row in remote.contests" v-bind:row="row" v-bind:key="row.id">
        <h4 class="mt-3"><router-link :to="'/edition/' + remote.ed_num + '/round/' + row.id" active-class="active">{{ row.title }}</router-link></h4>

        <table class="table table-sm table-responsive-lg table-borderless table-striped mt-3">
          <thead>
            <tr class="text-uppercase" style="font-size: small;">
              <th class="align-middle text-center">Rank</th>
              <th class="align-middle text-center">Reg. Rank</th>
              <th class="align-middle text-center">Score</th>
              <th class="text-center"
                  v-for="task in row.tasks"
                  v-bind:task="task"
                  v-bind:key="task.name">
                <span class="score-header d-inline-block align-middle text-truncate">
                  <router-link :to="'/edition/' + remote.ed_num + '/round/' + row.id + '/' + task.name" active-class="active">{{ task.name }}</router-link>
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td class="align-middle text-center">
                {{ row.rank_tot }}
                <font-awesome-icon v-if="row.rank_tot == 1" icon="certificate" style="color: green" />
                <font-awesome-icon v-if="row.rank_tot > 1 && (row.rank_tot-1)*100 <= 5*(row.teams-1)" icon="certificate" style="color: goldenrod" />
                <font-awesome-icon v-if="5*(row.teams-1) < (row.rank_tot-1)*100 && (row.rank_tot-1)*100 <= 15*(row.teams-1)" icon="certificate" style="color: silver" />
                <font-awesome-icon v-if="15*(row.teams-1) < (row.rank_tot-1)*100 && (row.rank_tot-1)*100 <= 30*(row.teams-1)" icon="certificate" style="color: brown" />
              </td>
              <td class="align-middle text-center">
                {{ row.rank_reg }}
              </td>
              <td class="align-middle font-weight-bold text-center">
                {{ row.total }}
              </td>
              <td class="align-middle text-center"
                  v-for="(score, index) in row.scores"
                  v-bind:key="row.id + index"
                  v-bind:score="score"
                  v-bind:class="{ 'font-weight-bold': score != null && score == 100,
                                  'alert-success': score != null && score > 80,
                                  'alert-warning': score != null && score > 40 && score <= 80,
                                  'alert-danger': score != null && score <= 40 }">
                {{ score == null ? "–" : score }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Team',

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
      fetch(new Request('/json/edition.' + this.$route.params.editionId + '.team.' + this.$route.params.teamId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data
          document.title = this.remote.name + ' (' + this.remote.year + ')' + ' — OIS'
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
