<script setup>
import { computed, ref, watch } from 'vue'
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'
import ProfilePic from '@/components/main/ProfilePic.vue'
import WeatherWidget from '@/components/main/WeatherWidget.vue'
import HikeCollageCard from '@/components/HikeCollageCard.vue'
import MonthlyCalendarCard from '@/components/main/MonthlyCalendarCard.vue'
import StartHikeCard from '@/components/main/StartHikeCard.vue'
import GoalCard from '@/components/main/GoalCard.vue'
import { useAuth } from '@/composables/useAuth'
import LogoutBtn from '@/components/main/logoutBtn.vue'

const { user } = useAuth()

const avatarURL = computed(() => user.value?.photoURL)
const userName = computed(() => user.value?.displayName)
const uid = computed(() => user.value?.uid)

// Fetch all hikes
const hikesQuery = computed(() => {
  if (!uid.value) return null
  return query(collection(db, 'users', uid.value, 'hikes'), orderBy('startedAt', 'desc'))
})

const hikes = useCollection(hikesQuery)
const hikesWithPhotos = ref([])
const hikesLoaded = ref(false)

// Fetch photos for each hike when hikes change
watch(
  [hikes, uid],
  async ([newHikes, newUid]) => {
    if (newHikes?.length > 0 && newUid) {
      // Fetch first photo for each hike (for collage display)
      const hikesData = await Promise.all(
        newHikes.slice(0, 6).map(async (hike) => {
          try {
            const photosQuery = query(
              collection(db, 'users', newUid, 'hikes', hike.id, 'photos'),
              orderBy('createdAt', 'desc'),
              limit(1),
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
        }),
      )
      hikesWithPhotos.value = hikesData
      hikesLoaded.value = true
    } else if (newUid && !hikesLoaded.value) {
      setTimeout(() => {
        hikesLoaded.value = true
      }, 1000)
    }
  },
  { immediate: true },
)

const hikesLoading = computed(() => !hikesLoaded.value)

// Page loading state
const weatherLoaded = ref(false)
const pageReady = computed(() => hikesLoaded.value && weatherLoaded.value)

// Fallback: show page after 5 seconds regardless
setTimeout(() => {
  weatherLoaded.value = true
  hikesLoaded.value = true
}, 5000)
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
          alignment="end"
        />

        <div class="userName">{{ userName }}</div>
        <div class="logout"><LogoutBtn /></div>
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
      <div class="start-hike-card-wrapper">
        <StartHikeCard />
      </div>
      <div class="start-hike-card-wrapper">
        <GoalCard />
      </div>
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

.start-hike-card-wrapper {
  width: 50%;
  height: 100%;
  cursor: pointer;
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
  to {
    transform: rotate(360deg);
  }
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
    padding: 3vh 5vw 3vh 5vw;
    overflow: hidden;
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
    height: 120px;
    min-height: 120px;
  }
}
</style>
