import type { PitchDuration } from '../types'
const durations: { value: PitchDuration; label: string; detail: string }[] = [
  { value: 30, label: '30 sec', detail: 'Quick and sharp' }, { value: 60, label: '60 sec', detail: 'The sweet spot' },
  { value: 90, label: '90 sec', detail: 'Tell the story' },
]
export function DurationPicker({ value, onChange }: { value: PitchDuration; onChange: (value: PitchDuration) => void }) {
  return <div className="duration-picker" role="radiogroup" aria-label="Pitch duration">
    {durations.map((option) => <button key={option.value} role="radio" aria-checked={value === option.value} className={`duration-option ${value === option.value ? 'is-selected' : ''}`} onClick={() => onChange(option.value)}><strong>{option.label}</strong><span>{option.detail}</span></button>)}
  </div>
}
