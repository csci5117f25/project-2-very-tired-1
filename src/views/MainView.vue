<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSwipe } from '@vueuse/core'
import { collection, query, orderBy } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'
import BaseCard from '@/components/BaseCard.vue'
import ProfilePic from '@/components/ProfilePic.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import PreviousHikesCard from '@/components/PreviousHikesCard.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signOut, user } = useAuth()

const avatarURL = computed(() => user.value?.photoURL)
const userName = computed(() => user.value?.displayName)
const uid = computed(() => user.value?.uid)

// Fetch all hikes
const hikesQuery = computed(() => {
  if (!uid.value) return null
  return query(
    collection(db, 'users', uid.value, 'hikes'),
    orderBy('startedAt', 'desc')
  )
})

const hikes = useCollection(hikesQuery)
const currentHikeIndex = ref(0)
const hikesLoaded = ref(false)

// Mark loaded when hikes arrive OR after timeout (for users with no hikes)
watch([hikes, uid], ([newHikes, newUid]) => {
  if (newHikes?.length > 0) {
    hikesLoaded.value = true
    currentHikeIndex.value = 0
  } else if (newUid && !hikesLoaded.value) {
    setTimeout(() => { hikesLoaded.value = true }, 1000)
  }
}, { immediate: true })

const currentHike = computed(() => hikes.value?.[currentHikeIndex.value] || null)
const hikesLoading = computed(() => !hikesLoaded.value)

// Page loading state
const weatherLoaded = ref(false)
const pageReady = computed(() => hikesLoaded.value && weatherLoaded.value)

// Fallback: show page after 5 seconds regardless
setTimeout(() => {
  weatherLoaded.value = true
  hikesLoaded.value = true
}, 5000)

// Swipe handling
const hikeCardRef = ref(null)
const { direction } = useSwipe(hikeCardRef, {
  onSwipeEnd() {
    if (!hikes.value?.length) return

    if (direction.value === 'up') {
      // Swipe up = next hike
      currentHikeIndex.value = (currentHikeIndex.value + 1) % hikes.value.length
    } else if (direction.value === 'down') {
      // Swipe down = previous hike
      currentHikeIndex.value = (currentHikeIndex.value - 1 + hikes.value.length) % hikes.value.length
    }
  }
})

async function handleLogout() {
  await signOut()
  router.replace('/login')
}
</script>

<template>
  <transition name="fade">
    <div v-if="!pageReady" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </transition>
  <div class="rows" :class="{ 'content-ready': pageReady }">
    <div class="row">
      <div class="profile-column">
        <profile-pic
          :src="avatarURL"
          style="cursor: pointer"
          :userName="userName"
          @click="handleLogout"
        />
      </div>
      <div class="weather-card">
        <WeatherWidget @loaded="weatherLoaded = true" />
      </div>
    </div>

    <div class="row" ref="hikeCardRef">
      <div class="hike-card-wrapper">
        <PreviousHikesCard
          class="previous-hike-card"
          :hikeId="currentHike?.id"
          :name="currentHike?.name"
          :datetime="currentHike?.startedAt"
          :distance="currentHike?.distanceMeters"
          :duration="currentHike?.durationSec"
          :trail="currentHike?.trail"
          :link="currentHike ? `/previousHikes?scrollTo=${currentHike.id}` : '/previousHikes'"
          :showTrailInContent="true"
          :isLoading="hikesLoading"
        />
      </div>
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
      <base-card link="" size="half" title="Goals">
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
  opacity: 0;
  transition: opacity 0.3s ease;
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
  justify-content: center;
  align-items: center;
}

.weather-card {
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.previous-hike-card {
  width: 100%;
  height: 100%;
}

.previous-hike-card :deep(.card-image) {
  display: none;
}

.previous-hike-card :deep(.delete-button) {
  display: none;
}

.hike-card-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: var(--bulma-body-background-color, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bulma-border);
  border-top-color: var(--bulma-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.rows.content-ready {
  opacity: 1;
}
</style>
