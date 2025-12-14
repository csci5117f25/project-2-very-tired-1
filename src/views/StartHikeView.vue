<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import TakePictureModal from '@/components/TakePictureModal.vue'
import HikeSummaryModal from '@/components/HikeSummaryModal.vue'
import { useGeolocation } from '@vueuse/core'
import TrailLine from '@/components/TrailLine.vue'
import HikeMap from '@/components/HikeMap.vue'
import { db, storage } from '@/firebase_conf'
import { ref as storageRef, deleteObject } from 'firebase/storage'
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
const startedAt = ref(new Date()) // Track when hike started for default name
const timerId = ref(null)
const hikeId = ref(null)
const distanceMeters = ref(0)
const elevationGainMeters = ref(0)
const isPaused = ref(false)
const hasGpsLock = ref(false) // Track if we have acquired GPS lock
const showGpsLockMessage = ref(false) // Show "GPS Lock" message briefly when acquired
const router = useRouter()
const showTakePicture = ref(false)
const showSummary = ref(false)
const photos = ref([])
const currPhotoIndex = ref(0)
const isImageModalActive = ref(false)
const selectedImage = ref('')
const showPhotoCarousel = ref(false)

function openImageModal(url) {
  selectedImage.value = url
  isImageModalActive.value = true
}

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

async function togglePause() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    stopTimer()
    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    await updateDoc(hikeRef, {
      status: 'paused',
      lastUpdatedAt: serverTimestamp(),
      durationSec: elapsed.value,
    })
  } else {
    startTimer()
    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    await updateDoc(hikeRef, {
      status: 'in_progress',
      lastUpdatedAt: serverTimestamp(),
    })
  }
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

function finishHike() {
  stopTimer()
  showSummary.value = true
}

function resumeHike() {
  startTimer()
}

async function saveHike(name) {
  try {
    const hikeRef = doc(db, 'users', uid.value, 'hikes', hikeId.value)
    await updateDoc(hikeRef, {
      finishedAt: serverTimestamp(),
      durationSec: elapsed.value,
      trail: trail.value,
      status: 'completed',
      name: name,
      distanceMeters: distanceMeters.value,
      elevationGainMeters: elevationGainMeters.value,
    })
    router.push('/')
  } catch (e) {
    console.error('Failed to update hike on finish:', e)
    // Resume timer if save failed
    startTimer()
    showSummary.value = false
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
    startedAt.value = existingHike.startedAt?.toDate() || new Date()

    // If we have an existing trail, we already have GPS lock
    if (trail.value.length > 0) {
      hasGpsLock.value = true
      // Prime Kalman filters with last known position for smooth continuation
      const lastPoint = trail.value[trail.value.length - 1]
      latFilter.update(lastPoint.lat)
      lngFilter.update(lastPoint.lng)
    }

    if (existingHike.status === 'paused') {
      isPaused.value = true
    } else if (existingHike.lastUpdatedAt) {
      const now = new Date()
      const lastUpdated = existingHike.lastUpdatedAt.toDate()
      const diffSeconds = Math.floor((now - lastUpdated) / 1000)
      elapsed.value += diffSeconds
      startTimer()
    } else {
      startTimer()
    }
  } else {
    // Create new hike in database
    const col = collection(db, 'users', uid.value, 'hikes')
    const docRef = await addDoc(col, {
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      status: 'in_progress',
      durationSec: 0,
      distanceMeters: 0,
      elevationGainMeters: 0,
      trail: [],
      name: '',
      lastUpdatedAt: serverTimestamp(),
    })
    hikeId.value = docRef.id
    startTimer()
  }

  loadPhotos()
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
    if (isPaused.value) {
      return
    }
    if (
      !c ||
      typeof c.latitude !== 'number' ||
      typeof c.longitude !== 'number' ||
      c.latitude == Infinity ||
      c.longitude == Infinity
    ) {
      return
    }

    // Filter out obviously invalid coordinates (0,0 or near 0,0 which indicates no GPS lock)
    if (Math.abs(c.latitude) < 0.001 && Math.abs(c.longitude) < 0.001) {
      return
    }

    // Check if we have a good accuracy reading to acquire GPS lock
    // If accuracy is undefined, we'll accept it (some devices don't provide accuracy)
    const hasGoodAccuracy =
      typeof c.accuracy !== 'number' || c.accuracy <= ACCURACY_THRESHOLD

    // Mark that we have acquired GPS lock once we get a good reading
    if (!hasGpsLock.value) {
      if (hasGoodAccuracy) {
        hasGpsLock.value = true
        showGpsLockMessage.value = true

        // Hide the "GPS Lock" message after 3 seconds
        setTimeout(() => {
          showGpsLockMessage.value = false
        }, 3000)
      } else {
        return
      }
    }

    // Filter out low-accuracy readings (WiFi/cell tower triangulation) - but only after we have GPS lock
    if (typeof c.accuracy === 'number' && c.accuracy > ACCURACY_THRESHOLD) {
      return
    }

    // Apply Kalman filter to smooth GPS coordinates
    const smoothedLat = latFilter.update(c.latitude, c.accuracy)
    const smoothedLng = lngFilter.update(c.longitude, c.accuracy)

    // Don't record until we have GPS lock
    if (!hasGpsLock.value) {
      return
    }

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

</script>

<template>
  <div class="start-hike">
    <!-- Fullscreen map as background -->
                    <HikeMap :trail="trail" :currentLocation="coords" :hideRecenter="showPhotoCarousel && photos.length > 0" class="fullscreen-map" />

    <!-- Overlay controls -->
    <div class="map-overlay">
      <!-- Top section: trail preview -->
      <div class="top-section">
        <div v-if="trail.length > 0" class="trail-preview">
          <TrailLine :points="trail" :width="150" :height="150" :padding="10" :strokeWidth="3" :markerRadius="4" />
        </div>
      </div>

      <!-- Bottom controls -->
      <div class="bottom-controls">
        <!-- Metrics bar -->
        <div class="metrics-bar horizontal" :class="{ paused: isPaused, 'gps-locked': showGpsLockMessage }">
          <div v-if="isPaused" class="paused-banner">Paused</div>
          <div v-else-if="showGpsLockMessage" class="gps-banner locked">GPS Lock</div>
          <div class="metric-item">
            <div class="metric-value">{{ formattedTime }}</div>
            <div class="metric-label">Time</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">{{ distanceKm }} km</div>
            <div class="metric-label">Distance</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">{{ elevationGainRounded }} m</div>
            <div class="metric-label">Elevation</div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="action-buttons">
          <b-button
            type="is-success"
            size="is-large"
            @click="finishHike"
            icon-left="flag-checkered"
          ></b-button>
          <b-button
            type="is-warning"
            size="is-large"
            @click="togglePause"
            :icon-left="isPaused ? 'play' : 'pause'"
          ></b-button>
          <b-button
            type="is-primary"
            size="is-large"
            @click="showTakePicture = true"
            icon-left="camera"
          ></b-button>
          <b-button
            v-if="photos.length > 0"
            type="is-info"
            size="is-large"
            @click="showPhotoCarousel = !showPhotoCarousel"
            icon-left="image"
          ></b-button>
          <b-button
            type="is-danger"
            size="is-large"
            @click="cancelHike"
            icon-left="trash-can"
          ></b-button>
        </div>

        <!-- Photos carousel -->
        <div v-if="showPhotoCarousel && photos.length > 0" class="photos-section">
          <b-carousel-list v-model="currPhotoIndex" :data="photos" :items-to-show="4.2">
            <template #item="photo">
              <div class="photo-item">
                <img
                  :src="photo.downloadURL"
                  alt="Hike photo"
                  class="photo-img"
                  @click="openImageModal(photo.downloadURL)"
                />
                <button class="delete is-small delete-btn" @click="deletePhoto(photo)"></button>
              </div>
            </template>
          </b-carousel-list>
        </div>
      </div>
    </div>

    <b-modal v-model="isImageModalActive">
      <div class="is-flex is-justify-content-center is-align-items-center" style="height: 100%">
        <img class="photo-img-modal" :src="selectedImage" />
      </div>
    </b-modal>

    <TakePictureModal v-model="showTakePicture" :hikeId="hikeId" @photo-added="loadPhotos" />

    <HikeSummaryModal
      v-model="showSummary"
      :trail="trail"
      :duration="elapsed"
      :distanceKm="distanceKm"
      :elevationGain="elevationGainRounded"
      :photos="photos"
      :startedAt="startedAt"
      :currentLocation="coords"
      @save="saveHike"
      @resume="resumeHike"
    />
  </div>
</template>

<style scoped>
.start-hike {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.fullscreen-map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
}


.bottom-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
}

.top-section {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.trail-preview {
  background: color-mix(in srgb, var(--bulma-white) 95%, transparent);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px var(--bulma-text-50);
  pointer-events: auto;
  width: 120px;
  height: 120px;
  position: relative;
}

.metrics-bar {
  background: color-mix(in srgb, var(--bulma-white) 95%, transparent);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px var(--bulma-text-50);
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 16px;
  position: relative;
}

.paused-banner,
.gps-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 8px 8px 0 0;
}

.paused-banner {
  background: var(--bulma-warning);
  color: var(--bulma-text-strong);
}

.gps-banner.locked {
  background: var(--bulma-success);
  color: var(--bulma-white);
}

.metrics-bar.paused,
.metrics-bar.gps-locked {
  padding-top: 42px; /* Add space for the banner */
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.metrics-bar.horizontal .metric-item {
  align-items: center;
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--bulma-text);
  line-height: 1.2;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--bulma-text-weak);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-buttons .button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.photos-section {
  background: color-mix(in srgb, var(--bulma-white) 95%, transparent);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px var(--bulma-text-50);
}

.photo-item {
  position: relative;
  padding: 0 5px;
}

.photo-img-modal {
  height: 75vh;
  aspect-ratio: 9 / 16;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}

.photo-img {
  aspect-ratio: 9 / 16;
  object-fit: cover;
  border-radius: 4px;
  width: 100%;
  cursor: pointer;
}

.delete-btn {
  position: absolute;
  top: 5px;
  right: 10px;
  background-color: color-mix(in srgb, var(--bulma-danger) 70%, transparent);
}

.delete-btn:hover {
  background-color: var(--bulma-danger);
}
</style>
