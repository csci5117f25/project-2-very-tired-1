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

const totalKms = computed(() => {
  if (!hikes.value) return 0
  let meters = 0
  for (const h of hikes.value) {
    if (h.distanceMeters) meters += h.distanceMeters
  }
  return meters / 1000
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
  <div class="overview">
    <LongGoalCard
      class="long-card"
      :count1="Number((userData.totalDistance / 1000).toFixed(2))"
      :count2="userData.totalElevation"
    >
      <template #svg1>
        <b-icon icon="shoe-print" size="is-large" type="is-dark"></b-icon>
      </template>

      <template #svg2>
        <b-icon icon="stairs" size="is-large" type="is-dark"></b-icon>
      </template>
    </LongGoalCard>

    <div class="entry">
      <GoalCard :count="userData.totalPhotos" :unit="'Photo Takens'"></GoalCard>
      <GoalCard :count="userData.totalHikes" :unit="'Hikes Traveled'"></GoalCard>
    </div>
  </div>

  <div class="goal has-background-primary">
    <h2 class="label">{{ goals?.type }}</h2>
    <div class="progressBar-list">
      <div class="nav-btn" @click="previous">
        <b-icon icon="chevron-left" size="is-medium" type="is-dark"></b-icon>
      </div>

      <ProgressBar
        :key="goals.type + 'distance'"
        :current="Number(totalKms.toFixed(2))"
        :target="goals.distanceKmTarget"
        :color="clrDistance"
        :unit="'KMs'"
      />

      <ProgressBar
        :key="goals.type + 'hikes'"
        :current="totalHikes"
        :target="goals?.hikesTarget"
        :color="clrHikes"
        :unit="'HIKES'"
      />

      <ProgressBar
        :key="goals.type + 'photos'"
        :current="totalPhotos"
        :target="goals?.photosTarget"
        :color="clrPhotos"
        :unit="'PHOTOS'"
      />

      <div class="nav-btn" @click="next">
        <b-icon icon="chevron-right" size="is-medium" type="is-dark"></b-icon>
      </div>
    </div>

    <div class="setting">
      <GoalInputField
        :key="goals.type + 'distanceTarget'"
        :unit="'Distance'"
        :type="type"
        :target="goals?.distanceKmTarget || 0"
        :color="clrDistance"
      />

      <GoalInputField
        :key="goals.type + 'hikesTarget'"
        :unit="'Hikes'"
        :type="type"
        :target="goals?.hikesTarget || 0"
        :color="clrHikes"
      />

      <GoalInputField
        :key="goals.type + 'photosTarget'"
        :unit="'Photos'"
        :type="type"
        :target="goals?.photosTarget || 0"
        :color="clrPhotos"
      />
    </div>
  </div>

  <BackButton></BackButton>
</template>

<style scoped>
.overview {
  display: flex;
  gap: 16px;
  padding: 20px;
}

.long-card {
  flex: 1;
}

.entry {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal {
  border-radius: 15px;
  padding: 5px;
  margin: 20px;
}

.progressBar-list {
  display: flex;
  height: 120px;
  align-items: center;
  justify-content: space-between;
}

.nav-btn {
  width: 3.5%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.nav-btn:hover {
  opacity: 1;
}

.setting {
  margin-top: 4vh;
}

.setting-entry {
  display: flex;
  height: 5vh;
}
</style>
