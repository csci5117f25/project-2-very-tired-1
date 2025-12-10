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
        class="block"
        v-for="i in 12"
        :key="year + '-' + (i - 1)"
        :year="year"
        :month="i - 1"
      ></monthly-calendar>
    </div>
  </body>
  <b-button class="back-button" type="is-primary" @click="goBack"> ← Back </b-button>
</template>

<style scoped>
@keyframes appear {
  from {
    opacity: 0;
    scale: 0.4;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

.wrapper {
  padding-bottom: 75px;
}

.title-wrapper {
  align-items: center;
  justify-content: center;
}

.block {
  animation: appear linear;
  animation-timeline: view();
  animation-range: entry 0% cover 15%;
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
