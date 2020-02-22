<template>
  <div class="mt-3">
    <nav aria-label="Navigation between editions" class="row container">
      <span class="font-weight-light ml-3" style="font-size: x-large">
        Edition:
      </span>

      <ul class="pagination ml-2 mb-0">
        <router-link class="page-item" aria-label="Previous" tag="li"
            v-bind:class="{ 'disabled': $route.params.editionId === '6' }"
            :to="'/edition/' + (parseInt($route.params.editionId) - 1)">
          <a class="page-link">
            <span aria-hidden="true">&laquo;</span>
            <span class="sr-only">Previous</span>
          </a>
        </router-link>

        <router-link v-for="n in (remote.lastEd-5)" v-bind:key="n" class="page-item" :to="'/edition/'+(n+5)" tag="li" active-class="active">
          <a class="page-link">{{n+5}}</a>
        </router-link>

        <router-link class="page-item" aria-label="Next" tag="li"
            v-bind:class="{ 'disabled': $route.params.editionId == remote.lastEd }"
            :to="'/edition/' + (parseInt($route.params.editionId) + 1)">
          <a class="page-link">
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Next</span>
          </a>
        </router-link>
      </ul>

      <span class="font-weight-light ml-3" style="font-size: x-large">
        Round:&nbsp;
      </span>

      <div class="btn-group" role="group" aria-label="Rounds">
        <router-link class="btn btn-outline-primary" :to="'/edition/' + $route.params.editionId + '/round/' + parseInt(contest.name.slice(5))"
            v-for="contest in remote.contests"
            v-bind:contest="contest"
            v-bind:key="contest.name"
            v-bind:class="{ 'disabled': contest.tasks == null }">
          {{ contest.title }}
        </router-link>

        <router-link class="btn btn-outline-success" :to="'/edition/' + $route.params.editionId + '/round/final'"
            v-bind:class="{ 'disabled': remote.final == null }">
          Final Round
        </router-link>
      </div>
    </nav>

    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">OIS {{ remote.year }}<span v-if="remote.final == null"> (provisional results)</span></h5>

          <p class="card-text">
            {{ remote.teams }} teams from {{ remote.instnum }} schools participated in this edition of the OIS, scoring a total of {{ remote.points }} points on {{ remote.tasks }} tasks.
            <span v-if="remote.final != null">The top 3 teams at the <strong>finals</strong> were:</span>
          </p>

          <ol class="mb-0" v-if="remote.final != null">
            <li v-for="row in remote.final.ranking.slice(0, 3)" v-bind:key="row.team.id">
              <mark><router-link :to="$route.params.editionId + '/team/'+row.team.id" active-class="active">
                <a>{{ row.team.name }}</a>
              </router-link></mark>
              from
              <router-link :to="'/region/' + row.team.region + '/'+row.team.inst_id" active-class="active">
                <a>{{ row.team.institute }}</a>
              </router-link>
            </li>
          </ol>
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
        <th class="align-middle text-center">Rank</th>
        <th class="align-middle text-center">Reg. Rank</th>
        <th class="align-middle">Team</th>
        <th class="align-middle">Institute</th>
        <th class="align-middle text-center">Region</th>
        <th class="align-middle text-center">To finals</th>
        <th class="align-middle text-center">Score</th>
        <th class="text-center"
            v-for="contest in remote.contests"
            v-bind:contest="contest"
            v-bind:key="contest.name">
            <router-link :to="'/edition/' + remote.id + '/round/' + contest.id" active-class="active">
              <span class="score-header d-inline-block align-middle text-truncate">
                <a>{{ 'Σ ' + contest.name }}</a>
              </span>
            </router-link>
        </th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="row in filterQuery(remote.rounds)"
          v-bind:row="row"
          v-bind:key="row.team.id">
          <td class="align-middle text-center">{{ row.rank_tot }}</td>
          <td class="align-middle text-center">{{ row.rank_reg }}</td>
          <td class="align-middle font-weight-bold">
            <router-link :to="'/edition/' + remote.id + '/team/' + row.team.id" active-class="active">{{ row.team.name }}</router-link>
          </td>
          <td class="align-middle font-italic"><small>
            <router-link :to="'/region/' + row.team.region + '/' + row.team.inst_id" active-class="active">{{ row.team.institute }}</router-link>
          </small></td>
          <td class="align-middle text-center">
            <router-link :to="'/region/' + row.team.region" active-class="active">
              <img style="height: 2rem" :title='row.team.fullregion' :src="'/flags/' + row.team.region + '.png'">
            </router-link>
          </td>
        <td class="align-middle text-center">
          <font-awesome-icon v-if="row.team.finalist === true" icon="certificate" style="color: goldenrod" />
        </td>
        <td class="align-middle font-weight-bold text-center">
          {{ row.total }}
        </td>

        <td class="align-middle text-center"
            v-for="(score, index) in row.rounds"
            v-bind:score="score"
            v-bind:key="row.id + '_' + index"
            v-bind:class="{ 'font-weight-bold': score != null && score == remote.contests[index].fullscore,
                            'alert-success': score != null && Math.floor(score * 100 / remote.contests[index].fullscore) > 80,
                            'alert-warning': score != null && Math.floor(score * 100 / remote.contests[index].fullscore) > 40 && Math.floor(score * 100 / remote.contests[index].fullscore) <= 80,
                            'alert-danger': score != null && Math.floor(score * 100 / remote.contests[index].fullscore) <= 40,
                            'bg-light': score == null }">
          {{ score == null ? "–" : score }}
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Edition',

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
      fetch(new Request('/json/edition.' + this.$route.params.editionId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data

          document.title = this.remote.title + ' — OIS'
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
