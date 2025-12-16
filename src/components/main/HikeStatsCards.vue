<script setup>
import { useHikeFormatters } from '../../composables/useHikeFormatters'

defineProps({
  hike: {
    type: Object,
    required: true,
  },
})

const { formatTime, formatDistance, formatDuration, formatElevation } = useHikeFormatters()
</script>

<template>
  <div class="stats-content">
    <div class="stats-grid">
      <div class="stat-item stat-item--full">
        <p class="subtitle is-4">Hike Details</p>
      </div>
      <div class="stat-item">
        <p class="stat-label">Start Time</p>
        <p class="stat-value">{{ formatTime(hike.startedAt) }}</p>
      </div>
      <div class="stat-item">
        <p class="stat-label">End Time</p>
        <p class="stat-value">{{ formatTime(hike.finishedAt) }}</p>
      </div>
      <div class="stat-item">
        <p class="stat-label">Distance</p>
        <p class="stat-value">{{ formatDistance(hike.distanceMeters) }}</p>
      </div>
      <div class="stat-item">
        <p class="stat-label">Duration</p>
        <p class="stat-value">{{ formatDuration(hike.durationSec) }}</p>
      </div>
      <div class="stat-item stat-item--full">
        <p class="stat-label">Elevation Gained</p>
        <p class="stat-value">{{ formatElevation(hike.elevationGainMeters) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--bulma-text-15-soft);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.stat-item {
  text-align: center;
}

.stat-item--full {
  grid-column: 1 / -1;
}

.stat-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  color: var(--bulma-text-40-bold);
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--bulma-text-70-bold);
  margin: 0;
}

@media (min-width: 768px) {
  .stat-label {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
