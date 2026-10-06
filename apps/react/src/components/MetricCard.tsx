export function MetricCard({ label, value, detail, tone = 'neutral' }: { label: string; value: string | number; detail: string; tone?: 'neutral' | 'good' | 'attention' }) {
  return <article className={`metric-card metric-${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}
