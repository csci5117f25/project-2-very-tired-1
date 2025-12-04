import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { firebaseApp } from '@/firebase_conf'

import LoginView from '@/views/LoginView.vue'
import MainView from '@/views/MainView.vue'
import StartHikeView from '@/views/StartHikeView.vue'
import TakePictureView from '@/views/TakePictureView.vue'
import PreviousHikesView from '@/views/PreviousHikesView.vue'

const routes = [
  { path: '/', name: 'Main', component: MainView },
  { path: '/login', name: 'Login', component: LoginView, meta: { public: true } },
  { path: '/startHike', name: 'StartHike', component: StartHikeView },
  { path: '/takePicture/:hikeId', name: 'TakePicture', component: TakePictureView },
  { path: '/previousHikes', name: 'PreviousHikes', component: PreviousHikesView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const auth = getAuth(firebaseApp)

function waitForUser() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => {
      stop()
      resolve(user)
    })
  })
}

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  const user = await waitForUser()
  if (!user) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

export default router
