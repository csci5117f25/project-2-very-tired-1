<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const SPLASH_DURATION_MS = 3000
const isVisible = ref(true)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = false
    if (user.value) {
      router.replace('/home')
    } else {
      router.replace('/login')
    }
  }, SPLASH_DURATION_MS)
})
</script>

<template>
  <section v-if="isVisible" class="hero is-fullheight">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="splash-content">
          <div class="logo-placeholder">T L</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.splash-content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.logo-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px dashed #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0.35em;
  color: #111;
}
</style>
