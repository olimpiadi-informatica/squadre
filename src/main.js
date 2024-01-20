import 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap';

import { createApp } from 'vue'
import VueGtag from "vue-gtag"
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

if (process.env.NODE_ENV === 'production') {
    app.use(VueGtag, {
        config: { id: "G-Q25K1YDNFL" }
    });
}

// start of FontAwesome support
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCertificate, faGraduationCap, faExternalLinkAlt, faFileAlt, faFilePdf, faMedal, faBookOpen, faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCertificate, faGraduationCap, faExternalLinkAlt, faFileAlt, faFilePdf, faMedal, faBookOpen, faArrowLeft, faSearch)

app.component('font-awesome-icon', FontAwesomeIcon)
// end of FontAwesome support


app.mount('#app')
