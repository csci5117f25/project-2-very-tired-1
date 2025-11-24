<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goStartHike() {
  router.push('/startHike')
}

function goPreviousHikes() {
  router.push('/previousHikes')
}
</script>

<template>
  <div id="app">
    <b-button @click="goStartHike">Start Hike</b-button>
    <b-button @click="goPreviousHikes">Previous Hikes</b-button>
  </div>
</template>

<style scoped></style>
