<template>
  <div class="mt-3">
    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h4>
            <router-link :to="'/edition/' + $route.params.editionId">
              OIS {{ remote.edition }}
            </router-link> — {{ remote.title }}
          </h4>

          <div class="card-text btn-group" role="group" aria-label="Rounds">
            <router-link class="btn btn-outline-primary" :to="'/edition/' + $route.params.editionId + '/round/' + i"
                v-for="i in [1, 2, 3, 4]"
                v-bind:key="i"
                v-bind:class="{ 'active': i == parseInt($route.params.roundId),
                                'disabled': $route.params.editionId === '11' && i > 0 }">
              Round {{ i }}
            </router-link>

            <router-link class="btn btn-outline-success" :to="'/edition/' + $route.params.editionId + '/round/final'"
                v-bind:class="{ 'active': 'final' === $route.params.roundId,
                                'disabled': $route.params.editionId === '11' }">
              Final Round
            </router-link>
          </div>

          <p class="card-text">
            {{ remote.positive }} teams scored {{ remote.points }} points on {{ remote.tasks.length }} tasks, for an average score of {{ remote.avgpos.toFixed(0) }} and a median score of {{ remote.medpos }}.
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
    <table class="table table-sm table-responsive-lg table-borderless table-striped mt-3" v-else>
      <thead>
        <tr class="text-uppercase" style="font-size: small;">
          <th class="align-middle text-center">Rank</th>
          <th class="align-middle text-center">Reg. Rank</th>
          <th class="align-middle">Team</th>
          <th class="align-middle">Institute</th>
          <th class="align-middle text-center">Region</th>
          <th class="align-middle text-center">Score</th>
          <th class="align-middle text-center"
              v-for="task in remote.tasks"
              v-bind:task="task"
              v-bind:key="task.name">
            <span class="score-header d-inline-block align-middle text-truncate">
              <router-link :to="'/edition/' + remote.ed_num + '/round/' + remote.id + '/' + task.name" active-class="active">{{ task.name }}</router-link>
            </span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in filterQuery(remote.ranking)"
            v-bind:row="row"
            v-bind:key="row.team.id">
          <td class="align-middle text-center" title="medals are assigned: platinum to the 1st, gold to the top 5%, silver to the top 15%, bronze to the top 30%">
            {{ row.rank }}
            <font-awesome-icon v-if="row.rank == 1" icon="certificate" style="color: green" />
            <font-awesome-icon v-if="row.rank > 1 && (row.rank-1)*100 <= 5*(remote.teams-1)" icon="certificate" style="color: goldenrod" />
            <font-awesome-icon v-if="5*(remote.teams-1) < (row.rank-1)*100 && (row.rank-1)*100 <= 15*(remote.teams-1)" icon="certificate" style="color: silver" />
            <font-awesome-icon v-if="15*(remote.teams-1) < (row.rank-1)*100 && (row.rank-1)*100 <= 30*(remote.teams-1)" icon="certificate" style="color: brown" />
          </td>
          <td class="align-middle text-center">{{ row.rank_reg }}</td>
          <td class="align-middle font-weight-bold">
            <router-link :to="'/edition/' + remote.ed_num + '/team/' + row.team.id" active-class="active">{{ row.team.name }}</router-link>
          </td>
          <td class="align-middle font-italic"><small>
            <router-link :to="'/region/' + row.team.region + '/' + row.team.inst_id" active-class="active">{{ row.team.institute }}</router-link>
          </small></td>
          <td class="align-middle text-center">
            <router-link :to="'/region/' + row.team.region" active-class="active">
              <img style="height: 2rem" :title='row.team.fullregion' :src="'/flags/' + row.team.region + '.png'">
            </router-link>
          </td>
          <td class="align-middle font-weight-bold text-center">
            {{ row.total }}
          </td>

          <td class="align-middle text-center"
              v-for="(score, index) in row.scores"
              v-bind:score="score"
              v-bind:key="row.id + '_' + index"
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
</template>

<script>
export default {
  name: 'Round',

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

  // beforeRouteUpdate (to, from, next) {
  //   this.init()
  //   next()
  // },

  methods: {
    init: function () {
      // fetch JSON data for the round
      fetch(new Request('/json/edition.' + this.$route.params.editionId + '.round.' + this.$route.params.roundId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data

          // outside of "app" scope, so it needs to be done manually
          document.title = this.remote.title + ', ' + this.remote.edition + ' ­— OIS'
        })
      })
    },

    filterQuery: function (ranking) {
      if (this.searchQuery == null) {
        return ranking
      }

      let query = this.searchQuery.toLowerCase()

      return ranking.filter(function (row) {
        return row.team.name.toLowerCase().indexOf(query) >= 0 ||
               row.team.fullregion.toLowerCase().indexOf(query) >= 0 ||
               row.team.institute.toLowerCase().indexOf(query) >= 0
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
