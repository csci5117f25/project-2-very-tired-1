<script setup>
import { ref, onMounted } from 'vue'
import { useGeolocation } from '@vueuse/core'

const API_KEY = '81cb7afcff678f180d84075e6a6dae9c'

const iconMap = {
  '01d': 'day.svg', '01n': 'night.svg',
  '02d': 'cloudy-day-1.svg', '02n': 'cloudy-night-1.svg',
  '03d': 'cloudy.svg', '03n': 'cloudy.svg',
  '04d': 'cloudy.svg', '04n': 'cloudy.svg',
  '09d': 'rainy-6.svg', '09n': 'rainy-6.svg',
  '10d': 'rainy-1.svg', '10n': 'rainy-5.svg',
  '11d': 'thunder.svg', '11n': 'thunder.svg',
  '13d': 'snowy-1.svg', '13n': 'snowy-5.svg',
  '50d': 'cloudy.svg', '50n': 'cloudy.svg',
}

const city = ref('')
const temp = ref(null)
const feelsLike = ref(null)
const wind = ref(null)
const humidity = ref(null)
const iconUrl = ref('')
const loading = ref(true)

const { coords } = useGeolocation({ immediate: true, enableHighAccuracy: true })

async function fetchWeather(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
    { cache: 'no-store' }
  )
  const data = await res.json()
  city.value = data.name
  temp.value = Math.round(data.main.temp)
  feelsLike.value = Math.round(data.main.feels_like)
  wind.value = Math.round(data.wind.speed)
  humidity.value = data.main.humidity
  iconUrl.value = `/weather-icons/${iconMap[data.weather[0].icon] || 'day.svg'}`
  loading.value = false
}

onMounted(() => {
  const interval = setInterval(() => {
    if (coords.value.latitude !== Infinity) {
      clearInterval(interval)
      fetchWeather(coords.value.latitude, coords.value.longitude)
    }
  }, 100)
  setTimeout(() => clearInterval(interval), 10000)
})
</script>

<template>
  <div class="weather-widget box">
    <span v-if="loading" class="has-text-grey">Loading...</span>
    <template v-else>
      <p class="city-name has-text-grey">{{ city }}</p>
      <img :src="iconUrl" class="weather-icon" alt="weather" />
      <p class="temp has-text-dark">{{ temp }}°F</p>
      <div class="stats">
        <div class="stat">
          <span class="has-text-grey">Feels</span>
          <span class="has-text-grey">{{ feelsLike }}°</span>
        </div>
        <div class="stat">
          <span class="has-text-grey">Wind</span>
          <span class="has-text-grey">{{ wind }}mph</span>
        </div>
        <div class="stat">
          <span class="has-text-grey">Humidity</span>
          <span class="has-text-grey">{{ humidity }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.weather-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 0.25rem;
}
.city-name { font-size: 0.8rem; margin: 0; }
.weather-icon { width: 85px; height: 85px; }
.temp { font-size: 0.9rem; font-weight: 600; margin: 0; margin-top: -8px; }
.stats { display: flex; justify-content: space-around; width: 100%; margin-top: 12px; }
.stat { display: flex; flex-direction: column; align-items: center; font-size: 0.7rem; }
</style>
