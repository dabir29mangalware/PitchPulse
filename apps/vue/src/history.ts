import type { HistoryRecord, PitchSession } from './types'

export const HISTORY_STORAGE_KEY = 'pitchpulse_rehearsal_history'

export function loadHistory(): HistoryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load rehearsal history from localStorage:', err)
    return []
  }
}

export function saveHistoryRecord(session: PitchSession): HistoryRecord {
  const analysis = session.analysis
  const defaultScores = {
    pace: 80,
    fillerControl: 85,
    repetition: 90,
    clarity: 80,
    structure: 75,
    overall: 82,
  }

  const scores = analysis ? analysis.scores : defaultScores

  const trimmed = session.transcript.trim()
  const words = trimmed.split(/\s+/)
  const transcriptSummary =
    words.length > 18
      ? `${words.slice(0, 18).join(' ')}...`
      : trimmed || 'No spoken transcript recorded.'

  const now = new Date()
  const record: HistoryRecord = {
    id: session.id || `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: session.timestamp || now.toISOString(),
    formattedDate: now.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    pitchType: session.pitchType,
    duration: session.duration,
    overallScore: scores.overall,
    scores: {
      pace: scores.pace,
      fillerControl: scores.fillerControl,
      repetition: scores.repetition,
      clarity: scores.clarity,
      structure: scores.structure,
    },
    wordCount: analysis?.wordCount ?? words.filter(Boolean).length,
    wordsPerMinute: session.wordsPerMinute,
    fillerCount: session.fillerCount,
    repeatedWordCount: analysis?.repeatedWordCount ?? 0,
    pauseCount: session.pauseCount,
    transcriptSummary,
    fullTranscript: session.transcript,
  }

  try {
    const currentList = loadHistory()
    const filtered = currentList.filter((item) => item.id !== record.id)
    const updated = [record, ...filtered].slice(0, 30)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to persist rehearsal record to localStorage:', err)
  }

  return record
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear history:', err)
  }
}
