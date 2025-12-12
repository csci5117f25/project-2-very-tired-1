<script setup>
// --- props ---
const props = defineProps({
  count1: { type: Number, required: true },
  count2: { type: Number, required: true },
})
</script>

<template>
  <div class="long-entry">
    <div class="long-entry-div">
      <div class="long-entry-content">
        <p class="value">{{ count1 || 0 }}</p>
        <slot name="svg1"></slot>
      </div>
      <h2 class="long-entry-label">Total Distance</h2>
    </div>

    <div class="long-entry-div">
      <div class="long-entry-content">
        <p class="value">{{ count2 || 0 }}</p>
        <slot name="svg2"></slot>
      </div>
      <h2 class="long-entry-label">Total Elevation</h2>
    </div>
  </div>
</template>

<style scoped>
.long-entry {
  width: 48%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  align-self: stretch;
  background-color: rgb(33, 31, 31);
  border-radius: 15px;
  padding: 16px;
}

.long-entry-content {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
}

.long-entry-label {
  font-size: 1rem;
  margin-top: 6px;
  text-align: center;
}
</style>
