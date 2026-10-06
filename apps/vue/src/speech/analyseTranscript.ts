import type {
  DeliveryQualityStatus,
  IndividualScores,
  PitchAnalysis,
  PitchSection,
  PitchType,
} from '../types'

export const FILLER_WORDS = new Set([
  'um',
  'uh',
  'erm',
  'like',
  'actually',
  'basically',
  'literally',
  'really',
  'just',
  'sort of',
  'kind of',
  'you know',
])

const sectionPatterns: Record<PitchSection['id'], { label: string; pattern: RegExp }> = {
  hook: {
    label: 'Hook',
    pattern: /\b(imagine|what if|have you ever|did you know|today|the future|picture this|question)\b|\?/i,
  },
  problem: {
    label: 'Problem',
    pattern: /\b(problem|challenge|pain point|pain|struggle|friction|difficult|broken|waste|costly)\b/i,
  },
  solution: {
    label: 'Solution',
    pattern: /\b(solution|we build|we built|our product|our platform|helps|enables|makes it|lets you|designed to)\b/i,
  },
  proof: {
    label: 'Proof / Traction',
    pattern: /\b(users?|customers?|revenue|growth|traction|tested|data|results?|percent|%|validated|demo)\b/i,
  },
  ask: {
    label: 'Ask / Close',
    pattern: /\b(asking|looking for|join us|try it|sign up|invest|next step|thank you|together|reach out|contact)\b/i,
  },
}

const typeConfigs: Record<
  PitchType,
  {
    targetPaceMin: number
    targetPaceMax: number
    requiredSections: PitchSection['id'][]
    pitchTypeName: string
  }
> = {
  startup: {
    targetPaceMin: 125,
    targetPaceMax: 155,
    requiredSections: ['hook', 'problem', 'solution', 'proof', 'ask'],
    pitchTypeName: 'Startup pitch',
  },
  hackathon: {
    targetPaceMin: 130,
    targetPaceMax: 165,
    requiredSections: ['problem', 'solution', 'proof', 'ask'],
    pitchTypeName: 'Hackathon demo',
  },
  product: {
    targetPaceMin: 120,
    targetPaceMax: 150,
    requiredSections: ['hook', 'problem', 'solution', 'proof', 'ask'],
    pitchTypeName: 'Product pitch',
  },
  elevator: {
    targetPaceMin: 120,
    targetPaceMax: 145,
    requiredSections: ['hook', 'problem', 'solution', 'ask'],
    pitchTypeName: 'Elevator pitch',
  },
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export function calculateLiveDeliveryQuality(
  wordsPerMinute: number,
  fillerCount: number,
  wordCount: number,
  pitchType: PitchType = 'startup'
): DeliveryQualityStatus {
  if (wordCount < 6) return 'good'
  const config = typeConfigs[pitchType] ?? typeConfigs.startup
  const fillerRatio = fillerCount / wordCount
  const paceDeviation = Math.abs(wordsPerMinute - (config.targetPaceMin + config.targetPaceMax) / 2)

  if (fillerRatio <= 0.03 && paceDeviation <= 20) {
    return 'excellent'
  }
  if (fillerRatio > 0.08 || paceDeviation > 35) {
    return 'needs-attention'
  }
  return 'good'
}

export function analyseTranscript(
  transcript: string,
  elapsedSeconds: number,
  pitchType: PitchType = 'startup',
  pauseCount = 0
): PitchAnalysis {
  const words = transcript.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? []
  const sentences = transcript.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? []
  const fillerCount = words.filter((word) => FILLER_WORDS.has(word)).length
  const repeatedWordCount = words.reduce(
    (count, word, index) => count + Number(index > 0 && word === words[index - 1]),
    0
  )
  const wordsPerMinute = elapsedSeconds > 0 ? Math.round((words.length / elapsedSeconds) * 60) : 0
  const fillerFrequency = words.length ? Number(((fillerCount / words.length) * 100).toFixed(1)) : 0
  const averageSentenceLength = sentences.length ? Number((words.length / sentences.length).toFixed(1)) : 0

  const config = typeConfigs[pitchType] ?? typeConfigs.startup
  const structure: PitchSection[] = (
    Object.entries(sectionPatterns) as [PitchSection['id'], { label: string; pattern: RegExp }][]
  ).map(([id, rule]) => {
    const match = transcript.match(rule.pattern)
    const isRequired = config.requiredSections.includes(id)
    return {
      id,
      label: rule.label,
      detected: Boolean(match),
      evidence: match?.[0]?.trim() ?? null,
      importance: isRequired ? 'core' : 'optional',
    }
  })

  const coreSections = structure.filter((s) => s.importance === 'core')
  const detectedCore = coreSections.filter((s) => s.detected).length
  const optionalSections = structure.filter((s) => s.importance === 'optional')
  const detectedOptional = optionalSections.filter((s) => s.detected).length

  // 1. Pace score (0 - 100)
  const paceOptimal = (config.targetPaceMin + config.targetPaceMax) / 2
  const paceTolerance = (config.targetPaceMax - config.targetPaceMin) / 2
  const pace =
    wordsPerMinute === 0
      ? 0
      : clamp(100 - Math.max(0, Math.abs(wordsPerMinute - paceOptimal) - paceTolerance) * 1.6)

  // 2. Filler word control score (0 - 100)
  const fillerControl = words.length === 0 ? 100 : clamp(100 - fillerFrequency * 9)

  // 3. Repetition score (0 - 100)
  const repetition = clamp(100 - repeatedWordCount * 12)

  // 4. Clarity score (0 - 100) based on sentence length and vocabulary efficiency
  const sentencePenalty =
    averageSentenceLength > 24
      ? (averageSentenceLength - 24) * 2.5
      : averageSentenceLength > 0 && averageSentenceLength < 6
        ? 8
        : 0
  const clarity = clamp(100 - fillerFrequency * 4 - sentencePenalty)

  // 5. Pitch structure score (0 - 100)
  const structureScore = coreSections.length
    ? clamp(Math.round((detectedCore / coreSections.length) * 85 + (detectedOptional > 0 ? 15 : 0)))
    : clamp(Math.round((structure.filter((s) => s.detected).length / structure.length) * 100))

  // Overall delivery quality composite score
  const overall =
    words.length === 0
      ? 0
      : clamp(
          Math.round(
            pace * 0.25 +
              fillerControl * 0.25 +
              repetition * 0.15 +
              clarity * 0.15 +
              structureScore * 0.2
          )
        )

  // Delivery quality status
  let deliveryQuality: DeliveryQualityStatus = 'good'
  if (overall >= 80) {
    deliveryQuality = 'excellent'
  } else if (overall < 65 || words.length === 0) {
    deliveryQuality = 'needs-attention'
  }

  // Strengths evaluation
  const scoreCategories: { name: string; score: number; desc: string }[] = [
    {
      name: 'Pace',
      score: pace,
      desc: `Pacing stayed well-regulated at ${wordsPerMinute} WPM within the target ${config.targetPaceMin}–${config.targetPaceMax} WPM range.`,
    },
    {
      name: 'Filler control',
      score: fillerControl,
      desc:
        fillerCount === 0
          ? 'Zero filler words detected—clean, concise vocabulary.'
          : `Strong vocabulary economy with only ${fillerCount} filler word${fillerCount === 1 ? '' : 's'} (${fillerFrequency}% of transcript).`,
    },
    {
      name: 'Repetition',
      score: repetition,
      desc:
        repeatedWordCount === 0
          ? 'Smooth word flow with zero immediate word repetitions.'
          : 'Low repetition count maintained across transitions.',
    },
    {
      name: 'Clarity',
      score: clarity,
      desc: `Balanced sentence density averaging ${averageSentenceLength || 14} words per sentence.`,
    },
    {
      name: 'Pitch structure',
      score: structureScore,
      desc: `High pitch structural coverage with ${detectedCore}/${coreSections.length} core sections detected.`,
    },
  ]

  const strengths = scoreCategories
    .filter((cat) => cat.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((cat) => cat.desc)

  if (strengths.length === 0) {
    strengths.push(
      'Established a full rehearsal run to baseline speaking rate and pitch parameters.'
    )
  }

  // Biggest improvement area evaluation
  const lowest = [...scoreCategories].sort((a, b) => a.score - b.score)[0]
  let biggestImprovementArea = ''
  if (lowest.name === 'Filler control' && fillerCount > 0) {
    biggestImprovementArea = `Filler word control (${fillerControl}/100): ${fillerCount} filler words (${fillerFrequency}% of total words) diluted pitch delivery.`
  } else if (lowest.name === 'Pace') {
    biggestImprovementArea =
      wordsPerMinute < config.targetPaceMin
        ? `Speaking pace (${pace}/100): ${wordsPerMinute} WPM is below the recommended ${config.targetPaceMin} WPM minimum for a ${config.pitchTypeName.toLowerCase()}.`
        : `Speaking pace (${pace}/100): ${wordsPerMinute} WPM exceeded the ${config.targetPaceMax} WPM ceiling. Slow down to improve audience absorption.`
  } else if (lowest.name === 'Pitch structure' && structureScore < 85) {
    const missing = coreSections.filter((s) => !s.detected).map((s) => s.label)
    biggestImprovementArea = `Pitch structure (${structureScore}/100): Core sections missing from the transcript: ${missing.join(', ')}.`
  } else if (lowest.name === 'Repetition' && repeatedWordCount > 0) {
    biggestImprovementArea = `Repetition control (${repetition}/100): ${repeatedWordCount} immediate word repetitions detected during thought transitions.`
  } else if (lowest.name === 'Clarity') {
    biggestImprovementArea = `Delivery clarity (${clarity}/100): Sentences averaged ${averageSentenceLength} words; aim for 12–18 words to avoid run-on thoughts.`
  } else {
    biggestImprovementArea =
      'Consistent pitch delivery health maintained across all 5 measured criteria.'
  }

  // Actionable recommendations based strictly on major transcript metrics
  const recommendations: string[] = []

  // Recommendation 1: Speaking rate
  if (wordsPerMinute === 0) {
    recommendations.push('Begin vocalizing early to establish a steady speaking cadence.')
  } else if (wordsPerMinute < config.targetPaceMin) {
    recommendations.push(
      `Increase tempo by ~${config.targetPaceMin - wordsPerMinute} WPM to meet the ${config.targetPaceMin}–${config.targetPaceMax} WPM target range.`
    )
  } else if (wordsPerMinute > config.targetPaceMax) {
    recommendations.push(
      `Reduce pace by ~${wordsPerMinute - config.targetPaceMax} WPM; allow silent pauses after key numbers or value statements.`
    )
  } else {
    recommendations.push(
      `Lock in this pace (${wordsPerMinute} WPM); it matches the optimal cadence for a ${config.pitchTypeName.toLowerCase()}.`
    )
  }

  // Recommendation 2: Filler words
  if (fillerCount > 0) {
    recommendations.push(
      `Eliminate ${fillerCount} filler word${fillerCount === 1 ? '' : 's'} (${fillerFrequency}% of total words) by replacing vocal placeholders with silent breaths.`
    )
  } else {
    recommendations.push('Maintain your current zero-filler vocabulary standard.')
  }

  // Recommendation 3: Structure
  const missingCore = coreSections.filter((s) => !s.detected).map((s) => s.label)
  if (missingCore.length > 0) {
    recommendations.push(`Explicitly incorporate missing pitch components: ${missingCore.join(', ')}.`)
  } else {
    recommendations.push(
      'All core pitch components were detected; refine the transitions connecting hook to problem.'
    )
  }

  // Recommendation 4: Pauses & Sentence density
  if (averageSentenceLength > 22) {
    recommendations.push(
      `Split longer sentences (currently ${averageSentenceLength} words/sentence) into shorter statements under 16 words.`
    )
  } else if (pauseCount > 5 && wordsPerMinute < config.targetPaceMin) {
    recommendations.push(
      `Smooth out ${pauseCount} extended speech gaps to maintain steady delivery momentum.`
    )
  }

  const individualScores: IndividualScores = {
    pace,
    fillerControl,
    repetition,
    clarity,
    structure: structureScore,
  }

  return {
    wordCount: words.length,
    wordsPerMinute,
    fillerCount,
    fillerFrequency,
    repeatedWordCount,
    pauseCount,
    sentenceCount: sentences.length,
    averageSentenceLength,
    structure,
    scores: {
      ...individualScores,
      overall,
    },
    deliveryQuality,
    strengths,
    biggestImprovementArea,
    recommendations,
    feedback: recommendations,
  }
}
