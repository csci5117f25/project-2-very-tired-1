<script setup>
import BackButton from '@/components/BackButton.vue'
import { useDocument } from 'vuefire'
import { doc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/firebase_conf'
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()

const hikeId = computed(() => route.params.id)

const hikeQuery = computed(() => {
  if (!hikeId.value) return null
  return doc(db, 'users', 'test', 'hikes', hikeId.value)
})

const hike = useDocument(hikeQuery)
const hikeWithPhotos = ref(null)

watch(
  hike,
  async (newHike) => {
    if (!newHike) {
      hikeWithPhotos.value = null
      return
    }

    try {
      const photosSnapshot = await getDocs(
        collection(db, 'users', 'test', 'hikes', newHike.id, 'photos'),
      )
      const photos = photosSnapshot.docs.map((doc) => doc.data())

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
</script>

<template>
  <div v-if="hikeWithPhotos.photos && hikeWithPhotos.photos.length > 0">
    <div v-for="(photo, index) in hikeWithPhotos.photos" :key="index">
      <img :src="photo.downloadURL" :alt="photo.caption || 'Hike photo'" />
      <p v-if="photo.caption">{{ photo.caption }}</p>
    </div>
  </div>
</template>
