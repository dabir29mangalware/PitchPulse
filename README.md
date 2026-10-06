# Pitchpulse

Client-side pitch rehearsal application provided as parallel, 100% feature-aligned **React** and **Vue** implementations.

## Features

- **Rehearsal Setup**: Choose your pitch format (*Startup pitch*, *Hackathon demo*, *Product pitch*, *Elevator pitch*) and target run time (*30s*, *60s*, *90s*).
- **Speech Recognition & Live Telemetry**:
  - Live continuous transcription using Web Speech API with automatic reconnection.
  - Real-time microphone input volume indicator powered by Web Audio API.
  - Live telemetry dashboard tracking words spoken, speaking rate (WPM), filler words, pause frequency, and mic state.
  - True pause & resume support maintaining strict sync between timer countdown and speech capture.
- **Tailored Analysis Engine**:
  - Format-specific target cadence and pitch structure validation (Hook, Problem, Solution, Proof / Traction, Ask / Next Steps).
  - Composite delivery scoring (pace 35%, clarity 35%, structure 30%).
  - Actionable feedback suggestions based on your pacing, vocabulary clarity, and rhythm.
- **Results & Progress**:
  - Detailed score and metric cards.
  - Pitch structure checklist with detected evidence quotes.
  - Full transcript review with interactive filler-word highlighting and one-click copy.
  - Local session history tracking your progress across takes.

## Run Locally

```bash
npm install

# Run the React application
npm run dev:react

# Run the Vue application
npm run dev:vue

# Build both applications for production
npm run build
```
