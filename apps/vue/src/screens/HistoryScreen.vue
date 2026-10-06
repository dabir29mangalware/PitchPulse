<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HistoryRecord, PitchDuration, PitchType } from '../types'
import { clearHistory, loadHistory } from '../history'

const emit = defineEmits<{
  'back-to-practice': []
  'rehearse-format': [pitchType: PitchType, duration: PitchDuration]
}>()

const pitchTypeLabels: Record<PitchType, string> = {
  startup: 'Startup Pitch',
  hackathon: 'Hackathon Demo',
  product: 'Product Pitch',
  elevator: 'Elevator Pitch',
}

const history = ref<HistoryRecord[]>(loadHistory())
const expandedId = ref<string | null>(null)

const handleClear = () => {
  if (window.confirm('Are you sure you want to clear your local rehearsal history?')) {
    clearHistory()
    history.value = []
  }
}

const totalAttempts = computed(() => history.value.length)
const avgScore = computed(() =>
  totalAttempts.value
    ? Math.round(history.value.reduce((sum, h) => sum + h.overallScore, 0) / totalAttempts.value)
    : 0
)
const avgWpm = computed(() =>
  totalAttempts.value
    ? Math.round(history.value.reduce((sum, h) => sum + h.wordsPerMinute, 0) / totalAttempts.value)
    : 0
)
const avgFillers = computed(() =>
  totalAttempts.value
    ? Number((history.value.reduce((sum, h) => sum + h.fillerCount, 0) / totalAttempts.value).toFixed(1))
    : 0
)

const toggleExpanded = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <section class="screen history-screen">
    <div className="history-header">
      <div className="eyebrow">Progression tracker</div>
      <h1>Delivery Quality History</h1>
      <p className="lead">
        Inspect measurable pitch health metrics across previous attempts and compare your delivery trends over time.
      </p>
    </div>

    <div v-if="totalAttempts > 0" class="history-summary-grid">
      <div class="summary-stat-card">
        <span>Total rehearsals</span>
        <strong>{{ totalAttempts }}</strong>
        <small>Sessions recorded</small>
      </div>
      <div class="summary-stat-card">
        <span>Avg delivery score</span>
        <strong>{{ avgScore }}</strong>
        <small>Out of 100</small>
      </div>
      <div class="summary-stat-card">
        <span>Avg speaking rate</span>
        <strong>{{ avgWpm }} <small>wpm</small></strong>
        <small>Pacing cadence</small>
      </div>
      <div class="summary-stat-card">
        <span>Avg filler words</span>
        <strong>{{ avgFillers }}</strong>
        <small>Per rehearsal</small>
      </div>
    </div>

    <div v-if="totalAttempts === 0" class="empty-history-card">
      <div class="empty-icon">📊</div>
      <h2>No rehearsals recorded yet</h2>
      <p>Complete a pitch rehearsal to see your delivery scores, pace, and transcript metrics tracked here.</p>
      <button
        class="primary-button"
        style="max-width: 280px; margin: 20px auto 0;"
        @click="emit('back-to-practice')"
      >
        Start a rehearsal <span>→</span>
      </button>
    </div>

    <div v-else class="history-entries-wrap">
      <div class="history-toolbar">
        <h2>Previous Attempts ({{ totalAttempts }})</h2>
        <button class="text-button danger-button" @click="handleClear">
          Clear history
        </button>
      </div>

      <div class="history-cards-list">
        <article v-for="record in history" :key="record.id" class="history-entry-card">
          <div class="entry-main-row">
            <div class="entry-info">
              <div class="entry-badges">
                <span class="rehearsal-meta-badge">
                  {{ pitchTypeLabels[record.pitchType] ?? record.pitchType }}
                </span>
                <span class="duration-badge">{{ record.duration }}s run</span>
                <span class="date-stamp">{{ record.formattedDate }}</span>
              </div>
              <p class="transcript-preview-snippet">
                “{{ record.transcriptSummary }}”
              </p>
            </div>

            <div class="entry-score-col">
              <span class="score-label">Delivery Score</span>
              <strong
                class="score-digit"
                :class="{
                  'score-good': record.overallScore >= 80,
                  'score-medium': record.overallScore >= 65 && record.overallScore < 80,
                  'score-attention': record.overallScore < 65,
                }"
              >
                {{ record.overallScore }}
              </strong>
              <span class="score-total">/100</span>
            </div>
          </div>

          <!-- 5-score breakdown pills -->
          <div class="entry-scores-breakdown">
            <div class="score-pill">
              <span>Pace:</span> <strong>{{ record.scores.pace }}/100</strong>
            </div>
            <div class="score-pill">
              <span>Filler control:</span> <strong>{{ record.scores.fillerControl }}/100</strong>
            </div>
            <div class="score-pill">
              <span>Repetition:</span> <strong>{{ record.scores.repetition }}/100</strong>
            </div>
            <div class="score-pill">
              <span>Clarity:</span> <strong>{{ record.scores.clarity }}/100</strong>
            </div>
            <div class="score-pill">
              <span>Structure:</span> <strong>{{ record.scores.structure }}/100</strong>
            </div>
          </div>

          <!-- Telemetry chips -->
          <div class="entry-metrics-bar">
            <div class="telemetry-chip">
              <span>Words:</span> <strong>{{ record.wordCount }}</strong>
            </div>
            <div class="telemetry-chip">
              <span>Rate:</span> <strong>{{ record.wordsPerMinute }} wpm</strong>
            </div>
            <div class="telemetry-chip">
              <span>Fillers:</span> <strong>{{ record.fillerCount }}</strong>
            </div>
            <div class="telemetry-chip">
              <span>Pauses:</span> <strong>{{ record.pauseCount }}</strong>
            </div>
            <div v-if="record.repeatedWordCount > 0" class="telemetry-chip">
              <span>Repeats:</span> <strong>{{ record.repeatedWordCount }}</strong>
            </div>
          </div>

          <!-- Expandable transcript -->
          <div v-if="expandedId === record.id" class="expanded-transcript-panel">
            <h4>Full transcript:</h4>
            <p>{{ record.fullTranscript || 'No speech recorded.' }}</p>
          </div>

          <div class="entry-actions-row">
            <button class="text-button" @click="toggleExpanded(record.id)">
              {{ expandedId === record.id ? 'Hide transcript ↑' : 'View full transcript ↓' }}
            </button>
            <button
              class="secondary-button compact-button"
              @click="emit('rehearse-format', record.pitchType, record.duration)"
            >
              Rehearse this format <span>→</span>
            </button>
          </div>
        </article>
      </div>

      <div style="margin-top: 28px; text-align: center;">
        <button
          class="primary-button"
          style="max-width: 320px; margin: 0 auto;"
          @click="emit('back-to-practice')"
        >
          ← Return to Practice Room
        </button>
      </div>
    </div>
  </section>
</template>
