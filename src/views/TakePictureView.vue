<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@vueuse/core'
import { db, storage } from '@/firebase_conf'
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const uid = ref(user.value?.uid)

const hikeId = route.params.hikeId

const videoEl = ref(null)
const canvasEl = ref(null)
const stream = ref(null)
const capturedBlob = ref(null)
const previewUrl = ref(null)
const isCapturing = ref(true)
const isUploading = ref(false)
const description = ref('')

const { coords } = useGeolocation()

async function startCamera() {
  isCapturing.value = true
  const s = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false,
  })
  stream.value = s
  videoEl.value.srcObject = s
}

function stopCamera() {
  stream.value = null
}

function capture() {
  const video = videoEl.value
  const canvas = canvasEl.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // copy live video feed to photo
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  canvas.toBlob(
    (b) => {
      capturedBlob.value = b
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
      }
      previewUrl.value = URL.createObjectURL(b)
      isCapturing.value = false
      stopCamera()
    },
    'image/jpeg',
    0.9,
  )
}

async function savePhoto() {
  isUploading.value = true
  try {
    // create a new photo doc id first
    const photosCol = collection(db, 'users', uid.value, 'hikes', hikeId, 'photos')
    const photoDocRef = doc(photosCol)
    const photoId = photoDocRef.id

    const path = `users/${uid.value}/hikes/${hikeId}/photos/${photoId}.jpg`
    const sRef = storageRef(storage, path)

    // upload
    await uploadBytes(sRef, capturedBlob.value)
    const downloadURL = await getDownloadURL(sRef)

    // prepare metadata
    const loc = coords.value ? { lat: coords.value.latitude, long: coords.value.longitude } : null
    const altitude =
      coords.value && typeof coords.value.altitude === 'number' ? coords.value.altitude : null

    await setDoc(photoDocRef, {
      storagePath: path,
      downloadURL,
      timestamp: serverTimestamp(),
      location: loc,
      altitudeMeters: altitude,
      description: description.value || '',
      createdAt: serverTimestamp(),
    })

    // navigate back to startHike view
    router.back()
  } catch (err) {
    console.error('Failed to save photo:', err)
  } finally {
    isUploading.value = false
  }
}

function deletePhoto() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  capturedBlob.value = null
  description.value = ''
  // restart camera so user can take another
  startCamera()
}

onMounted(() => {
  startCamera()
})

onBeforeUnmount(() => {
  stopCamera()
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="take-picture">
    <div v-if="isCapturing" class="camera-container">
      <video
        ref="videoEl"
        autoplay
        playsinline
        muted
        style="width: 100%; max-height: 70vh; background: black"
      ></video>
      <div class="controls">
        <b-button type="is-primary" @click="capture">Capture</b-button>
        <b-button @click="$router.back()">Cancel</b-button>
      </div>
    </div>

    <div v-else class="preview-container">
      <img
        :src="previewUrl"
        alt="Preview"
        style="width: 100%; max-height: 60vh; object-fit: contain"
      />
      <b-field label="Description">
        <b-input v-model="description" placeholder="Add a short description" />
      </b-field>
      <div class="controls">
        <b-button type="is-success" :loading="isUploading" @click="savePhoto">Save</b-button>
        <b-button type="is-danger" @click="deletePhoto">Delete</b-button>
      </div>
    </div>

    <canvas ref="canvasEl" style="display: none"></canvas>
  </div>
</template>

<style scoped>
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.controls {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.preview-container {
  display: flex;
  flex-direction: column;
}
</style>
