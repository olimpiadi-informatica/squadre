<template>
  <div class="container">
    <nav class="mt-3" aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/">Home</router-link>
        </li>
        <li class="breadcrumb-item">
          <router-link to="/about">About</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Syllabus</li>
      </ol>
    </nav>

    <div class="mb-4 p-5 bg-white rounded text-justify"
        style="box-shadow: 0 0 2rem rgba(0,0,0,.175); font-size: larger;">
      <router-link class="btn btn-outline-primary" to="/about">
        <font-awesome-icon icon="arrow-left" />
        Back
      </router-link>

      <a class="ml-2 btn btn-success" href="/resources/syllabus.pdf" download>
        <font-awesome-icon icon="file-pdf" />
        Download PDF
      </a>

      <h2 class="mt-3">Syllabus</h2>
      <h3>Olimpiadi di Informatica a Squadre</h3>

      <h6>Versione 2 — 19 maggio 2019</h6>

      <h3 class="mt-5">Livello 1</h3>

      <ul>
        <li>
          Tipi di dato primitivo (e.g. <code>int</code>, <code>char</code>, <code>double</code>, <code>bool</code>)
        </li>
        <li>
          Array mono-dimensionali (e.g. <code>int[]</code>, <code>char[]</code>, <code>double[]</code>, <code>bool[]</code>)
        </li>
        <li>
          Branching (costrutti <code>if</code>/<code>else</code>)
        </li>
        <li>
          Cicli limitati (costrutti for semplici)
        </li>
      </ul>

      <h3 class="mt-3">Livello 2</h3>

      <ul>
        <li>
          Array multi-dimensionali (e.g. <code>int[][]</code>)
        </li>
        <li>
          Strutture dati coda e pila
        </li>
        <li>
          Cicli illimitati (costrutto <code>while</code>)
        </li>
        <li>
          Funzioni e ricorsione esaustiva (e.g. elencare le permutazioni)
        </li>
        <li>
          Ricerca binaria
        </li>
        <li>
          Algoritmi di ordinamento quadratici (e.g. bubble sort) 
        </li>
        <li>
          Stringhe e ricerca quadratica di una sottostringa in una stringa
        </li>
        <li>
          Algoritmo di Euclide per il massimo comun divisore
        </li>
        <li>
          Concetti base di geometria e aritmetica
        </li>
      </ul>

      <h3 class="mt-3">Livello 3</h3>

      <ul>
        <li>
          Contenitori standard (e.g. <code>vector</code>, <code>set</code>, <code>map</code>)
        </li>
        <li>
          Divide et impera
        </li>
        <li>
          Programmazione dinamica su array mono- o multi-dimensionali
        </li>
        <li>
          Visite di grafi (BFS, DFS)
        </li>
        <li>
          Algoritmi di ordinamento efficienti (<code>sort</code> o <code>qsort</code>)
        </li>
        <li>
          Ottimizzazione approssimata tramite tecniche euristiche
        </li>
      </ul>

      <h3 class="mt-3">Livello 4</h3>

      <ul>
        <li>
          Struttura dati union-find per insiemi disgiunti
        </li>
        <li>
          Strutture dati per query su range
        </li>
        <li>
          Minimo antenato comune su alberi
        </li>
        <li>
          Algoritmi su grafi: cammini minimi, albero ricoprente
        </li>
        <li>
          Programmazione dinamica su grafi aciclici
        </li>
        <li>
          Backtracking (algoritmi branch and bound)
        </li>
      </ul>

      <h3 class="mt-3">Livello 5</h3>

      <ul>
        <li>
          Tutti gli argomenti non menzionati nei livelli precedenti
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutSyllabus',
}
</script>

<style scoped>
</style>
