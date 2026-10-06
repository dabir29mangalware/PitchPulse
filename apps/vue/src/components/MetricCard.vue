<script setup lang="ts">
withDefaults(defineProps<{ label: string; value: string | number; detail: string; tone?: 'neutral' | 'good' | 'attention' }>(), { tone: 'neutral' })
</script>
<template><article :class="['metric-card', `metric-${tone}`]"><span>{{ label }}</span><strong>{{ value }}</strong><small>{{ detail }}</small></article></template>
