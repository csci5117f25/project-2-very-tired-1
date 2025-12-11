<script setup>
const props = defineProps({
  color: { type: String, required: true },
  unit: { type: String, required: true },
  current: { type: Number, required: true },
  target: { type: Number, required: true },
  size: {
    type: String,
    default: 'full',
  },
})

const percent = Math.ceil((props.current / props.target) * 100)

let className = ''
console.log(props.target)
console.log(percent)
if (percent === 0) {
  className = 'zero'
} else if (percent < 50) {
  className = 'less'
}
</script>
<template>
  <div class="container">
    <div
      class="progress"
      :class="className"
      :style="{
        '--i': percent,
        '--clr': props.color,
      }"
    >
      <h3>
        {{ current }}
        <span>/{{ target }}</span>
      </h3>
      <h4>{{ unit }}</h4>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
}
.progress {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  color: #fff;
  background: #444 linear-gradient(to right, transparent 50%, var(--clr) 0);
  margin-bottom: 0px !important;
}
.progress h3 {
  position: absolute;
  top: 50%;
  width: 100%;
  text-align: center;
  transform: translateY(-50%);
  font-size: 3rem;
  z-index: 1;
  font-weight: 500;
}
.progress h3 span {
  font-size: 0.65em;
  font-weight: 400;
}

.progress h4 {
  position: absolute;
  font-size: 0.8rem;
  transform: translateX(-50%);
  top: 69%;
  left: 50%;
  z-index: 1;
  color: var(--clr);
  text-transform: uppercase;
}
.progress::before {
  content: '';
  display: block;
  height: 100%;
  margin-left: 50%;
  transform-origin: left;
  border-radius: 0 100% 100% 0/50%;
}
.progress::after {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background-color: #222;
}
.progress::before {
  background-color: var(--clr);
  transform: rotate(calc(((var(--i) - 50) * 0.01turn)));
}
/* if value is less than 50%, then */
.container .progress.less::before {
  background-color: #444;
  transform: rotate(calc(((var(--i) - 0) * 0.01turn)));
}
.progress.zero {
  background: #444;
}
.progress.zero::before {
  background: #444;
  transform: rotate(0turn);
}
</style>
