<script setup>
//https://www.geeksforgeeks.org/javascript/how-to-design-a-simple-calendar-using-javascript/

// --- imports ---
import { computed, watch, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useHikes } from '@/composables/useHikes'
import { useRouter } from 'vue-router'

// --- props ---
const props = defineProps({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
})

// --- router & auth ---
const router = useRouter()
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

// --- local state ---
const year = props.year
const month = props.month
const hikesRef = ref([])

// --- computed: days ---
const days = computed(() => {
  const firstDay = new Date(year, month, 1).getDay()
  const numDays = new Date(year, month + 1, 0).getDate()
  const monthlastdate = new Date(year, month, 0).getDate()

  const arr = []

  for (let i = firstDay; i > 0; i--) {
    arr.push({
      day: monthlastdate - i + 1,
      type: 'prev',
    })
  }

  for (let i = 1; i <= numDays; i++) {
    const isToday =
      i === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()

    arr.push({
      day: i,
      type: 'current',
      isToday,
    })
  }

  return arr
})

// --- computed: month name ---
const monthName = computed(() =>
  new Date(props.year, month).toLocaleString('en-US', {
    month: 'long',
  }),
)

// --- watchers ---
watch(
  uid,
  (newUid) => {
    if (!newUid) return

    const { hikes } = useHikes(newUid, props.year, props.month)

    watch(
      hikes,
      (newValue) => {
        hikesRef.value = newValue
      },
      { immediate: true },
    )
  },
  { immediate: true },
)

// --- methods ---
const hikesOn = (day) => {
  return hikesRef.value.filter((h) => h.createdAt.toDate().getDate() === day)
}

const goToDay = (day) => {
  const hikeList = hikesOn(day)
  if (hikeList.length === 0) return

  router.push({
    name: 'previousHikesByDay',
    params: {
      year,
      month,
      day,
    },
  })
}
</script>

<template>
  <div class="wrapper box">
    <header>
      <h1 class="title is-5">{{ monthName }}</h1>
    </header>
    <div class="body">
      <ul class="weekdays">
        <li>Sun</li>
        <li>Mon</li>
        <li>Tue</li>
        <li>Wed</li>
        <li>Thu</li>
        <li>Fri</li>
        <li>Sat</li>
      </ul>
      <ul class="dates has-text-primary-light">
        <li
          v-for="(d, idx) in days"
          :key="idx"
          @click="goToDay(d.day)"
          :class="{ isToday: d.isToday }"
        >
          <p v-if="hikesOn(d.day).length > 0" class="hike-icon">
            <img src="/calendar-icons/noun-hiking-boot-8115251.svg" alt="hike" />
          </p>

          <p v-else :class="{ inactive: d.type === 'prev' }">
            {{ d.day }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
}
ul {
  list-style: none;
  flex-wrap: wrap;
  display: flex;
  text-align: center;
}

.weekdays {
  text-decoration: underline;
  font-size: 1rem;
  color: var(--bulma-text-70-bold);
}

li {
  width: calc(100% / 7);
  height: 30px;
  line-height: 30px;
  font-size: 0.9rem;
  margin-top: 20px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
}

.dates li {
  margin-bottom: 20px;
}

.dates p {
  align-items: center;
  justify-content: center;
  line-height: 28px;

  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  width: 40px;
  height: 40px;
  border: 2px solid var(--bulma-border);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--bulma-dark);
  overflow: hidden;
}
.isToday p {
  border: 2px solid black;
}
.dates p.inactive {
  border: none;
  color: var(--bulma-grey);
  opacity: 0.5;
}

.hike-icon {
  background-color: var(--bulma-primary);
  padding: 8px;
}

.hike-icon img {
  width: 100%;
  height: 100%;
}

@media (prefers-color-scheme: dark) {
  .isToday p {
    border: 2px solid rgb(199, 197, 197);
  }
}
</style>
