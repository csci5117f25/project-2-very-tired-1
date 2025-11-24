<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()

const props = defineProps({
  hikeId: String,
  datetime: Object, // Firestore Timestamp object
  distance: Number, // meters
  duration: Number, // seconds
  backgroundImage: String,
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
</script>

<template>
  <div
    class="previousHikeCard"
    @click="openHike"
    :style="backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}"
  >
    <div class="card-content">
      <div class="info-row">
        <div class="info-item">
          <div class="label">Date</div>
          <div class="value">{{ formattedDatetime }}</div>
        </div>
        <div class="info-item">
          <div class="label">Distance</div>
          <div class="value">{{ formattedDistance }}</div>
        </div>
        <div class="info-item">
          <div class="label">Duration</div>
          <div class="value">{{ formattedDuration }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.previousHikeCard {
  width: 100%;
  min-height: 200px;
  background-color: #e8e8e8;
  background-size: cover;
  background-position: center;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;
}

.previousHikeCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  border-radius: 10px;
  pointer-events: none;
}

.previousHikeCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  position: relative;
  z-index: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.value {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

/* Desktop sized view */
@media (min-width: 1024px) {
  .previousHikeCard {
    min-height: 250px;
    padding: 24px;
  }

  .label {
    font-size: 13px;
  }

  .value {
    font-size: 15px;
  }

  .info-row {
    padding: 16px;
  }
}
</style>
