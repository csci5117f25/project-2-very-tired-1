<script setup>
import { useCollection } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase_conf'
import { useRouter } from 'vue-router'
// import { useCurrentUser } from 'vuefire'

import { computed, ref, watch } from 'vue'
import PreviousHikesCard from '@/components/PreviousHikesCard.vue'

const router = useRouter()

const hikesQuery = computed(() => {
  // if (!user.value) return null
  // !!! !!! !!! USER IS HARD CODED TO THE TEST USER THIS NEEDS TO BE CHANGED ONCE AUTH IS GOOD !!! !!! !!!
  return collection(db, 'users', 'test', 'hikes')
})

const hikes = useCollection(hikesQuery)
const hikesWithPhotos = ref([])

watch(
  hikes,
  async (newHikes) => {
    if (!newHikes || newHikes.length === 0) {
      hikesWithPhotos.value = []
      return
    }

    const hikesData = await Promise.all(
      newHikes.map(async (hike) => {
        try {
          const photosSnapshot = await getDocs(
            collection(db, 'users', 'test', 'hikes', hike.id, 'photos'),
          )
          const photos = photosSnapshot.docs.map((doc) => doc.data())

          return {
            ...hike,
            photos: photos,
          }
        } catch (error) {
          console.error(`Error fetching photos for hike ${hike.id}:`, error)
          return {
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

const goBack = () => {
  router.back()
}
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
            :hike-id="hike.id"
            :name="hike.name"
            :datetime="hike.startedAt"
            :distance="hike.distanceMeters"
            :duration="hike.durationSec"
            :background-image="hike.photos?.[0]?.downloadURL"
            :trail="hike.trail"
          />
        </div>
      </div>
    </div>

    <b-button class="back-button" type="is-primary" @click="goBack"> ← Back </b-button>
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

.back-button {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
