<script setup>
// --- Props ---
const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: 'Profile Picture' },
  size: { type: Number, default: 150 },
})

const srcToUse = props.src || '/pwa-512x512.png'
</script>

<template>
  <div class="avatar-wrapper" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="srcToUse" :alt="alt" class="avatar-img" />
  </div>
</template>

<style scoped>
.avatar-wrapper {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
