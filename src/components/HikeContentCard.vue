<script setup>
import { computed } from 'vue'
import HikeStatsCard from '../components/HikeStatsCards.vue'
import HikePhotoCard from '../components/HikePhotoCard.vue'
import { useHikeFormatters } from '../composables/useHikeFormatters'

const { formatDatetime } = useHikeFormatters()

const props = defineProps({
  hike: {
    type: Object,
    required: true,
  },
  photos: {
    type: Array,
    default: () => [],
  },
  currentPhotoIndex: {
    type: [Number, null],
    default: null,
  },
})

const emit = defineEmits(['update:currentPhotoIndex', 'open-modal'])

const totalItems = computed(() => 1 + props.photos.length)

const canGoNext = computed(() => {
  if (props.currentPhotoIndex === null) {
    return props.photos.length > 0
  }
  return props.currentPhotoIndex < props.photos.length - 1
})

const canGoPrev = computed(() => {
  return props.currentPhotoIndex !== null
})

function nextItem() {
  if (!canGoNext.value) return
  if (props.currentPhotoIndex === null) {
    emit('update:currentPhotoIndex', 0)
  } else {
    emit('update:currentPhotoIndex', props.currentPhotoIndex + 1)
  }
}

function prevItem() {
  if (!canGoPrev.value) return
  if (props.currentPhotoIndex === 0) {
    emit('update:currentPhotoIndex', null)
  } else {
    emit('update:currentPhotoIndex', props.currentPhotoIndex - 1)
  }
}

function goToItem(index) {
  if (index === 0) {
    emit('update:currentPhotoIndex', null)
  } else {
    emit('update:currentPhotoIndex', index - 1)
  }
}

const currentDotIndex = computed(() => {
  return props.currentPhotoIndex === null ? 0 : props.currentPhotoIndex + 1
})

const currentPhoto = computed(() => {
  if (props.currentPhotoIndex === null) return null
  return props.photos[props.currentPhotoIndex] || null
})
</script>

<template>
  <div class="content-column">
    <div class="card content-card">
      <!-- Top section -->
      <div class="content-top-section">
        <!-- Navigation arrows -->
        <button
          class="nav-arrow nav-arrow--left"
          :class="{ 'is-disabled': !canGoPrev }"
          @click="prevItem"
          :disabled="!canGoPrev"
          v-if="totalItems > 1"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          class="nav-arrow nav-arrow--right"
          :class="{ 'is-disabled': !canGoNext }"
          @click="nextItem"
          :disabled="!canGoNext"
          v-if="totalItems > 1"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- Stats View (top section) -->
        <HikeStatsCard v-if="currentPhotoIndex === null" :hike="hike" />

        <!-- Photo View (top section) -->
        <HikePhotoCard v-else :photo="currentPhoto" @open-modal="emit('open-modal', $event)" />
      </div>

      <!-- Bottom section -->
      <div class="content-bottom-section">
        <!-- Stats: photo hint -->
        <div v-if="currentPhotoIndex === null && photos.length > 0" class="photos-hint">
          <span>{{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }} from this hike</span>
          <b-button class="back-button" type="is-primary" @click="nextItem"> View Photos </b-button>
        </div>

        <!-- Photo: info -->
        <div v-else-if="currentPhotoIndex !== null" class="photo-info">
          <p class="photo-number">Photo {{ currentPhotoIndex + 1 }} of {{ photos.length }}</p>
          <p class="photo-time">{{ formatDatetime(currentPhoto?.timestamp) }}</p>
          <p v-if="currentPhoto?.description" class="photo-description">
            {{ currentPhoto.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pagination dots -->
    <div class="pagination-dots" v-if="totalItems > 1">
      <button
        v-for="i in totalItems"
        :key="i"
        class="dot"
        :class="{ 'is-active': currentDotIndex === i - 1 }"
        @click="goToItem(i - 1)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.content-column {
  width: 100%;
}

.content-card {
  border: 2px solid var(--bulma-border);
  border-radius: 15px;
  overflow: hidden;
  background: var(--bulma-background);
}

.content-top-section {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-arrow svg {
  width: 20px;
  height: 20px;
  color: var(--bulma-text);
}

.nav-arrow:hover:not(:disabled) {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.nav-arrow--left {
  left: 10px;
}

.nav-arrow--right {
  right: 10px;
}

.nav-arrow.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.content-bottom-section {
  background: var(--bulma-text-15-soft);
}

.photos-hint {
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--bulma-text-40);
  font-size: 0.875rem;
  border-top: 1px solid var(--bulma-border);
}

.photo-info {
  padding: 1rem 1.25rem;
}

.photo-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bulma-text-70-bold);
  margin: 0 0 0.25rem;
}

.photo-time {
  font-size: 0.8rem;
  color: var(--bulma-text-40-bold);
  margin: 0;
}

.photo-description {
  margin: 0.75rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bulma-border);
  font-size: 0.875rem;
  color: var(--bulma-text-60);
  line-height: 1.5;
}

.pagination-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 1rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bulma-border);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.dot:hover {
  background: var(--bulma-text-40);
}

.dot.is-active {
  background: var(--bulma-primary);
  transform: scale(1.2);
}

@media (min-width: 768px) {
  .content-column {
    flex: 1;
    max-width: 50%;
  }
}

@media (min-width: 1024px) {
  .content-column {
    max-width: 45%;
  }
}
</style>
