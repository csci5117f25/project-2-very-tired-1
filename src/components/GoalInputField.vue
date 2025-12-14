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

// --- auth ---
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

// --- methods ---
async function updateGoal() {
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
      <h2 class="has-text-dark">{{ unit }}:</h2>
    </div>

    <div class="setting-input">
      <input v-model.number="count" class="has-text-dark" />
    </div>

    <div class="setting-btn">
      <button class="button is-small is-white is-outlined" @click="updateGoal">Update</button>
    </div>
  </div>
</template>

<style scoped>
.setting-label {
  width: 25vw;
  font-size: 1.2rem;
  color: var(--color);
}

.setting-input {
  width: 50vw;
}

.setting-input input {
  background-color: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  font-weight: bold;
  border-radius: 20px;
  height: 28px;
  text-align: center;
  width: 45vw;
  transition: border 0.2s ease;
}

.setting-input input:focus {
  outline: none;
  border: 3px solid #ccc;
}

.setting-btn button {
  font-weight: bold;
}
</style>
