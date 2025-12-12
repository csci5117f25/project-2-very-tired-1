<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import TakePictureModal from '@/components/TakePictureModal.vue'
import { useGeolocation } from '@vueuse/core'
import TrailLine from '@/components/TrailLine.vue'
import { db, storage } from '@/firebase_conf'
import { ref as storageRef, deleteObject, increment } from 'firebase/storage'
import { useAuth } from '@/composables/useAuth'
import { getInProgressHike } from '@/composables/getInProgressHike'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'

const { user } = useAuth()
const uid = computed(() => user.value?.uid)

// Kalman filter for GPS smoothing - reduces jitter and zigzag patterns
class KalmanFilter {
  constructor(processNoise = 0.00001, measurementNoise = 0.00005) {
    this.Q = processNoise // How much we expect position to change naturally
    this.R = measurementNoise // GPS measurement noise (tuned for lat/lng scale)
    this.P = 1 // Initial estimation error
    this.X = null // Current best estimate
  }

  update(measurement, accuracy = null) {
    // Adjust measurement noise based on reported GPS accuracy
    const R = accuracy ? this.R * (accuracy / 5) : this.R

    if (this.X === null) {
      this.X = measurement
      return measurement
    }

    // Prediction step - increase uncertainty
    this.P = this.P + this.Q

    // Update step - blend prediction with measurement
    const K = this.P / (this.P + R) // Kalman gain
    this.X = this.X + K * (measurement - this.X)
    this.P = (1 - K) * this.P

    return this.X
  }

  reset() {
    this.X = null
    this.P = 1
  }
}

// Separate filter for each dimension
const latFilter = new KalmanFilter()
const lngFilter = new KalmanFilter()

const trail = ref([])
const elapsed = ref(0) // seconds
const timerId = ref(null)
const hikeId = ref(null)
const distanceMeters = ref(0)
const elevationGainMeters = ref(0)
const hikeName = ref('')
const router = useRouter()
const showTakePicture = ref(false)
const photos = ref([])
const currPhotoIndex = ref(0)

async function loadPhotos() {
  const q = query(
    collection(db, 'users', uid.value, 'hikes', hikeId.value, 'photos'),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  photos.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

async function deletePhoto(photo) {
  if (confirm('Delete this photo?')) {
    await deleteDoc(doc(db, 'users', uid.value, 'hikes', hikeId.value, 'photos', photo.id))
    const imageRef = storageRef(storage, photo.storagePath)
    await deleteObject(imageRef)
    photos.value = photos.value.filter((p) => p.id !== photo.id)
  }
}

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

async function cancelHike() {
  if (confirm('Are you sure you want to cancel this hike? It will be deleted.')) {
    stopTimer()
    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    await deleteDoc(hikeRef)
    router.push('/')
  }
}

async function finishHike() {
  stopTimer()
  try {
    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    const userRef = doc(db, 'users', uid.value)

    await updateDoc(hikeRef, {
      finishedAt: serverTimestamp(),
      durationSec: elapsed.value,
      trail: trail.value,
      status: 'completed',
      name: hikeName.value,
      distanceMeters: distanceMeters.value,
      elevationGainMeters: elevationGainMeters.value,
    })

    await updateDoc(userRef, {
      totalDistance: increment(distanceMeters.value),
      totalElevation: increment(elevationGainMeters.value),
      totalHikes: increment(1),
      updatedAt: serverTimestamp(),
    })
    router.push('/')
  } catch (e) {
    console.error('Failed to update hike on finish:', e)
  }
}

onMounted(async () => {
  const existingHike = await getInProgressHike(uid.value)

  if (existingHike) {
    hikeId.value = existingHike.id
    trail.value = existingHike.trail || []
    elapsed.value = existingHike.durationSec || 0
    distanceMeters.value = existingHike.distanceMeters || 0
    elevationGainMeters.value = existingHike.elevationGainMeters || 0
    hikeName.value = existingHike.name || ''
    console.log('Loaded in-progress hike:', hikeId.value)

    // Prime Kalman filters with last known position for smooth continuation
    if (trail.value.length > 0) {
      const lastPoint = trail.value[trail.value.length - 1]
      latFilter.update(lastPoint.lat)
      lngFilter.update(lastPoint.lng)
    }
    if (existingHike.lastUpdatedAt) {
      const now = new Date()
      const lastUpdated = existingHike.lastUpdatedAt.toDate()
      const diffSeconds = Math.floor((now - lastUpdated) / 1000)
      elapsed.value += diffSeconds
    }
  } else {
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
        lastUpdatedAt: serverTimestamp(),
        photoCount: 0,
      })
      hikeId.value = docRef.id
      console.log('Created new hike for user', uid.value, ':', hikeId.value)
    } catch (e) {
      console.error('Failed to create hike:', e)
    }
  }

  loadPhotos()
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})

// Use GPS hardware for high accuracy (5-15m) instead of WiFi/cell towers (30-100m+)
const { coords } = useGeolocation({
  enableHighAccuracy: true, // Forces GPS hardware usage
  maximumAge: 0, // Always get fresh position, no caching
  timeout: 30000, // Allow up to 30s for GPS lock
})

// Accuracy thresholds in meters - reject readings above these
const ACCURACY_THRESHOLD = 20 // Horizontal (lat/lng)
const ALTITUDE_ACCURACY_THRESHOLD = 30 // Vertical (elevation) - GPS altitude is less precise

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

    // Filter out low-accuracy readings (WiFi/cell tower triangulation)
    if (typeof c.accuracy === 'number' && c.accuracy > ACCURACY_THRESHOLD) {
      console.log(
        `Skipping low-accuracy reading: ${c.accuracy}m (threshold: ${ACCURACY_THRESHOLD}m)`,
      )
      return
    }

    // Apply Kalman filter to smooth GPS coordinates
    const smoothedLat = latFilter.update(c.latitude, c.accuracy)
    const smoothedLng = lngFilter.update(c.longitude, c.accuracy)

    // Avoid pushing duplicate consecutive points (0.00005 is around 5 meters)
    const last = trail.value[trail.value.length - 1]
    if (
      last &&
      Math.abs(last.lat - smoothedLat) < 0.00005 &&
      Math.abs(last.lng - smoothedLng) < 0.00005
    ) {
      return
    }

    trail.value.push({
      lat: smoothedLat,
      lng: smoothedLng,
      alt: typeof c.altitude === 'number' ? c.altitude : null,
    })

    if (!hikeId.value) return

    // Update accumulated distance when a new point is added
    const prev = trail.value[trail.value.length - 2]
    if (prev) {
      const added = computeDistanceMeters(prev.lat, prev.lng, smoothedLat, smoothedLng)
      distanceMeters.value += added
    }

    // Update elevation gain when a new point is added (only if altitude accuracy is good)
    const hasGoodAltitudeAccuracy =
      typeof c.altitudeAccuracy === 'number' && c.altitudeAccuracy <= ALTITUDE_ACCURACY_THRESHOLD
    if (
      prev &&
      typeof prev.alt === 'number' &&
      typeof c.altitude === 'number' &&
      hasGoodAltitudeAccuracy
    ) {
      const deltaAlt = c.altitude - prev.alt
      if (deltaAlt > 0) {
        elevationGainMeters.value += deltaAlt
      }
    }

    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    updateDoc(hikeRef, {
      trail: trail.value,
      durationSec: elapsed.value,
      distanceMeters: distanceMeters.value,
      elevationGainMeters: elevationGainMeters.value,
      lastUpdatedAt: serverTimestamp(),
    }).catch((err) => console.warn('Failed updating trail:', err))
  },
  { immediate: true },
)

watch(hikeName, (v) => {
  const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
  updateDoc(hikeRef, { name: v })
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

      <b-field label="Hike Name (required)">
        <b-input v-model="hikeName" placeholder="Enter a name for this hike" required />
      </b-field>

      <div class="field is-grouped is-grouped-centered action-buttons">
        <b-button type="is-success" @click="finishHike" :disabled="!hikeName.trim()"
          >Finish</b-button
        >
        <b-button type="is-primary" @click="showTakePicture = true">Take Picture</b-button>
        <b-button type="is-danger" @click="cancelHike">Cancel</b-button>
      </div>

      <div v-if="photos.length > 0" class="photos-section">
        <b-carousel-list v-model="currPhotoIndex" :data="photos">
          <template #item="photo">
            <div class="photo-item">
              <img :src="photo.downloadURL" alt="Hike photo" class="photo-img" />
              <button class="delete is-small delete-btn" @click.stop="deletePhoto(photo)"></button>
            </div>
          </template>
        </b-carousel-list>
      </div>
    </section>
    <TakePictureModal v-model="showTakePicture" :hikeId="hikeId" @photo-added="loadPhotos" />
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
.photo-item {
  position: relative;
  padding: 0 5px;
}
.photo-img {
  aspect-ratio: 9 / 16;
  object-fit: cover;
  border-radius: 4px;
  width: 100%;
}
.delete-btn {
  position: absolute;
  top: 5px;
  right: 10px;
  background-color: rgba(255, 0, 0, 0.7);
}
.delete-btn:hover {
  background-color: rgba(255, 0, 0, 1);
}
</style>
