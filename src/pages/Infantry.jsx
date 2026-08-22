import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import { useT } from '../i18n/LanguageContext'
import {
  INFANTRY_TYPES,
  INFANTRY_CATEGORIES,
  TERRAIN_LABELS,
  calcInfantryBonuses,
  calcInfantryTerrainModifiers,
} from '../engine/infantryTypes'

// ─── Constants ────────────────────────────────────────────────────────────────
const STAT_LABELS = {
  es: {
    combat: 'Combate', accuracy: 'Precisión', defense: 'Defensa', stealth: 'Sigilo',
    mobility: 'Movilidad', morale: 'Moral', medical: 'Médico',
    communications: 'Comunicaciones', leadership: 'Liderazgo',
    logistics: 'Logística', experience: 'Experiencia',
  },
  en: {
    combat: 'Combat', accuracy: 'Accuracy', defense: 'Defense', stealth: 'Stealth',
    mobility: 'Mobility', morale: 'Morale', medical: 'Medical',
    communications: 'Comms', leadership: 'Leadership',
    logistics: 'Logistics', experience: 'Experience',
  },
}

const catColor = {
  assault: 'text-danger', support: 'text-warn', specialist: 'text-signal',
  medical: 'text-safe', recon: 'text-signal', logistics: 'text-text-muted',
}
const catBorder = {
  assault: 'border-danger/40', support: 'border-warn/40', specialist: 'border-signal/40',
  medical: 'border-safe/40', recon: 'border-signal/40', logistics: 'border-border-col',
}
const catBg = {
  assault: 'bg-danger/10', support: 'bg-warn/10', specialist: 'bg-signal/10',
  medical: 'bg-safe/10', recon: 'bg-signal/10', logistics: 'bg-surface-2',
}

// ─── Terrain modifier cell ────────────────────────────────────────────────────
function TerrainCell({ value, lang }) {
  const pct = Math.round((value - 1) * 100)
  if (Math.abs(pct) < 2) return <span className="text-text-muted font-mono text-stat">—</span>
  return (
    <span className={`font-mono text-stat font-semibold ${pct > 0 ? 'text-safe' : 'text-danger'}`}>
      {pct > 0 ? '+' : ''}{pct}%
    </span>
  )
}

// ─── Terrain modifiers panel ──────────────────────────────────────────────────
// Shows a heatmap of all terrain modifiers for the selected unit mix
function TerrainModPanel({ units, lang }) {
  if (units.length === 0) return null

  const mods = calcInfantryTerrainModifiers(
    units.map(u => ({ typeId: u.typeId, count: u.count }))
  )

  const terrainKeys = Object.keys(TERRAIN_LABELS)

  return (
    <div className="bg-deep-night border border-border-col rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-signal text-sm">🗺</span>
        <p className="label mb-0">
          {lang === 'en' ? 'Combined terrain performance' : 'Rendimiento por terreno combinado'}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {terrainKeys.map(k => {
          const val = mods[k] ?? 1
          const pct = Math.round((val - 1) * 100)
          const bg  = pct > 5  ? 'bg-safe/15 border-safe/30'
                    : pct > 0  ? 'bg-safe/8  border-safe/20'
                    : pct < -5 ? 'bg-danger/15 border-danger/30'
                    : pct < 0  ? 'bg-danger/8  border-danger/20'
                    :             'bg-surface-2 border-border-col'
          return (
            <div key={k} className={`rounded border p-1.5 text-center ${bg}`}>
              <div className="font-display font-semibold text-xs text-text-muted">
                {lang === 'en' ? TERRAIN_LABELS[k].en : TERRAIN_LABELS[k].es}
              </div>
              <div className={`font-mono text-sm font-bold ${
                pct > 0 ? 'text-safe' : pct < 0 ? 'text-danger' : 'text-text-muted'
              }`}>
                {pct > 0 ? '+' : ''}{pct !== 0 ? `${pct}%` : '±0'}
              </div>
            </div>
          )
        })}
      </div>
      {/* Worst terrain warning */}
      {(() => {
        const worst = terrainKeys.reduce((a, b) => (mods[a] < mods[b] ? a : b))
        const worstPct = Math.round((mods[worst] - 1) * 100)
        if (worstPct >= -3) return null
        return (
          <div className="mt-2 flex items-center gap-2 text-xs text-danger border border-danger/20 bg-danger/5 rounded px-2 py-1.5">
            <span>⚠</span>
            <span>
              {lang === 'en'
                ? `Avoid ${TERRAIN_LABELS[worst].en}: ${worstPct}% combat penalty from current unit mix`
                : `Evitar ${TERRAIN_LABELS[worst].es}: ${worstPct}% penalidad de combate por esta composición`}
            </span>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Type picker card (multi-select) ─────────────────────────────────────────
function TypePickerCard({ type, selectedCount, onAdd, onRemove, lang }) {
  const cat     = INFANTRY_CATEGORIES[type.category]
  const name    = lang === 'en' ? type.nameEn    : type.name
  const desc    = lang === 'en' ? type.descriptionEn : type.description
  const isSelected = selectedCount > 0

  // Show best / worst terrain for this type
  const penalties = type.terrainPenalties || {}
  const terrainKeys = Object.keys(penalties)
  const best  = terrainKeys.reduce((a, b) => (penalties[a] > penalties[b] ? a : b), terrainKeys[0])
  const worst = terrainKeys.reduce((a, b) => (penalties[a] < penalties[b] ? a : b), terrainKeys[0])
  const bestPct  = Math.round((penalties[best]  - 1) * 100)
  const worstPct = Math.round((penalties[worst] - 1) * 100)

  return (
    <div className={`rounded border transition-all ${
      isSelected
        ? `${catBg[type.category]} ${catBorder[type.category]} ring-1 ring-signal/30`
        : 'border-border-col bg-deep-night hover:border-signal/20'
    }`}>
      <div className="p-2.5">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-1">
          <span className="text-base leading-none shrink-0 mt-0.5">{cat.icon}</span>
          <div className="flex-1 min-w-0">
            <div className={`font-display font-semibold text-sm leading-tight ${
              isSelected ? catColor[type.category] : 'text-text-primary'
            }`}>
              {name}
            </div>
            <div className="text-text-muted text-xs mt-0.5 leading-snug line-clamp-2">{desc}</div>
          </div>
        </div>

        {/* Stat bonuses */}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2">
          {Object.entries(type.bonusPerUnit).map(([stat, v]) => (
            <span key={stat} className="text-stat font-mono">
              <span className={v > 0 ? 'text-safe' : 'text-danger'}>
                {v > 0 ? '+' : ''}{v}
              </span>
              {' '}<span className="text-text-muted">{STAT_LABELS.en[stat]}</span>
            </span>
          ))}
        </div>

        {/* Terrain preview chips */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {bestPct > 2 && (
            <span className="text-stat font-mono px-1 py-0.5 rounded bg-safe/10 border border-safe/20 text-safe">
              ✓ {lang === 'en' ? TERRAIN_LABELS[best].en : TERRAIN_LABELS[best].es} +{bestPct}%
            </span>
          )}
          {worstPct < -2 && (
            <span className="text-stat font-mono px-1 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger">
              ✗ {lang === 'en' ? TERRAIN_LABELS[worst].en : TERRAIN_LABELS[worst].es} {worstPct}%
            </span>
          )}
        </div>

        {/* Count controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRemove}
            disabled={!isSelected}
            className={`w-6 h-6 rounded border text-xs font-mono transition-colors flex items-center justify-center
              ${isSelected
                ? 'border-danger/40 text-danger hover:bg-danger/10'
                : 'border-border-col text-text-muted opacity-40 cursor-not-allowed'}`}
          >−</button>
          <span className={`font-mono text-sm font-semibold w-8 text-center ${
            isSelected ? catColor[type.category] : 'text-text-muted'
          }`}>
            {isSelected ? selectedCount : '0'}
          </span>
          <button
            type="button"
            onClick={onAdd}
            className={`w-6 h-6 rounded border text-xs font-mono transition-colors flex items-center justify-center
              ${catBorder[type.category]} ${catColor[type.category]} hover:${catBg[type.category]}`}
          >+</button>
          {isSelected && (
            <button
              type="button"
              onClick={() => { for (let i = 0; i < 10; i++) onAdd() }}
              className="text-stat font-mono text-text-muted hover:text-signal border border-border-col rounded px-1.5 py-0.5 transition-colors"
            >+10</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Unit form (multi-type) ───────────────────────────────────────────────────
// A "unit entry" is now a composition: multiple type IDs with individual counts,
// all belonging to one squad.
function UnitForm({ initial, squads, onSave, onCancel, lang }) {
  // typeCounts: { [typeId]: count }
  const [typeCounts, setTypeCounts] = useState(initial?.typeCounts || {})
  const [squadId,    setSquadId]    = useState(initial?.squadId || '')
  const [notes,      setNotes]      = useState(initial?.notes   || '')
  const [catFilter,  setCatFilter]  = useState('')

  const filteredTypes = catFilter
    ? INFANTRY_TYPES.filter(t => t.category === catFilter)
    : INFANTRY_TYPES

  const totalCount = Object.values(typeCounts).reduce((a, v) => a + v, 0)

  const unitsForCalc = Object.entries(typeCounts)
    .filter(([, v]) => v > 0)
    .map(([typeId, count]) => ({ typeId, count }))

  const bonuses      = calcInfantryBonuses(unitsForCalc)
  const terrainMods  = calcInfantryTerrainModifiers(unitsForCalc)

  const addOne = (typeId) => {
    const def = INFANTRY_TYPES.find(t => t.id === typeId)
    if (!def) return
    setTypeCounts(prev => {
      const cur = prev[typeId] || 0
      if (cur >= def.maxCount) return prev
      return { ...prev, [typeId]: cur + 1 }
    })
  }

  const removeOne = (typeId) => {
    setTypeCounts(prev => {
      const cur = prev[typeId] || 0
      if (cur <= 0) return prev
      const next = { ...prev, [typeId]: cur - 1 }
      if (next[typeId] === 0) delete next[typeId]
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (totalCount === 0) return
    onSave({
      typeCounts,
      squadId: squadId || null,
      notes,
    })
  }

  const selectedTypeIds = Object.keys(typeCounts).filter(k => typeCounts[k] > 0)

  // Significant bonuses (> 0)
  const sigBonuses = Object.entries(bonuses).filter(([, v]) => v > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Category filter */}
      <div>
        <label className="label mb-2">
          {lang === 'en' ? 'Select unit types (multi-select)' : 'Seleccionar tipos de unidad (multi-selección)'}
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button type="button" onClick={() => setCatFilter('')}
            className={`px-2 py-1 rounded text-xs font-mono border transition-colors ${
              !catFilter ? 'bg-signal/15 border-signal/40 text-signal' : 'border-border-col text-text-muted hover:border-signal/20'
            }`}>
            {lang === 'en' ? 'All' : 'Todos'}
          </button>
          {Object.entries(INFANTRY_CATEGORIES).map(([key, cat]) => (
            <button key={key} type="button" onClick={() => setCatFilter(catFilter === key ? '' : key)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition-colors ${
                catFilter === key
                  ? `${catBg[key]} ${catBorder[key]} ${catColor[key]}`
                  : 'border-border-col text-text-muted hover:border-signal/20'
              }`}>
              <span>{cat.icon}</span>
              <span>{lang === 'en' ? cat.labelEn : cat.label}</span>
            </button>
          ))}
        </div>

        {/* Type picker grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {filteredTypes.map(type => (
            <TypePickerCard
              key={type.id}
              type={type}
              selectedCount={typeCounts[type.id] || 0}
              onAdd={() => addOne(type.id)}
              onRemove={() => removeOne(type.id)}
              lang={lang}
            />
          ))}
        </div>
      </div>

      {/* Selected composition summary */}
      {totalCount > 0 && (
        <div className="bg-surface-2 border border-border-col rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="label mb-0">
              {lang === 'en' ? 'Composition' : 'Composición'}
            </p>
            <span className="font-mono text-signal text-sm font-semibold">{totalCount} {lang === 'en' ? 'total' : 'total'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTypeIds.map(tid => {
              const def = INFANTRY_TYPES.find(t => t.id === tid)
              const cat = def ? INFANTRY_CATEGORIES[def.category] : null
              return (
                <span key={tid} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono
                  ${def ? `${catBg[def.category]} ${catBorder[def.category]} ${catColor[def.category]}` : 'bg-surface border-border-col text-text-muted'}`}>
                  {cat?.icon} {lang === 'en' ? def?.nameEn : def?.name} ×{typeCounts[tid]}
                </span>
              )
            })}
          </div>
          {/* Stat bonuses */}
          {sigBonuses.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t border-border-col/50">
              {sigBonuses.map(([stat, val]) => (
                <span key={stat} className="text-xs font-mono text-safe">
                  +{val} {STAT_LABELS[lang]?.[stat] || stat}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Terrain modifiers panel */}
      {totalCount > 0 && (
        <TerrainModPanel units={unitsForCalc} lang={lang} />
      )}

      {/* Squad + Notes */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={lang === 'en' ? 'Assign to squad' : 'Asignar a escuadra'}>
          <select className="select" value={squadId} onChange={e => setSquadId(e.target.value)}>
            <option value="">{lang === 'en' ? 'No squad' : 'Sin escuadra'}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label={lang === 'en' ? 'Notes' : 'Notas'}>
          <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={lang === 'en' ? 'Equipment, origin, notes...' : 'Equipo, origen, notas...'} />
        </FormField>
      </div>

      {totalCount === 0 && (
        <p className="text-warn text-xs text-center">
          {lang === 'en' ? 'Select at least one unit type.' : 'Selecciona al menos un tipo de unidad.'}
        </p>
      )}

      <div className="flex gap-3 justify-end pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {lang === 'en' ? 'Cancel' : 'Cancelar'}
        </button>
        <button type="submit" className="btn-primary" disabled={totalCount === 0}>
          {lang === 'en' ? `Save ${totalCount} troops` : `Guardar ${totalCount} tropas`}
        </button>
      </div>
    </form>
  )
}

// ─── Squad infantry panel ─────────────────────────────────────────────────────
function SquadInfantryPanel({ squad, units, lang, onAdd, onEdit, onDelete }) {
  const [showTerrainPanel, setShowTerrainPanel] = useState(false)

  const squadUnits  = units.filter(u => u.squadId === squad.id)
  const totalCount  = squadUnits.reduce((a, u) => {
    const tc = u.typeCounts || {}
    return a + Object.values(tc).reduce((x, v) => x + v, 0)
  }, 0)

  // Flatten all typeCounts for bonus/terrain calc
  const allTypeUnits = squadUnits.flatMap(u =>
    Object.entries(u.typeCounts || {}).map(([typeId, count]) => ({ typeId, count }))
  )
  const bonuses     = calcInfantryBonuses(allTypeUnits)
  const terrainMods = calcInfantryTerrainModifiers(allTypeUnits)
  const sigBonuses  = Object.entries(bonuses).filter(([, v]) => v > 0)

  // Find worst terrain
  const terrainKeys = Object.keys(TERRAIN_LABELS)
  const worst = allTypeUnits.length > 0
    ? terrainKeys.reduce((a, b) => (terrainMods[a] < terrainMods[b] ? a : b))
    : null
  const worstPct = worst ? Math.round((terrainMods[worst] - 1) * 100) : 0

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-display font-semibold text-sm tracking-wide truncate">{squad.name}</span>
          <span className="text-text-muted text-xs font-mono">
            {totalCount} {lang === 'en' ? 'troops' : 'tropas'}
          </span>
          {worst && worstPct < -3 && (
            <span className="text-danger text-stat font-mono ml-1">
              ✗ {lang === 'en' ? TERRAIN_LABELS[worst].en : TERRAIN_LABELS[worst].es}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {allTypeUnits.length > 0 && (
            <button type="button"
              className="btn-ghost px-2 py-1 text-xs text-text-muted hover:text-signal"
              onClick={() => setShowTerrainPanel(p => !p)}
              title={lang === 'en' ? 'Toggle terrain panel' : 'Ver terrenos'}>
              🗺
            </button>
          )}
          <button type="button" className="btn-ghost px-2 py-1 text-xs text-signal" onClick={onAdd}>
            + {lang === 'en' ? 'Add' : 'Añadir'}
          </button>
        </div>
      </div>

      {/* Stat bonus strip */}
      {sigBonuses.length > 0 && (
        <div className="px-3 py-1.5 border-b border-border-col/50 flex flex-wrap gap-x-3 gap-y-0.5">
          {sigBonuses.slice(0, 6).map(([stat, val]) => (
            <span key={stat} className="text-xs font-mono text-safe">+{val} {STAT_LABELS[lang]?.[stat] || stat}</span>
          ))}
        </div>
      )}

      {/* Terrain panel (toggle) */}
      {showTerrainPanel && allTypeUnits.length > 0 && (
        <div className="p-3 border-b border-border-col/50">
          <div className="grid grid-cols-4 gap-1">
            {terrainKeys.map(k => {
              const val = terrainMods[k] ?? 1
              const pct = Math.round((val - 1) * 100)
              const bg  = pct > 3  ? 'bg-safe/10 border-safe/20'
                        : pct < -3 ? 'bg-danger/10 border-danger/20'
                        :             'bg-surface-2 border-border-col'
              return (
                <div key={k} className={`rounded border p-1 text-center ${bg}`}>
                  <div className="text-text-muted text-stat">
                    {lang === 'en' ? TERRAIN_LABELS[k].en : TERRAIN_LABELS[k].es}
                  </div>
                  <div className={`font-mono text-xs font-semibold ${pct > 0 ? 'text-safe' : pct < 0 ? 'text-danger' : 'text-text-muted'}`}>
                    {pct > 0 ? '+' : ''}{pct !== 0 ? `${pct}%` : '±0'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {squadUnits.length === 0 ? (
        <div className="p-4 text-center text-text-muted text-xs">
          {lang === 'en' ? 'No infantry units assigned.' : 'Sin unidades de infantería asignadas.'}
        </div>
      ) : (
        <div className="p-3 space-y-1.5">
          {squadUnits.map(unit => {
            const typeIds = Object.keys(unit.typeCounts || {}).filter(k => unit.typeCounts[k] > 0)
            const unitTotal = typeIds.reduce((a, k) => a + unit.typeCounts[k], 0)
            return (
              <div key={unit.id}
                className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  {/* Type composition chips */}
                  <div className="flex flex-wrap gap-1 mb-0.5">
                    {typeIds.map(tid => {
                      const def = INFANTRY_TYPES.find(t => t.id === tid)
                      const cat = def ? INFANTRY_CATEGORIES[def.category] : null
                      return (
                        <span key={tid}
                          className={`text-stat font-mono inline-flex items-center gap-0.5 px-1 rounded border
                            ${def ? `${catBg[def.category]} ${catBorder[def.category]} ${catColor[def.category]}` : ''}`}>
                          {cat?.icon}{' '}{lang === 'en' ? def?.nameEn : def?.name}
                          {' '}×{unit.typeCounts[tid]}
                        </span>
                      )
                    })}
                  </div>
                  {unit.notes && (
                    <span className="text-text-muted text-xs truncate">{unit.notes}</span>
                  )}
                </div>
                <span className="font-mono text-sm font-semibold text-signal shrink-0">
                  {unitTotal} {lang === 'en' ? 'total' : 'total'}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button type="button" className="btn-ghost px-1.5 py-0.5 text-xs"
                    onClick={() => onEdit(unit)}>
                    {lang === 'en' ? 'Edit' : 'Editar'}
                  </button>
                  <button type="button" className="btn-ghost px-1.5 py-0.5 text-xs text-danger"
                    onClick={() => onDelete(unit.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Infantry() {
  const { lang } = useT()

  const squads             = useStore(s => s.squads)
  const infantryUnits      = useStore(s => s.infantryUnits)
  const addInfantryUnit    = useStore(s => s.addInfantryUnit)
  const updateInfantryUnit = useStore(s => s.updateInfantryUnit)
  const deleteInfantryUnit = useStore(s => s.deleteInfantryUnit)

  const [showCreate,  setShowCreate]  = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [presetSquad, setPresetSquad] = useState(null)
  const [filterSquad, setFilterSquad] = useState('')
  const [view,        setView]        = useState('squads') // 'squads' | 'all'

  const activeSquads = useMemo(
    () => squads.filter(sq => sq.status !== 'DESTROYED'),
    [squads]
  )

  const squadPanels = useMemo(
    () => activeSquads.filter(sq => !filterSquad || sq.id === filterSquad),
    [activeSquads, filterSquad]
  )

  // Flatten all type units for category summary
  const allTypeUnits = useMemo(() =>
    infantryUnits.flatMap(u =>
      Object.entries(u.typeCounts || {}).map(([typeId, count]) => ({ typeId, count }))
    ),
    [infantryUnits]
  )

  const totalTroops = allTypeUnits.reduce((a, u) => a + u.count, 0)

  // Count per category
  const catCounts = useMemo(() => {
    const counts = {}
    for (const { typeId, count } of allTypeUnits) {
      const def = INFANTRY_TYPES.find(t => t.id === typeId)
      if (def) counts[def.category] = (counts[def.category] || 0) + count
    }
    return counts
  }, [allTypeUnits])

  const handleAdd = (preSquadId = null) => {
    setPresetSquad(preSquadId)
    setShowCreate(true)
  }

  // Store action wrappers for new multi-type format
  const handleSave = (data, existingId = null) => {
    if (existingId) {
      updateInfantryUnit(existingId, data)
    } else {
      addInfantryUnit(data)
    }
  }

  return (
    <div>
      <PageHeader
        title={lang === 'en' ? '◉ Infantry units' : '◉ Unidades de infantería'}
        subtitle={`${totalTroops.toLocaleString()} ${lang === 'en' ? 'infantry troops total' : 'tropas de infantería en total'}`}
        actions={
          <button type="button" className="btn-primary" onClick={() => handleAdd()}>
            {lang === 'en' ? '+ New unit group' : '+ Nuevo grupo'}
          </button>
        }
      />

      {/* Category summary pills */}
      {totalTroops > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(INFANTRY_CATEGORIES).map(([key, cat]) =>
            (catCounts[key] || 0) > 0 ? (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono
                  ${catBg[key]} ${catBorder[key]} ${catColor[key]}`}
              >
                <span>{cat.icon}</span>
                <span>{lang === 'en' ? cat.labelEn : cat.label}</span>
                <span className="font-semibold">{(catCounts[key] || 0).toLocaleString()}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* View toggle + squad filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded border border-border-col overflow-hidden">
          {[
            { key: 'squads', label: lang === 'en' ? '◆ By squad' : '◆ Por escuadra' },
            { key: 'all',    label: lang === 'en' ? '≡ All groups' : '≡ Todos los grupos' },
          ].map(v => (
            <button key={v.key} type="button" onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-xs font-display font-semibold transition-colors ${
                view === v.key ? 'bg-signal/15 text-signal' : 'text-text-muted hover:text-text-primary'
              }`}>{v.label}</button>
          ))}
        </div>

        <select className="select w-48" value={filterSquad} onChange={e => setFilterSquad(e.target.value)}>
          <option value="">{lang === 'en' ? 'All squads' : 'Todas las escuadras'}</option>
          {activeSquads.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {activeSquads.length === 0 ? (
        <EmptyState
          icon="◉"
          title={lang === 'en' ? 'No active squads' : 'Sin escuadras activas'}
          message={lang === 'en'
            ? 'Create squads first, then assign infantry units to them.'
            : 'Crea escuadras primero y luego asígnales unidades de infantería.'}
        />
      ) : view === 'squads' ? (
        <div className="space-y-4">
          {squadPanels.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">
              {lang === 'en' ? 'No squads match the filter.' : 'Sin escuadras con ese filtro.'}
            </p>
          ) : (
            squadPanels.map(sq => (
              <SquadInfantryPanel
                key={sq.id}
                squad={sq}
                units={infantryUnits}
                lang={lang}
                onAdd={() => handleAdd(sq.id)}
                onEdit={unit => setEditing(unit)}
                onDelete={id => setDeleting(id)}
              />
            ))
          )}
        </div>
      ) : (
        /* All groups table */
        <div className="card overflow-x-auto">
          {infantryUnits.filter(u => !filterSquad || u.squadId === filterSquad).length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              {lang === 'en' ? 'No infantry groups registered yet.' : 'Sin grupos de infantería registrados.'}
            </div>
          ) : (
            <table className="war-table">
              <thead>
                <tr>
                  <th>{lang === 'en' ? 'Composition' : 'Composición'}</th>
                  <th>{lang === 'en' ? 'Squad' : 'Escuadra'}</th>
                  <th className="text-right">{lang === 'en' ? 'Total' : 'Total'}</th>
                  <th>{lang === 'en' ? 'Best terrain' : 'Mejor terreno'}</th>
                  <th>{lang === 'en' ? 'Worst terrain' : 'Peor terreno'}</th>
                  <th>{lang === 'en' ? 'Notes' : 'Notas'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {infantryUnits
                  .filter(u => !filterSquad || u.squadId === filterSquad)
                  .map(unit => {
                    const tc     = unit.typeCounts || {}
                    const typeIds = Object.keys(tc).filter(k => tc[k] > 0)
                    const total  = typeIds.reduce((a, k) => a + tc[k], 0)
                    const squad  = squads.find(s => s.id === unit.squadId)
                    const unitsFlat = typeIds.map(tid => ({ typeId: tid, count: tc[tid] }))
                    const tmods  = calcInfantryTerrainModifiers(unitsFlat)
                    const tkeys  = Object.keys(TERRAIN_LABELS)
                    const best   = tkeys.reduce((a, b) => tmods[a] > tmods[b] ? a : b)
                    const worst  = tkeys.reduce((a, b) => tmods[a] < tmods[b] ? a : b)
                    const bestPct  = Math.round((tmods[best]  - 1) * 100)
                    const worstPct = Math.round((tmods[worst] - 1) * 100)

                    return (
                      <tr key={unit.id}>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {typeIds.slice(0, 4).map(tid => {
                              const def = INFANTRY_TYPES.find(t => t.id === tid)
                              const cat = def ? INFANTRY_CATEGORIES[def.category] : null
                              return (
                                <span key={tid}
                                  className={`text-stat font-mono px-1 rounded border inline-flex items-center gap-0.5
                                    ${def ? `${catBg[def.category]} ${catBorder[def.category]} ${catColor[def.category]}` : ''}`}>
                                  {cat?.icon} {lang === 'en' ? def?.nameEn : def?.name} ×{tc[tid]}
                                </span>
                              )
                            })}
                            {typeIds.length > 4 && (
                              <span className="text-stat text-text-muted font-mono">+{typeIds.length - 4} more</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {squad
                            ? <span className="font-display text-xs">{squad.name}</span>
                            : <span className="text-text-muted text-xs">—</span>}
                        </td>
                        <td className="text-right font-mono font-semibold text-signal">{total}</td>
                        <td>
                          <span className="text-safe text-xs font-mono">
                            {bestPct > 0 ? `${lang === 'en' ? TERRAIN_LABELS[best].en : TERRAIN_LABELS[best].es} +${bestPct}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-danger text-xs font-mono">
                            {worstPct < 0 ? `${lang === 'en' ? TERRAIN_LABELS[worst].en : TERRAIN_LABELS[worst].es} ${worstPct}%` : '—'}
                          </span>
                        </td>
                        <td className="text-text-muted text-xs max-w-32 truncate">{unit.notes || '—'}</td>
                        <td>
                          <div className="flex gap-1">
                            <button type="button" className="btn-ghost px-2 py-1 text-xs"
                              onClick={() => setEditing(unit)}>
                              {lang === 'en' ? 'Edit' : 'Editar'}
                            </button>
                            <button type="button" className="btn-ghost px-2 py-1 text-xs text-danger"
                              onClick={() => setDeleting(unit.id)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal
          title={lang === 'en' ? 'New infantry group' : 'Nuevo grupo de infantería'}
          onClose={() => { setShowCreate(false); setPresetSquad(null) }}
          wide
        >
          <UnitForm
            initial={presetSquad ? { squadId: presetSquad, typeCounts: {} } : null}
            squads={activeSquads}
            lang={lang}
            onSave={data => {
              handleSave(data)
              setShowCreate(false)
              setPresetSquad(null)
            }}
            onCancel={() => { setShowCreate(false); setPresetSquad(null) }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal
          title={lang === 'en' ? 'Edit infantry group' : 'Editar grupo de infantería'}
          onClose={() => setEditing(null)}
          wide
        >
          <UnitForm
            initial={editing}
            squads={activeSquads}
            lang={lang}
            onSave={data => { handleSave(data, editing.id); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          title={lang === 'en' ? 'Remove infantry group' : 'Eliminar grupo de infantería'}
          message={lang === 'en'
            ? 'This group will be removed. Continue?'
            : 'El grupo será eliminado. ¿Continuar?'}
          danger
          onConfirm={() => { deleteInfantryUnit(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
