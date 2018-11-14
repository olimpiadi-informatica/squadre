import Vue from 'vue'
import Router from 'vue-router'
import RoundRanking from '@/components/RoundRanking'
import EditionRanking from '@/components/EditionRanking'
import Homepage from '@/components/Homepage'
import Info from '@/components/Info'
import InfoRules from '@/components/Info.Rules'
import InfoSyllabus from '@/components/Info.Syllabus'
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
      path: '/info',
      name: 'Info',
      component: Info
    },
    {
      path: '/info/rules',
      name: 'Info.Rules',
      component: InfoRules
    },
    {
      path: '/info/syllabus',
      name: 'Info.Syllabus',
      component: InfoSyllabus
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
