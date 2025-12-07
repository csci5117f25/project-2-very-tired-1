import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { firebaseApp } from '@/firebase_conf'

import LoginView from '@/views/LoginView.vue'
import MainView from '@/views/MainView.vue'
import StartHikeView from '@/views/StartHikeView.vue'
import PreviousHikesView from '@/views/PreviousHikesView.vue'
import CalendarView from '@/views/CalendarView.vue'

const routes = [
  { path: '/', component: MainView },
  { path: '/login', component: LoginView, meta: { public: true } },
  { path: '/startHike', component: StartHikeView },
  { path: '/previousHikes', component: PreviousHikesView },
  {
    path: '/calendar',
    component: CalendarView,
  },
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
