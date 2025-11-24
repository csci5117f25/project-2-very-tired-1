<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goStartHike() {
  router.push('/startHike')
}
</script>

<template>
  <div id="app">
    <b-button @click="goStartHike">Start Hike</b-button>
  </div>
</template>

<style scoped></style>
