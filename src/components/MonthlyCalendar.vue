<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
})

const year = props.year
const month = props.month

const { user } = useAuth()
const uid = computed(() => user.value?.uid)

const days = computed(() => {
  const firstDay = new Date(year, month, 1).getDay()
  const lastdate = new Date(year, month + 1, 0).getDate()
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

  for (let i = 1; i <= lastdate; i++) {
    arr.push({
      day: i,
      type: 'next',
    })
  }

  return arr
})
</script>

<template>
  <div class="wrapper box">
    <header>
      <p>{{ month }}</p>
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
      <ul class="dates">
        <li
          v-for="(d, idx) in days"
          :key="idx"
          :class="[
            d.type === 'prev' || d.type === 'next' ? 'inactive' : '',
            d.isToday ? 'active' : '',
          ]"
        >
          {{ d.day }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
header {
  display: flex;
  align-items: center;
  padding: 15px 20px 8px;
  justify-content: space-between;
}

ul {
  list-style: none;
  flex-wrap: wrap;
  display: flex;
  text-align: center;
}

li {
  width: calc(100% / 7);
  height: 30px;
  line-height: 30px;
  font-size: 0.9rem;
  color: #414141;
  margin-top: 10px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
}
</style>
