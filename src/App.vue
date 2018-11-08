<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <img style="width: 6rem;" class="navbar-brand" src="./assets/logo.png"/>

      <div class="collapse navbar-collapse">
        <ul class="navbar-nav mr-auto">
          <router-link class="nav-item" tag="li" to="/" active-class="active" exact="true">
            <a class="nav-link">Home</a>
          </router-link>
          <router-link class="nav-item" tag="li" to="/edition" active-class="active">
            <a class="nav-link">Editions</a>
          </router-link>
          <router-link class="nav-item" tag="li" to="/region" active-class="active">
            <a class="nav-link">Regions</a>
          </router-link>
          <router-link class="nav-item" tag="li" to="/school" active-class="active">
            <a class="nav-link">Schools</a>
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
