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
  hideRecenter: {
    type: Boolean,
    default: false,
  },
  static: {
    type: Boolean,
    default: false,
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

  const initMap = () => {
    if (!mapContainer.value || map) return

    // Determine initial center - use current location or default
    const initialCenter = currentCoords.value || [-122.4194, 37.7749] // Default to SF
    const initialZoom = currentCoords.value ? 15 : 10

    // For static mode (card preview), use bounds fitting
    let mapOptions = {
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/outdoors-v12',
    }

    if (props.static) {
      mapOptions.interactive = false
      mapOptions.attributionControl = false

      // For static mode, fit bounds to trail if we have enough points
      if (props.trail.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds()
        props.trail.forEach((point) => {
          bounds.extend([point.lng, point.lat])
        })
        mapOptions.bounds = bounds
        mapOptions.fitBoundsOptions = {
          padding: 20,
          duration: 0, // Instant for static preview
        }
      } else if (props.trail.length > 0) {
        mapOptions.center = [props.trail[0].lng, props.trail[0].lat]
        mapOptions.zoom = 15
      } else {
        mapOptions.center = initialCenter
        mapOptions.zoom = initialZoom
      }
    } else {
      mapOptions.center = initialCenter
      mapOptions.zoom = initialZoom
    }

    map = new mapboxgl.Map(mapOptions)

    map.on('load', () => {
      mapLoaded.value = true

      // Ensure map renders properly in containers with dynamic sizing
      if (props.static) {
        map.resize()
      }

    // Add trail source if we have trail data
    if (props.trail.length >= 2) {
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
          'line-width': props.static ? 3 : 5,
        },
      })
    }

    // Add start point source (green dot) - only in static mode or if no current location tracking
    if (props.trail.length > 0 && (props.static || !currentCoords.value)) {
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
          'circle-radius': props.static ? 6 : 8,
          'circle-color': '#00ff00', // Start point - kept as hex for Mapbox GL
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff', // White stroke for better visibility
        },
      })
    }

    // Add end point (red dot) - only in static mode
    if (props.static && props.trail.length > 1) {
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
          'circle-radius': 6,
          'circle-color': '#ff0000', // End point - kept as hex for Mapbox GL
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    }
    })

    // Disable auto-follow when user interacts with map (skip in static mode)
    if (!props.static) {
      map.on('dragstart', () => {
        isFollowing.value = false
      })

      // Create user location marker
      if (currentCoords.value) {
        createUserMarker(currentCoords.value)
      }
    }
  }

  if (props.static) {
    // For static mode, use a longer delay to ensure container is fully rendered
    setTimeout(initMap, 300)
  } else {
    initMap()
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

  }
})

// Watch for location updates and auto-follow (skip in static mode)
watch(currentCoords, (coords) => {
  if (!coords || !map || props.static) return

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
  <div class="hike-map-wrapper" :data-static="props.static">
    <div ref="mapContainer" class="map-container"></div>
    <div v-if="!props.hideRecenter" class="recenter-container" :class="{ expanded: !isFollowing }">
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

/* For static mode in cards, ensure proper height */
.hike-map-wrapper[data-static="true"] {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.hike-map-wrapper[data-static="true"] .map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
