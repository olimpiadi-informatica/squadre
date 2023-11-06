<template>
  <div class="container">
    <h1 class="mt-3">Italian Team Olympiads in Informatics</h1>

    <blockquote class="blockquote">
      <p class="mb-0 ml-2">Website: <a href="http://oisquadre.it/" target="_blank">
        http://oisquadre.it/
        <font-awesome-icon icon="external-link-alt" />
      </a></p>
      <p class="mb-0 ml-2">International website: <a href="https://iio.team/" target="_blank">
        https://iio.team/
        <font-awesome-icon icon="external-link-alt" />
      </a></p>
    </blockquote>

    <p>
      The <i>Olimpiadi di Informatica a Squadre (OIS)</i> aims to be a
      <strong>team-oriented</strong> version of the already-existing Italian
      Olympiads in Informatics. This new project introduces many differences
      with its “individual” counterpart, one of the most important ones is
      the almost complete decentralization of the contests: there are four
      <strong>completely online</strong> rounds that lead to an onsite final.
    </p>

    <p>
      The initiative started in February of 2010 in Italy as an idea by
      professor <strong>Giulio Angiani</strong> from “Blaise Pascal” institute
      in Reggio Emilia. The project was then developed and organized by
      professor Giorgeliana Carletto from “E. Fermi” institute in Bologna.
    </p>

    <p>
      Initially, the OIS organizers lacked the technical expertise to run a
      contest so they relied on the
      <a href="http://www.hsin.hr/coci/" target="_blank">
        Croatian Open Competition in Informatics (COCI)
        <font-awesome-icon icon="external-link-alt" />
      </a> since they provided an online evaluator and English-language tasks.
      We are very thankful to Croatia for creating the COCI.
    </p>

    <p>
      In 2010 only 7 teams were participating but, as the initiative started to
      catch on, more schools began to get interested. The Italian Olympiads in
      Informatics (OII) started backing the project by providing OIS with
      <strong>staff</strong> and <strong>resources</strong> so that, from the
      6th edition the OIS, the project started running its own contests using
      beautiful and original tasks and grading students' submission with the
      open source <a href="http://cms-dev.github.io/" target="_blank">
        CMS
        <font-awesome-icon icon="external-link-alt" />
      </a> system, hosted on the OII servers.
    </p>

    <p>
      In 2017, the initiative expanded to the international level. On May 17-20th 2017 the first edition of the IIOT was held in Bologna, Italy, with the participation of 8 teams from Italy, Romania and the Russian Federation. In the following years, editions have been hosted in Piatra Neamț (Romania), Moscow (Russian Federation), online for COVID restrictions, then again in Bologna (Italy), and finally in Port Said (Egypt). During the years, teams from Italy, Romania, Hungary, Egypt, Syria, Russian Federation, Moldova, Bulgaria, Iran, Spain, Peru have participated in the initiative.
    </p>

    <router-link to="/about/rules" class="btn btn-info btn-lg">
      <font-awesome-icon icon="file-alt" />
      Rules and Regulations
    </router-link>

    <router-link to="/about/syllabus" class="btn btn-info btn-lg ml-2">
      <font-awesome-icon icon="book-open" />
      Syllabus
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'About',
}
</script>

<style scoped>
</style>
