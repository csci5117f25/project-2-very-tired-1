import { createRouter, createWebHistory } from 'vue-router'
import StartHikeView from '@/views/StartHikeView.vue'
import MainView from '@/views/MainView.vue'
import IndividualHikeView from '@/views/IndividualHikeView.vue'

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
    path: '/individualHike/:id',
    component: IndividualHikeView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
