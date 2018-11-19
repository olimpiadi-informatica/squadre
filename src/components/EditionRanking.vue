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

        <router-link class="page-item" to="/edition/6" tag="li" active-class="active">
          <a class="page-link">6</a>
        </router-link>

        <router-link class="page-item" to="/edition/7" tag="li" active-class="active">
          <a class="page-link">7</a>
        </router-link>

        <router-link class="page-item" to="/edition/8" tag="li" active-class="active">
          <a class="page-link">8</a>
        </router-link>

        <router-link class="page-item" to="/edition/9" tag="li" active-class="active">
          <a class="page-link">9</a>
        </router-link>

        <router-link class="page-item" to="/edition/10" tag="li" active-class="active">
          <a class="page-link">10</a>
        </router-link>

        <router-link class="page-item" aria-label="Next" tag="li"
            v-bind:class="{ 'disabled': $route.params.editionId === '10' }"
            :to="'/edition/' + (parseInt($route.params.editionId) + 1)">
          <a class="page-link">
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Next</span>
          </a>
        </router-link>
      </ul>
    </nav>

    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">OIS {{ remote.year }}</h5>

          <p class="card-text">
            {{ remote.rounds.length }} teams participated in this edition of the
            OIS.
            <!-- The region with the highest number of participating teams was
            <a href="#">Abruzzo</a>. The task with the highest number of full
            score solutions was <a href="#">numpad</a>. -->
          </p>

          <h6 class="card-subtitle mb-2 text-muted">Individual rounds:</h6>
          <div class="btn-group" role="group" aria-label="Rounds">
            <router-link class="btn btn-outline-primary" :to="'/edition/' + $route.params.editionId + '/round/' + parseInt(contest.name.slice(5))"
                v-for="contest in remote.contests"
                v-bind:contest="contest"
                v-bind:key="contest.name"
                v-bind:class="{ 'disabled': contest.tasks == null }">
              {{ contest.title }}
            </router-link>

            <router-link class="btn btn-outline-success" :to="'/edition/' + $route.params.editionId + '/round/final'">
              Final Round
            </router-link>
          </div>
        </div>
      </div>

      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">Winner</h5>

          <p>The top 3 teams at the <strong>finals</strong> of the {{ remote.title }} were:</p>

          <ol class="mb-0" v-if="remote.final != null">
            <li v-for="row in remote.final.ranking.slice(0, 3)" v-bind:key="row.team.id">
              <mark>{{ row.team.name }}</mark> from {{ row.team.institute }}
            </li>
          </ol>

          <ol v-else>
            <li></li>
            <li></li>
            <li></li>
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
        <th class="align-middle">Team</th>
        <th class="align-middle">Institute</th>
        <th class="align-middle text-center">Region</th>
        <th class="align-middle text-center">To finals</th>
        <th class="align-middle text-center">Score</th>
        <th class="text-center"
            v-for="contest in remote.contests"
            v-bind:contest="contest"
            v-bind:key="contest.name">
          <span class="score-header d-inline-block align-middle text-truncate">
            {{ 'Σ ' + contest.name }}
          </span>
        </th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="row in filterQuery(remote.rounds)"
          v-bind:row="row"
          v-bind:key="row.team.id">
        <td class="align-middle text-center">{{ row.rank_tot }}</td>
        <td class="align-middle font-weight-bold">{{ row.team.name }}</td>
        <td class="align-middle font-italic"><small>{{ row.team.institute }}</small></td>
        <td class="align-middle text-center">
          <img style="height: 2rem" :title='row.team.fullregion' :src="'/flags/' + row.team.region + '.png'">
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
  name: 'EditionRanking',

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

          document.title = this.remote.title + ' ranking — OIS'
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
