<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <b-button class="back-button" type="is-primary" @click="router.back()"> ← Back </b-button>
</template>

<style scoped>
.back-button {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
