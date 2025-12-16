<script setup>
// --- props ---
defineProps({
  count1: { type: Number, required: true },
  count2: { type: Number, required: true },
})
</script>

<template>
  <div class="long-entry has-background-primary">
    <div class="long-entry-div">
      <div class="long-entry-content">
        <p class="value has-text-dark has-text-weight-bold">{{ count1 }}</p>
        <slot name="svg1"></slot>
      </div>
      <h2 class="long-entry-label has-text-dark">Total Distance (km)</h2>
    </div>

    <div class="long-entry-div">
      <div class="long-entry-content">
        <p class="value has-text-dark has-text-weight-bold">{{ count2 }}</p>
        <slot name="svg2"></slot>
      </div>
      <h2 class="long-entry-label has-text-dark">Total Elevation (m)</h2>
    </div>
  </div>
</template>

<style scoped>
.long-entry {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  border-radius: 15px;

  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
}

.long-entry-content {
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.long-entry-label {
  font-size: 1rem;
  margin-top: 6px;
  text-align: center;
}

.value {
  font-size: 2rem;
}
</style>
