import { onBeforeUnmount, ref } from 'vue'

export type SpeechError = 'permission-denied' | 'network' | 'no-speech' | 'audio-capture' | 'service-not-allowed' | 'unknown'

const normaliseError = (error: string): SpeechError => {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'permission-denied'
  if (error === 'network') return 'network'
  if (error === 'no-speech') return 'no-speech'
  if (error === 'audio-capture') return 'audio-capture'
  return 'unknown'
}

export function useSpeechRecognition(language = 'en-US') {
  const recognition = ref<SpeechRecognition | null>(null)
  const isListeningRef = ref(false)
  const manuallyStopped = ref(false)
  const isSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  const permission = ref<PermissionState | 'unknown'>('unknown')
  const isListening = ref(false)
  const interimTranscript = ref('')
  const finalTranscript = ref('')
  const error = ref<SpeechError | null>(null)
  const audioLevel = ref(0)
  const pauseCount = ref(0)

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let mediaStream: MediaStream | null = null
  let animFrameId: number | null = null
  let lastSpokenTimestamp: number | null = null

  const stopAudioMeter = () => {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch(() => {})
      audioContext = null
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
    }
    audioLevel.value = 0
  }

  const startAudioMeter = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }
      audioContext = ctx

      const node = ctx.createAnalyser()
      node.fftSize = 128
      node.smoothingTimeConstant = 0.4
      analyser = node

      const source = ctx.createMediaStreamSource(stream)
      source.connect(node)

      const dataArray = new Uint8Array(node.frequencyBinCount)

      const updateVolume = () => {
        if (!analyser || !isListeningRef.value) {
          audioLevel.value = 0
          return
        }
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const normalized = Math.min(100, Math.round((avg / 128) * 100))
        audioLevel.value = normalized

        if (normalized > 18) {
          const now = Date.now()
          if (lastSpokenTimestamp && now - lastSpokenTimestamp > 1800) {
            pauseCount.value += 1
          }
          lastSpokenTimestamp = now
        }

        animFrameId = requestAnimationFrame(updateVolume)
      }
      animFrameId = requestAnimationFrame(updateVolume)
    } catch {
      // Audio meter silent fallback
    }
  }

  const requestMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = 'audio-capture'
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      permission.value = 'granted'
      return true
    } catch {
      permission.value = 'denied'
      error.value = 'permission-denied'
      return false
    }
  }

  const initialise = () => {
    if (recognition.value || !isSupported) return recognition.value
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Constructor) return null

    const instance = new Constructor()
    instance.continuous = true
    instance.interimResults = true
    instance.lang = language

    instance.onstart = () => {
      isListeningRef.value = true
      isListening.value = true
      error.value = null
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
        finalTranscript.value = `${finalTranscript.value}${finalTranscript.value ? ' ' : ''}${completed.trim()}`
      }
      interimTranscript.value = interim.trim()
    }

    instance.onerror = (event) => {
      if (event.error !== 'aborted') error.value = normaliseError(event.error)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        permission.value = 'denied'
      }
    }

    instance.onend = () => {
      if (!manuallyStopped.value && isListeningRef.value) {
        window.setTimeout(() => {
          if (!manuallyStopped.value && isListeningRef.value) {
            try {
              instance.start()
            } catch {
              // Browser may still be cycling
            }
          }
        }, 120)
        return
      }
      isListeningRef.value = false
      isListening.value = false
      interimTranscript.value = ''
    }

    recognition.value = instance
    return instance
  }

  const start = async () => {
    if (!isSupported) return
    error.value = null
    manuallyStopped.value = false
    const allowed = permission.value === 'granted' || (await requestMicrophone())
    if (!allowed) return

    const instance = initialise()
    try {
      instance?.start()
      isListeningRef.value = true
      isListening.value = true
      void startAudioMeter()
    } catch {
      // recognition already running
    }
  }

  const stop = () => {
    manuallyStopped.value = true
    isListeningRef.value = false
    isListening.value = false
    stopAudioMeter()
    try {
      recognition.value?.stop()
    } catch {
      // ignore
    }
  }

  const restart = async () => {
    stop()
    window.setTimeout(() => {
      void start()
    }, 200)
  }

  const resetTranscript = () => {
    finalTranscript.value = ''
    interimTranscript.value = ''
    pauseCount.value = 0
    lastSpokenTimestamp = null
  }

  onBeforeUnmount(() => {
    manuallyStopped.value = true
    isListeningRef.value = false
    stopAudioMeter()
    recognition.value?.abort()
  })

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
