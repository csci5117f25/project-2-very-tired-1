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

  // Handle case where all lats or lngs are equal; If both dimensions are zero, center the single point
  if (dataWidth === 0 && dataHeight === 0) {
    return props.points.map(() => ({ x: props.width / 2, y: props.height / 2 }))
  }

  // Compute a safe scale depending on available dimensions
  let scale
  if (dataWidth === 0) {
    scale = usableHeight / dataHeight
  } else if (dataHeight === 0) {
    scale = usableWidth / dataWidth
  } else {
    // Preserve aspect ratio
    scale = Math.min(usableWidth / dataWidth, usableHeight / dataHeight)
  }

  // Center the scaled data within the usable area
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
const svgPointsString = computed(() => {
  if (!svgPointsArray.value.length) return ''
  return svgPointsArray.value.map((p) => `${p.x},${p.y}`).join(' ')
})
</script>
<template>
  <div class="trail-wrapper">
    <svg
      class="trail-svg"
      :viewBox="`0 0 ${props.width} ${props.height}`"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- The path -->
      <polyline
        :points="svgPointsString"
        fill="none"
        stroke="#ff7300"
        :stroke-width="props.strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Start point -->
      <circle
        v-if="svgPointsArray.length"
        :cx="svgPointsArray[0].x"
        :cy="svgPointsArray[0].y"
        :r="props.markerRadius"
        fill="#1ba848"
        stroke="#ff7300"
        :stroke-width="3"
      />

      <!-- End point -->
      <circle
        v-if="svgPointsArray.length"
        :cx="svgPointsArray[svgPointsArray.length - 1].x"
        :cy="svgPointsArray[svgPointsArray.length - 1].y"
        :r="props.markerRadius"
        fill="#de3535"
        stroke="#ff7300"
        :stroke-width="3"
      />
    </svg>
  </div>
</template>

<style scoped>
.trail-wrapper {
  display: block;
  width: 100%;
}
.trail-svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
