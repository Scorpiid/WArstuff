import { useState } from 'react'
import Modal from './Modal'
import { useT } from '../i18n/LanguageContext'

// ─── Tier card ───────────────────────────────────────────────────────────────
function TierCard({ tierKey, label, desc, selected, onClick, color }) {
  const colors = {
    recruit: 'border-text-muted/40 hover:border-text-muted   data-[sel=true]:bg-text-muted/10  data-[sel=true]:border-text-muted',
    soldier: 'border-safe/30      hover:border-safe          data-[sel=true]:bg-safe/10         data-[sel=true]:border-safe',
    veteran: 'border-signal/30    hover:border-signal        data-[sel=true]:bg-signal/10       data-[sel=true]:border-signal',
    elite:   'border-danger/30    hover:border-danger        data-[sel=true]:bg-danger/10       data-[sel=true]:border-danger',
    low:     'border-text-muted/40 hover:border-text-muted   data-[sel=true]:bg-text-muted/10  data-[sel=true]:border-text-muted',
    regular: 'border-safe/30      hover:border-safe          data-[sel=true]:bg-safe/10         data-[sel=true]:border-safe',
    high:    'border-signal/30    hover:border-signal        data-[sel=true]:bg-signal/10       data-[sel=true]:border-signal',
  }
  const textColors = {
    recruit:'text-text-muted', soldier:'text-safe', veteran:'text-signal',
    elite:'text-danger', low:'text-text-muted', regular:'text-safe', high:'text-signal',
  }
  const cls = colors[tierKey] || 'border-border-col hover:border-signal data-[sel=true]:bg-signal/10 data-[sel=true]:border-signal'
  const tc  = textColors[tierKey] || 'text-signal'

  return (
    <button
      type="button"
      data-sel={selected}
      onClick={onClick}
      className={`w-full text-left p-3 rounded border transition-all ${cls}`}
    >
      <div className={`font-display font-semibold text-sm tracking-wide ${tc}`}>{label}</div>
      <div className="text-text-muted text-xs mt-0.5">{desc}</div>
    </button>
  )
}

// ─── Squad generator modal ───────────────────────────────────────────────────
export function RandomSquadModal({ nations, onGenerate, onClose }) {
  const { t } = useT()
  const r = t.random
  const [tier,     setTier]     = useState('soldier')
  const [nationId, setNationId] = useState('')
  const [count,    setCount]    = useState(1)

  const TIERS = ['recruit','soldier','veteran','elite']

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
          <button className="btn-secondary" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn-primary" onClick={handleGenerate}>
            ⚄ {r.squadTiers[tier].label} ×{count}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Personnel generator modal ───────────────────────────────────────────────
export function RandomPersonnelModal({ squads, onGenerate, onClose }) {
  const { t } = useT()
  const r = t.random
  const [tier,    setTier]    = useState('regular')
  const [squadId, setSquadId] = useState('')
  const [count,   setCount]   = useState(5)

  const TIERS = ['low','regular','high','elite']

  const handleGenerate = () => {
    onGenerate(tier, squadId || null, count)
    onClose()
  }

  return (
    <Modal title={r.btnRandomPersonnel} onClose={onClose} wide>
      <div className="space-y-4">
        {/* Tier selector */}
        <div>
          <p className="label mb-2">{r.personnelTierLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map(tk => (
              <TierCard
                key={tk}
                tierKey={tk}
                label={r.personnelTiers[tk].label}
                desc={r.personnelTiers[tk].desc}
                selected={tier === tk}
                onClick={() => setTier(tk)}
              />
            ))}
          </div>
        </div>

        {/* Squad assignment */}
        <div>
          <label className="label">{t.personnel.formSquad}</label>
          <select className="select w-full" value={squadId} onChange={e => setSquadId(e.target.value)}>
            <option value="">{t.personnel.noSquad}</option>
            {squads.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Count */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">{r.personnelCount}</label>
            <span className="font-mono text-signal text-sm">{count}</span>
          </div>
          <input
            type="range" min="1" max="20" value={count}
            onChange={e => setCount(+e.target.value)}
            className="w-full accent-signal"
          />
          <div className="flex justify-between text-text-muted text-xs mt-0.5">
            <span>1</span><span>10</span><span>20</span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-deep-night border border-border-col/50 rounded p-3 text-xs font-mono text-text-muted">
          <span className="text-signal">{count}</span> × <span className={`font-display font-semibold ${tier === 'low' ? 'text-text-muted' : tier === 'regular' ? 'text-safe' : tier === 'high' ? 'text-signal' : 'text-danger'}`}>
            {r.personnelTiers[tier].label}
          </span>
          {squadId && squads.find(s => s.id === squadId) && (
            <span> → {squads.find(s => s.id === squadId).name}</span>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button className="btn-secondary" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn-primary" onClick={handleGenerate}>
            ⚄ {t.common.confirm}
          </button>
        </div>
      </div>
    </Modal>
  )
}
