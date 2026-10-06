import type { PitchType } from '../types'

const pitchTypes: { value: PitchType; title: string; detail: string; icon: string }[] = [
  { value: 'startup', title: 'Startup', detail: 'Win over investors', icon: '↗' },
  { value: 'hackathon', title: 'Hackathon', detail: 'Demo with impact', icon: '⌘' },
  { value: 'product', title: 'Product', detail: 'Make the value clear', icon: '◈' },
  { value: 'elevator', title: 'Elevator', detail: 'Make it memorable', icon: '↑' },
]

export function PitchTypePicker({ value, onChange }: { value: PitchType; onChange: (value: PitchType) => void }) {
  return <div className="pitch-type-grid" role="radiogroup" aria-label="Pitch type">
    {pitchTypes.map((type) => <button key={type.value} role="radio" aria-checked={value === type.value} className={`pitch-type ${value === type.value ? 'is-selected' : ''}`} onClick={() => onChange(type.value)}>
      <span className="pitch-type-icon">{type.icon}</span><span><strong>{type.title}</strong><small>{type.detail}</small></span>
    </button>)}
  </div>
}
