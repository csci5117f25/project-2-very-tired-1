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
const currentYear = today.getFullYear()

// Month boundaries for query
const monthStart = new Date(currentYear, currentMonth, 1)
const monthEnd = new Date(currentYear, currentMonth + 1, 1)

// Day names for header (Sunday first)
const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Generate calendar rows (6 rows x 7 columns)
const calendarRows = computed(() => {
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const rows = []
  let dayCounter = 1

  for (let row = 0; row < 6; row++) {
    const week = []
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col
      if (cellIndex < firstDayOfMonth || dayCounter > daysInMonth) {
        week.push({ empty: true })
      } else {
        const date = new Date(currentYear, currentMonth, dayCounter)
        week.push({
          dayNumber: dayCounter,
          isToday: date.toDateString() === today.toDateString(),
          date: date,
        })
        dayCounter++
      }
    }
    rows.push(week)
  }

  return rows
})

// Filter out completely empty rows (for months that don't need 6 weeks)
const visibleCalendarRows = computed(() => {
  return calendarRows.value.filter((week) => week.some((day) => !day.empty))
})

// Query hikes for current month
const hikesQuery = computed(() => {
  if (!uid.value) return null

  return query(
    collection(db, 'users', uid.value, 'hikes'),
    where('startedAt', '>=', monthStart),
    where('startedAt', '<', monthEnd),
  )
})

const monthHikes = useCollection(hikesQuery)

// Check if a day has hikes
const hasHikeOnDay = (day) => {
  if (!monthHikes.value?.length || day.empty) return false

  return monthHikes.value.some((hike) => {
    const hikeDate = hike.startedAt?.toDate?.() || new Date(hike.startedAt)
    return hikeDate.toDateString() === day.date.toDateString()
  })
}

// Check if a week row has any hikes
const weekHasHike = (week) => {
  if (!monthHikes.value?.length) return false

  return week.some((day) => {
    if (day.empty) return false
    return monthHikes.value.some((hike) => {
      const hikeDate = hike.startedAt?.toDate?.() || new Date(hike.startedAt)
      return hikeDate.toDateString() === day.date.toDateString()
    })
  })
}

// Navigate to calendar and scroll to current month
const goToCalendar = () => {
  router.push({
    path: '/calendar',
    query: { scrollTo: `month-${currentMonth}` },
  })
}

// Month name for header
const monthName = computed(() => {
  return today.toLocaleString('en-US', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <div class="card monthly-card" @click="goToCalendar">
    <div class="card-content">
      <div class="card-header-row">
        <p class="title">{{ monthName }}</p>
      </div>

      <table class="calendar-table">
        <thead>
          <tr>
            <th v-for="name in dayNames" :key="name">{{ name }}</th>
            <th class="streak-header"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(week, rowIdx) in visibleCalendarRows" :key="rowIdx">
            <td
              v-for="(day, colIdx) in week"
              :key="colIdx"
              :class="{
                empty: day.empty,
                'is-today': day.isToday,
              }"
            >
              <template v-if="!day.empty">
                <span v-if="hasHikeOnDay(day)" class="day-circle hike-icon">
                  <img src="/calendar-icons/noun-hiking-boot-8115251.svg" alt="hike">
                </span>
                <span v-else class="day-circle">{{ day.dayNumber }}</span>
              </template>
            </td>
            <!-- Streak indicator cell -->
            <td class="streak-cell">
              <div class="streak-indicator">
                <img
                  v-if="weekHasHike(week)"
                  class="streak-check"
                  src="/calendar-icons/noun-checkmark-3345738.svg"
                  alt="completed"
                >
                <div v-else class="streak-circle"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.monthly-card {
  cursor: pointer;
  overflow: hidden;
  border: 2px solid var(--bulma-border);
  border-radius: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px var(--bulma-text-50);
}

.card-content {
  padding: 0.75rem 0.75rem 1rem 0.75rem;
  background-color: var(--bulma-text-15-soft);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header-row {
  margin-bottom: 0.25rem;
}

.card-header-row .title {
  margin-bottom: 0;
  font-size: 1.1rem;
  color: var(--bulma-text-70-bold);
}

.calendar-table {
  flex: 1;
  width: 100%;
  border-collapse: collapse;
  height: 100%;
}

.calendar-table thead {
  height: 18px;
}

.calendar-table th {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--bulma-text-40-bold);
  text-align: center;
  padding: 1px 0;
  height: 18px;
}

.calendar-table tbody tr {
  height: 1px; /* Allow equal distribution */
}

.calendar-table td {
  text-align: center;
  vertical-align: middle;
  padding: 0;
  box-sizing: border-box;
  height: 32px;
}

.calendar-table td.empty {
  visibility: hidden;
}

/* Day circle - same size as hike icon */
.day-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--bulma-border);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--bulma-dark);
  box-sizing: border-box;
}

/* Today - dark black outline */
.calendar-table td.is-today .day-circle {
  border-color: var(--bulma-dark);
  border-width: 2px;
}

/* Days with hikes - teal circle with boot icon */
.hike-icon {
  background-color: var(--bulma-primary);
  padding: 6px;
}

.hike-icon img {
  width: 100%;
  height: 100%;
}

/* Today with hike - black border on the circle */
.calendar-table td.is-today .day-circle.hike-icon {
  border: 2px solid var(--bulma-dark);
}

/* Streak column */
.streak-header {
  width: 36px;
}

.streak-cell {
  width: 36px;
  padding: 0 !important;
  vertical-align: middle;
}

.streak-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 32px;
}

.streak-check {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
}

.streak-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--bulma-primary);
  box-sizing: border-box;
}

@media (max-width: 400px) {
  .card-content {
    padding: 0.5rem;
  }

  .day-circle {
    width: 24px;
    height: 24px;
    font-size: 0.6rem;
  }

  .calendar-table th {
    font-size: 0.55rem;
  }

  .calendar-table td {
    height: 28px;
  }

  .hike-icon {
    width: 24px;
    height: 24px;
    padding: 4px;
  }

  .streak-header,
  .streak-cell {
    width: 30px;
  }

  .streak-indicator {
    min-height: 28px;
  }

  .streak-check,
  .streak-circle {
    width: 24px;
    height: 24px;
  }
}

/* Small height screens - more compact layout */
@media (max-height: 750px) {
  .card-content {
    padding: 0.4rem;
  }

  .card-header-row {
    margin-bottom: 0.25rem;
  }

  .card-header-row .title {
    font-size: 0.95rem;
  }

  .calendar-table td {
    height: 26px;
  }

  .day-circle {
    width: 22px;
    height: 22px;
    font-size: 0.55rem;
  }

  .hike-icon {
    width: 22px;
    height: 22px;
    padding: 3px;
  }

  .streak-header,
  .streak-cell {
    width: 28px;
  }

  .streak-indicator {
    min-height: 26px;
  }

  .streak-check,
  .streak-circle {
    width: 22px;
    height: 22px;
  }
}
</style>
