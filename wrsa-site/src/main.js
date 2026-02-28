import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

/* --- FIREBASE SETUP --- */
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getFunctions } from "firebase/functions"   

const firebaseConfig = {
  apiKey: "AIzaSyAPBXBoYXFURJ0pC9T_vkOXvS5h2fPMXDA",
  authDomain: "miniproject-4c4a6.firebaseapp.com",
  projectId: "miniproject-4c4a6",
  storageBucket: "miniproject-4c4a6.firebasestorage.app",
  messagingSenderId: "434475975210",
  appId: "1:434475975210:web:8f0f8f89510fe8979eb953"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);       

/* --- FONT AWESOME SETUP --- */
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSliders, faGrip, faList, faEye } from '@fortawesome/free-solid-svg-icons'
library.add(faSliders, faGrip, faList, faEye)
import {
  faHeart,
  faBagShopping,
  faUser,
  faImages,
  faCloudUploadAlt,
  faChevronDown,
  faPlus,
  faTrash,
  faImage,
  faEdit,
  faTimes,
  faWandMagicSparkles   // AI buttons
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faHeart,
  faBagShopping,
  faUser,
  faImages,
  faCloudUploadAlt,
  faChevronDown,
  faPlus,
  faTrash,
  faImage,
  faEdit,
  faTimes,
  faWandMagicSparkles 
)

/* --- VUE APP INITIALIZATION --- */
const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.mount('#app')