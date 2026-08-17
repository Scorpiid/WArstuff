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
import {
  LAND_COMPONENTS, AIR_COMPONENTS,
  LAND_SUBTYPES, AIR_SUBTYPES,
  calcStatsFromComponents, findComponent,
  VEHICLE_STATS,
} from '../engine/vehicleComponents'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const VEHICLE_STATUSES = ['OPERATIONAL', 'DAMAGED', 'DESTROYED', 'CAPTURED']

function getCatalog(category) {
  return category === 'AIR' ? AIR_COMPONENTS : LAND_COMPONENTS
}

function getSubtypes(category) {
  return category === 'AIR' ? AIR_SUBTYPES : LAND_SUBTYPES
}

// ─── Stat grid ────────────────────────────────────────────────────────────────
function StatGrid({ stats, compact = false }) {
  const { lang } = useT()
  return (
    <div className={`grid ${compact ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'}`}>
      {Object.entries(VEHICLE_STATS).map(([key, meta]) => {
        const val = stats[key] ?? 0
        if (val === 0 && compact) return null
        return (
          <div key={key} className={compact ? 'text-center' : ''}>
            {compact ? (
              <>
                <div className={`font-mono text-sm font-medium text-${meta.color}`}>{val}</div>
                <div className="label text-center text-stat">{lang === 'en' ? meta.labelEn : meta.label}</div>
              </>
            ) : (
              <StatBar
                label={lang === 'en' ? meta.labelEn : meta.label}
                value={val}
                color={meta.color}
              />
            )}
          </div>
        )
      }).filter(Boolean)}
    </div>
  )
}

// ─── Component selector panel ─────────────────────────────────────────────────
function ComponentSelector({ catalog, selected, onChange, lang }) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(catalog)[0])
  const cat = catalog[activeCategory]

  return (
    <div className="border border-border-col rounded overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto bg-surface-2 border-b border-border-col">
        {Object.entries(catalog).map(([key, catDef]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-2 text-xs font-display font-semibold tracking-wide shrink-0 transition-colors border-r border-border-col last:border-0
              ${activeCategory === key
                ? 'bg-signal/15 text-signal'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
              }`}
          >
            {lang === 'en' ? catDef.labelEn : catDef.label}
            {catDef.optional && <span className="ml-1 text-text-muted font-normal">(opt)</span>}
          </button>
        ))}
      </div>

      {/* Options grid */}
      <div className="p-3 grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
        {/* None option for optional categories */}
        {cat.optional && (
          <button
            type="button"
            onClick={() => onChange(activeCategory, null)}
            className={`text-left p-2 rounded border text-xs transition-colors
              ${!selected[activeCategory]
                ? 'bg-surface-2 border-signal/40 text-signal'
                : 'border-border-col text-text-muted hover:border-border-col/80'
              }`}
          >
            <span className="font-display font-semibold">
              {lang === 'en' ? '— No component —' : '— Sin componente —'}
            </span>
          </button>
        )}
        {cat.options.map(opt => {
          const isSelected = selected[activeCategory] === opt.id
          const preview = Object.entries(opt.stats)
            .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
            .join(', ')
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onChange(activeCategory, opt.id)}
              className={`text-left p-2.5 rounded border transition-all
                ${isSelected
                  ? 'bg-signal/10 border-signal/50 text-text-primary'
                  : 'border-border-col text-text-muted hover:border-signal/30 hover:text-text-primary'
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className={`font-display font-semibold text-sm ${isSelected ? 'text-signal' : ''}`}>
                    {lang === 'en' ? opt.nameEn : opt.name}
                  </div>
                  <div className="text-text-muted text-xs mt-0.5">{opt.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs text-signal whitespace-nowrap">{preview}</div>
                  {opt.weight > 0 && (
                    <div className="font-mono text-stat text-text-muted">{opt.weight}t</div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected component summary */}
      {selected[activeCategory] && (
        <div className="border-t border-border-col px-3 py-2 bg-signal/5 flex items-center gap-2">
          <span className="text-signal text-xs">✓</span>
          <span className="text-xs text-signal font-mono">
            {(() => {
              const comp = findComponent(catalog, selected[activeCategory])
              return comp ? (lang === 'en' ? comp.nameEn : comp.name) : ''
            })()}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Vehicle form ─────────────────────────────────────────────────────────────
function VehicleForm({ initial, onSave, onCancel, squads }) {
  const { t, lang } = useT()

  const defaultCat = initial?.category || 'LAND'
  const catalog = getCatalog(defaultCat)

  const [category,   setCategory]   = useState(defaultCat)
  const [subtype,    setSubtype]    = useState(initial?.subtype || 'APC')
  const [name,       setName]       = useState(initial?.name || '')
  const [squadId,    setSquadId]    = useState(initial?.squadId || '')
  const [status,     setStatus]     = useState(initial?.status || 'OPERATIONAL')
  const [crewSize,   setCrewSize]   = useState(initial?.crewSize ?? 2)
  const [components, setComponents] = useState(initial?.components || {})

  const currentCatalog = getCatalog(category)
  const stats = calcStatsFromComponents(components, currentCatalog)

  const handleComponentChange = (catKey, compId) => {
    setComponents(prev => ({ ...prev, [catKey]: compId }))
  }

  const handleCategoryChange = (newCat) => {
    setCategory(newCat)
    setComponents({}) // reset components when switching category
    setSubtype(getCatalog(newCat) === AIR_COMPONENTS ? 'FIGHTER' : 'APC')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name, category, subtype, squadId: squadId || null,
      status, crewSize, components, ...stats,
    })
  }

  const totalWeight = Object.values(components)
    .filter(Boolean)
    .reduce((acc, id) => {
      const comp = findComponent(currentCatalog, id)
      return acc + (comp?.weight || 0)
    }, 0)

  const selectedCount = Object.values(components).filter(Boolean).length
  const totalSlots    = Object.keys(currentCatalog).length

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={lang === 'en' ? 'Name / Designation' : 'Nombre / Designación'}>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder={lang === 'en' ? 'E.g.: Leopard 2A7' : 'Ej: Leopard 2A7'}
          />
        </FormField>
        <FormField label={lang === 'en' ? 'Crew size' : 'Tripulación'}>
          <input type="number" min="1" max="20" className="input" value={crewSize}
            onChange={e => setCrewSize(+e.target.value)} />
        </FormField>
      </div>

      {/* Category toggle */}
      <div>
        <label className="label">{lang === 'en' ? 'Category' : 'Categoría'}</label>
        <div className="flex gap-2">
          {[
            { key: 'LAND', label: lang === 'en' ? '⬡ Land vehicle' : '⬡ Vehículo terrestre' },
            { key: 'AIR',  label: lang === 'en' ? '✈ Aircraft' : '✈ Aeronave' },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => handleCategoryChange(key)}
              className={`flex-1 py-2 rounded border text-sm font-display font-semibold tracking-wide transition-colors
                ${category === key
                  ? 'bg-signal/15 border-signal/50 text-signal'
                  : 'border-border-col text-text-muted hover:border-signal/30'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subtype + Squad + Status */}
      <div className="grid grid-cols-3 gap-3">
        <FormField label={lang === 'en' ? 'Subtype' : 'Subtipo'}>
          <select className="select" value={subtype} onChange={e => setSubtype(e.target.value)}>
            {getSubtypes(category).map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </FormField>
        <FormField label={lang === 'en' ? 'Squad' : 'Escuadra'}>
          <select className="select" value={squadId} onChange={e => setSquadId(e.target.value)}>
            <option value="">{lang === 'en' ? 'No squad' : 'Sin escuadra'}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label={lang === 'en' ? 'Status' : 'Estado'}>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
            {VEHICLE_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </FormField>
      </div>

      {/* Component builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            {lang === 'en' ? 'Components' : 'Componentes'}
          </label>
          <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
            <span>{selectedCount}/{totalSlots} {lang === 'en' ? 'slots' : 'ranuras'}</span>
            <span>{totalWeight}t {lang === 'en' ? 'total weight' : 'peso total'}</span>
          </div>
        </div>
        <ComponentSelector
          catalog={currentCatalog}
          selected={components}
          onChange={handleComponentChange}
          lang={lang}
        />
      </div>

      {/* Live stats preview */}
      <div className="bg-deep-night border border-border-col rounded p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="label mb-0">{lang === 'en' ? 'Calculated stats' : 'Estadísticas calculadas'}</p>
          <span className="text-text-muted text-xs font-mono">
            {lang === 'en' ? 'from selected components' : 'de componentes seleccionados'}
          </span>
        </div>
        <StatGrid stats={stats} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary">
          {lang === 'en' ? 'Save vehicle' : 'Guardar vehículo'}
        </button>
      </div>
    </form>
  )
}

// ─── Damage log modal ─────────────────────────────────────────────────────────
function DamageLogModal({ vehicle, onDamage, onClose }) {
  const { t, lang } = useT()
  const [dmgComp,  setDmgComp]  = useState('')
  const [dmgDesc,  setDmgDesc]  = useState('')
  const [dmgAmt,   setDmgAmt]   = useState(10)
  const catalog = getCatalog(vehicle.category)

  // Flat list of component names for dropdown
  const componentOptions = []
  Object.values(catalog).forEach(cat => {
    cat.options.forEach(opt => {
      componentOptions.push({ id: opt.id, name: lang === 'en' ? opt.nameEn : opt.name })
    })
  })
  componentOptions.push({ id: 'Hull', name: lang === 'en' ? 'Hull / Structure' : 'Chasis / Estructura' })
  componentOptions.push({ id: 'Crew', name: lang === 'en' ? 'Crew' : 'Tripulación' })
  componentOptions.push({ id: 'General', name: lang === 'en' ? 'General damage' : 'Daño general' })

  const handleSubmit = (e) => {
    e.preventDefault()
    onDamage({
      component: dmgComp || 'General',
      description: dmgDesc || (lang === 'en' ? 'Combat damage received' : 'Daño recibido en combate'),
      healthLost: dmgAmt,
    })
  }

  return (
    <Modal title={lang === 'en' ? `Damage log — ${vehicle.name}` : `Registro de daño — ${vehicle.name}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Existing log */}
        {vehicle.damageLog?.length > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-1">
            <p className="label mb-2">{lang === 'en' ? 'Damage history' : 'Historial de daños'}</p>
            {[...vehicle.damageLog].reverse().map((entry, i) => (
              <div key={i} className="border border-border-col/50 rounded p-2 bg-deep-night text-xs">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-display font-semibold text-danger">{entry.component}</span>
                  <span className="text-text-muted font-mono">{new Date(entry.at).toLocaleString()}</span>
                </div>
                <div className="text-text-primary">{entry.description}</div>
                <div className="flex gap-3 mt-1 font-mono text-text-muted">
                  <span>{lang === 'en' ? 'Before:' : 'Antes:'} <span className="text-warn">{entry.healthBefore}%</span></span>
                  <span>→</span>
                  <span>{lang === 'en' ? 'After:' : 'Después:'} <span className={entry.healthAfter === 0 ? 'text-danger' : 'text-safe'}>{entry.healthAfter}%</span></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-2">
            {lang === 'en' ? 'No damage recorded.' : 'Sin daños registrados.'}
          </p>
        )}

        {/* Record new damage */}
        {vehicle.status !== 'DESTROYED' && (
          <>
            <div className="border-t border-border-col pt-3">
              <p className="label mb-3">{lang === 'en' ? 'Record new damage' : 'Registrar nuevo daño'}</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <FormField label={lang === 'en' ? 'Affected component' : 'Componente afectado'}>
                  <select className="select" value={dmgComp} onChange={e => setDmgComp(e.target.value)}>
                    <option value="">{lang === 'en' ? 'Select...' : 'Seleccionar...'}</option>
                    {componentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label={lang === 'en' ? 'Description' : 'Descripción'}>
                  <input className="input" value={dmgDesc} onChange={e => setDmgDesc(e.target.value)}
                    placeholder={lang === 'en' ? 'E.g.: Hit on left track by RPG' : 'Ej: Impacto de RPG en oruga izquierda'} />
                </FormField>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="label mb-0">{lang === 'en' ? 'Damage amount (% health)' : 'Daño (% salud)'}</label>
                    <span className="font-mono text-danger text-xs">-{dmgAmt}%</span>
                  </div>
                  <input type="range" min="1" max={vehicle.health} value={dmgAmt}
                    onChange={e => setDmgAmt(+e.target.value)} className="w-full accent-danger" />
                  <div className="flex justify-between text-xs font-mono text-text-muted mt-0.5">
                    <span>{lang === 'en' ? 'Current:' : 'Actual:'} {vehicle.health}%</span>
                    <span>→ {vehicle.health - dmgAmt}%</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" className="btn-secondary" onClick={onClose}>{t.common.close}</button>
                  <button type="submit" className="btn-danger">
                    {lang === 'en' ? '⚠ Record damage' : '⚠ Registrar daño'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
        {vehicle.status === 'DESTROYED' && (
          <div className="flex justify-end">
            <button className="btn-secondary" onClick={onClose}>{t.common.close}</button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Vehicle card ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, squad, onEdit, onDelete, onDamage }) {
  const { lang } = useT()
  const healthColor = vehicle.health > 60 ? 'safe' : vehicle.health > 30 ? 'warn' : 'danger'
  const catIcon = vehicle.category === 'AIR' ? '✈' : '⬡'

  // Only show non-zero stats
  const significantStats = Object.entries(VEHICLE_STATS).filter(([k]) => (vehicle[k] ?? 0) > 0)

  return (
    <div className={`card transition-colors ${vehicle.status === 'DESTROYED' ? 'opacity-40' : 'hover:border-border-col/80'}`}>
      <div className="card-header gap-2">
        <span className="text-signal">{catIcon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm tracking-wide truncate">{vehicle.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-text-muted text-xs">{vehicle.subtype || vehicle.category}</span>
            {squad && <span className="text-text-muted text-xs">· {squad.name}</span>}
          </div>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>

      <div className="p-3 space-y-2">
        {/* Health bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">{lang === 'en' ? 'Hull integrity' : 'Integridad'}</span>
            <span className={`font-mono text-xs text-${healthColor}`}>{vehicle.health}%</span>
          </div>
          <div className="relative w-full h-1.5 bg-border-col rounded-full">
            <div
              className={`absolute h-1.5 rounded-full bg-${healthColor} transition-all`}
              style={{ width: `${vehicle.health}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        {significantStats.length > 0 && (
          <div className="border-t border-border-col/50 pt-2">
            <StatGrid stats={vehicle} compact />
          </div>
        )}

        {/* Damage log indicator */}
        {vehicle.damageLog?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-warn border border-warn/20 rounded px-2 py-1 bg-warn/5">
            <span>⚠</span>
            <span className="font-mono">
              {vehicle.damageLog.length} {lang === 'en' ? 'damage event(s)' : 'evento(s) de daño'}
            </span>
            <span className="text-text-muted ml-auto">
              {lang === 'en' ? 'Last:' : 'Último:'} {vehicle.damageLog.slice(-1)[0]?.component}
            </span>
          </div>
        )}

        {/* Components summary */}
        {Object.keys(vehicle.components || {}).length > 0 && (
          <div className="border-t border-border-col/50 pt-2 flex flex-wrap gap-1">
            {Object.values(vehicle.components).filter(Boolean).map(compId => {
              const catalog = getCatalog(vehicle.category)
              const comp = findComponent(catalog, compId)
              if (!comp) return null
              return (
                <span key={compId} className="text-stat px-1.5 py-0.5 bg-surface-2 border border-border-col rounded font-mono text-text-muted">
                  {lang === 'en' ? comp.nameEn : comp.name}
                </span>
              )
            })}
          </div>
        )}

        <div className="flex gap-1 pt-1 border-t border-border-col/50">
          <button className="btn-ghost px-2 py-1 text-xs flex-1" onClick={onEdit}>
            {lang === 'en' ? 'Edit' : 'Editar'}
          </button>
          <button className="btn-ghost px-2 py-1 text-xs flex-1 text-warn hover:text-warn" onClick={onDamage}>
            {lang === 'en' ? 'Damage' : 'Daño'}
          </button>
          <button className="btn-ghost px-2 py-1 text-xs text-danger" onClick={onDelete}>✕</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Vehicles() {
  const { t, lang } = useT()
  const squads             = useStore(s => s.squads)
  const vehicles           = useStore(s => s.vehicles)
  const addVehicle         = useStore(s => s.addVehicle)
  const updateVehicle      = useStore(s => s.updateVehicle)
  const deleteVehicle      = useStore(s => s.deleteVehicle)
  const assignVehicleToSquad = useStore(s => s.assignVehicleToSquad)
  const recordVehicleDamage  = useStore(s => s.recordVehicleDamage)

  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [deleting,      setDeleting]      = useState(null)
  const [damageTarget,  setDamageTarget]  = useState(null)
  const [filterCat,     setFilterCat]     = useState('')
  const [filterSquad,   setFilterSquad]   = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')

  const filtered = vehicles.filter(v => {
    const matchCat    = !filterCat    || v.category === filterCat
    const matchSquad  = !filterSquad  || v.squadId  === filterSquad
    const matchStatus = !filterStatus || v.status   === filterStatus
    return matchCat && matchSquad && matchStatus
  })

  const handleSave = (data, existingId = null) => {
    if (existingId) {
      updateVehicle(existingId, data)
      if (data.squadId) assignVehicleToSquad(existingId, data.squadId)
    } else {
      addVehicle(data)
    }
  }

  const handleDamage = (vehicleId, dmgData) => {
    recordVehicleDamage(vehicleId, dmgData)
  }

  const landCount = vehicles.filter(v => v.category === 'LAND').length
  const airCount  = vehicles.filter(v => v.category === 'AIR').length

  return (
    <div>
      <PageHeader
        title={lang === 'en' ? 'Combat vehicles' : 'Vehículos de combate'}
        subtitle={`${vehicles.length} ${lang === 'en' ? 'vehicle(s) registered' : 'vehículo(s) registrado(s)'}`}
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            {lang === 'en' ? '+ New vehicle' : '+ Nuevo vehículo'}
          </button>
        }
      />

      {/* Category summary */}
      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: '',     label: lang === 'en' ? `All (${vehicles.length})` : `Todos (${vehicles.length})` },
            { key: 'LAND', label: `⬡ ${lang === 'en' ? 'Land' : 'Terrestre'} (${landCount})` },
            { key: 'AIR',  label: `✈ ${lang === 'en' ? 'Air' : 'Aéreo'} (${airCount})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterCat(key)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-colors
                ${filterCat === key
                  ? 'bg-signal/15 border-signal/40 text-signal'
                  : 'bg-surface border-border-col text-text-muted hover:border-signal/20'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="select w-44" value={filterSquad} onChange={e => setFilterSquad(e.target.value)}>
            <option value="">{lang === 'en' ? 'All squads' : 'Todas las escuadras'}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{lang === 'en' ? 'All statuses' : 'Todos los estados'}</option>
            {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {vehicles.length === 0 ? (
        <EmptyState
          icon="⬡"
          title={lang === 'en' ? 'No vehicles' : 'Sin vehículos'}
          message={lang === 'en' ? 'Build the first modular vehicle.' : 'Construye el primer vehículo modular.'}
          action={{ label: lang === 'en' ? '+ New vehicle' : '+ Nuevo vehículo', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                squad={squads.find(s => s.id === v.squadId)}
                onEdit={()   => setEditing(v)}
                onDelete={() => setDeleting(v.id)}
                onDamage={() => setDamageTarget(v)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-8 text-text-muted text-sm">
                {lang === 'en' ? 'No vehicles match the filters.' : 'Sin vehículos con los filtros aplicados.'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal
          title={lang === 'en' ? 'New modular vehicle' : 'Nuevo vehículo modular'}
          onClose={() => setShowCreate(false)}
          wide
        >
          <VehicleForm
            squads={squads}
            onSave={data => { handleSave(data); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal
          title={lang === 'en' ? `Edit — ${editing.name}` : `Editar — ${editing.name}`}
          onClose={() => setEditing(null)}
          wide
        >
          <VehicleForm
            initial={editing}
            squads={squads}
            onSave={data => { handleSave(data, editing.id); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          title={lang === 'en' ? 'Delete vehicle' : 'Eliminar vehículo'}
          message={lang === 'en' ? 'The vehicle will be removed from the registry. Continue?' : 'El vehículo será eliminado del registro. ¿Continuar?'}
          danger
          onConfirm={() => { deleteVehicle(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Damage log modal */}
      {damageTarget && (
        <DamageLogModal
          vehicle={damageTarget}
          onDamage={dmgData => {
            handleDamage(damageTarget.id, dmgData)
            // Refresh the target with updated data
            setDamageTarget(prev => {
              const updated = vehicles.find(v => v.id === prev.id)
              return updated || null
            })
          }}
          onClose={() => setDamageTarget(null)}
        />
      )}
    </div>
  )
}
