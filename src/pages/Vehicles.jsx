import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'
import StatusBadge from '../components/StatusBadge'
import { useT } from '../i18n/LanguageContext'

const VEHICLE_TYPES = [
  { value:'IFV',        label:'Infantry Fighting Vehicle (IFV)', icon:'⬡' },
  { value:'APC',        label:'Armored Personnel Carrier (APC)', icon:'⬡' },
  { value:'MBT',        label:'Main Battle Tank',                icon:'⬡' },
  { value:'RECON',      label:'Recon Vehicle',                   icon:'◌' },
  { value:'ARTILLERY',  label:'Artillery Unit',                  icon:'◈' },
  { value:'HELICOPTER', label:'Helicopter',                      icon:'◈' },
  { value:'LOGISTICS',  label:'Logistics Truck',                 icon:'◧' },
]
const VEHICLE_STATUSES = ['OPERATIONAL','DAMAGED','DESTROYED','CAPTURED']
const SPECIAL_ABILITIES_OPTIONS = ['Night Vision','Active Protection System','Smoke Screen','Amphibious','Air Defense','Mine Clearing','Medical Bay','Electronic Warfare','Thermal Imaging','Drone Carrier']
const EMPTY_FORM = { name:'', type:'APC', armor:50, firepower:50, mobility:50, crewSize:3, health:100, fuel:100, ammo:100, specialAbilities:[], status:'OPERATIONAL', squadId:null }

function VehicleForm({ initial = EMPTY_FORM, onSave, onCancel, squads }) {
  const { t } = useT()
  const v = t.vehicles
  const [form, setForm] = useState({ ...initial, specialAbilities: [...(initial.specialAbilities || [])] })
  const set = (k, val) => setForm(f => ({ ...f, [k]: val }))
  const toggleAbility = (ab) => setForm(f => ({
    ...f,
    specialAbilities: f.specialAbilities.includes(ab) ? f.specialAbilities.filter(x => x !== ab) : [...f.specialAbilities, ab],
  }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={v.formName}>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder={v.placeholderName} />
        </FormField>
        <FormField label={v.formSquad}>
          <select className="select" value={form.squadId || ''} onChange={e => set('squadId', e.target.value || null)}>
            <option value="">{v.noSquad}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={v.formType}>
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            {VEHICLE_TYPES.map(tp => <option key={tp.value} value={tp.value}>{tp.value} — {tp.label}</option>)}
          </select>
        </FormField>
        <FormField label={v.formCrew}>
          <input type="number" min="1" max="10" className="input" value={form.crewSize} onChange={e => set('crewSize', +e.target.value)} />
        </FormField>
        <FormField label={v.formStatus}>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { key:'armor',     label: v.formArmor,     color:'safe' },
          { key:'firepower', label: v.formFirepower,  color:'danger' },
          { key:'mobility',  label: v.formMobility,   color:'signal' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="label mb-0">{label}</span>
              <span className={`font-mono text-xs text-${color}`}>{form[key]}</span>
            </div>
            <input type="range" min="0" max="100" value={form[key]} onChange={e => set(key, +e.target.value)}
              className={`w-full accent-${color === 'safe' ? 'green-600' : color === 'danger' ? 'red-600' : 'signal'}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { key:'health', label: v.formHealth },
          { key:'fuel',   label: v.formFuel },
          { key:'ammo',   label: v.formAmmo },
        ].map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="label mb-0">{label}</span>
              <span className="font-mono text-xs text-signal">{form[key]}%</span>
            </div>
            <input type="range" min="0" max="100" value={form[key]} onChange={e => set(key, +e.target.value)} className="w-full accent-signal" />
          </div>
        ))}
      </div>
      <FormField label={v.formAbilities}>
        <div className="flex flex-wrap gap-2 mt-1">
          {SPECIAL_ABILITIES_OPTIONS.map(ab => (
            <button key={ab} type="button" onClick={() => toggleAbility(ab)}
              className={`px-2 py-1 rounded text-xs font-mono border transition-colors ${form.specialAbilities.includes(ab) ? 'bg-signal/20 border-signal/50 text-signal' : 'bg-surface-2 border-border-col text-text-muted hover:border-signal/30'}`}>
              {ab}
            </button>
          ))}
        </div>
      </FormField>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary">{v.btnSave}</button>
      </div>
    </form>
  )
}

function VehicleCard({ vehicle, squad, onEdit, onDelete }) {
  const { t } = useT()
  const v = t.vehicles
  const typeInfo   = VEHICLE_TYPES.find(tp => tp.value === vehicle.type)
  const healthColor = vehicle.health > 60 ? 'safe' : vehicle.health > 30 ? 'warn' : 'danger'
  return (
    <div className={`card hover:border-border-col/80 transition-colors ${vehicle.status === 'DESTROYED' ? 'opacity-50' : ''}`}>
      <div className="card-header">
        <span className="text-signal text-base">{typeInfo?.icon || '◈'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm tracking-wide truncate">{vehicle.name}</h3>
          <p className="text-text-muted text-xs">{typeInfo?.label || vehicle.type}</p>
        </div>
        <StatusBadge status={vehicle.status} />
        <div className="flex gap-1 ml-2">
          <button className="btn-ghost px-2 py-1 text-xs" onClick={onEdit}>{t.common.edit}</button>
          <button className="btn-ghost px-2 py-1 text-xs text-danger" onClick={onDelete}>{t.common.delete}</button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <StatBar label={v.cardArmor}     value={vehicle.armor}     color="safe" />
        <StatBar label={v.cardFirepower} value={vehicle.firepower} color="danger" />
        <StatBar label={v.cardMobility}  value={vehicle.mobility}  color="signal" />
        <div className="border-t border-border-col/50 pt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className={`font-mono text-sm font-medium text-${healthColor}`}>{vehicle.health}%</div>
            <div className="label text-center">{v.cardHealth}</div>
          </div>
          <div>
            <div className="font-mono text-sm font-medium text-warn">{vehicle.fuel}%</div>
            <div className="label text-center">{v.cardFuel}</div>
          </div>
          <div>
            <div className="font-mono text-sm font-medium text-danger">{vehicle.ammo}%</div>
            <div className="label text-center">{v.cardAmmo}</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border-col/50 pt-2">
          <div>
            <span className="label mb-0 mr-2">{v.cardSquad}</span>
            <span className="font-display text-xs">{squad?.name || '—'}</span>
          </div>
          <span className="text-text-muted text-xs">{v.cardCrew.replace('{n}', vehicle.crewSize)}</span>
        </div>
        {vehicle.specialAbilities?.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t border-border-col/50 pt-2">
            {vehicle.specialAbilities.map(ab => (
              <span key={ab} className="text-xs px-1.5 py-0.5 bg-signal/10 text-signal border border-signal/20 rounded">{ab}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Vehicles() {
  const { t } = useT()
  const v = t.vehicles
  const squads        = useStore(s => s.squads)
  const vehicles      = useStore(s => s.vehicles)
  const addVehicle    = useStore(s => s.addVehicle)
  const updateVehicle = useStore(s => s.updateVehicle)
  const deleteVehicle = useStore(s => s.deleteVehicle)
  const assignVehicleToSquad = useStore(s => s.assignVehicleToSquad)

  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [deleting,      setDeleting]      = useState(null)
  const [filterType,    setFilterType]    = useState('')
  const [filterSquad,   setFilterSquad]   = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')

  const filtered = vehicles.filter(veh => {
    const matchType   = !filterType   || veh.type === filterType
    const matchSquad  = !filterSquad  || veh.squadId === filterSquad
    const matchStatus = !filterStatus || veh.status === filterStatus
    return matchType && matchSquad && matchStatus
  })
  const handleSave = (data, existingId = null) => {
    if (existingId) { updateVehicle(existingId, data); if (data.squadId) assignVehicleToSquad(existingId, data.squadId) }
    else addVehicle(data)
  }
  const byType = VEHICLE_TYPES.reduce((acc, tp) => ({ ...acc, [tp.value]: vehicles.filter(veh => veh.type === tp.value).length }), {})
  const subtitle = vehicles.length === 1 ? v.subtitle.replace('{n}', 1) : v.subtitlePlural.replace('{n}', vehicles.length)

  return (
    <div>
      <PageHeader title={v.title} subtitle={subtitle}
        actions={<button className="btn-primary" onClick={() => setShowCreate(true)}>{v.btnNew}</button>} />

      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {VEHICLE_TYPES.filter(tp => byType[tp.value] > 0).map(tp => (
            <button key={tp.value} onClick={() => setFilterType(filterType === tp.value ? '' : tp.value)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${filterType === tp.value ? 'bg-signal/20 border-signal/50 text-signal' : 'bg-surface border-border-col text-text-muted hover:border-signal/30'}`}>
              {tp.value} ({byType[tp.value]})
            </button>
          ))}
        </div>
      )}
      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="select w-44" value={filterSquad} onChange={e => setFilterSquad(e.target.value)}>
            <option value="">{v.filterSquad}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{v.filterStatus}</option>
            {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {vehicles.length === 0
        ? <EmptyState icon="◧" title={v.emptyTitle} message={v.emptyMsg}
            action={{ label: v.btnNew, onClick: () => setShowCreate(true) }} />
        : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(veh => (
              <VehicleCard key={veh.id} vehicle={veh}
                squad={squads.find(s => s.id === veh.squadId)}
                onEdit={()   => setEditing(veh)}
                onDelete={() => setDeleting(veh.id)} />
            ))}
            {filtered.length === 0 && <div className="col-span-3 text-center py-8 text-text-muted text-sm">{v.emptyFilter}</div>}
          </div>
      }

      {showCreate && (
        <Modal title={v.modalCreate} onClose={() => setShowCreate(false)} wide>
          <VehicleForm squads={squads} onSave={data => { handleSave(data); setShowCreate(false) }} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title={v.modalEdit.replace('{name}', editing.name)} onClose={() => setEditing(null)} wide>
          <VehicleForm initial={editing} squads={squads}
            onSave={data => { handleSave(data, editing.id); setEditing(null) }}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title={v.deleteTitle} message={v.deleteMsg} danger
          onConfirm={() => { deleteVehicle(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  )
}
