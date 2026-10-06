import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PitchDuration, PitchType } from '../types'
import { analyseTranscript, calculateLiveDeliveryQuality } from '../speech/analyseTranscript'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'

const displayTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const pitchTypeLabels: Record<PitchType, string> = {
  startup: 'Startup Pitch',
  hackathon: 'Hackathon Demo',
  product: 'Product Pitch',
  elevator: 'Elevator Pitch',
}

interface RehearsalScreenProps {
  duration: PitchDuration
  pitchType: PitchType
  onFinish: (transcript: string, elapsedSeconds: number, pauseCount: number) => void
  onCancel: () => void
}

export function RehearsalScreen({ duration, pitchType, onFinish, onCancel }: RehearsalScreenProps) {
  const speech = useSpeechRecognition()
  const transcript = [speech.finalTranscript, speech.interimTranscript].filter(Boolean).join(' ')
  const [hasStarted, setHasStarted] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(duration)
  const remainingSecondsRef = useRef<number>(duration)
  remainingSecondsRef.current = remainingSeconds

  const transcriptRef = useRef(transcript)
  const hasFinished = useRef(false)

  const elapsedSeconds = Math.max(1, duration - remainingSeconds)
  const metrics = useMemo(
    () => analyseTranscript(transcript, elapsedSeconds, pitchType, speech.pauseCount),
    [transcript, elapsedSeconds, pitchType, speech.pauseCount]
  )

  const liveDeliveryQuality = useMemo(
    () =>
      calculateLiveDeliveryQuality(
        metrics.wordsPerMinute,
        metrics.fillerCount,
        metrics.wordCount,
        pitchType
      ),
    [metrics.wordsPerMinute, metrics.fillerCount, metrics.wordCount, pitchType]
  )

  const finishRehearsal = useCallback(() => {
    if (hasFinished.current) return
    hasFinished.current = true
    speech.stop()
    const finalElapsed = Math.max(1, duration - remainingSecondsRef.current)
    onFinish(transcriptRef.current, finalElapsed, speech.pauseCount)
  }, [duration, onFinish, speech])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  // Mark rehearsal started once listening begins
  useEffect(() => {
    if (speech.isListening && !hasStarted) {
      setHasStarted(true)
    }
  }, [speech.isListening, hasStarted])

  // Countdown only when speech is active (true pause/resume support)
  useEffect(() => {
    if (!speech.isListening || remainingSeconds <= 0) return

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [speech.isListening, remainingSeconds])

  // Auto finish when timer runs out
  useEffect(() => {
    if (hasStarted && remainingSeconds === 0) {
      finishRehearsal()
    }
  }, [hasStarted, remainingSeconds, finishRehearsal])

  const errorCopy: Record<NonNullable<typeof speech.error>, string> = {
    'permission-denied': 'Microphone access was blocked. Allow it in your browser settings and try again.',
    network: 'Speech recognition needs an active network connection.',
    'no-speech': 'We did not hear any speech. Start speaking when you are ready.',
    'audio-capture': 'No microphone is available to Pitchpulse.',
    'service-not-allowed': 'Speech recognition is unavailable in this browser.',
    unknown: 'Something interrupted speech recognition. Try restarting it.',
  }

  const handleReset = () => {
    speech.resetTranscript()
    setRemainingSeconds(duration)
    setHasStarted(false)
    void speech.restart()
  }

  const qualityNames = {
    excellent: 'Excellent',
    good: 'Good',
    'needs-attention': 'Needs attention',
  }

  return (
    <section className="screen rehearsal-screen">
      <div className="rehearsal-top">
        <button
          className="text-button"
          onClick={() => {
            speech.stop()
            onCancel()
          }}
        >
          ← End practice
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="rehearsal-meta-badge">{pitchTypeLabels[pitchType]}</span>

          {/* Live Delivery Quality Pill in Header */}
          <div
            className={`live-quality-pill quality-${liveDeliveryQuality}`}
            title="Measurable delivery quality indicator (speaking pace, filler frequency, speech flow). Not a measure of psychological confidence or emotion."
          >
            <span className="quality-indicator-dot" />
            <span className="quality-pill-label">Delivery quality:</span>
            <strong>{qualityNames[liveDeliveryQuality]}</strong>
          </div>

          <span className="live-badge">
            <i /> {speech.isListening ? 'Listening' : hasStarted ? 'Paused' : 'Ready'}
          </span>

          {speech.isListening && (
            <div className="audio-indicator" title="Microphone input activity">
              <span>Mic</span>
              <div className="audio-bar-wrapper">
                <div
                  className="audio-bar-level"
                  style={{ width: `${Math.min(100, Math.max(10, speech.audioLevel))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="timer-wrap">
        <p>{hasStarted ? (speech.isListening ? 'Time remaining' : 'Paused') : 'Ready when you are'}</p>
        <time>{displayTime(remainingSeconds)}</time>
        <div className="progress-track">
          <span style={{ width: `${((duration - remainingSeconds) / duration) * 100}%` }} />
        </div>
      </div>

      {!speech.isSupported && (
        <div className="speech-notice" role="status">
          <strong>Speech recognition is not supported in this browser.</strong>
          <span>Use a recent Chrome or Edge browser to rehearse with real-time speech transcription.</span>
        </div>
      )}

      {speech.error && (
        <div className="speech-notice is-error" role="alert">
          {errorCopy[speech.error]}{' '}
          <button onClick={() => void speech.restart()}>Try again</button>
        </div>
      )}

      <div className="live-grid">
        <section className="transcript-panel">
          <div className="panel-heading">
            <span>Live transcript</span>
            <span className="muted">{speech.isListening ? 'Listening…' : hasStarted ? 'Paused' : 'Not listening'}</span>
          </div>
          {transcript ? (
            <p className="live-transcript">
              {speech.finalTranscript}
              {speech.interimTranscript && (
                <span className="interim-transcript"> {speech.interimTranscript}</span>
              )}
            </p>
          ) : (
            <p className="empty-transcript">Your words will appear here in real time as you speak.</p>
          )}
        </section>

        <aside className="live-metrics">
          {/* Live Delivery Quality Block with explicit disclaimer */}
          <div className="live-quality-metric-block">
            <span>Live delivery quality</span>
            <strong className={`quality-status-text status-${liveDeliveryQuality}`}>
              {qualityNames[liveDeliveryQuality]}
            </strong>
            <small className="quality-telemetry-note">
              Based on pace, filler control &amp; speech flow. Not a psychological confidence detector.
            </small>
          </div>

          <div>
            <span>Words</span>
            <strong>{metrics.wordCount}</strong>
          </div>
          <div>
            <span>Speaking rate</span>
            <strong>
              {metrics.wordsPerMinute} <small>wpm</small>
            </strong>
          </div>
          <div>
            <span>Filler words</span>
            <strong>{metrics.fillerCount}</strong>
          </div>
          <div>
            <span>Pauses detected</span>
            <strong>{speech.pauseCount}</strong>
          </div>
          <div>
            <span>Microphone</span>
            <strong className={speech.isListening ? 'metric-live' : ''}>
              {speech.isListening ? 'Active' : 'Muted'}
            </strong>
          </div>
        </aside>
      </div>

      <div className="speech-controls">
        {speech.isListening ? (
          <button className="secondary-button" onClick={speech.stop}>
            Pause rehearsal
          </button>
        ) : (
          <button
            className="secondary-button"
            disabled={!speech.isSupported || remainingSeconds === 0}
            onClick={() => void speech.start()}
          >
            {hasStarted ? 'Resume rehearsal' : 'Enable microphone & start'}
          </button>
        )}
        <button
          className="text-button restart-button"
          onClick={handleReset}
          disabled={!speech.isSupported || remainingSeconds === 0}
        >
          Reset rehearsal
        </button>
      </div>

      <button className="primary-button finish-button" onClick={finishRehearsal}>
        Finish rehearsal <span>→</span>
      </button>
    </section>
  )
}
