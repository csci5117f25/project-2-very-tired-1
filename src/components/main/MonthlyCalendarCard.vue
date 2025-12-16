<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { collection, query, where } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'

const router = useRouter()
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

// Current date info
const today = new Date()
const currentMonth = today.getMonth()

// Get current week (Sunday to Saturday)
const currentDayOfWeek = today.getDay() // 0 = Sunday
const weekStart = new Date(today)
weekStart.setDate(today.getDate() - currentDayOfWeek)
weekStart.setHours(0, 0, 0, 0)

const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 7)

// Day names for header (Sunday first)
const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Generate current week days
const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push({
      dayNumber: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      date: date,
    })
  }
  return days
})

// Query hikes for current week
const hikesQuery = computed(() => {
  if (!uid.value) return null

  return query(
    collection(db, 'users', uid.value, 'hikes'),
    where('startedAt', '>=', weekStart),
    where('startedAt', '<', weekEnd),
  )
})

const weekHikes = useCollection(hikesQuery)

// Check if a day has hikes
const hasHikeOnDay = (day) => {
  if (!weekHikes.value?.length) return false

  return weekHikes.value.some((hike) => {
    const hikeDate = hike.startedAt?.toDate?.() || new Date(hike.startedAt)
    return hikeDate.toDateString() === day.date.toDateString()
  })
}

// Navigate to calendar and scroll to current month
const goToCalendar = () => {
  router.push({
    path: '/calendar',
    query: { scrollTo: `month-${currentMonth}` },
  })
}

// Week range for header (e.g., "Dec 8 - 14" or "Dec 29 - Jan 4")
const weekRange = computed(() => {
  const startMonth = weekStart.toLocaleString('en-US', { month: 'short' })
  const startDay = weekStart.getDate()

  const lastDay = new Date(weekEnd)
  lastDay.setDate(weekEnd.getDate() - 1)
  const endMonth = lastDay.toLocaleString('en-US', { month: 'short' })
  const endDay = lastDay.getDate()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
  }
})
</script>

<template>
  <div class="card weekly-card">
    <div class="card-content">
      <div class="card-header-row">
        <p class="title">{{ weekRange }}</p>
        <p class="calendar-link" @click="goToCalendar">View Full Calendar</p>
      </div>

      <div class="week-row">
        <div
          v-for="(day, idx) in weekDays"
          :key="idx"
          class="day-cell"
          :class="{ 'is-today': day.isToday }"
        >
          <span class="day-name">{{ dayNames[idx] }}</span>
          <span v-if="hasHikeOnDay(day)" class="day-circle hike-icon">
            <img src="/calendar-icons/noun-hiking-boot-8115251.svg" alt="hike" />
          </span>
          <span v-else class="day-circle">{{ day.dayNumber }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weekly-card {
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
}

.card-content {
  padding: 0.5rem 0.75rem;
  background-color: var(--bulma-text-15-soft);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.25rem;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-row .title {
  margin-bottom: 0;
  font-size: 1rem;
  color: var(--bulma-text-70-bold);
}

.calendar-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--bulma-dark);
  margin: 0;
  cursor: pointer;
  text-decoration: underline;
}

.week-row {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.day-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.day-name {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--bulma-text-40-bold);
  text-transform: uppercase;
}

.day-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--bulma-border);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--bulma-dark);
  box-sizing: border-box;
}

/* Today - dark outline */
.day-cell.is-today .day-circle {
  border-color: var(--bulma-dark);
}

/* Days with hikes - teal circle with boot icon */
.hike-icon {
  background-color: var(--bulma-primary);
  padding: 8px;
  border-color: transparent;
}

.hike-icon img {
  width: 100%;
  height: 100%;
}

/* Today with hike - black border */
.day-cell.is-today .day-circle.hike-icon {
  border: 2px solid var(--bulma-dark);
}

/* Small width screens */
@media (max-width: 400px) {
  .card-content {
    padding: 0.5rem;
  }

  .day-circle {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .hike-icon {
    padding: 7px;
  }

  .day-name {
    font-size: 0.55rem;
  }
}

/* Small height screens */
@media (max-height: 750px) {
  .card-content {
    padding: 0.5rem;
    gap: 0.25rem;
  }

  .card-header-row .title {
    font-size: 0.95rem;
  }

  .day-circle {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .hike-icon {
    padding: 7px;
  }
}
</style>
