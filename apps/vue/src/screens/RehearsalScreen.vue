<script setup lang="ts">
import type { PitchDuration, PitchType } from '../types'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'
import { analyseTranscript, calculateLiveDeliveryQuality } from '../speech/analyseTranscript'

const props = defineProps<{ duration: PitchDuration; pitchType: PitchType }>()
const emit = defineEmits<{ finish: [transcript: string, elapsedSeconds: number, pauseCount: number]; cancel: [] }>()

const pitchTypeLabels: Record<PitchType, string> = {
  startup: 'Startup Pitch',
  hackathon: 'Hackathon Demo',
  product: 'Product Pitch',
  elevator: 'Elevator Pitch',
}

const displayTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const speech = useSpeechRecognition()
const transcript = computed(() =>
  [speech.finalTranscript.value, speech.interimTranscript.value].filter(Boolean).join(' ')
)

const hasStarted = ref(false)
const remainingSeconds = ref<number>(props.duration)
const elapsedSeconds = computed(() => Math.max(1, props.duration - remainingSeconds.value))
const metrics = computed(() =>
  analyseTranscript(transcript.value, elapsedSeconds.value, props.pitchType, speech.pauseCount.value)
)

const liveDeliveryQuality = computed(() =>
  calculateLiveDeliveryQuality(
    metrics.value.wordsPerMinute,
    metrics.value.fillerCount,
    metrics.value.wordCount,
    props.pitchType
  )
)

const qualityNames = {
  excellent: 'Excellent',
  good: 'Good',
  'needs-attention': 'Needs attention',
}

const hasFinished = ref(false)
let timerId: number | undefined

const errorCopy: Record<string, string> = {
  'permission-denied': 'Microphone access was blocked. Allow it in your browser settings and try again.',
  network: 'Speech recognition needs an active network connection.',
  'no-speech': 'We did not hear any speech. Start speaking when you are ready.',
  'audio-capture': 'No microphone is available to Pitchpulse.',
  'service-not-allowed': 'Speech recognition is unavailable in this browser.',
  unknown: 'Something interrupted speech recognition. Try restarting it.',
}

const endPractice = () => {
  speech.stop()
  if (timerId) window.clearInterval(timerId)
  emit('cancel')
}

const finish = () => {
  if (hasFinished.value) return
  hasFinished.value = true
  const completedTranscript = [speech.finalTranscript.value, speech.interimTranscript.value].filter(Boolean).join(' ')
  speech.stop()
  if (timerId) window.clearInterval(timerId)
  emit('finish', completedTranscript, elapsedSeconds.value || props.duration, speech.pauseCount.value)
}

const handleReset = () => {
  speech.resetTranscript()
  remainingSeconds.value = props.duration
  hasStarted.value = false
  if (timerId) window.clearInterval(timerId)
  void speech.restart()
}

// Track start of rehearsal
watch(speech.isListening, (listening) => {
  if (listening && !hasStarted.value) {
    hasStarted.value = true
  }

  if (timerId) {
    window.clearInterval(timerId)
    timerId = undefined
  }

  if (listening && remainingSeconds.value > 0) {
    timerId = window.setInterval(() => {
      if (remainingSeconds.value <= 1) {
        remainingSeconds.value = 0
        if (timerId) window.clearInterval(timerId)
        finish()
      } else {
        remainingSeconds.value -= 1
      }
    }, 1000)
  }
})

onBeforeUnmount(() => {
  if (timerId) window.clearInterval(timerId)
})
</script>

<template>
  <section class="screen rehearsal-screen">
    <div class="rehearsal-top">
      <button class="text-button" @click="endPractice">← End practice</button>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="rehearsal-meta-badge">{{ pitchTypeLabels[props.pitchType] }}</span>

        <!-- Live Delivery Quality Pill in Header -->
        <div
          class="live-quality-pill"
          :class="`quality-${liveDeliveryQuality}`"
          title="Measurable delivery quality indicator (speaking pace, filler frequency, speech flow). Not a measure of psychological confidence or emotion."
        >
          <span class="quality-indicator-dot" />
          <span class="quality-pill-label">Delivery quality:</span>
          <strong>{{ qualityNames[liveDeliveryQuality] }}</strong>
        </div>

        <span class="live-badge">
          <i /> {{ speech.isListening.value ? 'Listening' : hasStarted ? 'Paused' : 'Ready' }}
        </span>

        <div v-if="speech.isListening.value" class="audio-indicator" title="Microphone input activity">
          <span>Mic</span>
          <div class="audio-bar-wrapper">
            <div
              class="audio-bar-level"
              :style="{ width: `${Math.min(100, Math.max(10, speech.audioLevel.value))}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="timer-wrap">
      <p>{{ hasStarted ? (speech.isListening.value ? 'Time remaining' : 'Paused') : 'Ready when you are' }}</p>
      <time>{{ displayTime(remainingSeconds) }}</time>
      <div class="progress-track">
        <span :style="{ width: `${((props.duration - remainingSeconds) / props.duration) * 100}%` }" />
      </div>
    </div>

    <div v-if="!speech.isSupported" class="speech-notice" role="status">
      <strong>Speech recognition is not supported in this browser.</strong>
      <span>Use a recent Chrome or Edge browser to rehearse with real-time speech transcription.</span>
    </div>

    <div v-if="speech.error.value" class="speech-notice is-error" role="alert">
      {{ errorCopy[speech.error.value] ?? 'An error occurred.' }}
      <button @click="speech.restart">Try again</button>
    </div>

    <div class="live-grid">
      <section class="transcript-panel">
        <div class="panel-heading">
          <span>Live transcript</span>
          <span class="muted">{{ speech.isListening.value ? 'Listening…' : hasStarted ? 'Paused' : 'Not listening' }}</span>
        </div>
        <p v-if="transcript" class="live-transcript">
          {{ speech.finalTranscript.value }}
          <span v-if="speech.interimTranscript.value" class="interim-transcript">
            {{ speech.interimTranscript.value }}
          </span>
        </p>
        <p v-else class="empty-transcript">Your words will appear here in real time as you speak.</p>
      </section>

      <aside class="live-metrics">
        <!-- Live Delivery Quality Block with explicit disclaimer -->
        <div class="live-quality-metric-block">
          <span>Live delivery quality</span>
          <strong class="quality-status-text" :class="`status-${liveDeliveryQuality}`">
            {{ qualityNames[liveDeliveryQuality] }}
          </strong>
          <small class="quality-telemetry-note">
            Based on pace, filler control &amp; speech flow. Not a psychological confidence detector.
          </small>
        </div>

        <div>
          <span>Words</span>
          <strong>{{ metrics.wordCount }}</strong>
        </div>
        <div>
          <span>Speaking rate</span>
          <strong>{{ metrics.wordsPerMinute }} <small>wpm</small></strong>
        </div>
        <div>
          <span>Filler words</span>
          <strong>{{ metrics.fillerCount }}</strong>
        </div>
        <div>
          <span>Pauses detected</span>
          <strong>{{ speech.pauseCount.value }}</strong>
        </div>
        <div>
          <span>Microphone</span>
          <strong :class="{ 'metric-live': speech.isListening.value }">
            {{ speech.isListening.value ? 'Active' : 'Muted' }}
          </strong>
        </div>
      </aside>
    </div>

    <div class="speech-controls">
      <button v-if="speech.isListening.value" class="secondary-button" @click="speech.stop">
        Pause rehearsal
      </button>
      <button
        v-else
        class="secondary-button"
        :disabled="!speech.isSupported || remainingSeconds === 0"
        @click="speech.start"
      >
        {{ hasStarted ? 'Resume rehearsal' : 'Enable microphone & start' }}
      </button>
      <button
        class="text-button restart-button"
        :disabled="!speech.isSupported || remainingSeconds === 0"
        @click="handleReset"
      >
        Reset rehearsal
      </button>
    </div>

    <button class="primary-button finish-button" @click="finish">
      Finish rehearsal <span>→</span>
    </button>
  </section>
</template>
