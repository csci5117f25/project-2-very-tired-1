<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import TrailLine from '@/components/TrailLine.vue'
import { useHikeFormatters } from '../composables/useHikeFormatters'

const router = useRouter()

const MAPBOX_TOKEN = 'pk.eyJ1IjoidG9tbGkxMDQiLCJhIjoiY21qNTZraGJ0MDE1cTNncHp2cWYwd3V0OSJ9.4iVmOOYYfvYHnsyMXouYqw'

const props = defineProps({
  hikeId: String,
  name: String,
  datetime: Object, // Firestore Timestamp object
  distance: Number, // meters
  duration: Number, // seconds
  backgroundImage: String,
  trail: Array,
  link: String, // Optional override for navigation
  showTrailInContent: { type: Boolean, default: false }, // Show trail line in content area instead of image
  isLoading: { type: Boolean, default: false }, // Hide empty state while loading
})

const emit = defineEmits(['delete'])

const { formatTime, formatDistance, formatDuration } = useHikeFormatters()

const deleteHike = () => {
  emit('delete', props.hikeId)
}

const openHike = () => {
  router.push(props.link || `/individualHike/${props.hikeId}`)
}

const hasTrailData = computed(() => {
  return props.trail && props.trail.length > 0
})

const hasHikeData = computed(() => !!props.hikeId)

// Formatted values using shared formatters
const formattedDatetime = computed(() => formatTime(props.datetime))
const formattedDistance = computed(() => formatDistance(props.distance))
const formattedDuration = computed(() => formatDuration(props.duration))

// Simplify trail to max N points to avoid URL length limits
const simplifyTrail = (trail, maxPoints = 80) => {
  if (trail.length <= maxPoints) return trail
  const step = (trail.length - 1) / (maxPoints - 1)
  const simplified = []
  for (let i = 0; i < maxPoints - 1; i++) {
    simplified.push(trail[Math.round(i * step)])
  }
  simplified.push(trail[trail.length - 1]) // Always include last point
  return simplified
}

// Generate Mapbox Static Image URL with trail overlay (using GeoJSON for accuracy)
const staticMapUrl = computed(() => {
  if (!props.trail || props.trail.length < 2) return null

  // Simplify trail to avoid URL length limits (~8KB max)
  const simplifiedTrail = simplifyTrail(props.trail)

  // Create GeoJSON for the trail line with start/end markers
  const geojson = {
    type: 'FeatureCollection',
    features: [
      // Trail line
      {
        type: 'Feature',
        properties: { stroke: '#ff7300', 'stroke-width': 4 },
        geometry: {
          type: 'LineString',
          coordinates: simplifiedTrail.map(p => [
            Math.round(p.lng * 100000) / 100000,
            Math.round(p.lat * 100000) / 100000
          ])
        }
      },
      // Start point (green)
      {
        type: 'Feature',
        properties: { 'marker-color': '#00cc00', 'marker-size': 'small' },
        geometry: {
          type: 'Point',
          coordinates: [props.trail[0].lng, props.trail[0].lat]
        }
      },
      // End point (black with flag)
      {
        type: 'Feature',
        properties: { 'marker-color': '#000000', 'marker-size': 'small', 'marker-symbol': 'embassy' },
        geometry: {
          type: 'Point',
          coordinates: [props.trail[props.trail.length - 1].lng, props.trail[props.trail.length - 1].lat]
        }
      }
    ]
  }

  const encodedGeoJSON = encodeURIComponent(JSON.stringify(geojson))
  // Using outdoors style with built-in hillshading
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/geojson(${encodedGeoJSON})/auto/400x250@2x?padding=30&access_token=${MAPBOX_TOKEN}`
})

// Responsive trail dimensions - iPhone SE is 375px, Pro Max is 430px
const { width: windowWidth } = useWindowSize()
const isSmallScreen = computed(() => windowWidth.value < 400)
</script>

<template>
  <div class="card hike-card" @click="openHike">
    <template v-if="hasHikeData">
      <b-button class="delete-button" @click.stop="deleteHike">🗑️</b-button>
      <div class="card-image">
        <div
          v-if="backgroundImage"
          class="background-image"
          :style="{ backgroundImage: `url(${backgroundImage})` }"
        >
          <div class="image-overlay"></div>
        </div>

        <div v-else-if="staticMapUrl" class="trail-preview">
          <img :src="staticMapUrl" alt="Trail map" class="static-map-image" loading="lazy" />
          <div class="image-overlay"></div>
        </div>

        <div v-else class="no-image-placeholder">
          <div class="image-overlay"></div>
        </div>
      </div>

      <div class="card-content" :class="{ 'card-content-with-trail': showTrailInContent }">
        <p class="title is-5">{{ name || '--' }}</p>
        <p class="subtitle is-5">{{ formattedDatetime }}</p>

        <div v-if="showTrailInContent && hasTrailData" class="compact-trail-container" :class="{ 'compact-trail-small': isSmallScreen }">
          <TrailLine
            :points="trail"
            :width="isSmallScreen ? 100 : 160"
            :height="isSmallScreen ? 70 : 100"
            :padding="isSmallScreen ? 6 : 10"
            :stroke-width="2"
            :marker-radius="isSmallScreen ? 2 : 3"
          />
        </div>

        <div v-if="showTrailInContent" style="flex: 1;"></div>

        <div class="columns is-mobile info-container">
          <div class="column has-text-centered">
            <p class="heading">Distance</p>
            <p class="title is-6">{{ formattedDistance }}</p>
          </div>
          <div class="column has-text-centered">
            <p class="heading">Duration</p>
            <p class="title is-6">{{ formattedDuration }}</p>
          </div>
        </div>
      </div>
    </template>
    <div v-else-if="!isLoading" class="card-content card-content-empty card-content-with-trail">
      <div style="flex: 1;"></div>
      <p class="title is-5">No Previous Hikes</p>
      <div style="flex: 1;"></div>
    </div>
    <div v-else class="card-content card-content-with-trail">
      <!-- Loading state - empty div to maintain card size -->
    </div>
  </div>
</template>

<style scoped>
.hike-card {
  cursor: pointer;
  overflow: hidden;
  border: 2px solid var(--bulma-border);
  border-radius: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px var(--bulma-text-50);
}

.card-image {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.background-image,
.no-image-placeholder,
.trail-preview {
  height: 200px; /* Fixed height for map rendering */
  background-color: var(--bulma-text-70);
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.trail-preview {
  background-color: var(--bulma-text-70); /* Fallback while image loads */
}

.static-map-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
  z-index: 2;
}

.card-content {
  padding: 1rem;
  background-color: var(--bulma-background);
  position: relative;
}

.card-content-with-trail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-content-empty {
  align-items: center;
  justify-content: center;
}

.info-container {
  gap: 0.75rem;
}

.compact-trail-container {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  width: 160px;
  height: 100px;
  pointer-events: none;
}

.compact-trail-small {
  width: 100px;
  height: 70px;
}

.heading {
  font-size: 0.6875rem;
  text-transform: uppercase;
  color: var(--bulma-text-40-bold);
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  color: var(--bulma-text-70-bold);
}

.title.is-5,
.subtitle.is-5 {
  font-size: 1.1rem;
  margin-bottom: 1 !important;
}

.subtitle.is-5 {
  color: var(--bulma-text-40-bold);
  font-weight: normal;
}

/* Desktop sized view */
@media (min-width: 1024px) {
  .card-image {
    height: 250px;
  }

  .background-image,
  .no-image-placeholder,
  .trail-preview {
    height: 250px;
  }

  .heading {
    font-size: 0.8125rem;
  }

  .title.is-6 {
    font-size: 0.9375rem;
  }
}

.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

/* Mobile responsive for compact trail */
@media (max-width: 768px) {
  .card-content-with-trail .title.is-5,
  .card-content-with-trail .subtitle.is-5 {
    padding-right: 110px;
  }
}
</style>
