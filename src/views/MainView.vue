<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'
import BaseCard from '@/components/BaseCard.vue'
import ProfilePic from '@/components/ProfilePic.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import HikeCollageCard from '@/components/HikeCollageCard.vue'
import MonthlyCalendarCard from '@/components/MonthlyCalendarCard.vue'
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
const hikesWithPhotos = ref([])
const hikesLoaded = ref(false)

// Fetch photos for each hike when hikes change
watch([hikes, uid], async ([newHikes, newUid]) => {
  if (newHikes?.length > 0 && newUid) {
    // Fetch first photo for each hike (for collage display)
    const hikesData = await Promise.all(
      newHikes.slice(0, 6).map(async (hike) => {
        try {
          const photosQuery = query(
            collection(db, 'users', newUid, 'hikes', hike.id, 'photos'),
            orderBy('createdAt', 'desc'),
            limit(1)
          )
          const photosSnapshot = await getDocs(photosQuery)
          const firstPhoto = photosSnapshot.docs[0]?.data()

          return {
            ...hike,
            id: hike.id,
            photoUrl: firstPhoto?.downloadURL || null,
          }
        } catch (error) {
          console.error(`Error fetching photos for hike ${hike.id}:`, error)
          return { ...hike, id: hike.id, photoUrl: null }
        }
      })
    )
    hikesWithPhotos.value = hikesData
    hikesLoaded.value = true
  } else if (newUid && !hikesLoaded.value) {
    setTimeout(() => { hikesLoaded.value = true }, 1000)
  }
}, { immediate: true })

const hikesLoading = computed(() => !hikesLoaded.value)

// Page loading state
const weatherLoaded = ref(false)
const pageReady = computed(() => hikesLoaded.value && weatherLoaded.value)

// Fallback: show page after 5 seconds regardless
setTimeout(() => {
  weatherLoaded.value = true
  hikesLoaded.value = true
}, 5000)

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
    <div class="row row-header">
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
        <WeatherWidget @loaded="weatherLoaded = true" />
      </div>
    </div>

    <div class="row row-collage">
      <div class="hike-card-wrapper">
        <HikeCollageCard
          :hikes="hikesWithPhotos"
          :totalCount="hikes?.length || 0"
          :isLoading="hikesLoading"
        />
      </div>
    </div>

    <div class="row row-calendar">
      <div class="calendar-card-wrapper">
        <MonthlyCalendarCard />
      </div>
    </div>

    <div class="row row-actions">
      <base-card link="/startHike" size="half" title="Start Hike">
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
  gap: 20px;
  height: 100vh;
  padding: 2vh 5vw 4vh 5vw;
  opacity: 0;
  transition: opacity 0.3s ease;
  overflow: hidden; /* Prevents page scroll on mobile */
}


.row {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.row-header {
  flex: 0.8;
  max-height: 180px;
}

.weather-card {
  width: 50%;
  height: 100%;
  max-width: 180px;
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.hike-card-wrapper {
  width: 100%;
  height: 100%;
}

.row-collage {
  flex: 1.2;
  max-height: 300px;
  margin-top: 0;
}

.calendar-card-wrapper {
  width: 100%;
  height: 100%;
}

.row-calendar {
  flex: 0.6;
  max-height: 160px;
}

.row-actions {
  flex: 0.6;
  min-height: 80px;
  margin-bottom: 10px;
}

/* Mobile screens - tighter layout */
@media (max-height: 900px) {
  .rows {
    gap: 12px;
    padding: 1.5vh 4vw 2vh 4vw;
  }

  .row-header {
    flex: 0.7;
  }

  .weather-card {
    max-width: 160px;
  }

  .row-collage {
    flex: 1.2;
    max-height: 280px;
    margin-top: 0;
  }

  .row-calendar {
    flex: 0.5;
    max-height: 130px;
  }

  .row-actions {
    flex: 0.5;
    min-height: 55px;
  }
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

/* Desktop layout */
@media (min-width: 1024px) {
  .rows {
    padding: 3vh 5vw 2vh 5vw;
    overflow: visible;
    max-width: 1200px;
    margin: 0 auto;
  }

  .weather-card {
    max-width: none;
    max-height: none;
    width: 50%;
    height: 100%;
  }

  .profile-column {
    width: 50%;
  }

  .row-header {
    flex: 0.6;
    max-height: 160px;
  }

  .row-collage {
    flex: 2;
    max-height: 50vh;
    margin-top: 0;
  }

  .row-calendar {
    flex: 0.5;
    max-height: 180px;
  }

  .row-actions {
    flex: 0;
    height: 140px;
    min-height: 140px;
  }
}
</style>
