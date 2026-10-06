import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { SetupScreen } from './screens/SetupScreen'
import { RehearsalScreen } from './screens/RehearsalScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import type { PitchDuration, PitchSession, PitchType, Screen } from './types'
import { analyseTranscript } from './speech/analyseTranscript'
import { loadHistory, saveHistoryRecord } from './history'

const demoInitialSession: PitchSession = {
  pitchType: 'startup',
  duration: 60,
  transcript:
    'Imagine a world where preparing for a high-stakes pitch is effortless. The problem is that most founders speak too quickly and clutter their delivery with fillers. We built Pitchpulse to provide instant telemetry. Our early users cut filler frequency by 60 percent. Join us as we launch today.',
  wordsPerMinute: 138,
  fillerCount: 1,
  pauseCount: 3,
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [duration, setDuration] = useState<PitchDuration>(60)
  const [pitchType, setPitchType] = useState<PitchType>('startup')
  const [completedSession, setCompletedSession] = useState<PitchSession>(demoInitialSession)
  const [historyCount, setHistoryCount] = useState<number>(0)

  // Sync history count on mount and screen changes
  useEffect(() => {
    const list = loadHistory()
    setHistoryCount(list.length)
  }, [screen])

  const handleFinishRehearsal = (
    transcript: string,
    elapsedSeconds: number,
    pauseCount: number
  ) => {
    const text = transcript.trim() || demoInitialSession.transcript
    const analysis = analyseTranscript(text, elapsedSeconds, pitchType, pauseCount)

    const session: PitchSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pitchType,
      duration,
      transcript: text,
      wordsPerMinute: analysis.wordsPerMinute,
      fillerCount: analysis.fillerCount,
      pauseCount,
      analysis,
    }

    // Persist automatically to local storage history
    saveHistoryRecord(session)
    setCompletedSession(session)
    setHistoryCount((prev) => prev + 1)
    setScreen('results')
  }

  const handleRehearseFormat = (type: PitchType, dur: PitchDuration) => {
    setPitchType(type)
    setDuration(dur)
    setScreen('rehearsal')
  }

  return (
    <AppShell
      screen={screen}
      onLogoClick={() => setScreen('setup')}
      onNavigateHistory={() => setScreen('history')}
      historyCount={historyCount}
    >
      {screen === 'setup' && (
        <SetupScreen
          duration={duration}
          pitchType={pitchType}
          onDurationChange={setDuration}
          onPitchTypeChange={setPitchType}
          onStart={() => setScreen('rehearsal')}
        />
      )}

      {screen === 'rehearsal' && (
        <RehearsalScreen
          duration={duration}
          pitchType={pitchType}
          onFinish={handleFinishRehearsal}
          onCancel={() => setScreen('setup')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          session={completedSession}
          onTryAgain={() => setScreen('setup')}
          onViewHistory={() => setScreen('history')}
        />
      )}

      {screen === 'history' && (
        <HistoryScreen
          onBackToPractice={() => setScreen('setup')}
          onRehearseFormat={handleRehearseFormat}
        />
      )}
    </AppShell>
  )
}
