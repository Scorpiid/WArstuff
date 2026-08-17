import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { useT } from '../i18n/LanguageContext'
import { RandomPersonnelModal } from '../components/RandomGeneratorModal'
import { generateSquadPersonnel } from '../engine/randomizer'

const RANKS = ['Private','Private First Class','Corporal','Sergeant','Staff Sergeant','Lieutenant','Captain','Major','Colonel','General']
const ROLES = ['Commander','Rifleman','Machine Gunner','Medic','Scout','Marksman','Engineer','Radio Operator','Driver','Support']
const STATUSES = ['ACTIVE','WOUNDED','INCAPACITATED','MISSING','CAPTURED','KILLED','RETIRED']
const WEAPONS = ['Assault Rifle','Sniper Rifle','Machine Gun','Shotgun','Pistol','Rocket Launcher','Grenade Launcher','SMG','Medical Kit','Radio Equipment','Engineering Tools']
const EMPTY_FORM = { name:'', rank:'Private', role:'Rifleman', experience:50, health:100, skill:50, weapon:'Assault Rifle', status:'ACTIVE', squadId:null, notes:'' }

function PersonnelForm({ initial = EMPTY_FORM, onSave, onCancel, squads }) {
  const { t } = useT()
  const p = t.personnel
  const [form, setForm] = useState({ ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={p.formName}>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder={p.placeholderName} />
        </FormField>
        <FormField label={p.formSquad}>
          <select className="select" value={form.squadId || ''} onChange={e => set('squadId', e.target.value || null)}>
            <option value="">{p.noSquad}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={p.formRank}>
          <select className="select" value={form.rank} onChange={e => set('rank', e.target.value)}>
            {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label={p.formRole}>
          <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label={p.formStatus}>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label={p.formWeapon}>
        <select className="select" value={form.weapon} onChange={e => set('weapon', e.target.value)}>
          {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </FormField>
      <div className="grid grid-cols-3 gap-4">
        {[
          { key:'experience', label: p.formExperience, color:'signal' },
          { key:'skill',      label: p.formSkill,      color:'signal' },
          { key:'health',     label: p.formHealth,     color:'safe' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="label mb-0">{label}</span>
              <span className={`font-mono text-xs text-${color}`}>{form[key]}</span>
            </div>
            <input type="range" min="0" max="100" value={form[key]}
              onChange={e => set(key, +e.target.value)}
              className={`w-full accent-${color === 'safe' ? 'green-600' : 'signal'}`} />
          </div>
        ))}
      </div>
      <FormField label={p.formNotes}>
        <textarea className="input resize-none" rows={2} value={form.notes}
          onChange={e => set('notes', e.target.value)} placeholder={p.placeholderNotes} />
      </FormField>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary">{p.btnSave}</button>
      </div>
    </form>
  )
}

function HistoryModal({ person, onClose }) {
  const { t } = useT()
  const p = t.personnel
  return (
    <Modal title={p.historyTitle.replace('{name}', person.name)} onClose={onClose}>
      <div className="space-y-2">
        <div className="flex items-center gap-3 py-2 border-b border-border-col">
          <span className="text-text-muted text-xs w-24 shrink-0">{p.historyCreated}</span>
          <span className="text-text-primary text-xs">{new Date(person.createdAt).toLocaleString()}</span>
          <StatusBadge status="ACTIVE" />
        </div>
        {person.history?.length === 0 && <p className="text-text-muted text-sm py-4 text-center">{p.historyEmpty}</p>}
        {person.history?.map((h, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-border-col/50">
            <span className="text-text-muted text-xs w-24 shrink-0">{new Date(h.at).toLocaleString()}</span>
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
  const { t } = useT()
  const p = t.personnel
  const squads               = useStore(s => s.squads)
  const personnel            = useStore(s => s.personnel)
  const addPersonnel         = useStore(s => s.addPersonnel)
  const updatePersonnel      = useStore(s => s.updatePersonnel)
  const assignPersonnelToSquad = useStore(s => s.assignPersonnelToSquad)

  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [history,       setHistory]       = useState(null)
  const [showRandom,    setShowRandom]    = useState(false)
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterSquad,   setFilterSquad]   = useState('')
  const [filterRole,    setFilterRole]    = useState('')
  const [search,        setSearch]        = useState('')

  const handleGeneratePersonnel = (tierKey, squadId, count) => {
    const batch = generateSquadPersonnel(tierKey, squadId, count)
    batch.forEach(data => {
      addPersonnel(data)
      if (data.squadId) assignPersonnelToSquad(data.id, data.squadId)
    })
  }

  const filtered = personnel.filter(per => {
    const matchSearch = !search       || per.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || per.status === filterStatus
    const matchSquad  = !filterSquad  || per.squadId === filterSquad
    const matchRole   = !filterRole   || per.role === filterRole
    return matchSearch && matchStatus && matchSquad && matchRole
  })
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: personnel.filter(per => per.status === s).length }), {})
  const subtitle = personnel.length === 1 ? p.subtitle.replace('{n}', 1) : p.subtitlePlural.replace('{n}', personnel.length)

  return (
    <div>
      <PageHeader title={p.title} subtitle={subtitle}
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowRandom(true)}>{t.random.btnRandomPersonnel}</button>
            <button className="btn-primary"   onClick={() => setShowCreate(true)}>{p.btnNew}</button>
          </div>
        }
      />

      {personnel.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUSES.filter(s => counts[s] > 0).map(s => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`badge cursor-pointer transition-all ${filterStatus === s ? 'ring-1 ring-signal' : ''}`}
              style={{ opacity: filterStatus && filterStatus !== s ? 0.5 : 1 }}>
              <StatusBadge status={s} /> <span className="ml-1 font-mono">{counts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {personnel.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <input className="input w-44" placeholder={p.filterName} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select w-40" value={filterSquad} onChange={e => setFilterSquad(e.target.value)}>
            <option value="">{p.filterSquad}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select w-40" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">{p.filterRole}</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{p.filterStatus}</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {personnel.length === 0
        ? <EmptyState icon="◉" title={p.emptyTitle} message={p.emptyMsg}
            action={{ label: p.btnNew, onClick: () => setShowCreate(true) }} />
        : <div className="card overflow-x-auto">
            <table className="war-table">
              <thead>
                <tr>
                  <th>{p.colName}</th><th>{p.colRank}</th><th>{p.colRole}</th>
                  <th>{p.colSquad}</th><th>{p.colWeapon}</th><th>{p.colExp}</th>
                  <th>{p.colHealth}</th><th>{p.colStatus}</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(per => {
                  const squad = squads.find(s => s.id === per.squadId)
                  return (
                    <tr key={per.id}>
                      <td>
                        <div className="font-display font-medium">{per.name}</div>
                        {per.notes && <div className="text-text-muted text-xs truncate max-w-32">{per.notes}</div>}
                      </td>
                      <td className="text-text-muted text-xs">{per.rank}</td>
                      <td className="text-text-muted text-xs">{per.role}</td>
                      <td>{squad ? <span className="font-display text-xs">{squad.name}</span> : <span className="text-text-muted text-xs">—</span>}</td>
                      <td className="text-text-muted text-xs">{per.weapon}</td>
                      <td className="font-mono text-signal text-xs">{per.experience}</td>
                      <td><span className={`font-mono text-xs ${per.health > 60 ? 'text-safe' : per.health > 30 ? 'text-warn' : 'text-danger'}`}>{per.health}</span></td>
                      <td><StatusBadge status={per.status} /></td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditing(per)}>{t.common.edit}</button>
                          <button className="btn-ghost px-2 py-1 text-xs text-text-muted" onClick={() => setHistory(per)}>{t.common.history}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-text-muted text-sm text-center py-6">{p.noResults}</p>}
          </div>
      }

      {showCreate && (
        <Modal title={p.modalCreate} onClose={() => setShowCreate(false)} wide>
          <PersonnelForm squads={squads}
            onSave={data => { addPersonnel(data); if (data.squadId) assignPersonnelToSquad(data.id, data.squadId); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title={p.modalEdit.replace('{name}', editing.name)} onClose={() => setEditing(null)} wide>
          <PersonnelForm initial={editing} squads={squads}
            onSave={data => { updatePersonnel(editing.id, data); if (data.squadId !== editing.squadId) assignPersonnelToSquad(editing.id, data.squadId); setEditing(null) }}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {history && <HistoryModal person={history} onClose={() => setHistory(null)} />}
      {showRandom && (
        <RandomPersonnelModal
          squads={squads}
          onGenerate={handleGeneratePersonnel}
          onClose={() => setShowRandom(false)}
        />
      )}
    </div>
  )
}
