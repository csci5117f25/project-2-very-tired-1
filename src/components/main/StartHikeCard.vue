<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const startHike = () => {
  router.push('/startHike')
}
</script>

<template>
  <div class="action-card" @click="startHike">
    <div class="card-content">
      <div class="content-wrapper">
        <div class="icon-wrapper">
          <img src="/icons/hiker.svg" alt="Start Hike" class="hiker-icon" />
        </div>
        <div class="text-wrapper">
          <p class="text-name has-text-weight-extrabold is-size-4">Start Hike</p>
          <p class="text-description subtitle is-size-6">Record your adventure</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-card {
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
  background-color: var(--bulma-text-15-soft);
  position: relative;
  padding: 5px;
}

.card-content {
  height: 100%;
  padding: 14px;
  display: flex;
}

.content-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-wrapper {
  background: var(--bulma-primary);
  padding: 12px;
  border-radius: 12px;
  display: flex;
}

.hiker-icon {
  width: 32px;
  height: 32px;
}

.text-wrapper {
  flex: 1;
}

@media (max-width: 500px) {
  .card-content {
    height: 100%;
    padding: 5px;
    display: flex;
  }
  .content-wrapper {
    gap: 10px;
  }
  .hiker-icon {
    width: 25px;
    height: 25px;
  }
  .text-name {
    font-size: 1.2rem !important;
  }

  .text-description {
    font-size: 0.9rem !important;
  }
}
</style>
