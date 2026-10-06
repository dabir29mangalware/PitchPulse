<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AppShell from './components/AppShell.vue'
import SetupScreen from './screens/SetupScreen.vue'
import RehearsalScreen from './screens/RehearsalScreen.vue'
import ResultsScreen from './screens/ResultsScreen.vue'
import HistoryScreen from './screens/HistoryScreen.vue'
import type { PitchDuration, PitchSession, PitchType, Screen } from './types'
import { analyseTranscript } from './speech/analyseTranscript'
import { loadHistory, saveHistoryRecord } from './history'

const screen = ref<Screen>('setup')
const duration = ref<PitchDuration>(60)
const pitchType = ref<PitchType>('startup')
const historyCount = ref<number>(0)

const demoInitialSession: PitchSession = {
  pitchType: 'startup',
  duration: 60,
  transcript:
    'Imagine a world where preparing for a high-stakes pitch is effortless. The problem is that most founders speak too quickly and clutter their delivery with fillers. We built Pitchpulse to provide instant telemetry. Our early users cut filler frequency by 60 percent. Join us as we launch today.',
  wordsPerMinute: 138,
  fillerCount: 1,
  pauseCount: 3,
}

const completedSession = ref<PitchSession>(demoInitialSession)

const refreshHistoryCount = () => {
  historyCount.value = loadHistory().length
}

onMounted(() => {
  refreshHistoryCount()
})

watch(screen, () => {
  refreshHistoryCount()
})

const handleFinishRehearsal = (
  transcript: string,
  elapsedSeconds: number,
  pauseCount: number
) => {
  const text = transcript.trim() || demoInitialSession.transcript
  const analysis = analyseTranscript(text, elapsedSeconds, pitchType.value, pauseCount)

  const session: PitchSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    pitchType: pitchType.value,
    duration: duration.value,
    transcript: text,
    wordsPerMinute: analysis.wordsPerMinute,
    fillerCount: analysis.fillerCount,
    pauseCount,
    analysis,
  }

  saveHistoryRecord(session)
  completedSession.value = session
  historyCount.value += 1
  screen.value = 'results'
}

const handleRehearseFormat = (type: PitchType, dur: PitchDuration) => {
  pitchType.value = type
  duration.value = dur
  screen.value = 'rehearsal'
}
</script>

<template>
  <AppShell
    :screen="screen"
    :history-count="historyCount"
    @home="screen = 'setup'"
    @history="screen = 'history'"
  >
    <SetupScreen
      v-if="screen === 'setup'"
      v-model:duration="duration"
      v-model:pitch-type="pitchType"
      @start="screen = 'rehearsal'"
    />
    <RehearsalScreen
      v-else-if="screen === 'rehearsal'"
      :duration="duration"
      :pitch-type="pitchType"
      @finish="handleFinishRehearsal"
      @cancel="screen = 'setup'"
    />
    <ResultsScreen
      v-else-if="screen === 'results'"
      :session="completedSession"
      @try-again="screen = 'setup'"
      @view-history="screen = 'history'"
    />
    <HistoryScreen
      v-else-if="screen === 'history'"
      @back-to-practice="screen = 'setup'"
      @rehearse-format="handleRehearseFormat"
    />
  </AppShell>
</template>
