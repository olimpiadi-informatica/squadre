import Vue from 'vue'
import Router from 'vue-router'
import RoundRanking from '@/components/RoundRanking'
import EditionRanking from '@/components/EditionRanking'
import Homepage from '@/components/Homepage'
import About from '@/components/About'
import AboutRules from '@/components/About.Rules'
import AboutSyllabus from '@/components/About.Syllabus'
import Regions from '@/components/Regions'
import Schools from '@/components/Schools'

Vue.use(Router)

// This should be changed to reflect the most recent edition available
var LATEST_EDITION_ID = 10

export default new Router({
  mode: process.env.NODE_ENV === 'production' ? 'history' : 'hash',
  routes: [
    {
      path: '/',
      name: 'Homepage',
      component: Homepage
    },
    {
      path: '/about',
      name: 'About',
      component: About
    },
    {
      path: '/about/rules',
      name: 'About.Rules',
      component: AboutRules
    },
    {
      path: '/about/syllabus',
      name: 'About.Syllabus',
      component: AboutSyllabus
    },
    {
      path: '/edition',
      redirect: '/edition/' + LATEST_EDITION_ID
    },
    {
      path: '/edition/:editionId',
      name: 'EditionRanking',
      component: EditionRanking
    },
    {
      path: '/edition/:editionId/round/:roundId',
      name: 'RoundRanking',
      component: RoundRanking
    },
    {
      path: '/region',
      name: 'Regions',
      component: Regions
    },
    {
      path: '/school',
      name: 'Schools',
      component: Schools
    }
  ]
})
