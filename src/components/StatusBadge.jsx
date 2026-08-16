const STATUS_MAP = {
  // Personnel
  ACTIVE:        'badge-active',
  WOUNDED:       'badge-wounded',
  INCAPACITATED: 'badge-incapacitated',
  MISSING:       'badge-missing',
  CAPTURED:      'badge-captured',
  KILLED:        'badge-killed',
  RETIRED:       'badge-retired',
  // Squads / Vehicles
  ENGAGED:       'badge bg-signal/20 text-signal border border-signal/30',
  RETREATING:    'badge bg-warn/20 text-warn border border-warn/30',
  DESTROYED:     'badge bg-danger/20 text-danger border border-danger/30',
  OPERATIONAL:   'badge-active',
  DAMAGED:       'badge-wounded',
  // General
  COMPLETED:     'badge-active',
  PENDING:       'badge bg-text-muted/20 text-text-muted border border-text-muted/30',
  VICTORY:       'badge-active',
  DEFEAT:        'badge-killed',
  DRAW:          'badge bg-text-muted/20 text-text-muted border border-text-muted/30',
}

const LABELS = {
  ACTIVE:        'Activo',
  WOUNDED:       'Herido',
  INCAPACITATED: 'Incapacitado',
  MISSING:       'Desaparecido',
  CAPTURED:      'Capturado',
  KILLED:        'KIA',
  RETIRED:       'Retirado',
  ENGAGED:       'En combate',
  RETREATING:    'Retirando',
  DESTROYED:     'Destruido',
  OPERATIONAL:   'Operativo',
  DAMAGED:       'Dañado',
  COMPLETED:     'Completado',
  PENDING:       'Pendiente',
  VICTORY:       'Victoria',
  DEFEAT:        'Derrota',
  DRAW:          'Empate',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'badge bg-surface-2 text-text-muted border border-border-col'
  const label = LABELS[status] || status
  return <span className={cls}>{label}</span>
}
