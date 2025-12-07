<script setup>
import MonthlyCalendar from '@/components/MonthlyCalendar.vue'
</script>

<template>
  <div>
    <p>This is calendar view</p>
    <monthly-calendar :year="2025" :month="12"></monthly-calendar>
  </div>
</template>

<style scoped>
container header {
  display: flex;
  align-items: center;
  padding: 15px 20px 8px;
  justify-content: space-between;
}
</style>
