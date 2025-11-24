import { createRouter, createWebHistory } from 'vue-router'
import StartHikeView from '@/views/StartHikeView.vue'
import MainView from '@/views/MainView.vue'
import PreviousHikesView from '@/views/PreviousHikesView.vue'

const routes = [
  {
    path: '/',
    component: MainView,
  },
  {
    path: '/startHike',
    component: StartHikeView,
  },
  {
    path: '/previousHikes',
    component: PreviousHikesView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
