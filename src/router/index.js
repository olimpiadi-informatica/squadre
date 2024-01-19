import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '@/components/Homepage.vue'
import About from '@/components/About.vue'
import AboutRules from '@/components/About.Rules.vue'
import AboutSyllabus from '@/components/About.Syllabus.vue'
import Editions from '@/components/Editions.vue'
import Edition from '@/components/Edition.vue'
import Round from '@/components/Round.vue'
import Task from '@/components/Task.vue'
import Team from '@/components/Team.vue'
import Regions from '@/components/Regions.vue'
import Region from '@/components/Region.vue'
import School from '@/components/School.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      name: 'Editions',
      component: Editions
    },
    {
      path: '/edition/:editionId',
      name: 'Edition',
      component: Edition
    },
    {
      path: '/edition/:editionId/round/:roundId',
      name: 'Round',
      component: Round
    },
    {
      path: '/edition/:editionId/round/:roundId/:taskId',
      name: 'Task',
      component: Task
    },
    {
      path: '/edition/:editionId/team/:teamId',
      name: 'Team',
      component: Team
    },
    {
      path: '/region',
      name: 'Regions',
      component: Regions
    },
    {
      path: '/region/:regionId',
      name: 'Region',
      component: Region
    },
    {
      path: '/region/:regionId/:schoolId',
      name: 'School',
      component: School
    },
    {
      path: '/contest',
      redirect: 'https://gara.squadre.olinfo.it'
    },
    {
      path: '/contest2',
      redirect: 'https://mirror.squadre.olinfo.it'
    },
    {
      path: '/contest/documentation',
      redirect: 'https://gara.squadre.olinfo.it'
    },
    {
      path: '/ranking',
      redirect: 'https://gara.squadre.olinfo.it/ranking'
    },
    {
      path: '/ranking2',
      redirect: 'https://mirror.squadre.olinfo.it/ranking'
    },
    {
      path: '/check',
      redirect: 'https://gara.squadre.olinfo.it/check'
    }
  ]
})

export default router
