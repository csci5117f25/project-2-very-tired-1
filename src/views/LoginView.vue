<script setup>
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, signIn } = useAuth()
const signingIn = ref(false)

watchEffect(() => {
  if (user.value) router.replace('/')
})

async function handleGoogle() {
  signingIn.value = true
  try {
    await signIn()
  } finally {
    signingIn.value = false
  }
}
</script>

<template>
  <section class="hero is-fullheight">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="login-content">
          <img src="/logo.png" alt="TrailLens" class="logo-img" />
          <b-button
            class="login-button"
            icon-left="google"
            :loading="signingIn"
            @click="handleGoogle"
          >
            Continue with Google
          </b-button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-content {
  max-width: 360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  padding: 2.5rem 2rem;
}

.logo-img {
  width: 200px;
  height: auto;
}

.login-button.button {
  justify-content: center;
  width: 100%;
  font-weight: 600;
}
</style>
