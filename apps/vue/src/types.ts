export type Screen = 'setup' | 'rehearsal' | 'results' | 'history'
export type PitchDuration = 30 | 60 | 90
export type PitchType = 'startup' | 'hackathon' | 'product' | 'elevator'

export type DeliveryQualityStatus = 'excellent' | 'good' | 'needs-attention'

export interface IndividualScores {
  pace: number
  fillerControl: number
  repetition: number
  clarity: number
  structure: number
}

export interface PitchSection {
  id: 'hook' | 'problem' | 'solution' | 'proof' | 'ask'
  label: string
  detected: boolean
  evidence: string | null
  importance?: 'core' | 'optional'
}

export interface PitchAnalysis {
  wordCount: number
  wordsPerMinute: number
  fillerCount: number
  fillerFrequency: number
  repeatedWordCount: number
  pauseCount: number
  sentenceCount: number
  averageSentenceLength: number
  structure: PitchSection[]
  scores: IndividualScores & { overall: number }
  deliveryQuality: DeliveryQualityStatus
  strengths: string[]
  biggestImprovementArea: string
  recommendations: string[]
  feedback: string[]
}

export interface HistoryRecord {
  id: string
  timestamp: string
  formattedDate: string
  pitchType: PitchType
  duration: PitchDuration
  overallScore: number
  scores: IndividualScores
  wordCount: number
  wordsPerMinute: number
  fillerCount: number
  repeatedWordCount: number
  pauseCount: number
  transcriptSummary: string
  fullTranscript: string
}

export interface PitchSession {
  id?: string
  timestamp?: string
  date?: string
  pitchType: PitchType
  duration: PitchDuration
  transcript: string
  wordsPerMinute: number
  fillerCount: number
  pauseCount: number
  analysis?: PitchAnalysis
}
