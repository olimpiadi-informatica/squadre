<template>
  <div class="mr-5 ml-5 mt-3">
    <nav aria-label="breadcrumb" class="mt-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/edition">Editions</router-link>
        </li>
        <li class="breadcrumb-item">
          <span v-if="!roundData">Loading...</span>
          <router-link v-bind:to="/edition/ + parseInt(roundData.edition)">{{ roundData.edition }}</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          <span v-if="!roundData">Loading...</span>
          <span v-else>{{ roundData.title }}</span>
        </li>
      </ol>
    </nav>

    <h1 class="mt-3">
      OIS —
      <span v-if="!roundData">Loading...</span>
      <span v-else>{{ roundData.edition + ", " + roundData.title }}</span>
    </h1>

    <div class="input-group col-4 mb-3 p-0">
      <div class="input-group-prepend">
        <span class="input-group-text" id="basic-addon1">🔍</span>
      </div>
      <input type="text" class="form-control" placeholder="Search" aria-label="Search" aria-describedby="basic-addon1"
              v-model="searchQuery">
    </div>

    <div v-if="!roundData">
        Loading...
    </div>
    <table class="table table-sm table-responsive-lg mt-3" v-else>
      <tr class="text-uppercase" style="font-size: small;">
        <th class="align-middle">#</th>
        <th class="align-middle">Team</th>
        <th class="align-middle">Institute</th>
        <th class="align-middle text-center">Region</th>
        <th class="align-middle text-center">Score</th>
        <th class="text-center"
            v-for="task in roundData.tasks"
            v-bind:task="task"
            v-bind:key="task.name">
          <span class="score-header d-inline-block align-middle text-truncate">{{ task.name }}</span>
        </th>
      </tr>

      <tr v-for="row in filterQuery(roundData.ranking)"
          v-bind:row="row"
          v-bind:key="row.id">
        <td class="align-middle">{{ row.rank }}</td>
        <td class="align-middle font-weight-bold">{{ row.team }}</td>
        <td class="align-middle font-italic"><small>{{ row.institute }}</small></td>
        <td class="align-middle text-center">
          <img style="height: 2rem" :src="'/flags/' + row.region + '.png'">
        </td>
        <td class="align-middle font-weight-bold text-center">
          {{ row.total }}
        </td>

        <td class="align-middle text-center"
            v-for="(score, index) in row.scores"
            v-bind:score="score"
            v-bind:key="row.id + '_' + index"
            v-bind:class="{ 'alert-success': score == 100, 'alert-warning': score > 40 && score < 100, 'alert-danger': score <= 40 }">
          {{ score == null ? "–" : score }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  name: 'RoundRanking',

  data () {
    return {
      roundData: null,
      searchQuery: null
    }
  },

  created () {
    this.init()
  },

  methods: {
    init: function () {
      // fetch JSON data for the round
      fetch(new Request('/json/edition.' + this.$route.params.editionId + '.round.' + this.$route.params.roundId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.roundData = data

          // outside of "app" scope, so it needs to be done manually
          document.title = document.title.replace('{{pageName}}',
            this.roundData.title + ' ranking, ' + this.roundData.edition)
        })
      })
    },

    filterQuery: function (ranking) {
      if (this.searchQuery == null) {
        return ranking
      }

      let query = this.searchQuery.toLowerCase()

      return ranking.filter(function (row) {
        return row.team.toLowerCase().indexOf(query) >= 0 ||
               row.fullregion.toLowerCase().indexOf(query) >= 0 ||
               row.institute.toLowerCase().indexOf(query) >= 0
      })
    }
  }
}
</script>

<style scoped>
th {
  font-family: monospace;
}

th:hover {
  background-color: #d9d9d9;
  cursor: pointer;
}

th span.score-header {
  width: 8ch;
}
</style>
