<script setup>
// --- props ---
defineProps({
  unit: { type: String, required: true },
  count: { type: Number, required: true },
})
</script>

<template>
  <div class="entry-div has-background-primary">
    <p class="value has-text-dark">{{ count }}</p>
    <p class="entry-label has-text-dark">Total {{ unit }}</p>
  </div>
</template>

<style scoped>
.entry-div {
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
