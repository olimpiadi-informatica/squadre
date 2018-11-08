import Vue from 'vue'
import Router from 'vue-router'
import RoundRanking from '@/components/RoundRanking'
import EditionRanking from '@/components/EditionRanking'
import Editions from '@/components/Editions'
import Homepage from '@/components/Homepage'
import Regions from '@/components/Regions'
import Schools from '@/components/Schools'

Vue.use(Router)

export default new Router({
  mode: process.env.NODE_ENV === 'production' ? 'history' : 'hash',
  routes: [
    {
      path: '/',
      name: 'Homepage',
      component: Homepage
    },
    {
      path: '/edition',
      name: 'Editions',
      component: Editions
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
