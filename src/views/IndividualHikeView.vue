<script setup>
import { useDocument } from 'vuefire'
import { doc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/firebase_conf'
import { useRoute } from 'vue-router'
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import TrailLine from '@/components/TrailLine.vue'
import BackButton from '@/components/BackButton.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()

const { user } = useAuth()
const uid = computed(() => user.value?.uid)

const hikeQuery = computed(() => {
  if (!hikeId.value || !uid.value) return null
  return doc(db, 'users', uid.value, 'hikes', hikeId.value)
})

const hikeId = computed(() => route.params.id)
const hike = useDocument(hikeQuery)
const hikeWithPhotos = ref(null)
const currentCardIndex = ref(0)
const cardsTrack = ref(null)
const viewportHeight = ref('auto')
const isPhotoModalOpen = ref(false)
const selectedPhoto = ref(null)

// Update viewport height when card changes
function updateViewportHeight() {
  if (!cardsTrack.value) return
  const cards = cardsTrack.value.querySelectorAll('.hike-card')
  if (cards[currentCardIndex.value]) {
    viewportHeight.value = cards[currentCardIndex.value].offsetHeight + 'px'
  }
}

// Handle image load to recalculate height
function onImageLoad() {
  nextTick(() => updateViewportHeight())
}

watch(currentCardIndex, () => {
  nextTick(() => updateViewportHeight())
})

watch(hikeWithPhotos, () => {
  nextTick(() => updateViewportHeight())
})

onMounted(() => {
  nextTick(() => updateViewportHeight())
})

watch(
  hike,
  async (newHike) => {
    if (!newHike) {
      hikeWithPhotos.value = null
      return
    }

    if (!uid.value) return

    try {
      const photosSnapshot = await getDocs(
        collection(db, 'users', uid.value, 'hikes', newHike.id, 'photos'),
      )
      const photos = photosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      hikeWithPhotos.value = {
        ...newHike,
        photos: photos,
      }
    } catch (error) {
      console.error(`Error fetching photos for hike ${newHike.id}:`, error)
      hikeWithPhotos.value = {
        ...newHike,
        photos: [],
      }
    }
  },
  { immediate: true },
)

// Photo modal functions
function openPhotoModal(photo) {
  selectedPhoto.value = photo
  isPhotoModalOpen.value = true
}

function closePhotoModal() {
  isPhotoModalOpen.value = false
  selectedPhoto.value = null
}

const totalCards = computed(() => {
  if (!hikeWithPhotos.value) return 1
  return 1 + (hikeWithPhotos.value.photos?.length || 0)
})

const canGoNext = computed(() => currentCardIndex.value < totalCards.value - 1)
const canGoPrev = computed(() => currentCardIndex.value > 0)

function nextCard() {
  if (canGoNext.value) {
    currentCardIndex.value++
  }
}

function prevCard() {
  if (canGoPrev.value) {
    currentCardIndex.value--
  }
}

// Format duration from seconds to readable format
function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Format distance (meters to miles)
function formatDistance(meters) {
  if (!meters) return 'N/A'
  const miles = meters * 0.000621371
  return `${miles.toFixed(1)} mi`
}

// Format elevation (meters to feet)
function formatElevation(meters) {
  if (meters === undefined || meters === null) return 'N/A'
  const feet = meters * 3.28084
  return `${Math.round(feet)} ft`
}

// Format time from Firestore timestamp
function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Format full datetime
function formatDatetime(timestamp) {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
}

// Check if trail data exists
const hasTrailData = computed(() => {
  return hikeWithPhotos.value?.trail && hikeWithPhotos.value.trail.length > 0
})

// Calculate photo marker position on trail
function getPhotoMarkerPosition(location, width, height, padding) {
  if (!location || !hasTrailData.value) {
    return { x: width / 2, y: height / 2 }
  }

  const trail = hikeWithPhotos.value.trail
  const lats = trail.map((p) => p.lat)
  const lngs = trail.map((p) => p.lng)

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

  const photoLat = location.lat
  const photoLng = location.long

  const x = (photoLng - minLng) * scale + padding + extraX
  const y = (maxLat - photoLat) * scale + padding + extraY

  return { x, y }
}

// Sort photos chronologically by timestamp
const sortedPhotos = computed(() => {
  if (!hikeWithPhotos.value?.photos) return []
  return [...hikeWithPhotos.value.photos].sort((a, b) => {
    const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0
    const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0
    return timeA - timeB
  })
})
</script>

<template>
  <div class="page-wrapper">
    <!-- Loading State -->
    <div v-if="!hikeWithPhotos" class="loading-container">
      <b-loading :is-full-page="false" :active="true"></b-loading>
      <p class="has-text-centered">Loading hike...</p>
    </div>

    <!-- Content -->
    <div v-else class="hike-detail-container">
      <!-- Card wrapper -->
      <div class="card-wrapper">
        <!-- Cards viewport -->
        <div class="cards-viewport" :style="{ height: viewportHeight }">
          <div
            ref="cardsTrack"
            class="cards-track"
            :style="{ transform: `translateX(-${currentCardIndex * 100}%)` }"
          >
            <!-- Main Hike Card -->
            <div class="card hike-card">
              <div class="card-image">
                <!-- Navigation arrows overlay -->
                <button
                  class="nav-arrow nav-arrow--left"
                  :class="{ 'is-disabled': !canGoPrev }"
                  @click="prevCard"
                  :disabled="!canGoPrev"
                  v-if="totalCards > 1"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  class="nav-arrow nav-arrow--right"
                  :class="{ 'is-disabled': !canGoNext }"
                  @click="nextCard"
                  :disabled="!canGoNext"
                  v-if="totalCards > 1"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <div v-if="hasTrailData" class="trail-preview">
                  <TrailLine
                    :points="hikeWithPhotos.trail"
                    :width="556"
                    :height="250"
                    :stroke-width="3"
                    :marker-radius="5"
                  />
                </div>
                <div v-else class="no-image-placeholder">
                  <span class="placeholder-text">No trail data</span>
                </div>
              </div>

              <div class="card-content">
                <p class="title is-5">{{ hikeWithPhotos.name || 'Untitled Hike' }}</p>
                <p class="subtitle is-6">{{ formatDatetime(hikeWithPhotos.startedAt) }}</p>

                <!-- Time row -->
                <div class="columns is-mobile info-container">
                  <div class="column has-text-centered">
                    <p class="heading">Start Time</p>
                    <p class="title is-6">{{ formatTime(hikeWithPhotos.startedAt) }}</p>
                  </div>
                  <div class="column has-text-centered">
                    <p class="heading">End Time</p>
                    <p class="title is-6">{{ formatTime(hikeWithPhotos.finishedAt) }}</p>
                  </div>
                </div>

                <!-- Stats rows -->
                <div class="columns is-mobile info-container">
                  <div class="column has-text-centered">
                    <p class="heading">Distance</p>
                    <p class="title is-6">{{ formatDistance(hikeWithPhotos.distanceMeters) }}</p>
                  </div>
                  <div class="column has-text-centered">
                    <p class="heading">Duration</p>
                    <p class="title is-6">{{ formatDuration(hikeWithPhotos.durationSec) }}</p>
                  </div>
                </div>

                <div class="columns is-mobile info-container">
                  <div class="column has-text-centered">
                    <p class="heading">Elevation Gained</p>
                    <p class="title is-6">
                      {{ formatElevation(hikeWithPhotos.elevationGainMeters) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Photo Cards -->
            <div
              v-for="(photo, index) in sortedPhotos"
              :key="photo.id || index"
              class="card hike-card photo-card"
            >
              <div
                class="card-image photo-card-image"
                @click="photo.downloadURL && openPhotoModal(photo)"
              >
                <!-- Navigation arrows overlay -->
                <button
                  class="nav-arrow nav-arrow--left"
                  :class="{ 'is-disabled': !canGoPrev }"
                  @click.stop="prevCard"
                  :disabled="!canGoPrev"
                  v-if="totalCards > 1"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  class="nav-arrow nav-arrow--right"
                  :class="{ 'is-disabled': !canGoNext }"
                  @click.stop="nextCard"
                  :disabled="!canGoNext"
                  v-if="totalCards > 1"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <img
                  v-if="photo.downloadURL"
                  :src="photo.downloadURL"
                  :alt="photo.description || 'Hike photo'"
                  class="card-photo-img"
                  @load="onImageLoad"
                />
                <div v-else class="no-image-placeholder">
                  <b-icon icon="image" size="is-large"></b-icon>
                  <span class="placeholder-text">Image unavailable</span>
                </div>
                <div class="click-hint" v-if="photo.downloadURL">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  <span>Tap to enlarge</span>
                </div>
              </div>

              <div class="card-content photo-card-content">
                <p class="title is-5">Photo {{ index + 1 }}</p>
                <p class="subtitle is-6">{{ formatDatetime(photo.timestamp) }}</p>

                <!-- Trail line with photo location marker -->
                <div v-if="hasTrailData" class="photo-trail-container">
                  <TrailLine
                    :points="hikeWithPhotos.trail"
                    :width="400"
                    :height="150"
                    :stroke-width="3"
                    :marker-radius="4"
                    :padding="25"
                  />
                  <!-- Photo location marker overlay -->
                  <svg
                    v-if="photo.location"
                    class="photo-marker-overlay"
                    :viewBox="`0 0 400 150`"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <circle
                      :cx="getPhotoMarkerPosition(photo.location, 400, 150, 25).x"
                      :cy="getPhotoMarkerPosition(photo.location, 400, 150, 25).y"
                      r="4"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      stroke-width="2"
                    />
                    <circle
                      :cx="getPhotoMarkerPosition(photo.location, 400, 150, 25).x"
                      :cy="getPhotoMarkerPosition(photo.location, 400, 150, 25).y"
                      r="6"
                      fill="none"
                      stroke="#3b82f6"
                      stroke-width="1"
                      opacity="0.5"
                    />
                  </svg>
                </div>
                <div v-else class="no-trail-placeholder">
                  <span>No trail data available</span>
                </div>

                <div v-if="photo.description" class="description-section">
                  <p class="heading">Description</p>
                  <p class="description-text">{{ photo.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination dots -->
        <div class="pagination-dots" v-if="totalCards > 1">
          <button
            v-for="i in totalCards"
            :key="i"
            class="dot"
            :class="{ 'is-active': currentCardIndex === i - 1 }"
            @click="currentCardIndex = i - 1"
          ></button>
        </div>
      </div>

      <!-- Photo Modal -->
      <div v-if="isPhotoModalOpen" class="photo-modal" @click.self="closePhotoModal">
        <div class="photo-modal-content">
          <button class="modal-close-btn" @click="closePhotoModal">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <img
            v-if="selectedPhoto?.downloadURL"
            :src="selectedPhoto.downloadURL"
            :alt="selectedPhoto.description || 'Hike photo'"
            class="modal-image"
          />
        </div>
      </div>
    </div>

    <BackButton />
  </div>
</template>

<style scoped>
.page-wrapper {
  margin: auto;
  min-height: 100vh;
  padding-top: 30px;
  padding-bottom: 90px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.hike-detail-container {
  width: 100%;
  max-width: 500px;
}

/* Card wrapper with navigation */
.card-wrapper {
  position: relative;
  width: 100%;
}

/* Navigation arrows - overlay on image */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-arrow svg {
  width: 20px;
  height: 20px;
  color: var(--bulma-text);
}

.nav-arrow:hover:not(:disabled) {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.nav-arrow--left {
  left: 10px;
}

.nav-arrow--right {
  right: 10px;
}

.nav-arrow.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Cards viewport */
.cards-viewport {
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.cards-track {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  align-items: flex-start;
}

/* Card styling */
.hike-card {
  flex: 0 0 100%;
  overflow: hidden;
  border: 2px solid var(--bulma-border);
  border-radius: 15px;
  background: var(--bulma-background);
  box-shadow: none !important;
}

.hike-card.card {
  box-shadow: none;
}

.card-image {
  min-height: 200px;
  position: relative;
  overflow: hidden;
}

.photo-card-image {
  min-height: 0;
  cursor: pointer;
}

.photo-card-image:hover .click-hint {
  opacity: 1;
}

.card-photo-img {
  width: 100%;
  height: auto;
  display: block;
}

.background-image,
.no-image-placeholder,
.trail-preview {
  min-height: 200px;
  background-color: var(--bulma-text-70);
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.5rem;
}

.placeholder-text {
  color: var(--bulma-text-30);
  font-size: 0.875rem;
}

.card-content {
  padding: 1.25rem;
  background-color: var(--bulma-text-15-soft);
}

.info-container {
  gap: 0.75rem;
  margin-bottom: 0.5rem !important;
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

.title.is-5 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem !important;
}

.title.is-6 {
  font-size: 1rem;
  margin-bottom: 0 !important;
}

.subtitle.is-6 {
  color: var(--bulma-text-40-bold);
  font-weight: normal;
  font-size: 0.9rem;
  margin-bottom: 0.75rem !important;
}

/* Description section */
.description-section {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bulma-border);
}

.description-text {
  color: var(--bulma-text-60);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Photo card content */
.photo-card-content {
  display: flex;
  flex-direction: column;
}

/* Photo trail container with marker overlay */
.photo-trail-container {
  position: relative;
  min-height: 120px;
  background: var(--bulma-text-50);
  border-radius: 8px;
  overflow: hidden;
}

.photo-marker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.no-trail-placeholder {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bulma-text-10);
  border-radius: 8px;
  color: var(--bulma-text-40);
  font-size: 0.875rem;
}

/* Pagination dots */
.pagination-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 1rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bulma-border);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.dot:hover {
  background: var(--bulma-text-40);
}

.dot.is-active {
  background: var(--bulma-primary);
  transform: scale(1.2);
}

/* Clickable image styles */
.click-hint {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
  pointer-events: none;
}

.click-hint svg {
  width: 14px;
  height: 14px;
}

/* Photo Modal */
.photo-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.photo-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 101;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-close-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

/* Desktop view */
@media (min-width: 1024px) {
  .card-image {
    min-height: 250px;
  }

  .background-image,
  .no-image-placeholder,
  .trail-preview {
    min-height: 250px;
  }

  .heading {
    font-size: 0.8125rem;
  }

  .title.is-6 {
    font-size: 1rem;
  }
}
</style>
