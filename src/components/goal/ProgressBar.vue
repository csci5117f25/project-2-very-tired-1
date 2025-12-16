<script setup>
import { computed } from 'vue'
const props = defineProps({
  color: { type: String, required: true },
  unit: { type: String, required: true },
  current: { type: Number, required: true },
  target: { type: Number, required: true },
  size: { type: String, default: 'full' },
})

const percent = computed(() => {
  return Math.min(100, Math.max(0, (props.current / props.target) * 100))
})
</script>

<template>
  <!-- https://nikitahl.github.io/svg-circle-progress-generator/ -->
  <div class="container">
    <div class="progress-wrapper">
      <svg viewBox="0 0 120 120">
        <circle
          class="inner-ring"
          stroke="rgba(255, 255, 255, 0.3)"
          stroke-width="10"
          fill="transparent"
          r="50"
          cx="60"
          cy="60"
        />
        <circle
          class="progress-ring"
          :stroke="color"
          stroke-width="10"
          fill="transparent"
          r="50"
          cx="60"
          cy="60"
          pathLength="100"
          :style="{
            strokeDasharray: '100',
            strokeDashoffset: 100 - percent,
          }"
        />
      </svg>
      <div class="progress-text">
        <h3 class="has-text-dark">
          {{ current }}<span>/{{ target }}</span>
        </h3>
        <h4 class="units">{{ unit.toUpperCase() }}</h4>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.progress-wrapper {
  position: relative;
  width: 100%;
  max-width: 120px;
  aspect-ratio: 1;
}

.progress-ring {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  stroke-linecap: round;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-text h3 {
  font-size: 1.3rem;
  font-weight: 500;
  line-height: 1;
}

.progress-text h3 span {
  font-size: 0.5em;
}

.units {
  color: v-bind(color);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.inner-ring {
  stroke: rgba(209, 207, 207, 0.8);
}
</style>
