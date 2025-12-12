<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGeolocation } from '@vueuse/core'

const city = ref('')
const temp = ref(null)
const tempF = ref(null)
const feelsLike = ref(null)
const wind = ref(null)
const rainChance = ref(null)
const description = ref('')
const iconUrl = ref('')
const loading = ref(true)

const { coords } = useGeolocation({ immediate: true, enableHighAccuracy: true })

// Dynamic background color based on conditions
const bgClass = computed(() => {
  const d = description.value.toLowerCase()
  const t = tempF.value
  if (d.includes('thunder') || d.includes('storm')) return 'bg-storm'
  if (d.includes('snow')) return 'bg-snow'
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return 'bg-rain'
  if (d.includes('cloud') || d.includes('overcast') || d.includes('fog')) return 'bg-cloudy'
  if (t && t > 80) return 'bg-hot'
  if (t && t < 40) return 'bg-cold'
  return 'bg-clear' // sunny/clear
})

// Icon selection logic
const isCold = computed(() => tempF.value && tempF.value < 50)
const isSnow = computed(() => tempF.value && tempF.value < 32)

function getIcon(forecast, isDay) {
  const f = forecast.toLowerCase()
  if (f.includes('thunder') || f.includes('storm')) return 'thunder.svg'
  if (f.includes('snow') || f.includes('flurr')) return isDay ? 'snowy-1.svg' : 'snowy-5.svg'
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return isDay ? 'rainy-1.svg' : 'rainy-5.svg'
  if (f.includes('cloud') || f.includes('overcast')) return isDay ? 'cloudy-day-1.svg' : 'cloudy-night-1.svg'
  if (f.includes('fog') || f.includes('mist') || f.includes('haze')) return 'cloudy.svg'
  if (f.includes('partly') || f.includes('mostly sunny') || f.includes('mostly clear')) return isDay ? 'cloudy-day-1.svg' : 'cloudy-night-1.svg'
  return isDay ? 'day.svg' : 'night.svg'
}

function calcFeelsLike(t, v, rh) {
  if (t < 50 && v > 3) {
    return 35.74 + 0.6215 * t - 35.75 * Math.pow(v, 0.16) + 0.4275 * t * Math.pow(v, 0.16)
  }
  if (t > 80) {
    let hi = -42.379 + 2.04901523 * t + 10.14333127 * rh
           - 0.22475541 * t * rh - 0.00683783 * t * t
           - 0.05481717 * rh * rh + 0.00122874 * t * t * rh
           + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh
    if (rh < 13 && t >= 80 && t <= 112) {
      hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17)
    } else if (rh > 85 && t >= 80 && t <= 87) {
      hi += ((rh - 85) / 10) * ((87 - t) / 5)
    }
    return hi
  }
  return t
}

async function fetchWeather(lat, lon) {
  const pointsRes = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`)
  const points = await pointsRes.json()
  city.value = points.properties.relativeLocation.properties.city

  const stationsRes = await fetch(points.properties.observationStations)
  const stations = await stationsRes.json()
  const stationId = stations.features[0].properties.stationIdentifier

  const obsRes = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`)
  const obs = await obsRes.json()
  const props = obs.properties

  const forecastRes = await fetch(points.properties.forecastHourly)
  const forecast = await forecastRes.json()
  const current = forecast.properties.periods[0]

  const tempC = props.temperature?.value
  tempF.value = tempC != null ? (tempC * 9/5) + 32 : null
  temp.value = tempF.value != null ? Math.round(tempF.value) : '--'

  const windMph = parseInt(current.windSpeed.replace(/\D+$/, '')) || 0
  wind.value = `${windMph}mph`

  const rh = props.relativeHumidity?.value
  feelsLike.value = (tempF.value != null && rh != null)
    ? Math.round(calcFeelsLike(tempF.value, windMph, rh))
    : '--'

  const precip = current.probabilityOfPrecipitation?.value
  rainChance.value = precip != null ? precip : 0

  description.value = props.textDescription || 'Clear'
  const hour = new Date().getHours()
  const isDay = hour >= 6 && hour < 20
  iconUrl.value = `/weather-icons/${getIcon(description.value, isDay)}`

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
  <div class="weather-widget" :class="{ [bgClass]: !loading }">
    <div v-if="loading" class="loading-state">
      <img src="/icons/cloud-off.svg" alt="loading">
      <span>Gathering weather data</span>
    </div>
    <template v-else>
      <!-- Background SVG -->
      <img :src="iconUrl" class="weather-icon-bg" alt="weather" />

      <!-- Center content: temp + city -->
      <div class="center-content">
        <p class="temp">{{ temp }}<span class="degree">°</span></p>
        <p class="city-name">{{ city }}</p>
      </div>

      <div class="bottom-bar">
        <div class="stat">
          <img :src="`/icons/${isSnow ? 'cloud-snow' : 'cloud-hail'}.svg`" alt="precipitation">
          <span>{{ rainChance }}%</span>
        </div>
        <div class="stat">
          <img :src="`/icons/${isCold ? 'thermometer-snowflake' : 'thermometer-sun'}.svg`" alt="feels like">
          <span>{{ feelsLike }}°</span>
        </div>
        <div class="stat">
          <img src="/icons/wind.svg" alt="wind">
          <span>{{ wind }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.weather-widget {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  border-radius: 12px;
  transition: background-color 0.3s;
  overflow: hidden;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: color-mix(in srgb, var(--bulma-text) 60%, transparent);
}

.loading-state img {
  width: 40px;
  height: 40px;
  opacity: 0.6;
}

.loading-state span {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Weather backgrounds using Bulma colors with transparency */
.bg-storm { background-color: color-mix(in srgb, var(--bulma-grey-dark) 50%, transparent); }
.bg-snow { background-color: color-mix(in srgb, var(--bulma-info) 40%, transparent); }
.bg-rain { background-color: color-mix(in srgb, var(--bulma-link) 40%, transparent); }
.bg-cloudy { background-color: color-mix(in srgb, var(--bulma-grey-light) 50%, transparent); }
.bg-hot { background-color: color-mix(in srgb, var(--bulma-warning) 50%, transparent); }
.bg-cold { background-color: color-mix(in srgb, var(--bulma-info-light) 50%, transparent); }
.bg-clear { background-color: color-mix(in srgb, var(--bulma-warning-light) 60%, transparent); }

.weather-icon-bg {
  position: absolute;
  inset-inline-start: -10px;
  inset-block-start: -20px;
  width: 120px;
  height: 120px;
  opacity: 1;
  z-index: 0;
  pointer-events: none;
  object-fit: contain;
}

.center-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8px;
  z-index: 1;
}

.temp {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0;
  color: color-mix(in srgb, var(--bulma-text-strong) 85%, transparent);
  line-height: 1;
}

.degree {
  font-size: 2rem;
  vertical-align: super;
}

.city-name {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 4px 0 0 0;
  color: color-mix(in srgb, var(--bulma-text) 60%, transparent);
}

.bottom-bar {
  display: flex;
  justify-content: space-evenly;
  background: color-mix(in srgb, var(--bulma-scheme-invert) 10%, transparent);
  border-radius: 8px;
  padding: 6px 0;
  z-index: 1;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: color-mix(in srgb, var(--bulma-text-strong) 85%, transparent);
}

.stat img {
  width: 20px;
  height: 20px;
  opacity: 0.8;
}

.stat span {
  font-size: 0.65rem;
  font-weight: 600;
}
</style>
