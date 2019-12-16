<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <router-link class="navbar-brand" to="/">
        <img style="width: 6rem;" class="navbar-brand" src="./assets/logo.png"/>
      </router-link>

      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <router-link class="nav-item" tag="li" to="/" active-class="active" :exact="true">
            <a class="nav-link">Home</a>
          </router-link>
          <router-link class="nav-item" tag="li" to="/about" active-class="active">
            <a class="nav-link">About</a>
          </router-link>
          <router-link class="nav-item" tag="li" to="/edition" active-class="active">
            <a class="nav-link">Scoreboard</a>
          </router-link>
          <router-link class="nav-item" tag="li" to="/region" active-class="active">
            <a class="nav-link">Teams</a>
          </router-link>
        </ul>
      </div>
    </nav>

    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
</style>
