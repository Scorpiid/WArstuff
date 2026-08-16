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

const SQUAD_TYPES = [
  'Infantry', 'Special Operations', 'Armored', 'Reconnaissance',
  'Artillery', 'Engineering', 'Medical', 'Logistics', 'Air Assault',
]

const SQUAD_STATUSES = ['ACTIVE', 'ENGAGED', 'RETREATING', 'DESTROYED', 'CAPTURED']

const STAT_KEYS = [
  { key: 'training',       label: 'Entrenamiento' },
  { key: 'morale',         label: 'Moral' },
  { key: 'experience',     label: 'Experiencia' },
  { key: 'combat',         label: 'Combate' },
  { key: 'stealth',        label: 'Sigilo' },
  { key: 'mobility',       label: 'Movilidad' },
  { key: 'accuracy',       label: 'Precisión' },
  { key: 'defense',        label: 'Defensa' },
  { key: 'leadership',     label: 'Liderazgo' },
  { key: 'medical',        label: 'Médico' },
  { key: 'communications', label: 'Comunicaciones' },
  { key: 'logistics',      label: 'Logística' },
]

const SUPPLY_KEYS = [
  { key: 'ammo',       label: 'Munición' },
  { key: 'medSupplies',label: 'Suministros médicos' },
  { key: 'fuel',       label: 'Combustible' },
  { key: 'commsEquip', label: 'Equipo comms' },
]

function SquadForm({ initial, onSave, onCancel, nations }) {
  const defaults = defaultSquadStats()
  const [form, setForm] = useState({
    name: '', nationId: '', commander: '', type: 'Infantry',
    status: 'ACTIVE', fatigue: 10, readiness: 90,
    ...defaults,
    ...(initial || {}),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre de la escuadra">
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ej: Alpha Squad" />
        </FormField>
        <FormField label="Comandante">
          <input className="input" value={form.commander} onChange={e => set('commander', e.target.value)} placeholder="Nombre del comandante" />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Tipo">
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            {SQUAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Nación">
          <select className="select" value={form.nationId || ''} onChange={e => set('nationId', e.target.value || null)}>
            <option value="">Sin nación</option>
            {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </FormField>
        <FormField label="Estado">
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {SQUAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>

      {/* Combat stats */}
      <div>
        <p className="label mb-3">Estadísticas de combate</p>
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

      {/* Fatigue & Readiness */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">Fatiga</span>
            <span className="font-mono text-xs text-warn">{form.fatigue}</span>
          </div>
          <input type="range" min="0" max="100" value={form.fatigue}
            onChange={e => set('fatigue', +e.target.value)}
            className="w-full accent-warn" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">Preparación</span>
            <span className="font-mono text-xs text-safe">{form.readiness}</span>
          </div>
          <input type="range" min="0" max="100" value={form.readiness}
            onChange={e => set('readiness', +e.target.value)}
            className="w-full accent-green-600" />
        </div>
      </div>

      {/* Supply */}
      <div>
        <p className="label mb-3">Suministros</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {SUPPLY_KEYS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="label mb-0">{label}</span>
                <span className="font-mono text-xs text-signal">{form[key] ?? 100}%</span>
              </div>
              <input type="range" min="0" max="100" value={form[key] ?? 100}
                onChange={e => set(key, +e.target.value)}
                className="w-full accent-signal" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar escuadra</button>
      </div>
    </form>
  )
}

function DerivedPanel({ squad, vehicles, rules }) {
  const derived = calcDerivedStats(squad, vehicles, rules)
  const items = [
    { label: 'Poder de combate', value: derived.combatPower },
    { label: 'Poder ofensivo',   value: derived.offensivePower },
    { label: 'Poder defensivo',  value: derived.defensivePower },
    { label: 'Prob. supervivencia', value: `${derived.survivalProbability}%` },
    { label: 'Estabilidad moral', value: derived.moraleStability },
    { label: 'Resist. supresión', value: derived.suppressionResist },
  ]
  return (
    <div className="bg-deep-night border border-border-col rounded p-3">
      <p className="label mb-2">Estadísticas derivadas</p>
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

function SquadRow({ squad, nation, personnel, vehicles, rules, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const activePersonnel = personnel.filter(p => squad.personnelIds?.includes(p.id) && p.status === 'ACTIVE')
  const squadVehicles   = vehicles.filter(v => squad.vehicleIds?.includes(v.id))

  return (
    <>
      <tr className="cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td>
          <div className="flex items-center gap-2">
            <span className="text-border-col text-xs">{expanded ? '▼' : '▶'}</span>
            <div>
              <div className="font-display font-semibold">{squad.name}</div>
              {squad.commander && <div className="text-text-muted text-xs">{squad.commander}</div>}
            </div>
          </div>
        </td>
        <td>
          {nation ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nation.color }} />
              <span className="text-text-muted text-xs">{nation.name}</span>
            </div>
          ) : <span className="text-text-muted text-xs">—</span>}
        </td>
        <td><span className="text-text-muted text-xs">{squad.type}</span></td>
        <td><span className="font-mono text-signal">{squad.combat ?? 70}</span></td>
        <td><span className="font-mono">{squad.morale ?? 80}</span></td>
        <td><span className={`font-mono ${squad.fatigue > 70 ? 'text-danger' : squad.fatigue > 40 ? 'text-warn' : 'text-safe'}`}>{squad.fatigue ?? 10}</span></td>
        <td><span className="font-mono text-text-muted">{activePersonnel.length}</span></td>
        <td><StatusBadge status={squad.status} /></td>
        <td>
          <div className="flex gap-1">
            <button className="btn-ghost px-2 py-1 text-xs" onClick={e => { e.stopPropagation(); onEdit() }}>Editar</button>
            <button className="btn-ghost px-2 py-1 text-xs text-danger" onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-surface-2 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stat bars */}
              <div className="space-y-2">
                {STAT_KEYS.slice(0, 6).map(({ key, label }) => (
                  <StatBar key={key} label={label} value={squad[key] ?? 50} />
                ))}
              </div>
              <div className="space-y-2">
                {STAT_KEYS.slice(6).map(({ key, label }) => (
                  <StatBar key={key} label={label} value={squad[key] ?? 50} />
                ))}
                <StatBar label="Fatiga"      value={squad.fatigue ?? 10} color="warn" />
                <StatBar label="Preparación" value={squad.readiness ?? 90} color="safe" />
              </div>
              {/* Derived */}
              <div className="md:col-span-2">
                <DerivedPanel squad={squad} vehicles={squadVehicles} rules={rules} />
              </div>
              {/* Vehicles */}
              {squadVehicles.length > 0 && (
                <div className="md:col-span-2">
                  <p className="label mb-2">Vehículos ({squadVehicles.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {squadVehicles.map(v => (
                      <div key={v.id} className="bg-deep-night border border-border-col rounded px-2 py-1 text-xs">
                        <span className="text-signal font-display">{v.name}</span>
                        <span className="text-text-muted ml-1">({v.type})</span>
                        <StatusBadge status={v.status} />
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

export default function Squads() {
  const nations    = useStore(s => s.nations)
  const squads     = useStore(s => s.squads)
  const personnel  = useStore(s => s.personnel)
  const vehicles   = useStore(s => s.vehicles)
  const rules      = useStore(s => s.rules)
  const addSquad   = useStore(s => s.addSquad)
  const updateSquad = useStore(s => s.updateSquad)
  const deleteSquad = useStore(s => s.deleteSquad)

  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [deleting,   setDeleting]   = useState(null)
  const [filter,     setFilter]     = useState('')
  const [filterNation, setFilterNation] = useState('')

  const filtered = squads.filter(s => {
    const matchName   = !filter       || s.name.toLowerCase().includes(filter.toLowerCase())
    const matchNation = !filterNation || s.nationId === filterNation
    return matchName && matchNation
  })

  return (
    <div>
      <PageHeader
        title="Escuadras"
        subtitle={`${squads.length} escuadra${squads.length !== 1 ? 's' : ''} registrada${squads.length !== 1 ? 's' : ''}`}
        actions={<button className="btn-primary" onClick={() => setShowCreate(true)}>+ Nueva escuadra</button>}
      />

      {/* Filters */}
      {squads.length > 0 && (
        <div className="flex gap-3 mb-4">
          <input
            className="input w-48"
            placeholder="Buscar escuadra..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <select className="select w-44" value={filterNation} onChange={e => setFilterNation(e.target.value)}>
            <option value="">Todas las naciones</option>
            {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>
      )}

      {squads.length === 0 ? (
        <EmptyState
          icon="◆"
          title="Sin escuadras"
          message="Crea la primera escuadra de combate."
          action={{ label: '+ Nueva escuadra', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="war-table">
            <thead>
              <tr>
                <th>Escuadra</th>
                <th>Nación</th>
                <th>Tipo</th>
                <th>Combate</th>
                <th>Moral</th>
                <th>Fatiga</th>
                <th>Personal</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sq => (
                <SquadRow
                  key={sq.id}
                  squad={sq}
                  nation={nations.find(n => n.id === sq.nationId)}
                  personnel={personnel}
                  vehicles={vehicles}
                  rules={rules}
                  onEdit={()   => setEditing(sq)}
                  onDelete={() => setDeleting(sq.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="Nueva escuadra" onClose={() => setShowCreate(false)} wide>
          <SquadForm
            nations={nations}
            onSave={data => { addSquad(data); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`Editar — ${editing.name}`} onClose={() => setEditing(null)} wide>
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
          title="Eliminar escuadra"
          message="Se eliminará la escuadra permanentemente. ¿Continuar?"
          danger
          onConfirm={() => { deleteSquad(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
