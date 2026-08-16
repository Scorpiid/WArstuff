/**
 * StatBar — Elemento firma del diseño.
 * Muestra un valor numérico con una barra tipo reticle táctica.
 * El marcador triangular señala la posición exacta del valor.
 */
export default function StatBar({ label, value = 0, max = 100, color = 'signal' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))

  const colorMap = {
    signal:  { bar: 'bg-signal',  marker: 'border-b-signal',  text: 'text-signal' },
    danger:  { bar: 'bg-danger',  marker: 'border-b-danger',  text: 'text-danger' },
    safe:    { bar: 'bg-safe',    marker: 'border-b-safe',    text: 'text-safe' },
    warn:    { bar: 'bg-warn',    marker: 'border-b-warn',    text: 'text-warn' },
    muted:   { bar: 'bg-text-muted', marker: 'border-b-text-muted', text: 'text-text-muted' },
  }
  const c = colorMap[color] || colorMap.signal

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-baseline mb-1">
          <span className="label">{label}</span>
          <span className={`font-mono text-xs ${c.text}`}>{value}</span>
        </div>
      )}
      {/* Track */}
      <div className="relative w-full h-px bg-border-col">
        {/* Fill */}
        <div
          className={`absolute top-0 left-0 h-px ${c.bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
        {/* Marker triangle */}
        <div
          className="absolute top-0"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%) translateY(-3px)',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: `6px solid ${
              color === 'danger' ? '#C0392B' :
              color === 'safe'   ? '#2E7D52' :
              color === 'warn'   ? '#D4820A' :
              color === 'muted'  ? '#6B7590' :
                                   '#C8A84B'
            }`,
          }}
        />
      </div>
    </div>
  )
}
