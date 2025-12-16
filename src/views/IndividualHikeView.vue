<script setup>
import { useDocument } from 'vuefire'
import { doc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/firebase_conf'
import { useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import BackButton from '../components/BackButton.vue'
import HikeTrailCard from '../components/HikeTrailCard.vue'
import HikeContentCard from '../components/HikeContentCard.vue'
import PhotoModal from '../components/PhotoModal.vue'
import { useAuth } from '../composables/useAuth'
import { useHikeFormatters } from '../composables/useHikeFormatters'
import LoadingSpinner from '@/components/main/LoadingSpinner.vue'

const route = useRoute()
const { user } = useAuth()
const { formatDatetime } = useHikeFormatters()

const uid = computed(() => user.value?.uid)
const hikeId = computed(() => route.params.id)

const hikeQuery = computed(() => {
  if (!hikeId.value || !uid.value) return null
  return doc(db, 'users', uid.value, 'hikes', hikeId.value)
})

const hike = useDocument(hikeQuery)
const hikeWithPhotos = ref(null)
const currentPhotoIndex = ref(null)
const isPhotoModalOpen = ref(false)
const selectedPhoto = ref(null)

// Fetch hike with photos
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

// Sort photos chronologically by timestamp
const sortedPhotos = computed(() => {
  if (!hikeWithPhotos.value?.photos) return []
  return [...hikeWithPhotos.value.photos].sort((a, b) => {
    const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0
    const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0
    return timeA - timeB
  })
})

// Current photo location for trail marker
const currentPhotoLocation = computed(() => {
  if (currentPhotoIndex.value === null) return null
  const photo = sortedPhotos.value[currentPhotoIndex.value]
  return photo?.location || null
})

// Photo modal functions
function openPhotoModal(photo) {
  selectedPhoto.value = photo
  isPhotoModalOpen.value = true
}

function closePhotoModal() {
  isPhotoModalOpen.value = false
  selectedPhoto.value = null
}
</script>

<template>
  <div class="page-wrapper">
    <!-- Loading State -->
    <div v-if="!hikeWithPhotos">
      <LoadingSpinner />
    </div>

    <!-- Content -->
    <div v-else class="hike-detail-container">
      <!-- Header -->
      <div class="hike-header">
        <h1 class="hike-title">{{ hikeWithPhotos.name || 'Untitled Hike' }}</h1>
        <p class="hike-date">{{ formatDatetime(hikeWithPhotos.startedAt) }}</p>
      </div>

      <!-- Main Layout: Trail + Content -->
      <div class="main-layout">
        <!-- Trail Column (always visible) -->
        <div class="trail-column">
          <HikeTrailCard :trail="hikeWithPhotos.trail" :photo-location="currentPhotoLocation" />
        </div>

        <!-- Content Column (stats or photos) -->
        <HikeContentCard
          :hike="hikeWithPhotos"
          :photos="sortedPhotos"
          v-model:current-photo-index="currentPhotoIndex"
          @open-modal="openPhotoModal"
        />
      </div>

      <!-- Photo Modal -->
      <PhotoModal :photo="selectedPhoto" :is-open="isPhotoModalOpen" @close="closePhotoModal" />
    </div>

    <BackButton />
  </div>
</template>

<style scoped>
.page-wrapper {
  margin: auto;
  min-height: 100vh;
  padding: 30px 20px 90px;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hike-detail-container {
  width: 100%;
}

.hike-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.hike-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--bulma-text-70-bold);
  margin: 0 0 0.25rem;
}

.hike-date {
  color: var(--bulma-text-40-bold);
  font-size: 0.9rem;
  margin: 0;
}

.main-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trail-column {
  width: 100%;
}

/* Desktop Layout */
@media (min-width: 768px) {
  .hike-header {
    margin-bottom: 2rem;
  }

  .hike-title {
    font-size: 1.75rem;
  }

  .main-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .trail-column {
    flex: 1;
    max-width: 50%;
    position: sticky;
    top: 30px;
  }
}

@media (min-width: 1024px) {
  .trail-column {
    max-width: 55%;
  }
}
</style>
