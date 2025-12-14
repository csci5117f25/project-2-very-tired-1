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
    <div class="userName">{{ userName }}</div>
  </div>
</template>

<style scoped>
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.avatar-ring {
  height: 80%;
  display: flex;

  padding: 4.5px;
  border-radius: 50%;
  background-color: var(--bulma-primary);
}

.avatar-img {
  border-radius: 50%;
  border: 5px solid var(--bulma-background);
  box-sizing: border-box;
}

.userName {
  border-radius: 5px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.3rem;
  font-weight: 550;
  color: var(--bulma-text);
}
</style>
