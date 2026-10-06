<script setup lang="ts">
import type { Screen } from '../types'

defineProps<{
  screen: Screen
  historyCount?: number
}>()

defineEmits<{
  home: []
  history: []
}>()
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <button class="brand" aria-label="Go to Pitchpulse home" @click="$emit('home')">
        <span class="brand-mark">P</span>
        <span>pitchpulse</span>
      </button>

      <nav class="header-nav" aria-label="Main navigation">
        <button
          class="nav-link-btn"
          :class="{ 'is-active': screen === 'setup' }"
          @click="$emit('home')"
        >
          Practice Room
        </button>
        <button
          class="nav-link-btn"
          :class="{ 'is-active': screen === 'history' }"
          @click="$emit('history')"
        >
          History {{ historyCount && historyCount > 0 ? `(${historyCount})` : '' }}
        </button>
      </nav>

      <div class="header-status">
        <span class="status-dot" />
        {{ screen === 'rehearsal' ? 'Practice in progress' : 'Private practice room' }}
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
