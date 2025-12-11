<script setup>
import { ref, computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useAuth } from '@/composables/useAuth'
import ProgressBar from '@/components/ProgressBar.vue'

const { user } = useAuth()

const uid = computed(() => user.value?.uid)

const type = ref('weekly')

const current = new Date()
const year = current.getFullYear()
const month = current.getMonth()
const day = current.getDay()

const { goals } = useGoals(uid, type)

let start,
  end = ''

if (type.value === 'year') {
  start = new Date(year, 0, 1)
  end = new Date(year + 1, 0, 1)
} else if (type.value === 'month') {
  start = new Date(year, month, 1)
  end = new Date(year, month + 1, 1)
} else {
  const first = current.getDate() - current.getDay()

  start = new Date(current)
  start.setDate(first)
  start.setHours(0, 0, 0, 0)

  end = new Date(start)
  end.setDate(start.getDate() + 7)
  end.setHours(0, 0, 0, 0)
}
</script>

<template>
  <div v-if="goals">
    <h2>{{ goals?.type ?? 'none' }}</h2>
    <div class="wrapper">
      <progress-bar
        :current="0"
        :target="Math.round(goals.distanceMetersTarget / 1609.344)"
        :color="'#4de375'"
        :unit="'miles'"
      ></progress-bar>
      <progress-bar
        :current="1"
        :target="goals?.hikesTarget"
        :color="'#be4de3'"
        :unit="'hikes'"
      ></progress-bar>
      <progress-bar
        :current="3"
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
</style>
