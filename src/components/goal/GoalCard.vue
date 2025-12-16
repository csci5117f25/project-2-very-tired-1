<script setup>
// --- props ---
defineProps({
  unit: { type: String, required: true },
  count: { type: Number, required: true },
})
</script>

<template>
  <div class="entry-div box mb-0">
    <p class="value">{{ count }}</p>
    <p class="entry-label">Total {{ unit }}</p>
  </div>
</template>

<style scoped>
.entry-div {
  overflow: hidden;
  border: var(--card-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
  border-radius: 15px;
  padding: 10px;
}

.entry-div p {
  text-align: center;
}

.entry-div .value {
  font-size: 3rem;
}
</style>
