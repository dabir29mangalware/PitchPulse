import { useState } from 'react'
import type { HistoryRecord, PitchDuration, PitchType } from '../types'
import { clearHistory, loadHistory } from '../history'

interface HistoryScreenProps {
  onBackToPractice: () => void
  onRehearseFormat: (pitchType: PitchType, duration: PitchDuration) => void
}

const pitchTypeLabels: Record<PitchType, string> = {
  startup: 'Startup Pitch',
  hackathon: 'Hackathon Demo',
  product: 'Product Pitch',
  elevator: 'Elevator Pitch',
}

export function HistoryScreen({ onBackToPractice, onRehearseFormat }: HistoryScreenProps) {
  const [history, setHistory] = useState<HistoryRecord[]>(() => loadHistory())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local rehearsal history?')) {
      clearHistory()
      setHistory([])
    }
  }

  // Summary analytics
  const totalAttempts = history.length
  const avgScore = totalAttempts
    ? Math.round(history.reduce((sum, h) => sum + h.overallScore, 0) / totalAttempts)
    : 0
  const avgWpm = totalAttempts
    ? Math.round(history.reduce((sum, h) => sum + h.wordsPerMinute, 0) / totalAttempts)
    : 0
  const avgFillers = totalAttempts
    ? Number((history.reduce((sum, h) => sum + h.fillerCount, 0) / totalAttempts).toFixed(1))
    : 0

  return (
    <section className="screen history-screen">
      <div className="history-header">
        <div className="eyebrow">Progression tracker</div>
        <h1>Delivery Quality History</h1>
        <p className="lead">
          Inspect measurable pitch health metrics across previous attempts and compare your delivery trends over time.
        </p>
      </div>

      {totalAttempts > 0 && (
        <div className="history-summary-grid">
          <div className="summary-stat-card">
            <span>Total rehearsals</span>
            <strong>{totalAttempts}</strong>
            <small>Sessions recorded</small>
          </div>
          <div className="summary-stat-card">
            <span>Avg delivery score</span>
            <strong>{avgScore}</strong>
            <small>Out of 100</small>
          </div>
          <div className="summary-stat-card">
            <span>Avg speaking rate</span>
            <strong>{avgWpm} <small>wpm</small></strong>
            <small>Pacing cadence</small>
          </div>
          <div className="summary-stat-card">
            <span>Avg filler words</span>
            <strong>{avgFillers}</strong>
            <small>Per rehearsal</small>
          </div>
        </div>
      )}

      {totalAttempts === 0 ? (
        <div className="empty-history-card">
          <div className="empty-icon">📊</div>
          <h2>No rehearsals recorded yet</h2>
          <p>Complete a pitch rehearsal to see your delivery scores, pace, and transcript metrics tracked here.</p>
          <button className="primary-button" onClick={onBackToPractice} style={{ maxWidth: '280px', margin: '20px auto 0' }}>
            Start a rehearsal <span>→</span>
          </button>
        </div>
      ) : (
        <div className="history-entries-wrap">
          <div className="history-toolbar">
            <h2>Previous Attempts ({totalAttempts})</h2>
            <button className="text-button danger-button" onClick={handleClear}>
              Clear history
            </button>
          </div>

          <div className="history-cards-list">
            {history.map((record, index) => {
              const isExpanded = expandedId === record.id
              const scoreTone =
                record.overallScore >= 80 ? 'good' : record.overallScore >= 65 ? 'medium' : 'attention'

              return (
                <article key={record.id} className="history-entry-card">
                  <div className="entry-main-row">
                    <div className="entry-info">
                      <div className="entry-badges">
                        <span className="rehearsal-meta-badge">
                          {pitchTypeLabels[record.pitchType] ?? record.pitchType}
                        </span>
                        <span className="duration-badge">{record.duration}s run</span>
                        <span className="date-stamp">{record.formattedDate}</span>
                      </div>
                      <p className="transcript-preview-snippet">
                        “{record.transcriptSummary}”
                      </p>
                    </div>

                    <div className="entry-score-col">
                      <span className="score-label">Delivery Score</span>
                      <strong className={`score-digit score-${scoreTone}`}>
                        {record.overallScore}
                      </strong>
                      <span className="score-total">/100</span>
                    </div>
                  </div>

                  {/* 5-score breakdown pills */}
                  <div className="entry-scores-breakdown">
                    <div className="score-pill">
                      <span>Pace:</span> <strong>{record.scores.pace}/100</strong>
                    </div>
                    <div className="score-pill">
                      <span>Filler control:</span> <strong>{record.scores.fillerControl}/100</strong>
                    </div>
                    <div className="score-pill">
                      <span>Repetition:</span> <strong>{record.scores.repetition}/100</strong>
                    </div>
                    <div className="score-pill">
                      <span>Clarity:</span> <strong>{record.scores.clarity}/100</strong>
                    </div>
                    <div className="score-pill">
                      <span>Structure:</span> <strong>{record.scores.structure}/100</strong>
                    </div>
                  </div>

                  {/* Telemetry chips */}
                  <div className="entry-metrics-bar">
                    <div className="telemetry-chip">
                      <span>Words:</span> <strong>{record.wordCount}</strong>
                    </div>
                    <div className="telemetry-chip">
                      <span>Rate:</span> <strong>{record.wordsPerMinute} wpm</strong>
                    </div>
                    <div className="telemetry-chip">
                      <span>Fillers:</span> <strong>{record.fillerCount}</strong>
                    </div>
                    <div className="telemetry-chip">
                      <span>Pauses:</span> <strong>{record.pauseCount}</strong>
                    </div>
                    {record.repeatedWordCount > 0 && (
                      <div className="telemetry-chip">
                        <span>Repeats:</span> <strong>{record.repeatedWordCount}</strong>
                      </div>
                    )}
                  </div>

                  {/* Expandable full transcript */}
                  {isExpanded && (
                    <div className="expanded-transcript-panel">
                      <h4>Full transcript:</h4>
                      <p>{record.fullTranscript || 'No speech recorded.'}</p>
                    </div>
                  )}

                  <div className="entry-actions-row">
                    <button
                      className="text-button"
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    >
                      {isExpanded ? 'Hide transcript ↑' : 'View full transcript ↓'}
                    </button>
                    <button
                      className="secondary-button compact-button"
                      onClick={() => onRehearseFormat(record.pitchType, record.duration)}
                    >
                      Rehearse this format <span>→</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <button className="primary-button" onClick={onBackToPractice} style={{ maxWidth: '320px', margin: '0 auto' }}>
              ← Return to Practice Room
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
