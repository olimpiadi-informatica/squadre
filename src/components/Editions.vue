<template>
  <div class="container">
    <h1 class="mt-3">
      All Editions
    </h1>

    <div class="list-group mt-3">
      <router-link to="edition/10" class="progress-bar progress-bar-striped progress-bar-animated list-group-item list-group-item-action flex-column align-items-start list-group-item-primary">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">OIS — 10th Edition</h5>
          <small>2018/2019</small>
        </div>
        <p class="mb-1">Participant teams: 389</p>
        <p class="mb-1">Total tasks: 40</p>
      </router-link>
      <router-link to="edition/9" class="list-group-item list-group-item-action flex-column align-items-start list-group-item-primary">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">OIS — 9th Edition</h5>
          <small>2017/2018</small>
        </div>
        <p class="mb-1">Participant teams: 389</p>
        <p class="mb-1">Total tasks: 40</p>
      </router-link>
      <router-link to="edition/8" class="list-group-item list-group-item-action flex-column align-items-start list-group-item-primary">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">OIS — 8th Edition</h5>
          <small>2016/2017</small>
        </div>
        <p class="mb-1">Participant teams: 389</p>
        <p class="mb-1">Total tasks: 40</p>
      </router-link>
      <router-link to="edition/7" class="list-group-item list-group-item-action flex-column align-items-start list-group-item-primary">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">OIS — 7th Edition</h5>
          <small>2015/2016</small>
        </div>
        <p class="mb-1">Participant teams: 389</p>
        <p class="mb-1">Total tasks: 40</p>
      </router-link>
      <router-link to="edition/6" class="list-group-item list-group-item-action flex-column align-items-start list-group-item-primary">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">OIS — 6th Edition</h5>
          <small>2014/2015</small>
        </div>
        <p class="mb-1">Participant teams: 389</p>
        <p class="mb-1">Total tasks: 40</p>
      </router-link>
    </div>
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

  methods: {
    init: function () {
      document.title = 'All Editions — OIS'
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
