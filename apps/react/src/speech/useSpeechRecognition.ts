import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechError = 'permission-denied' | 'network' | 'no-speech' | 'audio-capture' | 'service-not-allowed' | 'unknown'

const normaliseError = (error: string): SpeechError => {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'permission-denied'
  if (error === 'network') return 'network'
  if (error === 'no-speech') return 'no-speech'
  if (error === 'audio-capture') return 'audio-capture'
  return 'unknown'
}

export function useSpeechRecognition(language = 'en-US') {
  const recognition = useRef<SpeechRecognition | null>(null)
  const isListeningRef = useRef(false)
  const manuallyStopped = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastSpokenTimestamp = useRef<number | null>(null)

  const [isSupported] = useState(() => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [permission, setPermission] = useState<PermissionState | 'unknown'>('unknown')
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState<SpeechError | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [pauseCount, setPauseCount] = useState(0)

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const startAudioMeter = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const audioCtx = new AudioCtx()
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume()
      }
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.4
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateVolume = () => {
        if (!analyserRef.current || !isListeningRef.current) {
          setAudioLevel(0)
          return
        }
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const normalized = Math.min(100, Math.round((avg / 128) * 100))
        setAudioLevel(normalized)

        if (normalized > 18) {
          const now = Date.now()
          if (lastSpokenTimestamp.current && now - lastSpokenTimestamp.current > 1800) {
            setPauseCount((prev) => prev + 1)
          }
          lastSpokenTimestamp.current = now
        }

        animFrameRef.current = requestAnimationFrame(updateVolume)
      }
      animFrameRef.current = requestAnimationFrame(updateVolume)
    } catch {
      // Audio meter fallback silent
    }
  }, [])

  const requestMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('audio-capture')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setPermission('granted')
      return true
    } catch {
      setPermission('denied')
      setError('permission-denied')
      return false
    }
  }, [])

  const initialise = useCallback(() => {
    if (recognition.current || !isSupported) return recognition.current
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Constructor) return null

    const instance = new Constructor()
    instance.continuous = true
    instance.interimResults = true
    instance.lang = language

    instance.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      setError(null)
    }

    instance.onresult = (event) => {
      let interim = ''
      let completed = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript
        if (event.results[index].isFinal) completed += text
        else interim += text
      }
      if (completed) {
        setFinalTranscript((current) => `${current}${current ? ' ' : ''}${completed.trim()}`)
      }
      setInterimTranscript(interim.trim())
    }

    instance.onerror = (event) => {
      if (event.error !== 'aborted') setError(normaliseError(event.error))
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermission('denied')
      }
    }

    instance.onend = () => {
      // Auto-reconnect if the browser terminated continuous recognition unexpectedly
      if (!manuallyStopped.current && isListeningRef.current) {
        window.setTimeout(() => {
          if (!manuallyStopped.current && isListeningRef.current) {
            try {
              instance.start()
            } catch {
              // Browser may still be cycling
            }
          }
        }, 120)
        return
      }
      isListeningRef.current = false
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.current = instance
    return instance
  }, [isSupported, language])

  const start = useCallback(async () => {
    if (!isSupported) return
    setError(null)
    manuallyStopped.current = false
    const allowed = permission === 'granted' || (await requestMicrophone())
    if (!allowed) return

    const instance = initialise()
    try {
      instance?.start()
      isListeningRef.current = true
      setIsListening(true)
      void startAudioMeter()
    } catch {
      // recognition already running
    }
  }, [initialise, isSupported, permission, requestMicrophone, startAudioMeter])

  const stop = useCallback(() => {
    manuallyStopped.current = true
    isListeningRef.current = false
    setIsListening(false)
    stopAudioMeter()
    try {
      recognition.current?.stop()
    } catch {
      // ignore
    }
  }, [stopAudioMeter])

  const restart = useCallback(async () => {
    stop()
    window.setTimeout(() => {
      void start()
    }, 200)
  }, [start, stop])

  const resetTranscript = useCallback(() => {
    setFinalTranscript('')
    setInterimTranscript('')
    setPauseCount(0)
    lastSpokenTimestamp.current = null
  }, [])

  useEffect(() => () => {
    manuallyStopped.current = true
    isListeningRef.current = false
    stopAudioMeter()
    recognition.current?.abort()
  }, [stopAudioMeter])

  return {
    isSupported,
    permission,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    audioLevel,
    pauseCount,
    start,
    stop,
    restart,
    resetTranscript,
  }
}
