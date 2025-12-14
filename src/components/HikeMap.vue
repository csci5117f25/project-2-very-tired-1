<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps({
  trail: {
    type: Array,
    default: () => [],
  },
  currentLocation: {
    type: Object,
    default: null,
  },
})

const mapContainer = ref(null)
const mapLoaded = ref(false)
const isFollowing = ref(true) // Track if we're auto-following user location
let map = null
let userMarker = null

// Convert trail points to GeoJSON LineString (needs at least 2 points to be valid)
const trailGeoJSON = computed(() => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: props.trail.length >= 2 ? props.trail.map((p) => [p.lng, p.lat]) : [],
  },
}))

// Get current location as [lng, lat] for Mapbox
const currentCoords = computed(() => {
  if (!props.currentLocation) return null
  const { latitude, longitude } = props.currentLocation
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    latitude === Infinity ||
    longitude === Infinity
  ) {
    return null
  }
  return [longitude, latitude]
})

onMounted(() => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidG9tbGkxMDQiLCJhIjoiY21qNTZraGJ0MDE1cTNncHp2cWYwd3V0OSJ9.4iVmOOYYfvYHnsyMXouYqw'

  // Determine initial center - use current location or default
  const initialCenter = currentCoords.value || [-122.4194, 37.7749] // Default to SF
  const initialZoom = currentCoords.value ? 15 : 10

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: initialCenter,
    zoom: initialZoom,
  })

  map.on('load', () => {
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
        'line-width': 5,
      },
    })

    // Add start point source (green dot)
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

    // Add end point source (red dot) if we have 2+ points
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
          'circle-stroke-color': '#000000', // Keep as hex for Mapbox GL
        },
      })
    }

    mapLoaded.value = true
  })

  // Disable auto-follow when user interacts with map
  map.on('dragstart', () => {
    isFollowing.value = false
  })

  // Create user location marker
  if (currentCoords.value) {
    createUserMarker(currentCoords.value)
  }
})

function createUserMarker(coords) {
  // Create a pulsing dot element
  const el = document.createElement('div')
  el.className = 'user-location-marker'

  userMarker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map)
}

function recenter() {
  if (!map || !currentCoords.value) return
  isFollowing.value = true
  map.flyTo({
    center: currentCoords.value,
    zoom: 16,
    duration: 1000,
  })
}

// Watch for trail updates
watch(
  () => props.trail,
  (newTrail) => {
    if (!map || !mapLoaded.value) return

    const source = map.getSource('trail')
    if (source) {
      source.setData(trailGeoJSON.value)
    }

    // Update start point if we have trail data
    if (newTrail.length > 0) {
      let startSource = map.getSource('start-point')
      if (!startSource) {
        // Create start point source if it doesn't exist
        map.addSource('start-point', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [newTrail[0].lng, newTrail[0].lat],
            },
          },
        })
        map.addLayer({
          id: 'start-point',
          type: 'circle',
          source: 'start-point',
          paint: {
            'circle-radius': 8,
            'circle-color': '#00ff00',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#000000',
          },
        })
      } else {
        startSource.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [newTrail[0].lng, newTrail[0].lat],
          },
        })
      }
    }

    // Update end point if we have 2+ trail points
    if (newTrail.length > 1) {
      const lastPoint = newTrail[newTrail.length - 1]
      let endSource = map.getSource('end-point')
      if (!endSource) {
        // Create end point source if it doesn't exist
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
            'circle-color': '#ff0000',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#000000',
          },
        })
      } else {
        endSource.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lastPoint.lng, lastPoint.lat],
          },
        })
      }
    }
  },
  { deep: true },
)

// Also watch mapLoaded to update trail data once map is ready
watch(mapLoaded, (loaded) => {
  if (loaded && props.trail.length > 0) {
    const source = map.getSource('trail')
    if (source) {
      source.setData(trailGeoJSON.value)
    }

    const startSource = map.getSource('start-point')
    if (startSource) {
      startSource.setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [props.trail[0].lng, props.trail[0].lat],
        },
      })
    }

    // Update end point if we have 2+ points
    if (props.trail.length > 1) {
      const lastPoint = props.trail[props.trail.length - 1]
      const endSource = map.getSource('end-point')
      if (endSource) {
        endSource.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lastPoint.lng, lastPoint.lat],
          },
        })
      }
    }
  }
})

// Watch for location updates and auto-follow
watch(currentCoords, (coords) => {
  if (!coords || !map) return

  // Update user marker position
  if (userMarker) {
    userMarker.setLngLat(coords)
  } else {
    createUserMarker(coords)
  }

  // Auto-center map on user only if following is enabled
  if (isFollowing.value) {
    map.easeTo({
      center: coords,
      duration: 500,
    })
  }
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="hike-map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <div class="recenter-container" :class="{ expanded: !isFollowing }">
      <button class="recenter-btn" @click="recenter" title="Re-center on my location">
        <img src="/hiking-icons/noun-geolocation-5194485(1).svg" alt="Re-center" class="recenter-icon" />
      </button>
      <span class="recenter-label" :class="{ expanded: !isFollowing }" @click="recenter">Re-center</span>
    </div>
  </div>
</template>

<style scoped>
.hike-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}

.recenter-container {
  position: absolute;
  bottom: 200px;
  right: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  z-index: 5;
}

.recenter-btn {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: var(--bulma-white);
  border: none;
  box-shadow: 0 2px 8px var(--bulma-text-50);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: transform 0.2s, box-shadow 0.2s, border-radius 0.3s ease-out;
  position: relative;
  z-index: 1;
}

.recenter-container.expanded .recenter-btn {
  border-radius: 4px 0 0 4px; /* Round left side when label is expanded */
}

.recenter-btn:hover,
.recenter-container:hover .recenter-btn {
  box-shadow: 0 4px 12px var(--bulma-text-50);
}

.recenter-btn:active {
  transform: scale(0.95);
}

.recenter-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.recenter-label {
  display: inline-flex;
  align-items: center;
  background: var(--bulma-white);
  color: var(--bulma-text);
  padding: 0;
  border-radius: 0 4px 4px 0; /* Only round right side */
  font-size: 0.75rem;
  white-space: nowrap;
  cursor: pointer;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-width 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out;
  height: 40px;
  box-shadow: 0 2px 8px var(--bulma-text-50);
  margin-left: -1px; /* Slight overlap to ensure seamless connection */
}

.recenter-label.expanded {
  max-width: 100px;
  opacity: 1;
  padding: 0 8px;
  pointer-events: auto;
}

.recenter-container:hover .recenter-label.expanded {
  box-shadow: 0 4px 12px var(--bulma-text-50);
}
</style>

<style>
/* Global styles for user marker (can't be scoped) */
.user-location-marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--bulma-link);
  border: 3px solid var(--bulma-white);
  box-shadow: 0 0 10px color-mix(in srgb, var(--bulma-link) 50%, transparent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--bulma-link) 70%, transparent);
  }
  70% {
    box-shadow: 0 0 0 15px color-mix(in srgb, var(--bulma-link) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--bulma-link) 0%, transparent);
  }
}
</style>
