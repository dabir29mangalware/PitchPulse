<script setup lang="ts">
import type { PitchDuration } from '../types'
defineProps<{ value: PitchDuration }>()
const emit = defineEmits<{ change: [value: PitchDuration] }>()
const durations: { value: PitchDuration; label: string; detail: string }[] = [{ value: 30, label: '30 sec', detail: 'Quick and sharp' }, { value: 60, label: '60 sec', detail: 'The sweet spot' }, { value: 90, label: '90 sec', detail: 'Tell the story' }]
</script>
<template><div class="duration-picker" role="radiogroup" aria-label="Pitch duration"><button v-for="option in durations" :key="option.value" role="radio" :aria-checked="value === option.value" :class="['duration-option', { 'is-selected': value === option.value }]" @click="emit('change', option.value)"><strong>{{ option.label }}</strong><span>{{ option.detail }}</span></button></div></template>
