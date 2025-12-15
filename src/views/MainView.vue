<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/BaseCard.vue'
import ProfilePic from '@/components/ProfilePic.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signOut, user } = useAuth()

const avatarURL = computed(() => user.value?.photoURL)
const userName = computed(() => user.value?.displayName)

async function handleLogout() {
  await signOut()
  router.replace('/login')
}
</script>

<template>
  <div class="rows">
    <div class="row">
      <div class="profile-column">
        <profile-pic
          :src="avatarURL"
          style="cursor: pointer"
          :userName="userName"
          @click="handleLogout"
        />
        <div class="userName">{{ userName }}</div>
      </div>

      <div class="weather-card">
        <WeatherWidget />
      </div>
    </div>

    <div class="row">
      <base-card link="/previousHikes" size="full" title="Previous Hikes">
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 256 256">
          <path
            fill="#000000"
            d="M152 84a36 36 0 1 0-36-36a36 36 0 0 0 36 36m0-48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m52 108v88a12 12 0 0 1-24 0v-76.76c-24.92-3.37-33.94-17.29-41.38-28.76c-1.55-2.39-3.05-4.71-4.67-6.88l-9.54 22L159 166.23a12 12 0 0 1 5 9.77v56a12 12 0 0 1-24 0v-49.83l-25.37-18.12L83 236.78a12 12 0 1 1-22-9.57L118.52 94.9A12 12 0 0 1 135 89a45.53 45.53 0 0 1 8.84 6c6.78 5.89 11.09 12.53 14.89 18.39C166.27 125 170.8 132 192 132a12 12 0 0 1 12 12m-139.4 9.88L39.27 143A12 12 0 0 1 33 127.27l24-56A12 12 0 0 1 72.73 65l25.61 11a12 12 0 1 1-9.45 22L74.3 91.76L59.76 125.7l14.29 6.12a12 12 0 1 1-9.45 22.06"
          />
        </svg>
      </base-card>
    </div>

    <div class="row">
      <base-card link="/calendar" size="full" title="Calendar">
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 20 20">
          <path
            fill="#000000"
            d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z"
          />
        </svg>
      </base-card>
    </div>

    <div class="row">
      <base-card link="/startHike" size="half" title="Start hike">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="150"
          height="150"
          viewBox="0 0 24 24"
          fill="#000000"
        >
          <g
            fill="none"
            stroke="#000000"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          >
            <path d="M14.25 11.25V.75l4.5 3.75l-4.5 3" />
            <path d="M11.25 3.75h-.75a9.75 9.75 0 0 0 0 19.5h12.75m0-19.5H21" />
            <path
              d="M23.25 11.25H10.5a2.25 2.25 0 0 0 0 4.5h12.75M20.786 7.5H18.75m-10.106.3a6.1 6.1 0 0 0-2.436 1.512M4.68 12.066a5.85 5.85 0 0 0 0 2.868m1.528 2.754A6.1 6.1 0 0 0 8.644 19.2m3.158.3H14.7m3.188 0h2.898"
            />
          </g>
        </svg>
      </base-card>
      <base-card link="/goals" size="half" title="Goals">
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 16 16">
          <path
            fill="#000000"
            d="M13.637 2.363h-.001l1.676.335c.09.018.164.084.19.173a.25.25 0 0 1-.062.249l-1.373 1.374a.876.876 0 0 1-.619.256H12.31L9.45 7.611A1.5 1.5 0 1 1 6.5 8a1.501 1.501 0 0 1 1.889-1.449l2.861-2.862V2.552c0-.232.092-.455.256-.619L12.88.559a.25.25 0 0 1 .249-.062c.089.026.155.1.173.19Z"
          />
          <path
            fill="#000000"
            d="M2 8a6 6 0 1 0 11.769-1.656a.751.751 0 1 1 1.442-.413a7.502 7.502 0 0 1-12.513 7.371A7.501 7.501 0 0 1 10.069.789a.75.75 0 0 1-.413 1.442A6.001 6.001 0 0 0 2 8Z"
          />
          <path
            fill="#000000"
            d="M5 8a3.002 3.002 0 0 0 4.699 2.476a3 3 0 0 0 1.28-2.827a.748.748 0 0 1 1.045-.782a.75.75 0 0 1 .445.61A4.5 4.5 0 1 1 8.516 3.53a.75.75 0 1 1-.17 1.49A3 3 0 0 0 5 8Z"
          />
        </svg>
      </base-card>
    </div>
  </div>
</template>

<style scoped>
.rows {
  display: flex;
  flex-direction: column;
  gap: 25px;
  height: 100vh;
  padding: 5vh 3vw 10vh 3vw;
}

.row {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.profile-column {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.userName {
  border-radius: 5px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.3rem;
  font-weight: 550;
  color: var(--bulma-text);
  height: 20%;
}
.weather-card {
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
