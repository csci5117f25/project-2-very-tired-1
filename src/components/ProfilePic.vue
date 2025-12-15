<script setup>
// --- Props ---
const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: 'Profile Picture' },
  userName: { type: String, required: true },
})

const srcToUse = props.src
console.log(props.src)
</script>

<template>
  <div class="avatar-wrapper">
    <div class="avatar-ring">
      <img :src="srcToUse" :alt="alt" class="avatar-img" referrerpolicy="no-referrer" />
    </div>
  </div>
</template>

<style scoped>
.avatar-wrapper {
  height: 100%;
}

.avatar-ring {
  height: 90%;
  aspect-ratio: 1 / 1;
  display: flex;

  padding: 4.5px;
  border-radius: 50%;
  background-color: var(--bulma-primary);
}

.avatar-img {
  height: 100%;
  border-radius: 50%;
  border: 5px solid var(--bulma-background);
  box-sizing: border-box;
}
</style>
