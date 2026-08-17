import { useT } from '../i18n/LanguageContext'

const STATUS_CLS = {
  ACTIVE:        'badge-active',
  WOUNDED:       'badge-wounded',
  INCAPACITATED: 'badge-incapacitated',
  MISSING:       'badge-missing',
  CAPTURED:      'badge-captured',
  KILLED:        'badge-killed',
  RETIRED:       'badge-retired',
  ENGAGED:       'badge bg-signal/20 text-signal border border-signal/30',
  RETREATING:    'badge bg-warn/20 text-warn border border-warn/30',
  DESTROYED:     'badge bg-danger/20 text-danger border border-danger/30',
  OPERATIONAL:   'badge-active',
  DAMAGED:       'badge-wounded',
  COMPLETED:     'badge-active',
  PENDING:       'badge bg-text-muted/20 text-text-muted border border-text-muted/30',
  VICTORY:       'badge-active',
  DEFEAT:        'badge-killed',
  DRAW:          'badge bg-text-muted/20 text-text-muted border border-text-muted/30',
}

export default function StatusBadge({ status }) {
  const { t } = useT()
  const cls   = STATUS_CLS[status] || 'badge bg-surface-2 text-text-muted border border-border-col'
  const label = t.status[status] || status
  return <span className={cls}>{label}</span>
}
