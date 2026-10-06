<script setup lang="ts">
import DurationPicker from '../components/DurationPicker.vue'
import PitchTypePicker from '../components/PitchTypePicker.vue'
import type { PitchDuration, PitchType } from '../types'
defineProps<{ duration: PitchDuration; pitchType: PitchType }>()
const emit = defineEmits<{ 'update:duration': [value: PitchDuration]; 'update:pitchType': [value: PitchType]; start: [] }>()
</script>
<template><section class="screen setup-screen"><div class="setup-hero"><div class="eyebrow">Practice in private. Pitch in public.</div><h1>Turn your idea into<br /><em>momentum.</em></h1><p class="lead">A focused room to rehearse your next pitch—then leave with a clearer, sharper delivery.</p></div><div class="setup-card"><div class="setup-step"><span class="step-number">01</span><div><h2>What are you pitching?</h2><p>We’ll tailor the rehearsal frame to your moment.</p></div></div><PitchTypePicker :value="pitchType" @change="emit('update:pitchType', $event)" /><div class="setup-step"><span class="step-number">02</span><div><h2>Set your run time</h2><p>Pick the constraint you need to nail.</p></div></div><DurationPicker :value="duration" @change="emit('update:duration', $event)" /><button class="primary-button start-button" @click="emit('start')"><span class="button-pulse" />Start your {{ duration }}-second rehearsal <b>→</b></button><p class="privacy-note"><span>⌁</span> Your practice stays in your browser. Nothing is recorded or shared.</p></div></section></template>
