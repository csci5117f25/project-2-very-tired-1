<script setup>
const props = defineProps({
  photo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['open-modal'])

function handleClick() {
  if (props.photo?.downloadURL) {
    emit('open-modal', props.photo)
  }
}
</script>

<template>
  <div class="photo-container" @click="handleClick">
    <img
      v-if="photo?.downloadURL"
      :src="photo.downloadURL"
      :alt="photo.description || 'Hike photo'"
      class="photo-image"
    />
    <div v-else class="no-image-placeholder">
      <b-icon icon="image" size="is-large"></b-icon>
      <span>Image unavailable</span>
    </div>
    <div class="click-hint" v-if="photo?.downloadURL">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
      <span>Tap to enlarge</span>
    </div>
  </div>
</template>

<style scoped>
.photo-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--bulma-text-10);
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--bulma-text-40);
}

.click-hint {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.photo-container:hover .click-hint {
  opacity: 1;
}

.click-hint svg {
  width: 14px;
  height: 14px;
}
</style>
