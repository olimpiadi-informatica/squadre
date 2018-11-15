import Vue from 'vue'
import App from './App'
import router from './router'

import 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';

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
