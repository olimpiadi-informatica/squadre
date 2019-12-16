import Vue from 'vue'
import Router from 'vue-router'
import Homepage from '@/components/Homepage'
import About from '@/components/About'
import AboutRules from '@/components/About.Rules'
import AboutSyllabus from '@/components/About.Syllabus'
import Editions from '@/components/Editions'
import Edition from '@/components/Edition'
import Round from '@/components/Round'
import Task from '@/components/Task'
import Team from '@/components/Team'
import Regions from '@/components/Regions'
import Region from '@/components/Region'
import School from '@/components/School'

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
      beforeEnter() {
        location.href = 'https://gara.squadre.olinfo.it';
      }
    },
    {
      path: '/contest2',
      beforeEnter() {
        location.href = 'https://mirror.squadre.olinfo.it';
      }
    },
    {
      path: '/contest/documentation',
      beforeEnter() {
        location.href = 'https://gara.squadre.olinfo.it';
      }
    },
    {
      path: '/ranking',
      beforeEnter() {
        location.href = 'https://gara.squadre.olinfo.it/ranking';
      }
    },
    {
      path: '/ranking2',
      beforeEnter() {
        location.href = 'https://mirror.squadre.olinfo.it/ranking';
      }
    },
    {
      path: '/check',
      beforeEnter() {
        location.href = 'https://gara.squadre.olinfo.it/check';
      }
    }
  ]
})
