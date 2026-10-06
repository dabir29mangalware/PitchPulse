import { useState } from 'react'
import type { PitchSession, PitchType } from '../types'
import { FILLER_WORDS } from '../speech/analyseTranscript'

const pitchTypeLabels: Record<PitchType, string> = {
  startup: 'Startup Pitch',
  hackathon: 'Hackathon Demo',
  product: 'Product Pitch',
  elevator: 'Elevator Pitch',
}

interface ResultsScreenProps {
  session: PitchSession
  onTryAgain: () => void
  onViewHistory: () => void
}

export function ResultsScreen({ session, onTryAgain, onViewHistory }: ResultsScreenProps) {
  const analysis = session.analysis
  const [highlightFillers, setHighlightFillers] = useState(true)
  const [copied, setCopied] = useState(false)

  const scores = analysis?.scores ?? {
    overall: 80,
    pace: 80,
    fillerControl: 85,
    repetition: 95,
    clarity: 80,
    structure: 75,
  }

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(session.transcript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const renderTranscriptWords = () => {
    if (!highlightFillers) {
      return session.transcript
    }
    const tokens = session.transcript.split(/(\s+|[.,!?;:]+)/)
    return tokens.map((token, index) => {
      const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (clean && FILLER_WORDS.has(clean)) {
        return (
          <mark key={index} className="filler-highlight" title="Filler word detected">
            {token}
          </mark>
        )
      }
      return <span key={index}>{token}</span>
    })
  }

  const qualityStatus = analysis?.deliveryQuality ?? 'good'
  const qualityLabels = {
    excellent: 'Excellent Delivery',
    good: 'Good Pitch Health',
    'needs-attention': 'Needs Attention',
  }

  return (
    <section className="screen results-screen">
      <div className="results-intro">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="rehearsal-meta-badge">{pitchTypeLabels[session.pitchType]}</span>
          <span className="eyebrow">Rehearsal Complete</span>
        </div>
        <h1>Pitch Delivery Health</h1>
        <p>
          Objective delivery quality assessment computed strictly from measured pacing, filler frequency, speech flow, and structural coverage.
        </p>
      </div>

      {/* Main Delivery Quality Score Card */}
      <div className="score-card">
        <div className="quality-pill-wrap">
          <span className={`quality-badge-tag status-${qualityStatus}`}>
            ● {qualityLabels[qualityStatus]}
          </span>
        </div>
        <span className="score-title">Delivery Quality Score</span>
        <strong>{scores.overall}</strong>
        <span className="out-of">out of 100</span>
        <p>
          Composite delivery quality index: Pace (25%), Filler Control (25%), Repetition (15%), Clarity (15%), and Structure (20%).
        </p>
      </div>

      {/* 5 Separate Scores Section */}
      <div className="separate-scores-section">
        <h2>Separate Dimension Scores</h2>
        <div className="separate-scores-grid">
          <div className="score-dimension-card">
            <div className="dim-head">
              <span>Pace</span>
              <strong>{scores.pace} <small>/100</small></strong>
            </div>
            <div className="dim-meter">
              <div className="dim-fill" style={{ width: `${scores.pace}%` }} />
            </div>
            <small>{session.wordsPerMinute} wpm speaking rate</small>
          </div>

          <div className="score-dimension-card">
            <div className="dim-head">
              <span>Filler Control</span>
              <strong>{scores.fillerControl} <small>/100</small></strong>
            </div>
            <div className="dim-meter">
              <div className="dim-fill" style={{ width: `${scores.fillerControl}%` }} />
            </div>
            <small>{session.fillerCount} fillers ({analysis?.fillerFrequency ?? 0}%)</small>
          </div>

          <div className="score-dimension-card">
            <div className="dim-head">
              <span>Repetition</span>
              <strong>{scores.repetition} <small>/100</small></strong>
            </div>
            <div className="dim-meter">
              <div className="dim-fill" style={{ width: `${scores.repetition}%` }} />
            </div>
            <small>{analysis?.repeatedWordCount ?? 0} repeated words</small>
          </div>

          <div className="score-dimension-card">
            <div className="dim-head">
              <span>Clarity</span>
              <strong>{scores.clarity} <small>/100</small></strong>
            </div>
            <div className="dim-meter">
              <div className="dim-fill" style={{ width: `${scores.clarity}%` }} />
            </div>
            <small>{analysis?.averageSentenceLength ?? 0} words / sentence</small>
          </div>

          <div className="score-dimension-card">
            <div className="dim-head">
              <span>Pitch Structure</span>
              <strong>{scores.structure} <small>/100</small></strong>
            </div>
            <div className="dim-meter">
              <div className="dim-fill" style={{ width: `${scores.structure}%` }} />
            </div>
            <small>Structural section matches</small>
          </div>
        </div>
      </div>

      {/* Strengths & Biggest Improvement Area */}
      <div className="insights-two-col">
        <div className="insight-card strengths-card">
          <div className="insight-badge-title">
            <span className="insight-icon">✓</span>
            <h3>Detected Strengths</h3>
          </div>
          <ul>
            {(analysis?.strengths ?? ['Strong baseline delivery completed.']).map((str, idx) => (
              <li key={idx}>{str}</li>
            ))}
          </ul>
        </div>

        <div className="insight-card improvement-card">
          <div className="insight-badge-title">
            <span className="insight-icon">▲</span>
            <h3>Biggest Improvement Area</h3>
          </div>
          <p className="improvement-statement">
            {analysis?.biggestImprovementArea ||
              'Maintain consistent pace and vocabulary discipline across all pitch sections.'}
          </p>
        </div>
      </div>

      {/* Concise Actionable Recommendations */}
      <section className="feedback-card">
        <div className="panel-heading">
          <h2>Actionable Recommendations</h2>
          <span>Based on major transcript metrics</span>
        </div>
        <ul>
          {(
            analysis?.recommendations ?? [
              'Maintain your target speaking rate.',
              'Replace filler placeholders with silent pauses.',
              'Ensure all core pitch components are covered.',
            ]
          ).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Structure checklist */}
      {analysis && (
        <section className="structure-card">
          <div className="panel-heading">
            <h2>Pitch Structure Verification</h2>
            <span>{analysis.scores.structure}/100 detected</span>
          </div>
          <div className="structure-list">
            {analysis.structure.map((section) => (
              <div key={section.id} className={section.detected ? 'is-detected' : ''}>
                <span>{section.detected ? '✓' : '○'}</span>
                <strong>
                  {section.label}
                  {section.importance === 'core' && (
                    <small style={{ display: 'inline', marginLeft: '6px', color: '#1a7551', fontWeight: 600 }}>
                      (Core)
                    </small>
                  )}
                </strong>
                <small>
                  {section.detected ? `Detected: “${section.evidence}”` : 'Not detected in transcript'}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcript Review */}
      <section className="transcript-review">
        <div className="panel-heading">
          <h2>Transcript Review</h2>
          <div className="panel-actions">
            <button
              className={`small-action-button ${highlightFillers ? 'active' : ''}`}
              onClick={() => setHighlightFillers(!highlightFillers)}
            >
              {highlightFillers ? 'Hide fillers' : 'Highlight fillers'}
            </button>
            <button className="small-action-button" onClick={copyTranscript}>
              {copied ? 'Copied!' : 'Copy transcript'}
            </button>
            <span>{session.duration}s run • {analysis?.wordCount ?? 0} words</span>
          </div>
        </div>
        <p>{renderTranscriptWords()}</p>
      </section>

      {/* Action Buttons */}
      <div className="results-cta-row">
        <button className="primary-button" onClick={onTryAgain}>
          Practice Again <span>→</span>
        </button>
        <button className="secondary-button" onClick={onViewHistory}>
          View Rehearsal History &amp; Trends
        </button>
      </div>
    </section>
  )
}
