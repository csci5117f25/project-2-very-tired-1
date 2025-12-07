import { createRouter, createWebHistory } from 'vue-router'
import StartHikeView from '@/views/StartHikeView.vue'
import MainView from '@/views/MainView.vue'
import CalendarView from '@/views/CalendarView.vue'

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
    path: '/calendar',
    component: CalendarView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
