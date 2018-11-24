import 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap';

import Vue from 'vue'
import App from './App'
import router from './router'

// set up Google Analytics plugin
import VueAnalytics from 'vue-analytics'
Vue.use(VueAnalytics, {
  id: 'UA-70826003-4',
  router
})

// start of FontAwesome support
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCertificate, faExternalLinkAlt, faFileAlt, faFilePdf, faBookOpen, faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCertificate, faExternalLinkAlt, faFileAlt, faFilePdf, faBookOpen, faArrowLeft, faSearch)

Vue.component('font-awesome-icon', FontAwesomeIcon)
// end of FontAwesome support


Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
