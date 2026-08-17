import { useState } from 'react'
import Modal from './Modal'
import { useT } from '../i18n/LanguageContext'

// ─── Tier card ────────────────────────────────────────────────────────────────
function TierCard({ tierKey, label, desc, selected, onClick }) {
  const borderCls = {
    recruit: 'border-text-muted/40 hover:border-text-muted',
    soldier: 'border-safe/30      hover:border-safe',
    veteran: 'border-signal/30    hover:border-signal',
    elite:   'border-danger/30    hover:border-danger',
  }
  const textCls = {
    recruit: 'text-text-muted',
    soldier: 'text-safe',
    veteran: 'text-signal',
    elite:   'text-danger',
  }
  const selBg = {
    recruit: 'bg-text-muted/10',
    soldier: 'bg-safe/10',
    veteran: 'bg-signal/10',
    elite:   'bg-danger/10',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded border transition-all
        ${borderCls[tierKey] || 'border-border-col'}
        ${selected ? (selBg[tierKey] || 'bg-signal/10') + ' border-opacity-100' : ''}`}
    >
      <div className={`font-display font-semibold text-sm tracking-wide ${textCls[tierKey] || 'text-signal'}`}>
        {label}
      </div>
      <div className="text-text-muted text-xs mt-0.5">{desc}</div>
    </button>
  )
}

// ─── Squad generator modal ────────────────────────────────────────────────────
export function RandomSquadModal({ nations, onGenerate, onClose }) {
  const { t } = useT()
  const r = t.random

  const [tier,     setTier]     = useState('soldier')
  const [nationId, setNationId] = useState('')
  const [count,    setCount]    = useState(1)

  const TIERS = ['recruit', 'soldier', 'veteran', 'elite']

  const handleGenerate = () => {
    for (let i = 0; i < count; i++) {
      onGenerate(tier, nationId || null)
    }
    onClose()
  }

  return (
    <Modal title={r.btnRandomSquad} onClose={onClose}>
      <div className="space-y-4">

        {/* Tier selector */}
        <div>
          <p className="label mb-2">{r.squadTierLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map(tk => (
              <TierCard
                key={tk}
                tierKey={tk}
                label={r.squadTiers[tk].label}
                desc={r.squadTiers[tk].desc}
                selected={tier === tk}
                onClick={() => setTier(tk)}
              />
            ))}
          </div>
        </div>

        {/* Nation */}
        {nations.length > 0 && (
          <div>
            <label className="label">{t.squads.formNation}</label>
            <select className="select w-full" value={nationId} onChange={e => setNationId(e.target.value)}>
              <option value="">{t.squads.noNation}</option>
              {nations.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Count */}
        <div>
          <label className="label">{r.personnelCount}</label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="1" max="5" value={count}
              onChange={e => setCount(+e.target.value)}
              className="flex-1 accent-signal"
            />
            <span className="font-mono text-signal text-sm w-6 text-right">{count}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>{t.common.cancel}</button>
          <button type="button" className="btn-primary" onClick={handleGenerate}>
            ⚄ {r.squadTiers[tier].label} ×{count}
          </button>
        </div>

      </div>
    </Modal>
  )
}
