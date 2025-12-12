<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@vueuse/core'
import { db, storage } from '@/firebase_conf'
import { collection, doc, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  hikeId: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const { user } = useAuth()
const uid = ref(user.value?.uid)

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
    },
    'image/jpeg',
    0.9,
  )
}

async function savePhoto() {
  isUploading.value = true
  try {
    const photosCol = collection(db, 'users', uid.value, 'hikes', props.hikeId, 'photos')
    const photoDocRef = doc(photosCol)
    const userRef = doc(db, 'users', uid.value)
    const hikeRef = doc(db, 'users', uid.value, 'hikes', props.hikeId)
    const photoId = photoDocRef.id

    const path = `users/${uid.value}/hikes/${props.hikeId}/photos/${photoId}.jpg`
    const sRef = storageRef(storage, path)

    await uploadBytes(sRef, capturedBlob.value)
    const downloadURL = await getDownloadURL(sRef)

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

    await updateDoc(hikeRef, {
      photoCount: increment(1),
    })

    await updateDoc(userRef, {
      totalPhotos: increment(1),
      updatedAt: serverTimestamp(),
    })
    description.value = ''
    emit('update:modelValue', false)
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
  startCamera()
}

const active = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      isCapturing.value = true
      startCamera()
    } else {
      stopCamera()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopCamera()
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <b-modal
    v-model="active"
    trap-focus
    :destroy-on-hide="false"
    aria-role="dialog"
    aria-label="Take Picture"
    close-button-aria-label="Close"
    aria-modal
  >
    <section class="modal-card-body">
      <div v-if="isCapturing" class="camera-container">
        <div class="preview-wrapper">
          <video ref="videoEl" class="photo-frame" autoplay playsinline muted></video>

          <div class="buttons mt-2 is-centered">
            <b-button type="is-primary" @click="capture">Capture</b-button>
          </div>
        </div>
      </div>

      <div v-else class="preview-container">
        <div class="preview-wrapper">
          <img class="photo-frame" :src="previewUrl" alt="Preview" />

          <b-input
            class="is-fullwidth my-2"
            v-model="description"
            placeholder="Add a short description"
          />

          <div class="buttons is-centered modal-controls">
            <b-button type="is-success" :loading="isUploading" @click="savePhoto">Save</b-button>
            <b-button type="is-danger" @click="deletePhoto">Delete</b-button>
          </div>
        </div>
      </div>

      <canvas ref="canvasEl" class="is-hidden"></canvas>
    </section>
  </b-modal>
</template>

<style scoped>
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-frame {
  aspect-ratio: 3 / 4;
  width: 100%;
  max-height: 70vh;
  background: #000;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

::deep .modal-card {
  border-radius: 12px;
  overflow: hidden;
}

.preview-wrapper {
  width: min(90vw, 70vmin);
  flex-direction: column;
}

.preview-wrapper .field,
.preview-wrapper .modal-controls {
  width: 100%;
}
</style>
