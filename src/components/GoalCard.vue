<script setup>
// --- props ---
const props = defineProps({
  unit: { type: String, required: true },
  count: { type: Number, required: true },
})
</script>

<template>
  <div class="entry-div">
    <p class="value">{{ count || 0 }}</p>
    <p class="entry-label">Total {{ unit || 'null' }}</p>
  </div>
</template>

<style scoped>
.entry-div {
  border-radius: 15px;
  background-color: rgb(33, 31, 31);
  padding: 12px;
}
.entry-div p {
  display: block;
  text-align: center;
}

.entry-div .value {
  font-size: 3rem;
  color: rgb(255, 255, 255);
}
</style>
