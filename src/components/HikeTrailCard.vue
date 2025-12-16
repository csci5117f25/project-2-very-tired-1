<script setup>
import { computed } from 'vue'
import TrailLine from '../components/TrailLine.vue'

const props = defineProps({
  trail: {
    type: Array,
    default: () => [],
  },
  photoLocation: {
    type: Object,
    default: null,
  },
})

const hasTrailData = computed(() => props.trail && props.trail.length > 0)

// Calculate photo marker position on trail
const markerPosition = computed(() => {
  if (!props.photoLocation || !hasTrailData.value) return null

  const width = 400
  const height = 300
  const padding = 30

  const lats = props.trail.map((p) => p.lat)
  const lngs = props.trail.map((p) => p.lng)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const dataWidth = maxLng - minLng
  const dataHeight = maxLat - minLat

  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2

  if (dataWidth === 0 && dataHeight === 0) {
    return { x: width / 2, y: height / 2 }
  }

  let scale
  if (dataWidth === 0) {
    scale = usableHeight / dataHeight
  } else if (dataHeight === 0) {
    scale = usableWidth / dataWidth
  } else {
    scale = Math.min(usableWidth / dataWidth, usableHeight / dataHeight)
  }

  const scaledDataWidth = dataWidth * scale
  const scaledDataHeight = dataHeight * scale
  const extraX = (usableWidth - scaledDataWidth) / 2
  const extraY = (usableHeight - scaledDataHeight) / 2

  const photoLat = props.photoLocation.lat
  const photoLng = props.photoLocation.long

  const x = (photoLng - minLng) * scale + padding + extraX
  const y = (maxLat - photoLat) * scale + padding + extraY

  return { x, y }
})
</script>

<template>
  <div class="card trail-card">
    <div v-if="hasTrailData" class="trail-container">
      <TrailLine
        :points="trail"
        :width="400"
        :height="300"
        :stroke-width="3"
        :marker-radius="5"
        :padding="30"
      />
      <!-- Photo location marker overlay -->
      <svg
        v-if="markerPosition"
        class="photo-marker-overlay"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Pulsing outer ring -->
        <circle
          :cx="markerPosition.x"
          :cy="markerPosition.y"
          r="12"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
          class="pulse-ring"
        />
        <!-- Inner marker -->
        <circle
          :cx="markerPosition.x"
          :cy="markerPosition.y"
          r="6"
          fill="#3b82f6"
          stroke="#ffffff"
          stroke-width="2"
        />
      </svg>
    </div>
    <div v-else class="no-trail-placeholder">
      <span>No trail data available</span>
    </div>
  </div>
</template>

<style scoped>
.trail-card {
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  background: var(--bulma-background);
}

.trail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--bulma-text-70);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trail-container :deep(svg) {
  width: 100%;
  height: 100%;
}

.photo-marker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.pulse-ring {
  animation: pulse 2s ease-out infinite;
  transform-origin: center;
}

@keyframes pulse {
  0% {
    opacity: 1;
    r: 6;
  }
  100% {
    opacity: 0;
    r: 18;
  }
}

.no-trail-placeholder {
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bulma-text-10);
  color: var(--bulma-text-40);
  font-size: 0.875rem;
}
</style>
