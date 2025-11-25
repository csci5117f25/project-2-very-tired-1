<script setup>
// --- imports ---
import { computed } from 'vue'
import router from '@/router'

// --- Props ---
const props = defineProps({
  link: { type: String, required: true },
  size: {
    type: String,
    default: 'full',
  },
})

// --- Computed ---
const computedWidth = computed(() => {
  return props.size === 'full' ? '100%' : '50%'
})

// --- Methods ---
const goToLink = () => {
  router.push(props.link)
}
</script>
<template>
  <div class="wrapper has-background-primary" :style="{ width: computedWidth }" @click="goToLink">
    <h3 class="title is-4 has-text-dark"><slot></slot></h3>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90%;
  border-radius: 20px;
}

.wrapper h3 {
  text-align: center;
}
</style>
