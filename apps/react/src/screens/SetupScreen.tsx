import { DurationPicker } from '../components/DurationPicker'
import { PitchTypePicker } from '../components/PitchTypePicker'
import type { PitchDuration, PitchType } from '../types'

export function SetupScreen({ duration, pitchType, onDurationChange, onPitchTypeChange, onStart }: { duration: PitchDuration; pitchType: PitchType; onDurationChange: (value: PitchDuration) => void; onPitchTypeChange: (value: PitchType) => void; onStart: () => void }) {
  return <section className="screen setup-screen">
    <div className="setup-hero"><div className="eyebrow">Practice in private. Pitch in public.</div><h1>Turn your idea into<br /><em>momentum.</em></h1><p className="lead">A focused room to rehearse your next pitch—then leave with a clearer, sharper delivery.</p></div>
    <div className="setup-card"><div className="setup-step"><span className="step-number">01</span><div><h2>What are you pitching?</h2><p>We’ll tailor the rehearsal frame to your moment.</p></div></div>
      <PitchTypePicker value={pitchType} onChange={onPitchTypeChange} />
      <div className="setup-step"><span className="step-number">02</span><div><h2>Set your run time</h2><p>Pick the constraint you need to nail.</p></div></div>
      <DurationPicker value={duration} onChange={onDurationChange} />
      <button className="primary-button start-button" onClick={onStart}><span className="button-pulse" />Start your {duration}-second rehearsal <b>→</b></button>
      <p className="privacy-note"><span>⌁</span> Your practice stays in your browser. Nothing is recorded or shared.</p>
    </div>
  </section>
}
