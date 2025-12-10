<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@vueuse/core'
import { db, storage } from '@/firebase_conf'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
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
const currentFacingMode = ref('environment')

const { coords } = useGeolocation()

async function startCamera() {
  isCapturing.value = true
  const s = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacingMode.value },
    audio: false,
  })
  stream.value = s
  videoEl.value.srcObject = s
}

function stopCamera() {
  stream.value = null
}

function switchCamera() {
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment'
  startCamera()
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
    <section class="modal-card-pic">
      <div v-if="isCapturing">
        <div class="flip-camera-icon" @click="switchCamera">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            id="Flip-Camera-Android--Streamline-Outlined-Material"
            height="24"
            width="24"
          >
            <desc>Flip Camera Android Streamline Icon: https://streamlinehq.com</desc>
            <path
              fill="#000000"
              d="M12 22c-2.33335 0 -4.4 -0.71665 -6.2 -2.15 -1.8 -1.43335 -2.958335 -3.29165 -3.475 -5.575H3.85c0.5 1.85 1.50415 3.35 3.0125 4.5S10.08335 20.5 12 20.5c1.63335 0 3.1375 -0.42085 4.5125 -1.2625S18.95 17.25 19.7 15.8h-3.275v-1.525H22V20h-1.475v-2.725c-0.95 1.46665 -2.175 2.62085 -3.675 3.4625S13.73335 22 12 22Zm0.025 -7.475c-0.7 0 -1.3 -0.25 -1.8 -0.75s-0.75 -1.1 -0.75 -1.8 0.25 -1.3 0.75 -1.8 1.1 -0.75 1.8 -0.75 1.3 0.25 1.8 0.75 0.75 1.1 0.75 1.8 -0.25 1.3 -0.75 1.8 -1.1 0.75 -1.8 0.75ZM2 9.7V4h1.5v2.675c0.95 -1.46665 2.17085 -2.6125 3.6625 -3.4375C8.65415 2.4125 10.26665 2 12 2c2.33335 0 4.40415 0.7125 6.2125 2.1375 1.80835 1.425 2.97085 3.27915 3.4875 5.5625h-1.525c-0.5 -1.85 -1.50835 -3.35 -3.025 -4.5 -1.51665 -1.15 -3.23335 -1.725 -5.15 -1.725 -1.61665 0 -3.10835 0.425 -4.475 1.275 -1.36665 0.85 -2.43335 1.99165 -3.2 3.425h3.275v1.525H2Z"
              stroke-width="0.5"
            ></path>
          </svg>
        </div>
        <video ref="videoEl" class="photo-frame" autoplay playsinline muted></video>

        <div class="buttons mt-2 is-centered">
          <b-button type="is-primary" @click="capture">Capture</b-button>
        </div>
      </div>

      <div v-else class="preview-container">
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

      <canvas ref="canvasEl" class="is-hidden"></canvas>
    </section>
  </b-modal>
</template>

<style scoped>
.modal-card-pic {
  padding: 5px;
}

.flip-camera-icon {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  padding: 5px;
  cursor: pointer;
}

.photo-frame {
  aspect-ratio: 9 / 16;
  width: 100%;
  max-height: 60vh;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}
</style>
