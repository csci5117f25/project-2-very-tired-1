<script setup>
import { useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'
import { db } from '@/firebase_conf'
import { useRouter } from 'vue-router'
// import { useCurrentUser } from 'vuefire'
import { computed } from 'vue'
import PreviousHikesCard from '@/components/PreviousHikesCard.vue'

const router = useRouter()

// const user = useCurrentUser()

const hikesQuery = computed(() => {
  // if (!user.value) return null
  // !!! !!! !!! USER IS HARD CODED TO THE TEST USER THIS NEEDS TO BE CHANGED ONCE AUTH IS GOOD !!! !!! !!!
  return collection(db, 'users', 'test', 'hikes')
})

const hikes = useCollection(hikesQuery)

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="page-wrapper">
    <div class="previousHikesContainer">
      <div v-if="!hikes || hikes.length === 0" class="no-hikes">
        No hikes found. Hikes can be viewed here after you complete your first hike!
      </div>
      <PreviousHikesCard
        v-for="hike in hikes"
        :key="hike.id"
        :hikeId="hike.id"
        :datetime="hike.createdAt"
        :distance="hike.distanceMeters"
        :duration="hike.durationSec"
        :backgroundImage="hike.backgroundImage"
      />
    </div>

    <b-button class="back-button" type="is-primary" @click="goBack"> ← Back </b-button>
  </div>
</template>

<style scoped>
.page-wrapper {
  position: relative;
  min-height: 100vh;
  padding-bottom: 80px;
}

.back-button {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Mobile - single column */
.previousHikesContainer {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Desktop - 3 columns */
@media (min-width: 1024px) {
  .previousHikesContainer {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 24px;
  }
}
</style>
