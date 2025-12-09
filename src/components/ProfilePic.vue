<script setup>
// --- Props ---
const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: 'Profile Picture' },
  size: { type: Number, default: 150 },
})

const srcToUse = props.src
console.log(props.src)
</script>

<template>
  <div class="avatar-wrapper" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="srcToUse" :alt="alt" class="avatar-img" referrerpolicy="no-referrer" />
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

.avatar-img {
  border-radius: 50%;
}
</style>
