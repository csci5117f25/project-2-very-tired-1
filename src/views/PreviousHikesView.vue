<script setup>
import { useCollection } from 'vuefire'
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/firebase_conf'
import { useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import PreviousHikesCard from '@/components/PreviousHikesCard.vue'
import { useAuth } from '@/composables/useAuth'
import BackButton from '@/components/BackButton.vue'

const { user } = useAuth()
const uid = computed(() => user.value?.uid)

const route = useRoute()

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

const hikesQuery = computed(() => {
  if (!paramsExist.value) {
    return query(collection(db, 'users', uid.value, 'hikes'), orderBy('createdAt', 'desc'))
  } else {
    return query(
      collection(db, 'users', uid.value, 'hikes'),
      where('createdAt', '>=', startOfDay.value),
      where('createdAt', '<=', endOfDay.value),
      orderBy('createdAt', 'desc'),
    )
  }
})

const hikes = useCollection(hikesQuery)
const hikesWithPhotos = ref([])

async function handleDeleteHike(hikeId) {
  if (window.confirm('Are you sure you want to delete this hike? This action cannot be undone.')) {
    const hikeDocRef = doc(db, 'users', uid.value, 'hikes', hikeId)
    await deleteDoc(hikeDocRef)
    hikesWithPhotos.value = hikesWithPhotos.value.filter((hike) => hike.id !== hikeId)
  }
}

watch(
  hikes,
  async (newHikes) => {
    if (!newHikes || newHikes.length === 0) {
      hikesWithPhotos.value = []
      return
    }

    const hikesData = await Promise.all(
      newHikes.map(async (hike) => {
        const hikeId = hike.id

        try {
          const photosSnapshot = await getDocs(
            collection(db, 'users', uid.value, 'hikes', hikeId, 'photos'),
          )
          const photos = photosSnapshot.docs.map((doc) => doc.data())

          return {
            id: hikeId,
            ...hike,
            photos: photos,
          }
        } catch (error) {
          console.error(`Error fetching photos for hike ${hikeId}:`, error)
          return {
            id: hikeId,
            ...hike,
            photos: [],
          }
        }
      }),
    )
    hikesWithPhotos.value = hikesData
  },
  { immediate: true },
)
</script>

<template>
  <div class="page-wrapper">
    <div class="previousHikesContainer">
      <div v-if="!hikesWithPhotos || hikesWithPhotos.length === 0" class="no-hikes">
        No hikes found. Hikes can be viewed here after you complete your first hike!
      </div>
      <div class="columns is-multiline">
        <div
          v-for="hike in hikesWithPhotos"
          :key="hike.id"
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
