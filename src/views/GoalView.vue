<script setup>
import { ref, computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useHikesRange } from '@/composables/useHikesRange'
import { useAuth } from '@/composables/useAuth'
import ProgressBar from '@/components/ProgressBar.vue'

const { user } = useAuth()

const uid = computed(() => user.value?.uid)

const types = ref(['weekly', 'monthly', 'annualy'])
const index = ref(0)

const type = computed(() => types.value[index.value])

const { goals } = useGoals(uid, type)
const previous = () => {
  if (index.value === 0) return
  index.value--
}

const next = () => {
  if (index.value === 2) return
  index.value++
}

const range = computed(() => {
  const current = new Date()
  const year = current.getFullYear()
  const month = current.getMonth()

  let start
  let end

  if (type.value === 'annualy') {
    start = new Date(year, 0, 1)
    end = new Date(year + 1, 0, 1)
  } else if (type.value === 'monthly') {
    start = new Date(year, month, 1)
    end = new Date(year, month + 1, 1)
  } else {
    const first = current.getDate() - current.getDay()

    start = new Date(current)
    start.setDate(first)

    end = new Date(start)
    end.setDate(start.getDate() + 7)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return { start, end }
})

const { hikes } = useHikesRange(uid, range)

const totalHikes = computed(() => {
  if (!hikes.value) {
    return 0
  }

  return hikes.value.length
})

const totalMiles = computed(() => {
  if (!hikes.value) return 0

  let meters = 0
  for (const h of hikes.value) {
    if (h.distanceMeters) {
      meters += h.distanceMeters
    }
  }
  return Math.round(meters / 1609.344)
})

const totalPhotos = computed(() => {
  if (!hikes.value) return 0

  let count = 0
  for (const h of hikes.value) {
    if (h.photoCount) {
      count += h.photoCount
    }
  }
  return count
})
</script>

<template>
  <div class="summary-wrapper">
    <button @click="previous"><</button>
    <div>
      <h2>Total:</h2>
    </div>
    <button @click="next">></button>
  </div>

  <div v-if="goals && hikes">
    <h2>{{ goals?.type ?? 'none' }}</h2>
    <div class="wrapper">
      <progress-bar
        :key="goals.type + 'distance'"
        :current="totalMiles"
        :target="Math.round(goals.distanceMetersTarget / 1609.344)"
        :color="'#4de375'"
        :unit="'miles'"
      ></progress-bar>
      <progress-bar
        :key="goals.type + 'hikes'"
        :current="totalHikes"
        :target="goals?.hikesTarget"
        :color="'#be4de3'"
        :unit="'hikes'"
      ></progress-bar>
      <progress-bar
        :key="goals.type + 'photos'"
        :current="totalPhotos"
        :target="goals?.photosTarget"
        :color="'#4d78e3'"
        :unit="'photo'"
      ></progress-bar>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
.summary-wrapper {
  height: 35vh;
  display: flex;
  justify-content: space-between;
}
.summary-wrapper button {
  height: 100%;
}
</style>
