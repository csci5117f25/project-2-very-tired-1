<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import TrailLine from '@/components/TrailLine.vue'

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

const openHike = () => {
  router.push(`/individualHike/${props.hikeId}`)
}

const formattedDatetime = computed(() => {
  if (!props.datetime) return 'N/A'
  const date = props.datetime.toDate()
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
})

const formattedDistance = computed(() => {
  if (!props.distance) return 'N/A'
  const miles = props.distance * 0.000621371
  return `${miles.toFixed(1)} mi`
})

const formattedDuration = computed(() => {
  if (!props.duration) return 'N/A'
  const hours = Math.floor(props.duration / 3600)
  const minutes = Math.floor((props.duration % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
})

const hasTrailData = computed(() => {
  return props.trail && props.trail.length > 0
})
</script>

<template>
  <div class="card hike-card" @click="openHike">
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
          :width="400"
          :height="200"
          :stroke-width="3"
          :marker-radius="5"
        />
      </div>

      <div v-else class="no-image-placeholder">
        <div class="image-overlay"></div>
      </div>
    </div>

    <div class="card-content">
      <p class="title is-5">{{ name }}</p>
      <p class="subtitle is-5">{{ formattedDatetime }}</p>

      <div class="columns is-mobile info-container">
        <div class="column has-text-centered">
          <p class="heading">Distance</p>
          <p class="title is-6">{{ formattedDistance }}</p>
        </div>
        <div class="column has-text-centered">
          <p class="heading">Duration</p>
          <p class="title is-6">{{ formattedDuration }}</p>
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
  border: 2px solid #333;
  border-radius: 12px;
}

.hike-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-image {
  min-height: 200px;
  position: relative;
  overflow: hidden;
}

.background-image,
.no-image-placeholder {
  min-height: 200px;
  background-color: #e8e8e8;
  background-size: cover;
  background-position: center;
  position: relative;
}

.trail-preview {
  min-height: 200px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
}

.card-content {
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.95);
}

.info-container {
  gap: 0.75rem;
}

.heading {
  font-size: 0.6875rem;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.title.is-5,
.subtitle.is-5 {
  font-size: 1.1rem;
  margin-bottom: 1 !important;
  color: #333;
}

.subtitle.is-5 {
  color: #666;
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
</style>
