<script setup lang="ts">
import type { PitchType } from '../types'
defineProps<{ value: PitchType }>()
const emit = defineEmits<{ change: [value: PitchType] }>()
const pitchTypes: { value: PitchType; title: string; detail: string; icon: string }[] = [
  { value: 'startup', title: 'Startup', detail: 'Win over investors', icon: '↗' },
  { value: 'hackathon', title: 'Hackathon', detail: 'Demo with impact', icon: '⌘' },
  { value: 'product', title: 'Product', detail: 'Make the value clear', icon: '◈' },
  { value: 'elevator', title: 'Elevator', detail: 'Make it memorable', icon: '↑' },
]
</script>
<template><div class="pitch-type-grid" role="radiogroup" aria-label="Pitch type"><button v-for="type in pitchTypes" :key="type.value" role="radio" :aria-checked="value === type.value" :class="['pitch-type', { 'is-selected': value === type.value }]" @click="emit('change', type.value)"><span class="pitch-type-icon">{{ type.icon }}</span><span><strong>{{ type.title }}</strong><small>{{ type.detail }}</small></span></button></div></template>
