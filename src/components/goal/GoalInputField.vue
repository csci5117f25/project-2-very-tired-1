<script setup>
// --- imports ---
import { updateDoc, doc } from 'firebase/firestore'
import { computed, ref } from 'vue'
import { db } from '@/firebase_conf'
import { useAuth } from '@/composables/useAuth'

// --- props ---
const props = defineProps({
  type: { type: String, required: true },
  unit: { type: String, required: true },
  color: { type: String, required: true },
  target: { type: [Number, String], required: true },
})

// --- fieldName mapping ---
let fieldName
switch (props.unit) {
  case 'Hikes':
    fieldName = 'hikesTarget'
    break
  case 'Photos':
    fieldName = 'photosTarget'
    break
  case 'Distance':
    fieldName = 'distanceKmTarget'
    break
}

// --- state ---
const count = ref(props.target)
const invalid = ref(false)
// --- auth ---
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

// --- methods ---
async function updateGoal() {
  if (!/^\d+$/.test(count.value) || count.value === 0) {
    invalid.value = true
    return
  }
  try {
    const goalRef = doc(db, 'users', uid.value, 'goals', props.type)

    await updateDoc(goalRef, {
      [fieldName]: Number(count.value),
    })
  } catch (e) {
    console.error('Failed to update goal on click:', e)
  }
}
</script>

<template>
  <div class="setting-entry">
    <div class="setting-label">
      <h2>{{ unit }}:</h2>
    </div>

    <div class="setting-input" :class="{ invalid: invalid }">
      <input
        v-model.number="count"
        class="has-text-dark"
        inputmode="numeric"
        @input="invalid = false"
      />
    </div>

    <div class="setting-btn">
      <button class="button is-small is-white is-outlined" @click="updateGoal">Update</button>
    </div>
  </div>
</template>

<style scoped>
.setting-entry {
  margin: 0px 20px 0px 20px;
}
.setting-label {
  width: 25%;
  font-size: 1.2rem;
  color: var(--color);
}

.setting-input {
  width: 50vw;
}

.setting-input input {
  background-color: rgba(209, 207, 207, 0.8);
  border: 2px solid transparent;
  border-radius: 20px;
  height: 28px;
  text-align: center;
  width: 90%;
  transition: border 0.2s ease;
  font-size: 17px;
}

.setting-input input:focus {
  outline: none;
  border: 3px solid #ccc;
}

.setting-input.invalid input {
  border: 3px solid #e58484;
}

.setting-btn button {
  font-weight: bold;
}

@media (prefers-color-scheme: light) {
  .setting-btn button {
    border-color: #000;
    color: #000;
  }
}

@media (max-width: 550px) {
  .setting-entry {
    margin: 0;
  }
}
</style>
