<script setup>
import BaseCard from '@/components/BaseCard.vue'
import ProfilePic from '@/components/ProfilePic.vue'
</script>

<template>
  <div class="rows">
    <div class="row">
      <div class="profile-column">
        <profile-pic :size="150" />
      </div>
      <base-card link="" size="half">Place Holder for weather</base-card>
    </div>

    <div class="row">
      <base-card link="/previousHikes" size="full">Previous Hikes</base-card>
    </div>

    <div class="row">
      <base-card link="" size="full">Calendar</base-card>
    </div>

    <div class="row">
      <base-card link="/startHike" size="half">Start hike</base-card>
      <base-card link="" size="half">Goals</base-card>
    </div>
  </div>
</template>

<style scoped>
.rows {
  display: flex;
  flex-direction: column;
  gap: 25px;
  height: 100vh;
  padding: 5vh 3vw 10vh 3vw;
}

.row {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.profile-column {
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
