<script setup>
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { getStorage, ref as storageRef, deleteObject } from 'firebase/storage'
import { db } from '@/firebase_conf'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import PreviousHikesCard from '@/components/PreviousHikesCard.vue'
import { useAuth } from '@/composables/useAuth'
import BackButton from '@/components/BackButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { user } = useAuth()
const uid = computed(() => user.value?.uid)

const route = useRoute()
const router = useRouter()
const scrollToId = computed(() => route.query.scrollTo)

const storage = getStorage()

const isLoading = ref(true)
const hikesWithPhotos = ref([])

const paramsExist = computed(() => {
  const { year, month, day } = route.params
  return (
    year !== undefined &&
    month !== undefined &&
    day !== undefined &&
    !isNaN(Number(year)) &&
    !isNaN(Number(month)) &&
    !isNaN(Number(day))
  )
})

const dateParams = computed(() => ({
  year: Number(route.params.year),
  month: Number(route.params.month),
  day: Number(route.params.day),
}))

const startOfDay = computed(
  () => new Date(dateParams.value.year, dateParams.value.month, dateParams.value.day, 0, 0, 0),
)
const endOfDay = computed(
  () => new Date(dateParams.value.year, dateParams.value.month, dateParams.value.day, 23, 59, 59),
)

async function fetchHikes() {
  if (!uid.value) {
    return
  }

  isLoading.value = true

  try {
    const hikesQuery = paramsExist.value
      ? query(
          collection(db, 'users', uid.value, 'hikes'),
          where('createdAt', '>=', startOfDay.value),
          where('createdAt', '<=', endOfDay.value),
          orderBy('createdAt', 'desc'),
        )
      : query(collection(db, 'users', uid.value, 'hikes'), orderBy('createdAt', 'desc'))

    const snapshot = await getDocs(hikesQuery)

    if (paramsExist.value && snapshot.empty) {
      router.replace({ name: 'not-found' })
      return
    }

    const hikesData = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const hikeId = docSnap.id
        const hikeData = docSnap.data()

        try {
          const photosSnapshot = await getDocs(
            collection(db, 'users', uid.value, 'hikes', hikeId, 'photos'),
          )
          const photos = photosSnapshot.docs.map((doc) => doc.data())

          return {
            id: hikeId,
            ...hikeData,
            photos,
          }
        } catch (error) {
          console.error(`Error fetching photos for hike ${hikeId}:`, error)
          return {
            id: hikeId,
            ...hikeData,
            photos: [],
          }
        }
      }),
    )

    hikesWithPhotos.value = hikesData

    // Scroll to specific hike if scrollTo query param exists
    if (scrollToId.value) {
      await nextTick()
      const element = document.getElementById(`hike-${scrollToId.value}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  } catch (error) {
    console.error('Error fetching hikes:', error)
    hikesWithPhotos.value = []
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteHike(hikeId) {
  if (
    window.confirm(
      'Are you sure you want to delete this hike? This hike and all photos from this hike will be permenantly deleted.',
    )
  ) {
    try {
      const hikeDocRef = doc(db, 'users', uid.value, 'hikes', hikeId)

      const photosCollectionRef = collection(db, 'users', uid.value, 'hikes', hikeId, 'photos')
      const photosSnapshot = await getDocs(photosCollectionRef)

      const deletePromises = photosSnapshot.docs.map(async (photoDoc) => {
        const photoData = photoDoc.data()

        if (photoData.storagePath) {
          try {
            const fileRef = storageRef(storage, photoData.storagePath)
            await deleteObject(fileRef)
          } catch (storageError) {
            console.warn(`Failed to delete storage file: ${photoData.storagePath}`, storageError)
          }
        }
        return deleteDoc(photoDoc.ref)
      })

      await Promise.all(deletePromises)
      await deleteDoc(hikeDocRef)

      hikesWithPhotos.value = hikesWithPhotos.value.filter((hike) => hike.id !== hikeId)
    } catch (error) {
      console.error('Error deleting hike:', error)
      alert('Failed to delete hike. Please try again.')
    }
  }
}

onMounted(async () => {
  if (uid.value) {
    await fetchHikes()
  }
})

watch(uid, async (newUid) => {
  if (newUid && hikesWithPhotos.value.length === 0 && isLoading.value) {
    await fetchHikes()
  }
})
</script>

<template>
  <div class="page-wrapper">
    <div v-if="isLoading">
      <LoadingSpinner />
    </div>

    <div v-else class="previousHikesContainer">
      <div v-if="hikesWithPhotos.length === 0" class="no-hikes">
        No hikes found. Hikes can be viewed here after you complete your first hike!
      </div>
      <div v-else class="columns is-multiline">
        <div
          v-for="hike in hikesWithPhotos"
          :key="hike.id"
          :id="`hike-${hike.id}`"
          class="column is-12-mobile is-4-desktop"
        >
          <PreviousHikesCard
            :hikeId="hike.id"
            :name="hike.name"
            :datetime="hike.startedAt"
            :distance="hike.distanceMeters"
            :duration="hike.durationSec"
            :background-image="hike.photos?.[0]?.downloadURL"
            :trail="hike.trail"
            @delete="handleDeleteHike"
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
  align-items: center;
}
</style>
