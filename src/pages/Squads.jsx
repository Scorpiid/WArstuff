import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'
import StatusBadge from '../components/StatusBadge'
import { defaultSquadStats } from '../store/useStore'
import { calcDerivedStats } from '../engine/combatEngine'
import { useT } from '../i18n/LanguageContext'
import { RandomSquadModal } from '../components/RandomGeneratorModal'
import { generateRandomSquad } from '../engine/randomizer'

const SQUAD_TYPES    = ['Infantry','Special Operations','Armored','Reconnaissance','Artillery','Engineering','Medical','Logistics','Air Assault']
const SQUAD_STATUSES = ['ACTIVE','ENGAGED','RETREATING','DESTROYED','CAPTURED']

// ─── Squad size counter ───────────────────────────────────────────────────────
function SizeCounter({ size, lang }) {
  const s = Math.max(0, size ?? 0)
  const color = s === 0 ? 'text-danger' : s <= 3 ? 'text-danger' : s <= 6 ? 'text-warn' : 'text-safe'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-mono text-sm font-semibold ${color}`}>{s}</span>
      {s === 0 && <span className="text-danger text-xs">☠</span>}
      <div className="w-12 h-1 bg-border-col rounded-full overflow-hidden">
        <div
          className={`h-1 rounded-full transition-all ${s === 0 ? 'bg-danger' : s <= 3 ? 'bg-danger' : s <= 6 ? 'bg-warn' : 'bg-safe'}`}
          style={{ width: `${Math.min(100, (s / 20) * 100)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Squad form ───────────────────────────────────────────────────────────────
function SquadForm({ initial, onSave, onCancel, nations }) {
  const { t, lang } = useT()
  const s = t.squads
  const defaults = defaultSquadStats()

  const STAT_KEYS = [
    { key: 'training',       label: s.statTraining },
    { key: 'morale',         label: s.statMorale },
    { key: 'experience',     label: s.statExperience },
    { key: 'combat',         label: s.statCombat },
    { key: 'stealth',        label: s.statStealth },
    { key: 'mobility',       label: s.statMobility },
    { key: 'accuracy',       label: s.statAccuracy },
    { key: 'defense',        label: s.statDefense },
    { key: 'leadership',     label: s.statLeadership },
    { key: 'medical',        label: s.statMedical },
    { key: 'communications', label: s.statComms },
    { key: 'logistics',      label: s.statLogistics },
  ]
  const SUPPLY_KEYS = [
    { key: 'ammo',        label: s.supplyAmmo },
    { key: 'medSupplies', label: s.supplyMed },
    { key: 'fuel',        label: s.supplyFuel },
    { key: 'commsEquip',  label: s.supplyComms },
  ]

  const [form, setForm] = useState({
    name: '', nationId: '', commander: '', type: 'Infantry',
    status: 'ACTIVE', fatigue: 10, readiness: 90,
    squadSize: 10,
    ...defaults,
    ...(initial || {}),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={s.formName}>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
            required placeholder={s.placeholderName} />
        </FormField>
        <FormField label={s.formCommander}>
          <input className="input" value={form.commander} onChange={e => set('commander', e.target.value)}
            placeholder={s.placeholderCommander} />
        </FormField>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <FormField label={s.formType}>
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            {SQUAD_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </FormField>
        <FormField label={s.formNation}>
          <select className="select" value={form.nationId || ''} onChange={e => set('nationId', e.target.value || null)}>
            <option value="">{s.noNation}</option>
            {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </FormField>
        <FormField label={s.formStatus}>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {SQUAD_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </FormField>
        {/* Squad size */}
        <FormField label={lang === 'en' ? 'Squad size' : 'Efectivos'}>
          <div className="flex gap-1">
            <input
              type="number" min="0" max="9999"
              className="input flex-1"
              value={form.squadSize ?? 10}
              onChange={e => set('squadSize', Math.max(0, parseInt(e.target.value) || 0))}
            />
            <button
              type="button"
              className="btn-secondary px-2 text-xs font-mono"
              onClick={() => set('squadSize', (form.squadSize ?? 10) + 100)}
              title="+100"
            >+100</button>
          </div>
        </FormField>
      </div>

      {/* Combat stats */}
      <div>
        <p className="label mb-3">{s.sectionStats}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {STAT_KEYS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="label mb-0">{label}</span>
                <span className="font-mono text-xs text-signal">{form[key]}</span>
              </div>
              <input type="range" min="0" max="100" value={form[key] ?? 50}
                onChange={e => set(key, +e.target.value)}
                className="w-full accent-signal h-px bg-border-col" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">{s.labelFatigue}</span>
            <span className="font-mono text-xs text-warn">{form.fatigue}</span>
          </div>
          <input type="range" min="0" max="100" value={form.fatigue}
            onChange={e => set('fatigue', +e.target.value)} className="w-full accent-warn" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">{s.labelReadiness}</span>
            <span className="font-mono text-xs text-safe">{form.readiness}</span>
          </div>
          <input type="range" min="0" max="100" value={form.readiness}
            onChange={e => set('readiness', +e.target.value)} className="w-full accent-green-600" />
        </div>
      </div>

      {/* Supply */}
      <div>
        <p className="label mb-3">{s.sectionSupply}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {SUPPLY_KEYS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="label mb-0">{label}</span>
                <span className="font-mono text-xs text-signal">{form[key] ?? 100}%</span>
              </div>
              <input type="range" min="0" max="100" value={form[key] ?? 100}
                onChange={e => set(key, +e.target.value)} className="w-full accent-signal" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary">{s.btnSave}</button>
      </div>
    </form>
  )
}

// ─── Derived stats panel ──────────────────────────────────────────────────────
function DerivedPanel({ squad, vehicles, rules }) {
  const { t } = useT()
  const s = t.squads
  const derived = calcDerivedStats(squad, vehicles, rules)
  const items = [
    { label: s.derivedCombat,       value: derived.combatPower },
    { label: s.derivedOffensive,    value: derived.offensivePower },
    { label: s.derivedDefensive,    value: derived.defensivePower },
    { label: s.derivedSurvival,     value: `${derived.survivalProbability}%` },
    { label: s.derivedMorale,       value: derived.moraleStability },
    { label: s.derivedSuppression,  value: derived.suppressionResist },
  ]
  return (
    <div className="bg-deep-night border border-border-col rounded p-3">
      <p className="label mb-2">{s.derivedTitle}</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="font-mono text-signal text-lg font-medium">{value}</div>
            <div className="label text-center">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Squad row ────────────────────────────────────────────────────────────────
function SquadRow({ squad, nation, vehicles, rules, onEdit, onDelete, onSizeChange }) {
  const { t, lang } = useT()
  const s = t.squads
  const [expanded, setExpanded] = useState(false)

  const STAT_KEYS = [
    { key: 'training',       label: s.statTraining },
    { key: 'morale',         label: s.statMorale },
    { key: 'experience',     label: s.statExperience },
    { key: 'combat',         label: s.statCombat },
    { key: 'stealth',        label: s.statStealth },
    { key: 'mobility',       label: s.statMobility },
    { key: 'accuracy',       label: s.statAccuracy },
    { key: 'defense',        label: s.statDefense },
    { key: 'leadership',     label: s.statLeadership },
    { key: 'medical',        label: s.statMedical },
    { key: 'communications', label: s.statComms },
    { key: 'logistics',      label: s.statLogistics },
  ]

  const squadVehicles = vehicles.filter(v => squad.vehicleIds?.includes(v.id))
  const isDestroyed   = squad.status === 'DESTROYED'
  const size          = squad.squadSize ?? 0

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${isDestroyed ? 'opacity-50' : 'hover:bg-surface-2/40'}`}
        onClick={() => setExpanded(e => !e)}
      >
        <td>
          <div className="flex items-center gap-2">
            <span className="text-border-col text-xs">{expanded ? '▼' : '▶'}</span>
            <div>
              <div className={`font-display font-semibold ${isDestroyed ? 'line-through text-text-muted' : ''}`}>
                {squad.name}
              </div>
              {squad.commander && <div className="text-text-muted text-xs">{squad.commander}</div>}
            </div>
          </div>
        </td>
        <td>
          {nation
            ? <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nation.color }} />
                <span className="text-text-muted text-xs">{nation.name}</span>
              </div>
            : <span className="text-text-muted text-xs">—</span>
          }
        </td>
        <td><span className="text-text-muted text-xs">{squad.type}</span></td>
        <td><span className="font-mono text-signal">{squad.combat ?? 70}</span></td>
        <td><span className="font-mono">{squad.morale ?? 80}</span></td>
        <td>
          <span className={`font-mono ${squad.fatigue > 70 ? 'text-danger' : squad.fatigue > 40 ? 'text-warn' : 'text-safe'}`}>
            {squad.fatigue ?? 10}
          </span>
        </td>
        {/* Squad size — inline editable, click stops propagation */}
        <td onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="text-text-muted hover:text-danger text-xs w-4 h-4 flex items-center justify-center"
              onClick={() => onSizeChange(squad.id, Math.max(0, size - 1))}
              disabled={isDestroyed}
              title="-1"
            >−</button>
            <SizeCounter size={size} lang={lang} />
            <button
              type="button"
              className="text-text-muted hover:text-safe text-xs w-4 h-4 flex items-center justify-center"
              onClick={() => onSizeChange(squad.id, size + 1)}
              disabled={isDestroyed}
              title="+1"
            >+</button>
            <button
              type="button"
              className="text-text-muted hover:text-safe text-stat font-mono px-1 border border-border-col rounded hover:border-safe/50 transition-colors"
              onClick={() => onSizeChange(squad.id, size + 100)}
              disabled={isDestroyed}
              title="+100"
            >+100</button>
          </div>
        </td>
        <td><StatusBadge status={squad.status} /></td>
        <td>
          <div className="flex gap-1">
            <button type="button" className="btn-ghost px-2 py-1 text-xs"
              onClick={e => { e.stopPropagation(); onEdit() }}>{t.common.edit}</button>
            <button type="button" className="btn-ghost px-2 py-1 text-xs text-danger"
              onClick={e => { e.stopPropagation(); onDelete() }}>{t.common.delete}</button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={9} className="bg-surface-2 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {STAT_KEYS.slice(0, 6).map(({ key, label }) => (
                  <StatBar key={key} label={label} value={squad[key] ?? 50} />
                ))}
              </div>
              <div className="space-y-2">
                {STAT_KEYS.slice(6).map(({ key, label }) => (
                  <StatBar key={key} label={label} value={squad[key] ?? 50} />
                ))}
                <StatBar label={s.labelFatigue}   value={squad.fatigue   ?? 10} color="warn" />
                <StatBar label={s.labelReadiness} value={squad.readiness ?? 90} color="safe" />
              </div>
              <div className="md:col-span-2">
                <DerivedPanel squad={squad} vehicles={squadVehicles} rules={rules} />
              </div>
              {squadVehicles.length > 0 && (
                <div className="md:col-span-2">
                  <p className="label mb-2">{s.labelVehicles.replace('{n}', squadVehicles.length)}</p>
                  <div className="flex gap-2 flex-wrap">
                    {squadVehicles.map(v => (
                      <div key={v.id} className="bg-deep-night border border-border-col rounded px-2 py-1 text-xs">
                        <span className="text-signal font-display">{v.name}</span>
                        <span className="text-text-muted ml-1">({v.subtype || v.category})</span>
                        <span className="ml-1"><StatusBadge status={v.status} /></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Squads() {
  const { t, lang } = useT()
  const s = t.squads

  const nations      = useStore(st => st.nations)
  const squads       = useStore(st => st.squads)
  const vehicles     = useStore(st => st.vehicles)
  const rules        = useStore(st => st.rules)
  const addSquad     = useStore(st => st.addSquad)
  const updateSquad  = useStore(st => st.updateSquad)
  const deleteSquad  = useStore(st => st.deleteSquad)

  const [showCreate,   setShowCreate]   = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [deleting,     setDeleting]     = useState(null)
  const [showRandom,   setShowRandom]   = useState(false)
  const [filter,       setFilter]       = useState('')
  const [filterNation, setFilterNation] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const handleGenerateSquad = (tierKey, nationId) => {
    const data = generateRandomSquad(tierKey, nationId)
    addSquad(data)
  }

  const handleSizeChange = (squadId, newSize) => {
    updateSquad(squadId, { squadSize: newSize })
  }

  const filtered = squads.filter(sq => {
    const matchName   = !filter       || sq.name.toLowerCase().includes(filter.toLowerCase())
    const matchNation = !filterNation || sq.nationId === filterNation
    const matchStatus = !filterStatus || sq.status   === filterStatus
    return matchName && matchNation && matchStatus
  })

  const subtitle = squads.length === 1
    ? s.subtitle.replace('{n}', 1)
    : s.subtitlePlural.replace('{n}', squads.length)

  // Summary counters
  const totalEffectives = squads.reduce((acc, sq) => acc + (sq.squadSize ?? 0), 0)
  const destroyedCount  = squads.filter(sq => sq.status === 'DESTROYED').length

  return (
    <div>
      <PageHeader
        title={s.title}
        subtitle={subtitle}
        actions={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowRandom(true)}>
              {t.random.btnRandomSquad}
            </button>
            <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
              {s.btnNew}
            </button>
          </div>
        }
      />

      {/* Summary strip */}
      {squads.length > 0 && (
        <div className="flex items-center gap-4 mb-4 px-3 py-2 bg-surface border border-border-col rounded text-xs font-mono">
          <span className="text-text-muted">
            {lang === 'en' ? 'Total effectives:' : 'Efectivos totales:'}
            <span className="text-signal ml-1 font-semibold">{totalEffectives}</span>
          </span>
          {destroyedCount > 0 && (
            <span className="text-danger">
              ☠ {destroyedCount} {lang === 'en' ? 'squad(s) destroyed' : 'escuadra(s) destruida(s)'}
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      {squads.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <input className="input w-48" placeholder={s.filterPlaceholder}
            value={filter} onChange={e => setFilter(e.target.value)} />
          <select className="select w-44" value={filterNation} onChange={e => setFilterNation(e.target.value)}>
            <option value="">{s.allNations}</option>
            {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{lang === 'en' ? 'All statuses' : 'Todos los estados'}</option>
            {SQUAD_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      )}

      {squads.length === 0 ? (
        <EmptyState
          icon="◆"
          title={s.emptyTitle}
          message={s.emptyMsg}
          action={{ label: s.btnNew, onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="war-table">
            <thead>
              <tr>
                <th>{s.colSquad}</th>
                <th>{s.colNation}</th>
                <th>{s.colType}</th>
                <th>{s.colCombat}</th>
                <th>{s.colMorale}</th>
                <th>{s.colFatigue}</th>
                <th>{lang === 'en' ? 'Size' : 'Efectivos'}</th>
                <th>{s.colStatus}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sq => (
                <SquadRow
                  key={sq.id}
                  squad={sq}
                  nation={nations.find(n => n.id === sq.nationId)}
                  vehicles={vehicles}
                  rules={rules}
                  onEdit={()   => setEditing(sq)}
                  onDelete={() => setDeleting(sq.id)}
                  onSizeChange={handleSizeChange}
                />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-6">
              {lang === 'en' ? 'No squads match the filters.' : 'Sin escuadras con los filtros aplicados.'}
            </p>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <Modal title={s.modalCreate} onClose={() => setShowCreate(false)} wide>
          <SquadForm
            nations={nations}
            onSave={data => { addSquad(data); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={s.modalEdit.replace('{name}', editing.name)} onClose={() => setEditing(null)} wide>
          <SquadForm
            initial={editing}
            nations={nations}
            onSave={data => { updateSquad(editing.id, data); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={s.deleteTitle}
          message={s.deleteMsg}
          danger
          onConfirm={() => { deleteSquad(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
        />
      )}

      {showRandom && (
        <RandomSquadModal
          nations={nations}
          onGenerate={handleGenerateSquad}
          onClose={() => setShowRandom(false)}
        />
      )}
    </div>
  )
}
