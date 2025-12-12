<script setup>
// --- imports ---
import { ref, computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useHikesRange } from '@/composables/useHikesRange'
import { useAuth } from '@/composables/useAuth'
import ProgressBar from '@/components/ProgressBar.vue'
import { useUserData } from '@/composables/useUserData'
import BackButton from '@/components/BackButton.vue'
import LongGoalCard from '@/components/LongGoalCard.vue'
import GoalCard from '@/components/GoalCard.vue'
import GoalInputField from '@/components/GoalInputField.vue'

// --- constants: progress bar colors ---
const clrDistance = '#4de375'
const clrHikes = '#be4de3'
const clrPhotos = '#4d78e3'

// --- auth ---
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

// --- state: goal type switching ---
const types = ref(['weekly', 'monthly', 'annualy'])
const index = ref(0)
const type = computed(() => types.value[index.value])

// --- firestore data ---
const { goals } = useGoals(uid, type)
const { userData } = useUserData(uid)

// --- navigation methods ---
const previous = () => {
  if (index.value === 0) return
  index.value--
}

const next = () => {
  if (index.value === 2) return
  index.value++
}

// --- computed: date range for weekly/monthly/annual ---
const range = computed(() => {
  const current = new Date()
  const year = current.getFullYear()
  const month = current.getMonth()

  let start
  let end

  if (type.value === 'annualy') {
    start = new Date(year, 0, 1)
    end = new Date(year + 1, 0, 1)
  } else if (type.value === 'monthly') {
    start = new Date(year, month, 1)
    end = new Date(year, month + 1, 1)
  } else {
    const first = current.getDate() - current.getDay()
    start = new Date(current)
    start.setDate(first)
    end = new Date(start)
    end.setDate(start.getDate() + 7)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return { start, end }
})

// --- hikes data ---
const { hikes } = useHikesRange(uid, range)

// --- computed: totals ---
const totalHikes = computed(() => {
  if (!hikes.value) return 0
  return hikes.value.length
})

const totalMiles = computed(() => {
  if (!hikes.value) return 0
  let meters = 0
  for (const h of hikes.value) {
    if (h.distanceMeters) meters += h.distanceMeters
  }
  return Math.round(meters / 1609.344)
})

const totalPhotos = computed(() => {
  if (!hikes.value) return 0
  let count = 0
  for (let h of hikes.value) {
    if (h.photoCount) count += h.photoCount
  }
  return count
})
</script>

<template>
  <body class="has-navbar-fixed-top">
    <nav class="navbar is-fixed-top">
      <div class="navbar-brand" style="flex: 1; justify-content: center; width: 100%">
        <div class="navbar-item">
          <h1 class="title">My Goals</h1>
        </div>
      </div>
    </nav>

    <div class="top-section" v-if="userData">
      <h2 class="label">Overview</h2>
      <div class="overview">
        <long-goal-card :count1="userData.totalDistance" :count2="userData.totalElevation">
          <template #svg1>
            <!-- SVG preserved exactly -->
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 512 512">
              <path
                fill="#ffffff"
                d="M133.83 361.27c-22.61 0-41-8.17-54.79-24.39s-22.84-40.29-28.11-75.31c-7.76-51.61-.06-95.11 21.68-122.48c12.8-16.12 29.6-25.44 48.58-26.94c16.25-1.3 40.54 5.29 64 44c14.69 24.24 25.86 56.44 30.65 88.34c5.79 38.51 1.48 66.86-13.18 86.65c-11.64 15.72-29.54 25.46-53.21 29a106.46 106.46 0 0 1-15.62 1.13ZM173 496c-13.21 0-26.6-4.23-38.66-12.36a79.79 79.79 0 0 1-33.52-50.6c-2.85-14.66-1.14-26.31 5.22-35.64c10.33-15.15 28.87-18.56 48.49-22.18c2.07-.38 4.17-.76 6.3-1.17c4.52-.86 9.14-2 13.62-3.11c16.78-4.14 34.14-8.43 48.47 1.75c9.59 6.8 15 18.36 16.62 35.32c1.84 19.57-2.36 39.1-11.83 55c-10.19 17.11-25.47 28.42-43 31.86A61 61 0 0 1 173 496Zm205.17-230.73a106.69 106.69 0 0 1-15.6-1.2c-23.66-3.5-41.56-13.25-53.2-29c-14.66-19.79-19-48.13-13.18-86.65c4.79-31.93 15.93-64.1 30.55-88.25c23.34-38.57 47.66-45.26 64-44.08c18.92 1.38 35.69 10.57 48.51 26.6c21.89 27.37 29.65 71 21.86 122.84c-5.27 35-14.2 58.95-28.11 75.31s-32.22 24.43-54.83 24.43ZM339 400a61 61 0 0 1-11.68-1.13c-17.56-3.44-32.84-14.75-43-31.86c-9.47-15.9-13.67-35.43-11.83-55c1.6-17 7-28.52 16.62-35.33c14.33-10.17 31.69-5.89 48.47-1.74c4.48 1.1 9.1 2.24 13.62 3.11l6.29 1.17c19.63 3.61 38.17 7 48.5 22.17c6.36 9.33 8.07 21 5.22 35.64a79.78 79.78 0 0 1-33.52 50.61C365.56 395.78 352.17 400 339 400Z"
              />
            </svg>
          </template>

          <template #svg2>
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 256 256">
              <path
                fill="#ffffff"
                d="M248 56a8 8 0 0 1-8 8h-48v40a8 8 0 0 1-8 8h-48v40a8 8 0 0 1-8 8H80v40a8 8 0 0 1-8 8H16a8 8 0 0 1 0-16h48v-40a8 8 0 0 1 8-8h48v-40a8 8 0 0 1 8-8h48V56a8 8 0 0 1 8-8h56a8 8 0 0 1 8 8Z"
              />
            </svg>
          </template>
        </long-goal-card>

        <div class="entry">
          <goal-card :count="userData.totalPhotos" :unit="'Photo Takens'"></goal-card>
          <goal-card :count="userData.totalHikes" :unit="'Hikes Traveled'"></goal-card>
        </div>
      </div>
    </div>

    <div v-if="goals && hikes" class="bottom-section">
      <p>{{}}</p>

      <h2 class="label">{{ goals?.type || 'none' }}</h2>

      <div class="goal">
        <div class="progressBar-list">
          <button @click="previous"><</button>

          <progress-bar
            :key="goals.type + 'distance'"
            :current="totalMiles"
            :target="Math.round(goals.distanceMetersTarget / 1609.344)"
            :color="clrDistance"
            :unit="'miles'"
          />

          <progress-bar
            :key="goals.type + 'hikes'"
            :current="totalHikes"
            :target="goals?.hikesTarget"
            :color="clrHikes"
            :unit="'hikes'"
          />

          <progress-bar
            :key="goals.type + 'photos'"
            :current="totalPhotos"
            :target="goals?.photosTarget"
            :color="clrPhotos"
            :unit="'photo'"
          />

          <button @click="next">></button>
        </div>

        <div class="setting">
          <h2 class="label">Setting:</h2>

          <div class="setting-list">
            <div class="setting-list">
              <goal-input-field
                :key="goals.type + 'distanceTarget'"
                :unit="'Distance'"
                :type="type"
                :target="goals?.distanceMetersTarget || 0"
                :color="clrDistance"
              />

              <goal-input-field
                :key="goals.type + 'hikesTarget'"
                :unit="'Hikes'"
                :type="type"
                :target="goals?.hikesTarget || 0"
                :color="clrHikes"
              />

              <goal-input-field
                :key="goals.type + 'photosTarget'"
                :unit="'Photos'"
                :type="type"
                :target="goals?.photosTarget || 0"
                :color="clrPhotos"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <back-button></back-button>
  </body>
</template>

<style scoped>
.body {
  display: flex;
  min-height: 100vh;
}

.navbar {
  border-bottom: solid 1px;
}

.top-section {
  padding-top: 5px;
  width: 99vw;
  margin: auto;
}

.overview {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}

.entry {
  width: 48%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bottom-section {
  min-height: 40vh;
  width: 98vw;
  margin: auto;
  padding-top: 4vh;
  padding-bottom: 50px;
}

.goal {
  padding-top: 10px;
  background-color: rgb(33, 31, 31);
  border-radius: 22px;
}

.progressBar-list {
  display: flex;
  height: 120px;
}

.progressBar-list button {
  width: 3.5%;
  height: 100%;
  opacity: 0.3;
}

.setting {
  margin-top: 4vh;
}

.setting-entry {
  display: flex;
  height: 5vh;
}
</style>
