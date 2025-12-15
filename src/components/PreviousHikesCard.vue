<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
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
  link: String, // Optional override for navigation
  showTrailInContent: { type: Boolean, default: false }, // Show trail line in content area instead of image
  isLoading: { type: Boolean, default: false }, // Hide empty state while loading
})

const emit = defineEmits(['delete'])

const deleteHike = () => {
  emit('delete', props.hikeId)
}

const openHike = () => {
  router.push(props.link || `/individualHike/${props.hikeId}`)
}

const hasTrailData = computed(() => {
  return props.trail && props.trail.length > 0
})

const hasHikeData = computed(() => !!props.hikeId)

// Responsive trail dimensions - iPhone SE is 375px, Pro Max is 430px
const { width: windowWidth } = useWindowSize()
const isSmallScreen = computed(() => windowWidth.value < 400)

const { formatTime, formatDistance, formatDuration } = useHikeFormatters()
</script>

<template>
  <div class="card hike-card" @click="openHike">
    <template v-if="hasHikeData">
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

      <div class="card-content" :class="{ 'card-content-with-trail': showTrailInContent }">
        <p class="title is-5">{{ name || '--' }}</p>
        <p class="subtitle is-5">{{ formatTime(datetime) }}</p>

        <div v-if="showTrailInContent && hasTrailData" class="compact-trail-container" :class="{ 'compact-trail-small': isSmallScreen }">
          <TrailLine
            :points="trail"
            :width="isSmallScreen ? 100 : 160"
            :height="isSmallScreen ? 70 : 100"
            :padding="isSmallScreen ? 6 : 10"
            :stroke-width="2"
            :marker-radius="isSmallScreen ? 2 : 3"
          />
        </div>

        <div v-if="showTrailInContent" style="flex: 1;"></div>

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
    </template>
    <div v-else-if="!isLoading" class="card-content card-content-empty card-content-with-trail">
      <div style="flex: 1;"></div>
      <p class="title is-5">No Previous Hikes</p>
      <div style="flex: 1;"></div>
    </div>
    <div v-else class="card-content card-content-with-trail">
      <!-- Loading state - empty div to maintain card size -->
    </div>
  </div>
</template>

<style scoped>
.hike-card {
  cursor: pointer;
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
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
  position: relative;
}

.card-content-with-trail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-content-empty {
  align-items: center;
  justify-content: center;
}

.info-container {
  gap: 0.75rem;
}

.compact-trail-container {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  width: 160px;
  height: 100px;
  pointer-events: none;
}

.compact-trail-small {
  width: 100px;
  height: 70px;
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

/* Mobile responsive for compact trail */
@media (max-width: 768px) {
  .card-content-with-trail .title.is-5,
  .card-content-with-trail .subtitle.is-5 {
    padding-right: 110px;
  }
}
</style>
