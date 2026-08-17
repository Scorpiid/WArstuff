import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { useT } from '../i18n/LanguageContext'
import {
  SEA_COMPONENTS, SEA_SUBTYPES,
  calcStatsFromComponents, findComponent,
  VEHICLE_STATS,
} from '../engine/vehicleComponents'

const VESSEL_STATUSES = ['OPERATIONAL', 'DAMAGED', 'DESTROYED', 'CAPTURED']

// ─── Stat bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, color = 'signal' }) {
  const pct = Math.max(0, Math.min(100, value))
  const colorMap = {
    signal:  '#C8A84B', danger: '#C0392B', safe: '#2E7D52',
    warn:    '#D4820A', muted:  '#6B7590',
  }
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="label mb-0">{label}</span>
        <span className={`font-mono text-xs text-${color}`}>{value}</span>
      </div>
      <div className="relative w-full h-px bg-border-col">
        <div className={`absolute top-0 left-0 h-px bg-${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0" style={{
          left: `${pct}%`,
          transform: 'translateX(-50%) translateY(-3px)',
          width: 0, height: 0,
          borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
          borderBottom: `6px solid ${colorMap[color] || colorMap.signal}`,
        }} />
      </div>
    </div>
  )
}

// ─── Component selector (reused pattern from Vehicles) ────────────────────────
function ComponentSelector({ catalog, selected, onChange, lang }) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(catalog)[0])
  const cat = catalog[activeCategory]

  return (
    <div className="border border-border-col rounded overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto bg-surface-2 border-b border-border-col">
        {Object.entries(catalog).map(([key, catDef]) => (
          <button key={key} type="button" onClick={() => setActiveCategory(key)}
            className={`px-3 py-2 text-xs font-display font-semibold tracking-wide shrink-0 transition-colors border-r border-border-col last:border-0
              ${activeCategory === key ? 'bg-signal/15 text-signal' : 'text-text-muted hover:text-text-primary hover:bg-surface'}`}>
            {lang === 'en' ? catDef.labelEn : catDef.label}
            {catDef.optional && <span className="ml-1 text-text-muted font-normal">(opt)</span>}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="p-3 grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
        {cat.optional && (
          <button type="button" onClick={() => onChange(activeCategory, null)}
            className={`text-left p-2 rounded border text-xs transition-colors
              ${!selected[activeCategory] ? 'bg-surface-2 border-signal/40 text-signal' : 'border-border-col text-text-muted hover:border-border-col/80'}`}>
            <span className="font-display font-semibold">
              {lang === 'en' ? '— No component —' : '— Sin componente —'}
            </span>
          </button>
        )}
        {cat.options.map(opt => {
          const isSelected = selected[activeCategory] === opt.id
          const preview = Object.entries(opt.stats).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ')
          return (
            <button key={opt.id} type="button" onClick={() => onChange(activeCategory, opt.id)}
              className={`text-left p-2.5 rounded border transition-all
                ${isSelected ? 'bg-signal/10 border-signal/50 text-text-primary' : 'border-border-col text-text-muted hover:border-signal/30 hover:text-text-primary'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className={`font-display font-semibold text-sm ${isSelected ? 'text-signal' : ''}`}>
                    {lang === 'en' ? opt.nameEn : opt.name}
                  </div>
                  <div className="text-text-muted text-xs mt-0.5">{opt.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs text-signal whitespace-nowrap">{preview}</div>
                  {opt.weight > 0 && <div className="font-mono text-stat text-text-muted">{opt.weight}kt</div>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selected[activeCategory] && (
        <div className="border-t border-border-col px-3 py-2 bg-signal/5 flex items-center gap-2">
          <span className="text-signal text-xs">✓</span>
          <span className="text-xs text-signal font-mono">
            {(() => { const c = findComponent(catalog, selected[activeCategory]); return c ? (lang === 'en' ? c.nameEn : c.name) : '' })()}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Vessel form ──────────────────────────────────────────────────────────────
function VesselForm({ initial, onSave, onCancel, nations }) {
  const { t, lang } = useT()
  const [name,       setName]       = useState(initial?.name     || '')
  const [subtype,    setSubtype]    = useState(initial?.subtype  || 'PATROL_BOAT')
  const [nationId,   setNationId]   = useState(initial?.nationId || '')
  const [status,     setStatus]     = useState(initial?.status   || 'OPERATIONAL')
  const [crewSize,   setCrewSize]   = useState(initial?.crewSize ?? 10)
  const [components, setComponents] = useState(initial?.components || {})

  const stats = calcStatsFromComponents(components, SEA_COMPONENTS)

  const handleComponentChange = (catKey, compId) => {
    setComponents(prev => ({ ...prev, [catKey]: compId }))
  }

  const totalWeight = Object.values(components).filter(Boolean).reduce((acc, id) => {
    const comp = findComponent(SEA_COMPONENTS, id)
    return acc + (comp?.weight || 0)
  }, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name, subtype, nationId: nationId || null, status, crewSize, components, ...stats })
  }

  // Subtype labels
  const SUBTYPE_LABELS = {
    PATROL_BOAT:   lang === 'en' ? 'Patrol boat'     : 'Patrullero',
    LANDING_CRAFT: lang === 'en' ? 'Landing craft'   : 'Lancha de desembarco',
    CORVETTE:      lang === 'en' ? 'Corvette'         : 'Corbeta',
    FRIGATE:       lang === 'en' ? 'Frigate'          : 'Fragata',
    DESTROYER:     lang === 'en' ? 'Destroyer'        : 'Destructor',
    SUBMARINE:     lang === 'en' ? 'Submarine'        : 'Submarino',
    SPEEDBOAT:     lang === 'en' ? 'Speedboat (RHIB)' : 'Lancha rápida (RHIB)',
    CARRIER:       lang === 'en' ? 'Carrier'          : 'Portaaviones',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={lang === 'en' ? 'Vessel name' : 'Nombre de la embarcación'}>
          <input className="input" value={name} onChange={e => setName(e.target.value)} required
            placeholder={lang === 'en' ? 'E.g.: HMS Resolute' : 'Ej: ARA San Martín'} />
        </FormField>
        <FormField label={lang === 'en' ? 'Crew size' : 'Tripulación'}>
          <input type="number" min="1" max="5000" className="input" value={crewSize}
            onChange={e => setCrewSize(+e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label={lang === 'en' ? 'Type' : 'Tipo'}>
          <select className="select" value={subtype} onChange={e => setSubtype(e.target.value)}>
            {SEA_SUBTYPES.map(st => (
              <option key={st} value={st}>{SUBTYPE_LABELS[st] || st}</option>
            ))}
          </select>
        </FormField>
        <FormField label={lang === 'en' ? 'Nation' : 'Nación'}>
          <select className="select" value={nationId} onChange={e => setNationId(e.target.value)}>
            <option value="">{lang === 'en' ? 'No nation' : 'Sin nación'}</option>
            {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </FormField>
        <FormField label={lang === 'en' ? 'Status' : 'Estado'}>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
            {VESSEL_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </FormField>
      </div>

      {/* Component builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">{lang === 'en' ? 'Naval modules' : 'Módulos navales'}</label>
          <span className="text-xs font-mono text-text-muted">{totalWeight}kt {lang === 'en' ? 'displacement' : 'desplazamiento'}</span>
        </div>
        <ComponentSelector catalog={SEA_COMPONENTS} selected={components} onChange={handleComponentChange} lang={lang} />
      </div>

      {/* Live stats */}
      <div className="bg-deep-night border border-border-col rounded p-3">
        <p className="label mb-3">{lang === 'en' ? 'Calculated stats' : 'Estadísticas calculadas'}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {Object.entries(VEHICLE_STATS).map(([key, meta]) => {
            const val = stats[key] ?? 0
            if (val === 0) return null
            return (
              <StatBar key={key} label={lang === 'en' ? meta.labelEn : meta.label} value={val} color={meta.color} />
            )
          }).filter(Boolean)}
          {Object.values(stats).every(v => v === 0) && (
            <p className="col-span-2 text-text-muted text-xs text-center py-2">
              {lang === 'en' ? 'Select modules to calculate stats' : 'Selecciona módulos para calcular estadísticas'}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary">
          {lang === 'en' ? 'Save vessel' : 'Guardar embarcación'}
        </button>
      </div>
    </form>
  )
}

// ─── Damage log modal ─────────────────────────────────────────────────────────
function DamageLogModal({ vessel, onDamage, onClose }) {
  const { t, lang } = useT()
  const [dmgComp, setDmgComp] = useState('')
  const [dmgDesc, setDmgDesc] = useState('')
  const [dmgAmt,  setDmgAmt]  = useState(10)

  const componentOptions = []
  Object.values(SEA_COMPONENTS).forEach(cat => {
    cat.options.forEach(opt => {
      componentOptions.push({ id: opt.id, name: lang === 'en' ? opt.nameEn : opt.name })
    })
  })
  componentOptions.push({ id: 'Hull',    name: lang === 'en' ? 'Hull / Keel'    : 'Casco / Quilla' })
  componentOptions.push({ id: 'Crew',    name: lang === 'en' ? 'Crew'           : 'Tripulación' })
  componentOptions.push({ id: 'Engine',  name: lang === 'en' ? 'Engine room'    : 'Sala de máquinas' })
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
    <Modal title={lang === 'en' ? `Damage log — ${vessel.name}` : `Registro de daño — ${vessel.name}`} onClose={onClose}>
      <div className="space-y-4">
        {/* History */}
        {vessel.damageLog?.length > 0 ? (
          <div className="max-h-52 overflow-y-auto space-y-1">
            <p className="label mb-2">{lang === 'en' ? 'Damage history' : 'Historial de daños'}</p>
            {[...vessel.damageLog].reverse().map((entry, i) => (
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

        {vessel.status !== 'DESTROYED' && (
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
                  placeholder={lang === 'en' ? 'E.g.: Torpedo hit on port side' : 'Ej: Impacto de torpedo en costado de babor'} />
              </FormField>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="label mb-0">{lang === 'en' ? 'Damage (% health)' : 'Daño (% salud)'}</label>
                  <span className="font-mono text-danger text-xs">-{dmgAmt}%</span>
                </div>
                <input type="range" min="1" max={vessel.health} value={dmgAmt}
                  onChange={e => setDmgAmt(+e.target.value)} className="w-full accent-danger" />
                <div className="flex justify-between text-xs font-mono text-text-muted mt-0.5">
                  <span>{lang === 'en' ? 'Current:' : 'Actual:'} {vessel.health}%</span>
                  <span>→ {vessel.health - dmgAmt}%</span>
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
        )}
        {vessel.status === 'DESTROYED' && (
          <div className="flex justify-end">
            <button className="btn-secondary" onClick={onClose}>{t.common.close}</button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Vessel card ──────────────────────────────────────────────────────────────
function VesselCard({ vessel, nation, onEdit, onDelete, onDamage }) {
  const { lang } = useT()
  const healthColor = vessel.health > 60 ? 'safe' : vessel.health > 30 ? 'warn' : 'danger'

  const SUBTYPE_ICONS = {
    PATROL_BOAT: '🚤', LANDING_CRAFT: '⛴', CORVETTE: '🛳',
    FRIGATE: '🛳', DESTROYER: '⚓', SUBMARINE: '🤿',
    SPEEDBOAT: '🚤', CARRIER: '🛳',
  }
  const icon = SUBTYPE_ICONS[vessel.subtype] || '⚓'

  const SUBTYPE_LABELS_ES = {
    PATROL_BOAT: 'Patrullero', LANDING_CRAFT: 'Desembarco', CORVETTE: 'Corbeta',
    FRIGATE: 'Fragata', DESTROYER: 'Destructor', SUBMARINE: 'Submarino',
    SPEEDBOAT: 'Lancha rápida', CARRIER: 'Portaaviones',
  }
  const SUBTYPE_LABELS_EN = {
    PATROL_BOAT: 'Patrol boat', LANDING_CRAFT: 'Landing craft', CORVETTE: 'Corvette',
    FRIGATE: 'Frigate', DESTROYER: 'Destroyer', SUBMARINE: 'Submarine',
    SPEEDBOAT: 'Speedboat', CARRIER: 'Carrier',
  }
  const subtypeLabel = lang === 'en' ? (SUBTYPE_LABELS_EN[vessel.subtype] || vessel.subtype) : (SUBTYPE_LABELS_ES[vessel.subtype] || vessel.subtype)

  return (
    <div className={`card transition-colors ${vessel.status === 'DESTROYED' ? 'opacity-40' : 'hover:border-border-col/80'}`}>
      <div className="card-header gap-2">
        <span className="text-2xl leading-none">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm tracking-wide truncate">{vessel.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-text-muted text-xs">{subtypeLabel}</span>
            {nation && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                · <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: nation.color }} />
                {nation.name}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={vessel.status} />
      </div>

      <div className="p-3 space-y-2">
        {/* Health bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="label mb-0">{lang === 'en' ? 'Hull integrity' : 'Integridad del casco'}</span>
            <span className={`font-mono text-xs text-${healthColor}`}>{vessel.health}%</span>
          </div>
          <div className="relative w-full h-1.5 bg-border-col rounded-full">
            <div className={`absolute h-1.5 rounded-full bg-${healthColor} transition-all`} style={{ width: `${vessel.health}%` }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="border-t border-border-col/50 pt-2 grid grid-cols-3 gap-2 text-center">
          {Object.entries(VEHICLE_STATS).map(([key, meta]) => {
            const val = vessel[key] ?? 0
            if (val === 0) return null
            return (
              <div key={key}>
                <div className={`font-mono text-sm font-medium text-${meta.color}`}>{val}</div>
                <div className="label text-center text-stat">{lang === 'en' ? meta.labelEn : meta.label}</div>
              </div>
            )
          }).filter(Boolean)}
        </div>

        {/* Operational info */}
        <div className="border-t border-border-col/50 pt-2 flex items-center justify-between text-xs font-mono text-text-muted">
          <span>{lang === 'en' ? 'Crew:' : 'Tripulación:'} <span className="text-text-primary">{vessel.crewSize}</span></span>
          <span>{lang === 'en' ? 'Fuel:' : 'Comb:'} <span className={vessel.fuel > 50 ? 'text-safe' : 'text-warn'}>{vessel.fuel}%</span></span>
          <span>{lang === 'en' ? 'Ammo:' : 'Mun:'} <span className={vessel.ammo > 30 ? 'text-text-primary' : 'text-danger'}>{vessel.ammo}%</span></span>
        </div>

        {/* Damage indicator */}
        {vessel.damageLog?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-warn border border-warn/20 rounded px-2 py-1 bg-warn/5">
            <span>⚠</span>
            <span className="font-mono">{vessel.damageLog.length} {lang === 'en' ? 'hit(s)' : 'impacto(s)'}</span>
            <span className="text-text-muted ml-auto">{vessel.damageLog.slice(-1)[0]?.component}</span>
          </div>
        )}

        {/* Component chips */}
        {Object.keys(vessel.components || {}).length > 0 && (
          <div className="border-t border-border-col/50 pt-2 flex flex-wrap gap-1">
            {Object.values(vessel.components).filter(Boolean).map(compId => {
              const comp = findComponent(SEA_COMPONENTS, compId)
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
export default function Vessels() {
  const { lang } = useT()
  const nations             = useStore(s => s.nations)
  const vessels             = useStore(s => s.vessels)
  const addVessel           = useStore(s => s.addVessel)
  const updateVessel        = useStore(s => s.updateVessel)
  const deleteVessel        = useStore(s => s.deleteVessel)
  const recordVesselDamage  = useStore(s => s.recordVesselDamage)

  const [showCreate,   setShowCreate]   = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [deleting,     setDeleting]     = useState(null)
  const [damageTarget, setDamageTarget] = useState(null)
  const [filterType,   setFilterType]   = useState('')
  const [filterNation, setFilterNation] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = vessels.filter(v => {
    const matchType   = !filterType   || v.subtype   === filterType
    const matchNation = !filterNation || v.nationId  === filterNation
    const matchStatus = !filterStatus || v.status    === filterStatus
    return matchType && matchNation && matchStatus
  })

  const handleSave = (data, existingId = null) => {
    if (existingId) updateVessel(existingId, data)
    else addVessel(data)
  }

  // Subtype counts for filter bar
  const subtypeCounts = SEA_SUBTYPES.reduce((acc, st) => ({
    ...acc, [st]: vessels.filter(v => v.subtype === st).length,
  }), {})

  const SUBTYPE_LABELS = {
    PATROL_BOAT:   lang === 'en' ? 'Patrol' : 'Patrullero',
    LANDING_CRAFT: lang === 'en' ? 'Landing' : 'Desembarco',
    CORVETTE:      lang === 'en' ? 'Corvette' : 'Corbeta',
    FRIGATE:       lang === 'en' ? 'Frigate' : 'Fragata',
    DESTROYER:     lang === 'en' ? 'Destroyer' : 'Destructor',
    SUBMARINE:     lang === 'en' ? 'Submarine' : 'Submarino',
    SPEEDBOAT:     lang === 'en' ? 'Speedboat' : 'Lancha',
    CARRIER:       lang === 'en' ? 'Carrier' : 'Portaaviones',
  }

  return (
    <div>
      <PageHeader
        title={lang === 'en' ? '⚓ Naval vessels' : '⚓ Embarcaciones navales'}
        subtitle={`${vessels.length} ${lang === 'en' ? 'vessel(s) registered' : 'embarcación(es) registrada(s)'}`}
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            {lang === 'en' ? '+ New vessel' : '+ Nueva embarcación'}
          </button>
        }
      />

      {/* Type filter pills */}
      {vessels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilterType('')}
            className={`px-3 py-1 rounded text-xs font-mono border transition-colors
              ${filterType === '' ? 'bg-signal/15 border-signal/40 text-signal' : 'bg-surface border-border-col text-text-muted hover:border-signal/20'}`}>
            {lang === 'en' ? `All (${vessels.length})` : `Todos (${vessels.length})`}
          </button>
          {SEA_SUBTYPES.filter(st => subtypeCounts[st] > 0).map(st => (
            <button key={st} onClick={() => setFilterType(filterType === st ? '' : st)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-colors
                ${filterType === st ? 'bg-signal/15 border-signal/40 text-signal' : 'bg-surface border-border-col text-text-muted hover:border-signal/20'}`}>
              {SUBTYPE_LABELS[st]} ({subtypeCounts[st]})
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {vessels.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="select w-44" value={filterNation} onChange={e => setFilterNation(e.target.value)}>
            <option value="">{lang === 'en' ? 'All nations' : 'Todas las naciones'}</option>
            {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{lang === 'en' ? 'All statuses' : 'Todos los estados'}</option>
            {VESSEL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {vessels.length === 0 ? (
        <EmptyState
          icon="⚓"
          title={lang === 'en' ? 'No vessels' : 'Sin embarcaciones'}
          message={lang === 'en'
            ? 'Build the first modular naval vessel.'
            : 'Construye la primera embarcación naval modular.'}
          action={{ label: lang === 'en' ? '+ New vessel' : '+ Nueva embarcación', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <VesselCard key={v.id} vessel={v}
              nation={nations.find(n => n.id === v.nationId)}
              onEdit={()   => setEditing(v)}
              onDelete={() => setDeleting(v.id)}
              onDamage={() => setDamageTarget(vessels.find(x => x.id === v.id) || v)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-8 text-text-muted text-sm">
              {lang === 'en' ? 'No vessels match the filters.' : 'Sin embarcaciones con los filtros aplicados.'}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <Modal
          title={lang === 'en' ? 'New naval vessel' : 'Nueva embarcación naval'}
          onClose={() => setShowCreate(false)} wide>
          <VesselForm nations={nations}
            onSave={data => { handleSave(data); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {editing && (
        <Modal
          title={lang === 'en' ? `Edit — ${editing.name}` : `Editar — ${editing.name}`}
          onClose={() => setEditing(null)} wide>
          <VesselForm initial={editing} nations={nations}
            onSave={data => { handleSave(data, editing.id); setEditing(null) }}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={lang === 'en' ? 'Delete vessel' : 'Eliminar embarcación'}
          message={lang === 'en'
            ? 'The vessel will be permanently removed. Continue?'
            : 'La embarcación será eliminada permanentemente. ¿Continuar?'}
          danger
          onConfirm={() => { deleteVessel(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)} />
      )}

      {damageTarget && (
        <DamageLogModal
          vessel={vessels.find(v => v.id === damageTarget.id) || damageTarget}
          onDamage={dmgData => {
            recordVesselDamage(damageTarget.id, dmgData)
            setDamageTarget(vessels.find(v => v.id === damageTarget.id) || null)
          }}
          onClose={() => setDamageTarget(null)} />
      )}
    </div>
  )
}
