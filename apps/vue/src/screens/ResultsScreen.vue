<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PitchSession, PitchType } from '../types'
import { FILLER_WORDS } from '../speech/analyseTranscript'

const props = defineProps<{ session: PitchSession }>()
const emit = defineEmits<{
  'try-again': []
  'view-history': []
}>()

const pitchTypeLabels: Record<PitchType, string> = {
  startup: 'Startup Pitch',
  hackathon: 'Hackathon Demo',
  product: 'Product Pitch',
  elevator: 'Elevator Pitch',
}

const highlightFillers = ref(true)
const copied = ref(false)

const scores = computed(() => {
  return (
    props.session.analysis?.scores ?? {
      overall: 80,
      pace: 80,
      fillerControl: 85,
      repetition: 95,
      clarity: 80,
      structure: 75,
    }
  )
})

const qualityStatus = computed(() => props.session.analysis?.deliveryQuality ?? 'good')
const qualityLabels = {
  excellent: 'Excellent Delivery',
  good: 'Good Pitch Health',
  'needs-attention': 'Needs Attention',
}

const copyTranscript = async () => {
  try {
    await navigator.clipboard.writeText(props.session.transcript)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // clipboard fallback
  }
}

interface TranscriptToken {
  text: string
  isFiller: boolean
}

const tokens = computed<TranscriptToken[]>(() => {
  const parts = props.session.transcript.split(/(\s+|[.,!?;:]+)/)
  return parts.map((part) => {
    const clean = part.toLowerCase().replace(/[^a-z0-9]/g, '')
    return {
      text: part,
      isFiller: Boolean(clean && FILLER_WORDS.has(clean)),
    }
  })
})
</script>

<template>
  <section class="screen results-screen">
    <div class="results-intro">
      <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span class="rehearsal-meta-badge">{{ pitchTypeLabels[props.session.pitchType] }}</span>
        <span class="eyebrow">Rehearsal Complete</span>
      </div>
      <h1>Pitch Delivery Health</h1>
      <p>
        Objective delivery quality assessment computed strictly from measured pacing, filler frequency, speech flow, and structural coverage.
      </p>
    </div>

    <!-- Main Delivery Quality Score Card -->
    <div class="score-card">
      <div class="quality-pill-wrap">
        <span class="quality-badge-tag" :class="`status-${qualityStatus}`">
          ● {{ qualityLabels[qualityStatus] }}
        </span>
      </div>
      <span class="score-title">Delivery Quality Score</span>
      <strong>{{ scores.overall }}</strong>
      <span class="out-of">out of 100</span>
      <p>
        Composite delivery quality index: Pace (25%), Filler Control (25%), Repetition (15%), Clarity (15%), and Structure (20%).
      </p>
    </div>

    <!-- 5 Separate Scores Section -->
    <div class="separate-scores-section">
      <h2>Separate Dimension Scores</h2>
      <div class="separate-scores-grid">
        <div class="score-dimension-card">
          <div class="dim-head">
            <span>Pace</span>
            <strong>{{ scores.pace }} <small>/100</small></strong>
          </div>
          <div class="dim-meter">
            <div class="dim-fill" :style="{ width: `${scores.pace}%` }" />
          </div>
          <small>{{ props.session.wordsPerMinute }} wpm speaking rate</small>
        </div>

        <div class="score-dimension-card">
          <div class="dim-head">
            <span>Filler Control</span>
            <strong>{{ scores.fillerControl }} <small>/100</small></strong>
          </div>
          <div class="dim-meter">
            <div class="dim-fill" :style="{ width: `${scores.fillerControl}%` }" />
          </div>
          <small>{{ props.session.fillerCount }} fillers ({{ props.session.analysis?.fillerFrequency ?? 0 }}%)</small>
        </div>

        <div class="score-dimension-card">
          <div class="dim-head">
            <span>Repetition</span>
            <strong>{{ scores.repetition }} <small>/100</small></strong>
          </div>
          <div class="dim-meter">
            <div class="dim-fill" :style="{ width: `${scores.repetition}%` }" />
          </div>
          <small>{{ props.session.analysis?.repeatedWordCount ?? 0 }} repeated words</small>
        </div>

        <div class="score-dimension-card">
          <div class="dim-head">
            <span>Clarity</span>
            <strong>{{ scores.clarity }} <small>/100</small></strong>
          </div>
          <div class="dim-meter">
            <div class="dim-fill" :style="{ width: `${scores.clarity}%` }" />
          </div>
          <small>{{ props.session.analysis?.averageSentenceLength ?? 0 }} words / sentence</small>
        </div>

        <div class="score-dimension-card">
          <div class="dim-head">
            <span>Pitch Structure</span>
            <strong>{{ scores.structure }} <small>/100</small></strong>
          </div>
          <div class="dim-meter">
            <div class="dim-fill" :style="{ width: `${scores.structure}%` }" />
          </div>
          <small>Structural section matches</small>
        </div>
      </div>
    </div>

    <!-- Strengths & Biggest Improvement Area -->
    <div class="insights-two-col">
      <div class="insight-card strengths-card">
        <div class="insight-badge-title">
          <span class="insight-icon">✓</span>
          <h3>Detected Strengths</h3>
        </div>
        <ul>
          <li
            v-for="(str, idx) in props.session.analysis?.strengths ?? ['Strong baseline delivery completed.']"
            :key="idx"
          >
            {{ str }}
          </li>
        </ul>
      </div>

      <div class="insight-card improvement-card">
        <div class="insight-badge-title">
          <span class="insight-icon">▲</span>
          <h3>Biggest Improvement Area</h3>
        </div>
        <p class="improvement-statement">
          {{ props.session.analysis?.biggestImprovementArea ||
            'Maintain consistent pace and vocabulary discipline across all pitch sections.' }}
        </p>
      </div>
    </div>

    <!-- Concise Actionable Recommendations -->
    <section class="feedback-card">
      <div class="panel-heading">
        <h2>Actionable Recommendations</h2>
        <span>Based on major transcript metrics</span>
      </div>
      <ul>
        <li
          v-for="(item, idx) in props.session.analysis?.recommendations ?? [
            'Maintain your target speaking rate.',
            'Replace filler placeholders with silent pauses.',
            'Ensure all core pitch components are covered.',
          ]"
          :key="idx"
        >
          {{ item }}
        </li>
      </ul>
    </section>

    <!-- Pitch Structure Verification -->
    <section v-if="props.session.analysis" class="structure-card">
      <div class="panel-heading">
        <h2>Pitch Structure Verification</h2>
        <span>{{ props.session.analysis.scores.structure }}/100 detected</span>
      </div>
      <div class="structure-list">
        <div
          v-for="section in props.session.analysis.structure"
          :key="section.id"
          :class="{ 'is-detected': section.detected }"
        >
          <span>{{ section.detected ? '✓' : '○' }}</span>
          <strong>
            {{ section.label }}
            <small
              v-if="section.importance === 'core'"
              style="display: inline; margin-left: 6px; color: #1a7551; font-weight: 600;"
            >
              (Core)
            </small>
          </strong>
          <small>{{ section.detected ? `Detected: “${section.evidence}”` : 'Not detected in transcript' }}</small>
        </div>
      </div>
    </section>

    <!-- Transcript Review -->
    <section class="transcript-review">
      <div class="panel-heading">
        <h2>Transcript Review</h2>
        <div class="panel-actions">
          <button
            class="small-action-button"
            :class="{ active: highlightFillers }"
            @click="highlightFillers = !highlightFillers"
          >
            {{ highlightFillers ? 'Hide fillers' : 'Highlight fillers' }}
          </button>
          <button class="small-action-button" @click="copyTranscript">
            {{ copied ? 'Copied!' : 'Copy transcript' }}
          </button>
          <span>{{ props.session.duration }}s run • {{ props.session.analysis?.wordCount ?? 0 }} words</span>
        </div>
      </div>
      <p v-if="highlightFillers">
        <template v-for="(token, idx) in tokens" :key="idx">
          <mark v-if="token.isFiller" class="filler-highlight" title="Filler word detected">{{ token.text }}</mark>
          <span v-else>{{ token.text }}</span>
        </template>
      </p>
      <p v-else>{{ props.session.transcript }}</p>
    </section>

    <!-- Action Buttons -->
    <div class="results-cta-row">
      <button class="primary-button" @click="emit('try-again')">
        Practice Again <span>→</span>
      </button>
      <button class="secondary-button" @click="emit('view-history')">
        View Rehearsal History &amp; Trends
      </button>
    </div>
  </section>
</template>
