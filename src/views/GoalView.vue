<script setup>
// --- imports ---
import { ref, computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useHikesRange } from '@/composables/useHikesRange'
import { useAuth } from '@/composables/useAuth'
import ProgressBar from '@/components/goal/ProgressBar.vue'
import { useUserData } from '@/composables/useUserData'
import BackButton from '@/components/BackButton.vue'
import LongGoalCard from '@/components/goal/LongGoalCard.vue'
import GoalCard from '@/components/goal/GoalCard.vue'
import GoalInputField from '@/components/goal/GoalInputField.vue'
import ProfilePic from '@/components/main/ProfilePic.vue'
import { useRouter } from 'vue-router'

// --- constants: progress bar colors ---
const clrDistance = '#4de375'
const clrHikes = '#be4de3'
const clrPhotos = '#4d78e3'

// --- auth ---
const { user } = useAuth()
const uid = computed(() => user.value?.uid)
const userName = computed(() => user.value?.displayName)
const avatarURL = computed(() => user.value?.photoURL)

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

const current = ref(new Date())

// --- computed: date range for weekly/monthly/annual ---
const range = computed(() => {
  const year = current.value.getFullYear()
  const month = current.value.getMonth()

  let start
  let end

  if (type.value === 'annualy') {
    start = new Date(year, 0, 1)
    end = new Date(year + 1, 0, 1)
  } else if (type.value === 'monthly') {
    start = new Date(year, month, 1)
    end = new Date(year, month + 1, 1)
  } else {
    const first = current.value.getDate() - current.value.getDay()
    start = new Date(current.value)
    start.setDate(first)
    end = new Date(start)
    end.setDate(start.getDate() + 7)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return { start, end }
})

const curDay = computed(() => current.value.getDate())

const curMonthYear = computed(() =>
  current.value.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  }),
)

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

// --- router ---
const router = useRouter()
</script>

<template>
  <div class="wrapper">
    <div class="user-info">
      <div class="user-leftcolumn">
        <profile-pic
          class="avatar"
          :src="avatarURL"
          style="cursor: pointer"
          :userName="userName"
          @click="handleLogout"
        />
        <div>
          <p class="userName title is-5">{{ userName }}</p>
          <p class="greeting subtitle is-6">Welcome Back!</p>
        </div>
      </div>

      <div class="user-rightcolumn">
        <div class="date">
          <p class="title is-5">{{ curDay }}</p>
          <p class="subtitle is-6">{{ curMonthYear }}</p>
        </div>
        <div class="date-btn">
          <button class="button is-large is-white is-outlined" @click="router.push('/calendar')">
            <b-icon icon="calendar" />
          </button>
        </div>
      </div>
    </div>

    <div class="overview">
      <LongGoalCard
        class="long-card"
        :count1="Math.floor(Number(userData.totalDistance / 1000))"
        :count2="Math.floor(Number(userData.totalElevation))"
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

    <div class="goal">
      <h2 class="label">{{ goals?.type.charAt(0).toUpperCase() + goals?.type.slice(1) }} Goals</h2>
      <div class="progressBar-list">
        <div class="nav-btn" @click="previous">
          <b-icon icon="chevron-left" size="is-medium" type="is-dark"></b-icon>
        </div>

        <ProgressBar
          :key="goals.type + 'distance'"
          :current="Math.floor(Number(totalKms))"
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
  </div>
  <BackButton></BackButton>
</template>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 11vh;
  margin: 20px 20px 0px 20px;
}

.user-leftcolumn {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-rightcolumn {
  display: flex;
  align-items: center;
  gap: 10px;
}
.date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.overview {
  display: flex;
  gap: 16px;
  padding: 20px 20px 16px 20px;
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
  margin: 0px 20px 0px 20px;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
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

.wrapper {
  margin-top: 10px;
  width: 100%;
}

.label {
  margin: auto;
  text-align: center;
  width: 100%;
  padding: 10px;
}

/* https://levelup.gitconnected.com/dynamic-element-scaling-in-css-7e35ed9a3914 */
@media (min-width: 500px) {
  .wrapper {
    width: calc(500px + (900px - 500px) * ((100vw - 500px) / (1920px - 500px)));
    margin: 0 auto;
  }
}

@media (max-width: 430px) {
  .user-info {
    height: 10vh;
  }
  .userName {
    display: none;
  }
  .greeting {
    display: none;
  }
}

@media (prefers-color-scheme: light) {
  .date-btn .button {
    border-color: #000;
    color: #000;
  }

  .date-btn .button .icon {
    color: #000;
  }
}
</style>
