<script setup>
// --- imports ---
import { ref } from 'vue'
import MonthlyCalendar from '@/components/MonthlyCalendar.vue'
import { useRouter } from 'vue-router'

// --- router ---
const router = useRouter()

// --- local state ---
const currentDate = new Date()
const year = ref(currentDate.getFullYear())

// --- Methods ---
const changeYear = (num) => {
  year.value = year.value + num
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <body class="wrapper has-navbar-fixed-top">
    <nav class="navbar is-fixed-top">
      <div class="navbar-brand" style="flex: 1; justify-content: center; width: 100%">
        <div class="navbar-item">
          <button class="button" @click="changeYear(-1)">← {{ year - 1 }}</button>
          <h1 class="year-title title">{{ year }}</h1>
          <button class="button" @click="changeYear(1)">{{ year + 1 }} →</button>
        </div>
      </div>
    </nav>

    <div class="body">
      <monthly-calendar
        v-for="i in 12"
        :key="year + '-' + (i - 1)"
        :year="year"
        :month="i - 1"
      ></monthly-calendar>
    </div>

    <b-button class="button back-button" type="is-primary" @click="goBack"> ← Back </b-button>
  </body>
</template>

<style scoped>
.wrapper {
  padding-bottom: 75px;
}

.title-wrapper {
  align-items: center;
  justify-content: center;
}

.back-button {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.year-title {
  margin-bottom: 0px !important;
}
</style>
