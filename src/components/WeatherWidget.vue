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
const hasError = ref(false)
const isDay = ref(true) // Track day/night state

const emit = defineEmits(['loaded'])

const { coords } = useGeolocation({ immediate: true, enableHighAccuracy: true })

// Dynamic background color based on conditions AND time of day
const bgClass = computed(() => {
  const d = description.value.toLowerCase()
  const t = tempF.value
  const isDayTime = isDay.value

  if (d.includes('thunder') || d.includes('storm')) return isDayTime ? 'bg-storm' : 'bg-storm-night'
  if (d.includes('snow')) return isDayTime ? 'bg-snow' : 'bg-snow-night'
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return isDayTime ? 'bg-rain' : 'bg-rain-night'
  if (d.includes('cloud') || d.includes('overcast') || d.includes('fog')) return isDayTime ? 'bg-cloudy' : 'bg-cloudy-night'
  if (t && t > 80) return isDayTime ? 'bg-hot' : 'bg-hot-night'
  if (t && t < 40) return isDayTime ? 'bg-cold' : 'bg-cold-night'
  return isDayTime ? 'bg-clear' : 'bg-clear-night'
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

// Sunrise/Sunset calculation - Used Claude AI to generate math formulas and verify the formula
// Source: https://edwilliams.org/sunrise_sunset_algorithm.htm (US Naval Observatory)
function calculateSunTimes(lat, lng, date = new Date()) {
  const toRad = (deg) => deg * Math.PI / 180
  const toDeg = (rad) => rad * 180 / Math.PI

  // Day of year
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))

  // Longitude to hour value
  const lngHour = lng / 15

  function calcTime(isRising) {
    // Approximate time
    const t = dayOfYear + ((isRising ? 6 : 18) - lngHour) / 24

    // Sun's mean anomaly
    const M = (0.9856 * t) - 3.289

    // Sun's true longitude
    let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2 * M))) + 282.634
    L = ((L % 360) + 360) % 360

    // Right ascension
    let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))))
    RA = ((RA % 360) + 360) % 360

    // RA in same quadrant as L
    const Lquadrant = Math.floor(L / 90) * 90
    const RAquadrant = Math.floor(RA / 90) * 90
    RA = RA + (Lquadrant - RAquadrant)
    RA = RA / 15

    // Declination
    const sinDec = 0.39782 * Math.sin(toRad(L))
    const cosDec = Math.cos(Math.asin(sinDec))

    // Hour angle
    const zenith = 90.833 // Official zenith
    const cosH = (Math.cos(toRad(zenith)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)))

    if (cosH > 1 || cosH < -1) return null // Sun never rises/sets

    let H = toDeg(Math.acos(cosH))
    if (isRising) H = 360 - H
    H = H / 15

    // Local mean time
    const T = H + RA - (0.06571 * t) - 6.622

    // UTC
    let UT = T - lngHour
    UT = ((UT % 24) + 24) % 24

    // Convert to local time
    const offset = -date.getTimezoneOffset() / 60
    let localT = UT + offset
    localT = ((localT % 24) + 24) % 24

    return localT // Hours (e.g., 6.5 = 6:30 AM)
  }

  return {
    sunrise: calcTime(true),
    sunset: calcTime(false)
  }
}
// End Claude AI validated math formulas for sunrise/sunset calculation

function isDaytimeByLocation(lat, lng) {
  const { sunrise, sunset } = calculateSunTimes(lat, lng)
  if (sunrise === null || sunset === null) return true // Default to day

  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60

  return currentHour >= sunrise && currentHour < sunset
}

// Feels like temperature calculation - Used Claude AI to generate math formulas and verify the formula
// Reference: https://climate.umt.edu/mesonet/ag_tools/feels_like/
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
// End Claude AI validated math formulas for feels like temperature calculation

async function fetchWeather(lat, lon) {
  console.log('Fetching weather for:', lat, lon)
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

  // Wind: Try observation station first (more accurate), fall back to forecast
  let windMph = 0
  const obsWindSpeed = props.windSpeed?.value
  if (obsWindSpeed != null) {
    windMph = Math.round(obsWindSpeed * 0.621371) // km/h to mph
  } else {
    windMph = parseInt(current.windSpeed.replace(/\D+$/, '')) || 0
  }
  wind.value = `${windMph}mph`

  const rh = props.relativeHumidity?.value
  feelsLike.value = (tempF.value != null && rh != null)
    ? Math.round(calcFeelsLike(tempF.value, windMph, rh))
    : '--'

  const precip = current.probabilityOfPrecipitation?.value
  rainChance.value = precip != null ? precip : 0

  description.value = props.textDescription || 'Clear'

  // Determine day/night using astronomical calculation
  const sunTimes = calculateSunTimes(lat, lon)
  isDay.value = isDaytimeByLocation(lat, lon)

  console.log('Sunrise/Sunset calculation:', {
    sunrise: `${Math.floor(sunTimes.sunrise)}:${String(Math.round((sunTimes.sunrise % 1) * 60)).padStart(2, '0')}`,
    sunset: `${Math.floor(sunTimes.sunset)}:${String(Math.round((sunTimes.sunset % 1) * 60)).padStart(2, '0')}`,
    isDaytime: isDay.value
  })

  iconUrl.value = `/weather-icons/${getIcon(description.value, isDay.value)}`

  loading.value = false
  emit('loaded')
}

onMounted(() => {
  const interval = setInterval(() => {
    if (coords.value.latitude !== Infinity) {
      clearInterval(interval)
      fetchWeather(coords.value.latitude, coords.value.longitude).catch(() => {
        hasError.value = true
        loading.value = false
        emit('loaded')
      })
    }
  }, 100)
  // Timeout fallback - emit loaded even if geolocation fails
  setTimeout(() => {
    clearInterval(interval)
    if (loading.value) {
      hasError.value = true
      loading.value = false
      emit('loaded')
    }
  }, 10000)
})

</script>

<template>
  <div class="weather-widget" :class="{ [bgClass]: !loading && !hasError }">
    <div v-if="loading" class="loading-state">
      <img src="/icons/cloud-off.svg" alt="loading">
      <span>Gathering weather data</span>
    </div>
    <div v-else-if="hasError" class="loading-state">
      <img src="/icons/cloud-off.svg" alt="unavailable" class="error-icon">
      <span>Weather data unavailable</span>
    </div>
    <template v-else>
      <!-- Background SVG -->
      <img :src="iconUrl" class="weather-icon-bg" alt="weather" />

      <!-- Top right: Weather description -->
      <div class="weather-description-top">{{ description }}</div>

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
  border-radius: var(--card-border-radius);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
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

.error-icon {
  filter: invert(27%) sepia(94%) saturate(5086%) hue-rotate(354deg) brightness(91%) contrast(119%);
}


/* Weather backgrounds using Bulma colors with transparency */
/* Day backgrounds */
.bg-storm { background-color: color-mix(in srgb, var(--bulma-grey-dark) 50%, transparent); }
.bg-snow { background-color: color-mix(in srgb, var(--bulma-info) 40%, transparent); }
.bg-rain { background-color: color-mix(in srgb, var(--bulma-link) 40%, transparent); }
.bg-cloudy { background-color: color-mix(in srgb, var(--bulma-grey-light) 50%, transparent); }
.bg-hot { background-color: color-mix(in srgb, var(--bulma-warning) 50%, transparent); }
.bg-cold { background-color: color-mix(in srgb, var(--bulma-info-light) 50%, transparent); }
.bg-clear { background-color: color-mix(in srgb, var(--bulma-warning-light) 60%, transparent); }

/* Night backgrounds - darker variants */
.bg-storm-night { background-color: color-mix(in srgb, var(--bulma-dark) 70%, transparent); }
.bg-snow-night { background-color: color-mix(in srgb, var(--bulma-link-dark) 50%, transparent); }
.bg-rain-night { background-color: color-mix(in srgb, var(--bulma-link-dark) 50%, transparent); }
.bg-cloudy-night { background-color: color-mix(in srgb, var(--bulma-grey-dark) 60%, transparent); }
.bg-hot-night { background-color: color-mix(in srgb, var(--bulma-warning-dark) 60%, transparent); }
.bg-cold-night { background-color: color-mix(in srgb, var(--bulma-info-dark) 60%, transparent); }
.bg-clear-night { background-color: color-mix(in srgb, var(--bulma-link-dark) 50%, transparent); }

/* Night mode - lighter text colors for dark backgrounds */
.bg-storm-night .temp,
.bg-snow-night .temp,
.bg-rain-night .temp,
.bg-cloudy-night .temp,
.bg-hot-night .temp,
.bg-cold-night .temp,
.bg-clear-night .temp {
  color: var(--bulma-white);
}

.bg-storm-night .stat,
.bg-snow-night .stat,
.bg-rain-night .stat,
.bg-cloudy-night .stat,
.bg-hot-night .stat,
.bg-cold-night .stat,
.bg-clear-night .stat {
  color: var(--bulma-white);
}

/* Night mode - enhance icon visibility */
.bg-storm-night .weather-icon-bg,
.bg-snow-night .weather-icon-bg,
.bg-rain-night .weather-icon-bg,
.bg-cloudy-night .weather-icon-bg,
.bg-hot-night .weather-icon-bg,
.bg-cold-night .weather-icon-bg,
.bg-clear-night .weather-icon-bg {
  filter: brightness(1.2);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.weather-icon-bg {
  position: absolute;
  inset-inline-start: -30px;
  inset-block-start: -30px;
  width: 140px;
  height: 140px;
  opacity: 1;
  z-index: 0;
  pointer-events: none;
  object-fit: contain;
  /* Fix for animated SVGs on iOS */
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  image-rendering: auto;
  shape-rendering: geometricPrecision;
}

.weather-description-top {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--bulma-text-strong);
  z-index: 1;
  text-align: right;
  max-width: 45%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* Night mode - lighter description text */
.bg-storm-night .weather-description-top,
.bg-snow-night .weather-description-top,
.bg-rain-night .weather-description-top,
.bg-cloudy-night .weather-description-top,
.bg-hot-night .weather-description-top,
.bg-cold-night .weather-description-top,
.bg-clear-night .weather-description-top {
  color: var(--bulma-white);
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
  color: var(--bulma-text-strong);
  line-height: 1;
  position: relative;
  display: inline-block;
}

.degree {
  font-size: 2rem;
  position: absolute;
  top: 0;
  right: -0.8rem;
}

.city-name {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 4px 0 0 0;
  color: var(--bulma-text-strong);
}

/* Night mode - lighter city name text */
.bg-storm-night .city-name,
.bg-snow-night .city-name,
.bg-rain-night .city-name,
.bg-cloudy-night .city-name,
.bg-hot-night .city-name,
.bg-cold-night .city-name,
.bg-clear-night .city-name {
  color: var(--bulma-white);
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
  color: var(--bulma-text-strong);
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
