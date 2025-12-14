<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  trail: {
    type: Array,
    default: () => [],
  },
  duration: {
    type: Number,
    default: 0,
  },
  distanceKm: {
    type: String,
    default: '0.00',
  },
  elevationGain: {
    type: Number,
    default: 0,
  },
  photos: {
    type: Array,
    default: () => [],
  },
  startedAt: {
    type: Date,
    default: null,
  },
  currentLocation: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'resume'])

// Generate default hike name based on time of day
function getDefaultHikeName(date) {
  const hour = date ? date.getHours() : new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return 'Morning Hike'
  } else if (hour >= 12 && hour < 17) {
    return 'Afternoon Hike'
  } else if (hour >= 17 && hour < 21) {
    return 'Evening Hike'
  } else {
    return 'Night Hike'
  }
}

const hikeName = ref(getDefaultHikeName(props.startedAt))

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const mapContainer = ref(null)
let map = null

// Convert trail points to GeoJSON LineString
const trailGeoJSON = computed(() => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: props.trail.length >= 2 ? props.trail.map((p) => [p.lng, p.lat]) : [],
  },
}))

// Reset to default name and initialize map when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      hikeName.value = getDefaultHikeName(props.startedAt)
      // Delay to ensure DOM is ready and modal is fully rendered
      setTimeout(() => {
        initMap()
      }, 300)
    } else {
      if (map) {
        cleanupMap()
      }
    }
  },
)

function initMap() {
  if (!mapContainer.value || map) return

  mapboxgl.accessToken =
    'pk.eyJ1IjoidG9tbGkxMDQiLCJhIjoiY21qNTZraGJ0MDE1cTNncHp2cWYwd3V0OSJ9.4iVmOOYYfvYHnsyMXouYqw'

  // Use bounds if we have trail data, otherwise use default center/zoom
  const mapOptions = {
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/outdoors-v12',
  }

  if (props.trail.length >= 2) {
    // Calculate bounds to fit entire trail
    const bounds = new mapboxgl.LngLatBounds()
    props.trail.forEach((p) => bounds.extend([p.lng, p.lat]))
    mapOptions.bounds = bounds
    mapOptions.fitBoundsOptions = {
      padding: 40,
    }
  } else {
    // Use first trail point, or current location, or a default
    let center = [-122.4194, 37.7749] // Default to SF
    let zoom = 10

    if (props.trail.length > 0) {
      center = [props.trail[0].lng, props.trail[0].lat]
      zoom = 15
    } else if (props.currentLocation && props.currentLocation.latitude && props.currentLocation.longitude) {
      center = [props.currentLocation.longitude, props.currentLocation.latitude]
      zoom = 15
    }

    mapOptions.center = center
    mapOptions.zoom = zoom
  }

  map = new mapboxgl.Map(mapOptions)

  map.on('load', () => {
    // Only add trail if we have at least 2 points
    if (props.trail.length >= 2) {
      // Add trail source
      map.addSource('trail', {
        type: 'geojson',
        data: trailGeoJSON.value,
      })

      // Add trail line layer
      map.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff7300', // Trail color - kept as hex for Mapbox GL
          'line-width': 4,
        },
      })
    }

    // Add start point (green dot)
    if (props.trail.length > 0) {
      map.addSource('start-point', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [props.trail[0].lng, props.trail[0].lat],
          },
        },
      })

      map.addLayer({
        id: 'start-point',
        type: 'circle',
        source: 'start-point',
        paint: {
          'circle-radius': 8,
          'circle-color': '#00ff00', // Start point - kept as hex for Mapbox GL
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000', // Keep as hex for Mapbox GL
        },
      })
    }

    // Add end point (red dot)
    if (props.trail.length > 1) {
      const lastPoint = props.trail[props.trail.length - 1]
      map.addSource('end-point', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lastPoint.lng, lastPoint.lat],
          },
        },
      })

      map.addLayer({
        id: 'end-point',
        type: 'circle',
        source: 'end-point',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff0000', // End point - kept as hex for Mapbox GL
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000',
        },
      })
    }

    // Trigger resize to ensure map renders properly in modal
    setTimeout(() => {
      if (map) {
        map.resize()
      }
    }, 100)
  })

  // Handle map errors
  map.on('error', (e) => {
    console.error('Mapbox error:', e)
  })
}

function cleanupMap() {
  if (map) {
    map.remove()
    map = null
  }
}

onBeforeUnmount(() => {
  cleanupMap()
})

const formattedTime = computed(() => {
  const s = Math.max(0, Math.floor(props.duration))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

function saveHike() {
  const name = hikeName.value.trim() || getDefaultHikeName(props.startedAt)
  emit('save', name)
}

function resume() {
  isOpen.value = false
  emit('resume')
}
</script>

<template>
  <b-modal v-model="isOpen" :can-cancel="['escape']" has-modal-card>
    <div class="modal-card summary-modal">
      <header class="modal-card-head custom-header">
        <b-button type="is-ghost" size="is-small" @click="resume" class="resume-btn">
          Resume
        </b-button>
        <p class="modal-card-title centered-title">Save Hike</p>
        <div class="header-spacer"></div>
      </header>

      <section class="modal-card-body">
        <!-- Trail map preview -->
        <div class="trail-container">
          <div ref="mapContainer" class="trail-map"></div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Duration</span>
            <span class="stat-value">{{ formattedTime }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Distance</span>
            <span class="stat-value">{{ distanceKm }} km</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Elevation Gain</span>
            <span class="stat-value">{{ elevationGain }} m</span>
          </div>
        </div>

        <!-- Photos -->
        <div v-if="photos.length > 0" class="photos-section">
          <p class="photos-label">Photos ({{ photos.length }})</p>
          <div class="photos-grid">
            <img
              v-for="photo in photos"
              :key="photo.id"
              :src="photo.downloadURL"
              alt="Hike photo"
              class="photo-thumb"
            />
          </div>
        </div>

        <!-- Hike name input -->
        <b-field label="Hike name" class="name-field">
          <b-input
            v-model="hikeName"
            placeholder="Enter a custom name"
            size="is-small"
            class="name-input-small"
          />
        </b-field>
      </section>

      <footer class="modal-card-foot">
        <b-button type="is-success" size="is-medium" @click="saveHike" expanded class="save-hike-btn">
          Save Hike
        </b-button>
      </footer>
    </div>
  </b-modal>
</template>

<style scoped>
.summary-modal {
  max-width: 400px;
  margin: 0 auto;
}

.custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.resume-btn {
  min-width: 80px;
  justify-content: flex-start;
  text-decoration: none !important;
  color: var(--bulma-text) !important;
  font-weight: normal !important;
}

.centered-title {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  flex: 1;
  margin: 0;
}

.header-spacer {
  min-width: 80px;
}

.trail-container {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: var(--bulma-background);
}

.trail-map {
  width: 100%;
  height: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  background: var(--bulma-background);
  border-radius: 8px;
  padding: 12px 8px;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--bulma-text-weak);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--bulma-text);
}

.photos-section {
  margin-bottom: 16px;
}

.photos-label {
  font-size: 0.875rem;
  color: var(--bulma-text-weak);
  margin-bottom: 8px;
}

.photos-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.photo-thumb {
  width: 60px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.name-field {
  margin-bottom: 0;
}

.name-input-small :deep(input::placeholder) {
  font-size: 0.875rem;
}

.name-input-small :deep(input) {
  font-size: 0.875rem;
}

.modal-card-foot {
  justify-content: center;
  padding: 12px 20px;
}

.save-hike-btn {
  border-radius: 9999px !important; /* Fully rounded */
}

.save-hike-btn :deep(span) {
  font-size: 1rem; /* Same size as title */
}
</style>
