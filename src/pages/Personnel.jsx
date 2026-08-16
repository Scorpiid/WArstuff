import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'

const RANKS = [
  'Private', 'Private First Class', 'Corporal', 'Sergeant',
  'Staff Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General',
]

const ROLES = [
  'Commander', 'Rifleman', 'Machine Gunner', 'Medic', 'Scout',
  'Marksman', 'Engineer', 'Radio Operator', 'Driver', 'Support',
]

const STATUSES = ['ACTIVE', 'WOUNDED', 'INCAPACITATED', 'MISSING', 'CAPTURED', 'KILLED', 'RETIRED']

const WEAPONS = [
  'Assault Rifle', 'Sniper Rifle', 'Machine Gun', 'Shotgun',
  'Pistol', 'Rocket Launcher', 'Grenade Launcher', 'SMG',
  'Medical Kit', 'Radio Equipment', 'Engineering Tools',
]

const EMPTY_FORM = {
  name: '', rank: 'Private', role: 'Rifleman',
  experience: 50, health: 100, skill: 50,
  weapon: 'Assault Rifle', status: 'ACTIVE',
  squadId: null, notes: '',
}

function PersonnelForm({ initial = EMPTY_FORM, onSave, onCancel, squads }) {
  const [form, setForm] = useState({ ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre completo">
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ej: John Smith" />
        </FormField>
        <FormField label="Escuadra">
          <select className="select" value={form.squadId || ''} onChange={e => set('squadId', e.target.value || null)}>
            <option value="">Sin escuadra</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Rango">
          <select className="select" value={form.rank} onChange={e => set('rank', e.target.value)}>
            {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label="Rol">
          <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label="Estado">
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Arma / Equipo">
        <select className="select" value={form.weapon} onChange={e => set('weapon', e.target.value)}>
          {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">Experiencia</span>
            <span className="font-mono text-xs text-signal">{form.experience}</span>
          </div>
          <input type="range" min="0" max="100" value={form.experience}
            onChange={e => set('experience', +e.target.value)} className="w-full accent-signal" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">Habilidad</span>
            <span className="font-mono text-xs text-signal">{form.skill}</span>
          </div>
          <input type="range" min="0" max="100" value={form.skill}
            onChange={e => set('skill', +e.target.value)} className="w-full accent-signal" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">Salud</span>
            <span className={`font-mono text-xs ${form.health > 60 ? 'text-safe' : form.health > 30 ? 'text-warn' : 'text-danger'}`}>{form.health}</span>
          </div>
          <input type="range" min="0" max="100" value={form.health}
            onChange={e => set('health', +e.target.value)} className="w-full accent-green-600" />
        </div>
      </div>

      <FormField label="Notas">
        <textarea className="input resize-none" rows={2} value={form.notes}
          onChange={e => set('notes', e.target.value)} placeholder="Información adicional..." />
      </FormField>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  )
}

function HistoryModal({ person, onClose }) {
  return (
    <Modal title={`Historial — ${person.name}`} onClose={onClose}>
      <div className="space-y-2">
        <div className="flex items-center gap-3 py-2 border-b border-border-col">
          <span className="text-text-muted text-xs w-24 shrink-0">Creado</span>
          <span className="text-text-primary text-xs">{new Date(person.createdAt).toLocaleString('es')}</span>
          <StatusBadge status="ACTIVE" />
        </div>
        {person.history?.length === 0 && (
          <p className="text-text-muted text-sm py-4 text-center">Sin cambios de estado registrados.</p>
        )}
        {person.history?.map((h, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-border-col/50">
            <span className="text-text-muted text-xs w-24 shrink-0">{new Date(h.at).toLocaleString('es')}</span>
            <StatusBadge status={h.from} />
            <span className="text-text-muted">→</span>
            <StatusBadge status={h.to} />
            {h.note && <span className="text-text-muted text-xs ml-auto">{h.note}</span>}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function Personnel() {
  const squads           = useStore(s => s.squads)
  const nations          = useStore(s => s.nations)
  const personnel        = useStore(s => s.personnel)
  const addPersonnel     = useStore(s => s.addPersonnel)
  const updatePersonnel  = useStore(s => s.updatePersonnel)
  const setPersonnelStatus = useStore(s => s.setPersonnelStatus)
  const assignPersonnelToSquad = useStore(s => s.assignPersonnelToSquad)

  const [showCreate,   setShowCreate]   = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [history,      setHistory]      = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSquad,  setFilterSquad]  = useState('')
  const [filterRole,   setFilterRole]   = useState('')
  const [search,       setSearch]       = useState('')

  const filtered = personnel.filter(p => {
    const matchSearch = !search       || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchSquad  = !filterSquad  || p.squadId === filterSquad
    const matchRole   = !filterRole   || p.role === filterRole
    return matchSearch && matchStatus && matchSquad && matchRole
  })

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: personnel.filter(p => p.status === s).length }), {})

  return (
    <div>
      <PageHeader
        title="Personal"
        subtitle={`${personnel.length} efectivo${personnel.length !== 1 ? 's' : ''} registrado${personnel.length !== 1 ? 's' : ''}`}
        actions={<button className="btn-primary" onClick={() => setShowCreate(true)}>+ Nuevo efectivo</button>}
      />

      {/* Status summary pills */}
      {personnel.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUSES.filter(s => counts[s] > 0).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`badge cursor-pointer transition-all ${filterStatus === s ? 'ring-1 ring-signal' : ''}`}
              style={{ opacity: filterStatus && filterStatus !== s ? 0.5 : 1 }}
            >
              <StatusBadge status={s} /> <span className="ml-1 font-mono">{counts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {personnel.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <input className="input w-44" placeholder="Buscar nombre..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select w-40" value={filterSquad} onChange={e => setFilterSquad(e.target.value)}>
            <option value="">Todas escuadras</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select w-40" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {personnel.length === 0 ? (
        <EmptyState
          icon="◉"
          title="Sin personal"
          message="Agrega efectivos a las escuadras de combate."
          action={{ label: '+ Nuevo efectivo', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="war-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rango</th>
                <th>Rol</th>
                <th>Escuadra</th>
                <th>Arma</th>
                <th>Exp</th>
                <th>Salud</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const squad = squads.find(s => s.id === p.squadId)
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="font-display font-medium">{p.name}</div>
                      {p.notes && <div className="text-text-muted text-xs truncate max-w-32">{p.notes}</div>}
                    </td>
                    <td className="text-text-muted text-xs">{p.rank}</td>
                    <td className="text-text-muted text-xs">{p.role}</td>
                    <td>
                      {squad ? (
                        <span className="font-display text-xs">{squad.name}</span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="text-text-muted text-xs">{p.weapon}</td>
                    <td className="font-mono text-signal text-xs">{p.experience}</td>
                    <td>
                      <span className={`font-mono text-xs ${p.health > 60 ? 'text-safe' : p.health > 30 ? 'text-warn' : 'text-danger'}`}>
                        {p.health}
                      </span>
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditing(p)}>Editar</button>
                        <button className="btn-ghost px-2 py-1 text-xs text-text-muted" onClick={() => setHistory(p)}>Hist.</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-6">Sin resultados con los filtros aplicados.</p>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Nuevo efectivo" onClose={() => setShowCreate(false)} wide>
          <PersonnelForm
            squads={squads}
            onSave={data => {
              addPersonnel(data)
              if (data.squadId) assignPersonnelToSquad(data.id, data.squadId)
              setShowCreate(false)
            }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`Editar — ${editing.name}`} onClose={() => setEditing(null)} wide>
          <PersonnelForm
            initial={editing}
            squads={squads}
            onSave={data => {
              updatePersonnel(editing.id, data)
              if (data.squadId !== editing.squadId) assignPersonnelToSquad(editing.id, data.squadId)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {history && <HistoryModal person={history} onClose={() => setHistory(null)} />}
    </div>
  )
}
