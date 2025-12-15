<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import TrailLine from '@/components/TrailLine.vue'
import { useHikeFormatters } from '../composables/useHikeFormatters'

const router = useRouter()

const props = defineProps({
  hikeId: String,
  name: String,
  datetime: Object, // Firestore Timestamp object
  distance: Number, // meters
  duration: Number, // seconds
  backgroundImage: String,
  trail: Array,
})

const emit = defineEmits(['delete'])

const deleteHike = () => {
  emit('delete', props.hikeId)
}

const openHike = () => {
  router.push(`/individualHike/${props.hikeId}`)
}

const hasTrailData = computed(() => {
  return props.trail && props.trail.length > 0
})

const { formatTime, formatDistance, formatDuration } = useHikeFormatters()
</script>

<template>
  <div class="card hike-card" @click="openHike">
    <b-button class="delete-button" @click.stop="deleteHike">🗑️</b-button>
    <div class="card-image">
      <div
        v-if="backgroundImage"
        class="background-image"
        :style="{ backgroundImage: `url(${backgroundImage})` }"
      >
        <div class="image-overlay"></div>
      </div>

      <div v-else-if="hasTrailData" class="trail-preview">
        <TrailLine
          :points="trail"
          :width="556"
          :height="250"
          :stroke-width="3"
          :marker-radius="5"
        />
        <div class="image-overlay"></div>
      </div>

      <div v-else class="no-image-placeholder">
        <div class="image-overlay"></div>
      </div>
    </div>

    <div class="card-content">
      <p class="title is-5">{{ name }}</p>
      <p class="subtitle is-5">{{ formatTime(datetime) }}</p>

      <div class="columns is-mobile info-container">
        <div class="column has-text-centered">
          <p class="heading">Distance</p>
          <p class="title is-6">{{ formatDistance(distance) }}</p>
        </div>
        <div class="column has-text-centered">
          <p class="heading">Duration</p>
          <p class="title is-6">{{ formatDuration(duration) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hike-card {
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  overflow: hidden;
  border: 2px solid var(--bulma-border);
  border-radius: 15px;
}

.hike-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--bulma-text-50);
}

.card-image {
  min-height: 200px;
  position: relative;
  overflow: hidden;
}

.background-image,
.no-image-placeholder,
.trail-preview {
  min-height: 200px;
  background-color: var(--bulma-text-70);
  background-size: cover;
  background-position: center;
  position: relative;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
}

.card-content {
  padding: 1rem;
  background-color: var(--bulma-background);
}

.info-container {
  gap: 0.75rem;
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

.title.is-5,
.subtitle.is-5 {
  font-size: 1.1rem;
  margin-bottom: 1 !important;
}

.subtitle.is-5 {
  color: var(--bulma-text-40-bold);
  font-weight: normal;
}

/* Desktop sized view */
@media (min-width: 1024px) {
  .card-image {
    min-height: 250px;
  }

  .background-image,
  .no-image-placeholder,
  .trail-preview {
    min-height: 250px;
  }

  .card-content {
    padding: 1rem;
  }

  .heading {
    font-size: 0.8125rem;
  }

  .title.is-6 {
    font-size: 0.9375rem;
  }
}

.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}
</style>
