<template>
  <div class="container">
    <nav class="mt-3" aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/">Home</router-link>
        </li>
        <li class="breadcrumb-item">
          <router-link to="/info">Info</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Syllabus</li>
      </ol>
    </nav>

    <div class="mb-4 p-5 bg-white rounded text-justify"
        style="box-shadow: 0 0 2rem rgba(0,0,0,.175); font-size: larger;">
      <router-link class="btn btn-outline-primary" to="/info">
        <font-awesome-icon icon="arrow-left" />
        Back
      </router-link>

      <a class="ml-2 btn btn-success" href="/resources/syllabus.pdf" download>
        <font-awesome-icon icon="file-pdf" />
        Download PDF
      </a>

      <h2 class="mt-3">Syllabus</h2>
      <h3>Olimpiadi di Informatica a Squadre</h3>

      <h6>Revisione: 10 settembre 2018</h6>

      <h3 class="mt-5">Livello 1 — Programmazione di base</h3>

      <ul>
        <li>
          Tipi di dato primitivo (e.g. <code>int</code>, <code>char</code>, <code>double</code>)
        </li>
        <li>
          Array mono-dimensionali (e.g. <code>int[]</code>, <code>char[]</code>, <code>double[]</code>)
        </li>
        <li>
          Branching (costrutti <code>if</code>/<code>else</code>)
        </li>
        <li>
          Cicli limitati (costrutti for semplici)
        </li>
      </ul>

      <h3 class="mt-3">Livello 2 — Strutture dati di base</h3>

      <ul>
        <li>
          Array multi-dimensionali
        </li>
        <li>
          Cicli illimitati (costrutto <code>while</code>)
        </li>
        <li>
          Funzioni e ricorsione (esaustiva)
        </li>
        <li>
          Strutture dati coda e pila
        </li>
        <li>
          Vettori dinamici (<code>vector</code>)
        </li>
        <li>
          Aritmetica modulare (e.g. calcolo del MCD)
        </li>
        <li>
          Geometria euclidea (e.g. teorema di Pitagora, prodotto scalare)
        </li>
      </ul>

      <h3 class="mt-3">Livello 3 — Tecniche algoritmiche</h3>

      <ul>
        <li>
          Divide et impera
        </li>
        <li>
          Programmazione dinamica
        </li>
        <li>
          Visite di grafi (BFS, DFS)
        </li>
        <li>
          Algoritmi di ordinamento efficienti (<code>sort</code> o <code>qsort</code>)
        </li>
        <li>
          Contenitori (<code>set</code>, <code>map</code>)
        </li>
        <li>
          Problemi di ottimizzazione approssimata (tipo machine learning)
        </li>
      </ul>

      <h3 class="mt-3">Livello 4 — Altri argomenti nel Syllabus IOI</h3>

      <h3 class="mt-3">Livello 5 — Altri argomenti fuori dal Syllabus IOI</h3>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfoSyllabus',
}
</script>

<style scoped>
</style>
