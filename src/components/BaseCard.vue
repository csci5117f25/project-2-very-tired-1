<script setup>
// --- imports ---
import { computed } from 'vue'
import router from '@/router'

// --- Props ---
const props = defineProps({
  link: { type: String, required: true },
  title: { type: String, required: true },
  source: { type: String },
  size: {
    type: String,
    default: 'full',
  },
  backgroundColor: { type: String, default: null },
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
  <div
    class="card-wrapper"
    :class="{ 'has-background-primary': !backgroundColor }"
    :style="{
      width: computedWidth,
      backgroundColor: backgroundColor || undefined
    }"
    :data-size="size"
    @click="goToLink"
  >
    <div class="card-title">
      <h3 class="title is-4 has-text-dark">{{ title }}</h3>
    </div>

    <div class="card-icon" v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.card-wrapper {
  position: relative;
  overflow: hidden;
  display: flex;
  height: 100%;
  border-radius: 20px;
  border: 2px solid var(--bulma-border);
  box-shadow: 0 4px 12px var(--bulma-text-50);
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  cursor: pointer;
}

.card-title {
  display: flex;
  align-items: center;
  width: 30%;
}

.card-icon::v-deep svg {
  width: clamp(80px, 15vw, 150px);
  height: auto;
}

.card-icon {
  transform: translateY(10vh);
  transition: transform 0.3s ease;
}

.card-wrapper:hover .card-icon {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .card-wrapper[data-size='half'] .card-icon {
    display: none;
  }
  .card-title {
    width: 65%;
  }
  .card-icon {
    transform: translateY(0);
  }
}

@media (hover: none) {
  .card-wrapper .card-icon {
    transform: translateY(0) !important;
  }
}
</style>
