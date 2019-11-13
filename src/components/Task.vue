<template>
  <div class="container">
    <div class="card-group m-3">
      <div class="card bg-light">
        <div class="card-body">
          <h5 class="card-title">
          {{ remote.title }} ({{ remote.name }})
          </h5>
          <p class="card-text">
            <router-link :to="'/edition/' + $route.params.editionId">{{ remote.edition }}</router-link>,
            <router-link :to="'/edition/' + $route.params.editionId + '/round/' + $route.params.roundId">{{ remote.round }}</router-link>
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
    <table class="table table-sm table-responsive-lg table-borderless table-striped mt-3" v-else>
      <thead>
        <tr class="text-uppercase" style="font-size: small;">
          <th class="align-middle text-center">Rank</th>
          <th class="align-middle">Team</th>
          <th class="align-middle">Institute</th>
          <th class="align-middle text-center">Region</th>
          <th class="align-middle text-center">Score</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in filterQuery(remote.ranking)"
            v-bind:row="row"
            v-bind:key="row.team.id">
          <td class="align-middle text-center">{{ row.rank }}</td>
          <td class="align-middle font-weight-bold">
            <router-link :to="'/edition/' + $route.params.editionId + '/team/' + row.team.id" active-class="active">{{ row.team.name }}</router-link>
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
            {{ row.score }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Task'
}
</script>

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
      fetch(new Request('/json/edition.' + this.$route.params.editionId + '.round.' + this.$route.params.roundId + '.' + this.$route.params.taskId + '.json'), { method: 'GET' }).then((data) => {
        data.json().then((data) => {
          this.remote = data

          // outside of "app" scope, so it needs to be done manually
          document.title = this.remote.title + ' (' + this.remote.edition + ', ' + this.remote.round + ') ­— OIS'
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
