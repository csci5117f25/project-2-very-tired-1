<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeolocation } from '@vueuse/core'
import TrailLine from '@/components/TrailLine.vue'
import { db } from '@/firebase_conf'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

const uid = ref('test')

const trail = ref([])
const elapsed = ref(0) // seconds
const timerId = ref(null)
const hikeId = ref(null)
const distanceMeters = ref(0)
const elevationGainMeters = ref(0)
const hikeName = ref('')
const caption = ref('')
const router = useRouter()

const formattedTime = computed(() => {
  const s = Math.max(0, Math.floor(elapsed.value))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

const distanceKm = computed(() => (distanceMeters.value / 1000).toFixed(2))

const elevationGainRounded = computed(() => Math.round(elevationGainMeters.value))

function startTimer() {
  timerId.value = setInterval(() => {
    elapsed.value += 1
  }, 1000)
}

function stopTimer() {
  clearInterval(timerId.value)
}

// https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
function computeDistanceMeters(lat1, lon1, lat2, lon2) {
  var R = 6378.137
  var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180
  var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = R * c
  return d * 1000
}

async function stopHike() {
  stopTimer()
  try {
    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    await updateDoc(hikeRef, {
      finishedAt: serverTimestamp(),
      durationSec: elapsed.value,
      trail: trail.value,
      status: 'completed',
      name: hikeName.value,
      caption: caption.value,
      distanceMeters: distanceMeters.value,
      elevationGainMeters: elevationGainMeters.value,
    })
    router.push('/')
  } catch (e) {
    console.error('Failed to update hike on stop:', e)
  }
}

function takePicture() {
  console.log('Take picture pressed (not implemented)')
}

onMounted(async () => {
  startTimer()

  // Create new hike in database
  try {
    const col = collection(db, 'users', uid.value, 'hikes')
    const docRef = await addDoc(col, {
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      status: 'in_progress',
      durationSec: 0,
      distanceMeters: 0,
      elevationGainMeters: 0,
      trail: [],
      name: hikeName.value,
      caption: caption.value,
    })
    hikeId.value = docRef.id
    console.log('Created new hike for user', uid.value, ':', hikeId.value)
  } catch (e) {
    console.error('Failed to create hike:', e)
  }
})

onBeforeUnmount(() => {
  stopTimer()
})

const { coords } = useGeolocation()

watch(
  coords,
  (c) => {
    if (
      !c ||
      typeof c.latitude !== 'number' ||
      typeof c.longitude !== 'number' ||
      c.latitude == Infinity ||
      c.longitude == Infinity
    ) {
      return
    }

    // avoid pushing duplicate consecutive points (0.00005 is around 5 meters)
    const last = trail.value[trail.value.length - 1]
    if (
      last &&
      Math.abs(last.lat - c.latitude) < 0.00005 &&
      Math.abs(last.lng - c.longitude) < 0.00005
    ) {
      return
    }

    trail.value.push({
      lat: c.latitude,
      lng: c.longitude,
      alt: typeof c.altitude === 'number' ? c.altitude : null,
    })

    if (!hikeId.value) return

    // Update accumulated distance when a new point is added
    const prev = trail.value[trail.value.length - 2]
    if (prev) {
      const added = computeDistanceMeters(prev.lat, prev.lng, c.latitude, c.longitude)
      distanceMeters.value += added
    }

    // Update elevation gain when a new point is added
    if (prev && typeof prev.alt === 'number' && typeof c.altitude === 'number') {
      const deltaAlt = c.altitude - prev.alt
      if (deltaAlt > 0) elevationGainMeters.value += deltaAlt
    }

    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    updateDoc(hikeRef, {
      trail: trail.value,
      durationSec: elapsed.value,
      distanceMeters: distanceMeters.value,
      elevationGainMeters: elevationGainMeters.value,
    }).catch((err) => console.warn('Failed updating trail:', err))
  },
  { immediate: true },
)

watch(hikeName, (v) => {
  if (!hikeId.value) return
  const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
  updateDoc(hikeRef, { name: v }).catch((err) => console.warn('Failed updating hike name:', err))
})

watch(caption, (v) => {
  if (!hikeId.value) return
  const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
  updateDoc(hikeRef, { caption: v }).catch((err) =>
    console.warn('Failed updating hike caption:', err),
  )
})
</script>

<template>
  <div class="start-hike">
    <div class="trail-top column has-text-centered">
      <TrailLine :points="trail" class="trail-line" />
    </div>

    <section class="hike-details">
      <div class="field is-grouped is-grouped-multiline is-grouped-centered details-tags">
        <b-tag type="is-primary" size="is-medium">Duration: {{ formattedTime }}</b-tag>
        <b-tag type="is-info" size="is-medium">Distance: {{ distanceKm }} km</b-tag>
        <b-tag type="is-success" size="is-medium"
          >Elevation Gain: {{ elevationGainRounded }} m</b-tag
        >
      </div>

      <b-field label="Hike Name">
        <b-input v-model="hikeName" placeholder="Enter a name for this hike" />
      </b-field>

      <b-field label="Caption">
        <b-input v-model="caption" placeholder="Write a short caption" />
      </b-field>

      <div class="field is-grouped is-grouped-centered action-buttons">
        <b-button type="is-danger" @click="stopHike">Stop Hike</b-button>
        <b-button type="is-primary" @click="takePicture">Take Picture</b-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.trail-top {
  width: 100%;
  height: auto;
  padding: 12px;
}
.trail-line {
  display: inline-block;
  width: 90%;
  max-width: 600px;
}
.hike-details {
  width: 100%;
  display: block;
  padding: 12px;
}
.details-tags {
  margin-bottom: 8px;
}
.action-buttons {
  margin-top: 12px;
}
</style>
