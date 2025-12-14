<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TrailLine from '@/components/TrailLine.vue'

const router = useRouter()

const props = defineProps({
  hikes: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  maxDisplay: {
    type: Number,
    default: 6, // Show up to 6 hikes in the collage
  },
})

const displayHikes = computed(() => {
  return props.hikes.slice(0, props.maxDisplay)
})

const hasHikes = computed(() => props.hikes.length > 0)

const goToHike = (hikeId) => {
  router.push(`/previousHikes?scrollTo=${hikeId}`)
}

// Determine grid layout based on number of hikes
const gridClass = computed(() => {
  const count = displayHikes.value.length
  if (count === 1) return 'grid-1'
  if (count === 2) return 'grid-2'
  if (count === 3) return 'grid-3'
  if (count === 4) return 'grid-4'
  return 'grid-6' // 5 or 6 hikes
})
</script>

<template>
  <div class="collage-wrapper">
    <p class="collage-title">Previous Hikes</p>
    <div class="collage-card">
      <div v-if="isLoading" class="loading-state">
        <!-- Loading placeholder -->
      </div>
      <div v-else-if="!hasHikes" class="empty-state">
        <p class="title is-5">No Previous Hikes</p>
        <p class="subtitle is-6">Start your first adventure!</p>
      </div>
      <div v-else class="collage-grid" :class="gridClass">
      <div
        v-for="hike in displayHikes"
        :key="hike.id"
        class="collage-item"
        @click="goToHike(hike.id)"
      >
        <!-- Photo if available -->
        <img
          v-if="hike.photoUrl"
          :src="hike.photoUrl"
          :alt="hike.name"
          class="collage-photo"
        />
        <!-- Trail line if no photo but has trail data -->
        <div v-else-if="hike.trail?.length > 1" class="collage-trail">
          <TrailLine
            :points="hike.trail"
            :width="200"
            :height="200"
            :padding="15"
            :stroke-width="3"
            :marker-radius="4"
          />
        </div>
        <!-- Placeholder if neither -->
        <div v-else class="collage-placeholder">
          <span class="hike-initial">{{ (hike.name || 'H')[0].toUpperCase() }}</span>
        </div>
      </div>
    </div>
      <!-- Overlay with hike count if there are more -->
      <div v-if="totalCount > maxDisplay" class="more-overlay">
        +{{ totalCount - maxDisplay }} more
      </div>
    </div>
  </div>
</template>

<style scoped>
.collage-wrapper {
  position: relative;
  height: 100%;
}

.collage-title {
  position: absolute;
  top: -28px;
  left: calc(100% / 6);
  transform: translateX(-50%);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--bulma-dark);
  margin: 0;
}

.collage-card {
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
  background-color: var(--bulma-text-15-soft);
  position: relative;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
}

.empty-state .title {
  color: var(--bulma-text-70-bold);
  margin-bottom: 0.5rem;
}

.empty-state .subtitle {
  color: var(--bulma-text-40-bold);
  margin: 0;
}

.collage-grid {
  display: grid;
  height: 100%;
  gap: 3px;
  padding: 0;
  overflow: hidden;
  border-radius: var(--card-border-radius);
}

/* Grid layouts */
.grid-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.grid-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.grid-3 .collage-item:first-child {
  grid-row: span 2;
}

.grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.grid-6 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr 1fr;
}

.collage-item {
  overflow: hidden;
  border-radius: 0;
  background-color: var(--bulma-text-25);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.collage-item:hover {
  opacity: 0.9;
}

.collage-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.collage-trail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bulma-text-15-soft);
}

.collage-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bulma-primary-light) 0%, var(--bulma-primary) 100%);
}

.hike-initial {
  font-size: 2rem;
  font-weight: 700;
  color: var(--bulma-white);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.more-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Small screens */
@media (max-width: 400px) {
  .collage-grid {
    gap: 2px;
  }

  .hike-initial {
    font-size: 1.5rem;
  }
}
</style>

