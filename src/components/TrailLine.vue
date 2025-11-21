<script setup>
import { computed } from 'vue'

const props = defineProps({
  points: {
    type: Array,
    required: true,
  },
  width: { type: Number, default: 800 },
  height: { type: Number, default: 800 },
  padding: { type: Number, default: 40 },
  strokeWidth: { type: Number, default: 6 },
  markerRadius: { type: Number, default: 8 },
})

// Compute bounding box of GPS points
const bbox = computed(() => {
  if (!props.points.length) return null

  const lats = props.points.map((p) => p.lat)
  const lngs = props.points.map((p) => p.lng)

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
})

// Convert lat/lng -> SVG x,y
const svgPointsArray = computed(() => {
  if (!bbox.value) return []

  const { minLat, maxLat, minLng, maxLng } = bbox.value

  const dataWidth = maxLng - minLng
  const dataHeight = maxLat - minLat

  // Allow for padding on side
  const usableWidth = props.width - props.padding * 2
  const usableHeight = props.height - props.padding * 2

  // Preverse aspect ratio
  const scale = Math.min(usableWidth / dataWidth, usableHeight / dataHeight)
  // Center the data on
  const scaledDataWidth = dataWidth * scale
  const scaledDataHeight = dataHeight * scale
  const extraX = (usableWidth - scaledDataWidth) / 2
  const extraY = (usableHeight - scaledDataHeight) / 2

  return props.points.map((p) => {
    const x = (p.lng - minLng) * scale + props.padding + extraX
    const y = (maxLat - p.lat) * scale + props.padding + extraY
    return { x, y }
  })
})

// Turn into "x,y x,y x,y" string for <polyline>
const svgPointsString = computed(() => svgPointsArray.value.map((p) => `${p.x},${p.y}`).join(' '))
</script>
<template>
  <div class="trail-wrapper">
    <svg class="trail-svg" :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height">
      <!-- The path -->
      <polyline
        :points="svgPointsString"
        fill="none"
        stroke="#ff7300"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Start point -->
      <circle
        v-if="svgPointsArray.length"
        :cx="svgPointsArray[0].x"
        :cy="svgPointsArray[0].y"
        :r="markerRadius"
        fill="#00ff00"
        stroke="#000000"
        :stroke-width="2"
      />

      <!-- End point -->
      <circle
        v-if="svgPointsArray.length"
        :cx="svgPointsArray[svgPointsArray.length - 1].x"
        :cy="svgPointsArray[svgPointsArray.length - 1].y"
        :r="markerRadius"
        fill="#ff0000"
        stroke="#000000"
        :stroke-width="2"
      />
    </svg>
  </div>
</template>

<style scoped>
.trail-wrapper {
  display: inline-block;
}
.trail-svg {
  display: block;
}
</style>
