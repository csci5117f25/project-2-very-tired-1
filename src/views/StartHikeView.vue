<script setup>
import { ref, watch } from 'vue'
import { useGeolocation } from '@vueuse/core'
import TrailLine from '@/components/TrailLine.vue'

const trail = ref([])

const { coords } = useGeolocation()

watch(
  coords,
  (c) => {
    trail.value.push({
      lat: c.latitude,
      lng: c.longitude,
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="start-hike">
    <div class="trail-container">
      <TrailLine :points="trail" :autoResize="true" />
    </div>
  </div>
</template>

<style scoped>
.trail-container {
  width: 100%;
  margin: 0 auto;
}
</style>
