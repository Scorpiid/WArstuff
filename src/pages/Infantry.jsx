import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'
import { useT } from '../i18n/LanguageContext'
import {
  INFANTRY_TYPES, INFANTRY_CATEGORIES, calcInfantryBonuses,
} from '../engine/infantryTypes'

// ─── Stat display for infantry bonuses ────────────────────────────────────────
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
const catBg = {
  assault: 'bg-danger/10 border-danger/30', support: 'bg-warn/10 border-warn/30',
  specialist: 'bg-signal/10 border-signal/30', medical: 'bg-safe/10 border-safe/30',
  recon: 'bg-signal/10 border-signal/30', logistics: 'bg-surface-2 border-border-col',
}

// ─── Bonus chip ───────────────────────────────────────────────────────────────
function BonusChip({ stat, value, lang }) {
  const label = STAT_LABELS[lang]?.[stat] || stat
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-signal/10 border border-signal/20 rounded text-stat font-mono">
      <span className="text-signal">+{value > 0 ? value.toFixed(1) : 0}</span>
      <span className="text-text-muted">{label}</span>
    </span>
  )
}

// ─── Infantry type card (picker) ──────────────────────────────────────────────
function TypeCard({ type, selected, onClick, lang }) {
  const cat  = INFANTRY_CATEGORIES[type.category]
  const name = lang === 'en' ? type.nameEn : type.name
  const desc = lang === 'en' ? type.descriptionEn : type.description
  const bonusKeys = Object.keys(type.bonusPerUnit)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded border transition-all w-full ${
        selected
          ? `${catBg[type.category]} ring-1 ring-signal/40`
          : 'border-border-col hover:border-signal/30 bg-deep-night'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{cat.icon}</span>
          <span className={`font-display font-semibold text-sm ${selected ? catColor[type.category] : 'text-text-primary'}`}>
            {name}
          </span>
        </div>
        <span className={`text-stat font-mono px-1.5 py-0.5 rounded border ${catBg[type.category]} ${catColor[type.category]}`}>
          {lang === 'en' ? cat.labelEn : cat.label}
        </span>
      </div>
      <p className="text-text-muted text-xs mb-2 leading-snug">{desc}</p>
      <div className="flex flex-wrap gap-1">
        {bonusKeys.map(k => (
          <span key={k} className="text-stat font-mono text-text-muted">
            <span className={type.bonusPerUnit[k] > 0 ? 'text-safe' : 'text-danger'}>
              {type.bonusPerUnit[k] > 0 ? '+' : ''}{type.bonusPerUnit[k]}
            </span>
            {' '}{STAT_LABELS.en[k]}
          </span>
        )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep${i}`} className="text-text-muted text-stat"> · </span>, el], [])}
      </div>
    </button>
  )
}

// ─── Add/Edit unit form ───────────────────────────────────────────────────────
function UnitForm({ initial, squads, onSave, onCancel, lang }) {
  const [typeId,  setTypeId]  = useState(initial?.typeId  || 'rifleman')
  const [count,   setCount]   = useState(initial?.count   ?? 10)
  const [squadId, setSquadId] = useState(initial?.squadId || '')
  const [notes,   setNotes]   = useState(initial?.notes   || '')
  const [catFilter, setCatFilter] = useState('')

  const selectedType = INFANTRY_TYPES.find(t => t.id === typeId)

  const filteredTypes = catFilter
    ? INFANTRY_TYPES.filter(t => t.category === catFilter)
    : INFANTRY_TYPES

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ typeId, count: Math.max(1, count), squadId: squadId || null, notes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category filter tabs */}
      <div>
        <label className="label mb-2">{lang === 'en' ? 'Unit type' : 'Tipo de unidad'}</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button type="button" onClick={() => setCatFilter('')}
            className={`px-2 py-1 rounded text-xs font-mono border transition-colors ${!catFilter ? 'bg-signal/15 border-signal/40 text-signal' : 'border-border-col text-text-muted hover:border-signal/20'}`}>
            {lang === 'en' ? 'All' : 'Todos'}
          </button>
          {Object.entries(INFANTRY_CATEGORIES).map(([key, cat]) => (
            <button key={key} type="button" onClick={() => setCatFilter(catFilter === key ? '' : key)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition-colors ${catFilter === key ? `${catBg[key]} ${catColor[key]}` : 'border-border-col text-text-muted hover:border-signal/20'}`}>
              <span>{cat.icon}</span>
              <span>{lang === 'en' ? cat.labelEn : cat.label}</span>
            </button>
          ))}
        </div>

        {/* Type grid */}
        <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
          {filteredTypes.map(type => (
            <TypeCard
              key={type.id}
              type={type}
              selected={typeId === type.id}
              onClick={() => setTypeId(type.id)}
              lang={lang}
            />
          ))}
        </div>
      </div>

      {/* Count + Squad */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={lang === 'en' ? 'Unit count' : 'Cantidad de efectivos'}>
          <div className="flex gap-2">
            <input
              type="number"
              min={selectedType?.minCount ?? 1}
              max={selectedType?.maxCount ?? 500}
              className="input flex-1"
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button type="button" className="btn-secondary px-2 text-xs font-mono"
              onClick={() => setCount(c => c + 10)}>+10</button>
          </div>
          {selectedType && (
            <span className="text-text-muted text-xs">
              {lang === 'en' ? `Max: ${selectedType.maxCount}` : `Máx: ${selectedType.maxCount}`}
            </span>
          )}
        </FormField>

        <FormField label={lang === 'en' ? 'Assign to squad' : 'Asignar a escuadra'}>
          <select className="select" value={squadId} onChange={e => setSquadId(e.target.value)}>
            <option value="">{lang === 'en' ? 'No squad' : 'Sin escuadra'}</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
      </div>

      {/* Notes */}
      <FormField label={lang === 'en' ? 'Notes' : 'Notas'}>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder={lang === 'en' ? 'Equipment, origin, special details...' : 'Equipamiento, origen, detalles...'} />
      </FormField>

      {/* Bonus preview */}
      {selectedType && count > 0 && (
        <div className="bg-deep-night border border-border-col rounded p-3">
          <p className="label mb-2">{lang === 'en' ? `Bonuses for ${count} ${lang === 'en' ? selectedType.nameEn : selectedType.name}` : `Bonificaciones por ${count} ${selectedType.name}`}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(selectedType.bonusPerUnit).map(([stat, perUnit]) => {
              const total = Math.round(perUnit * count * 10) / 10
              const label = STAT_LABELS[lang]?.[stat] || stat
              return (
                <span key={stat} className={`text-xs px-2 py-0.5 rounded border font-mono ${total > 0 ? 'bg-safe/10 border-safe/30 text-safe' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                  {total > 0 ? '+' : ''}{total} {label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {lang === 'en' ? 'Cancel' : 'Cancelar'}
        </button>
        <button type="submit" className="btn-primary">
          {lang === 'en' ? 'Save unit' : 'Guardar unidad'}
        </button>
      </div>
    </form>
  )
}

// ─── Squad infantry summary ───────────────────────────────────────────────────
function SquadInfantryPanel({ squad, units, lang, onAdd, onEdit, onDelete }) {
  const squadUnits = units.filter(u => u.squadId === squad.id)
  const bonuses    = calcInfantryBonuses(squadUnits.map(u => ({ typeId: u.typeId, count: u.count })))
  const totalCount = squadUnits.reduce((a, u) => a + u.count, 0)

  const significantBonuses = Object.entries(bonuses).filter(([, v]) => v > 0)

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: squad.color || '#C8A84B' }} />
          <h3 className="font-display font-semibold text-sm tracking-wide truncate">{squad.name}</h3>
          <span className="text-text-muted text-xs">
            {totalCount} {lang === 'en' ? 'infantry' : 'infantería'}
          </span>
        </div>
        <button
          type="button"
          className="btn-ghost px-2 py-1 text-xs text-signal"
          onClick={onAdd}
        >
          + {lang === 'en' ? 'Add' : 'Añadir'}
        </button>
      </div>

      {squadUnits.length === 0 ? (
        <div className="p-4 text-center text-text-muted text-xs">
          {lang === 'en' ? 'No infantry units assigned.' : 'Sin unidades de infantería asignadas.'}
        </div>
      ) : (
        <div className="p-3 space-y-1.5">
          {/* Bonus summary */}
          {significantBonuses.length > 0 && (
            <div className="flex flex-wrap gap-1 pb-2 border-b border-border-col/50 mb-2">
              {significantBonuses.slice(0, 6).map(([stat, val]) => (
                <span key={stat} className="text-stat font-mono text-safe">
                  +{val} {STAT_LABELS[lang]?.[stat] || stat}
                </span>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc,
                <span key={`s${i}`} className="text-text-muted text-stat"> · </span>, el], [])}
            </div>
          )}

          {/* Unit list */}
          {squadUnits.map(unit => {
            const typeDef = INFANTRY_TYPES.find(t => t.id === unit.typeId)
            if (!typeDef) return null
            const cat = INFANTRY_CATEGORIES[typeDef.category]
            return (
              <div key={unit.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-surface-2 transition-colors"
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-display font-medium text-sm">
                    {lang === 'en' ? typeDef.nameEn : typeDef.name}
                  </span>
                  {unit.notes && (
                    <span className="text-text-muted text-xs ml-2 truncate">{unit.notes}</span>
                  )}
                </div>
                <span className={`font-mono text-sm font-semibold ${catColor[typeDef.category]}`}>
                  ×{unit.count}
                </span>
                <div className="flex gap-1">
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
  const squads          = useStore(s => s.squads)
  const nations         = useStore(s => s.nations)
  const infantryUnits   = useStore(s => s.infantryUnits)
  const addInfantryUnit = useStore(s => s.addInfantryUnit)
  const updateInfantryUnit = useStore(s => s.updateInfantryUnit)
  const deleteInfantryUnit = useStore(s => s.deleteInfantryUnit)

  const [showCreate,  setShowCreate]  = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [presetSquad, setPresetSquad] = useState(null) // when adding from squad panel
  const [filterSquad, setFilterSquad] = useState('')
  const [filterCat,   setFilterCat]   = useState('')
  const [view,        setView]        = useState('squads') // 'squads' | 'all'

  // Group units by squad
  const squadPanels = useMemo(() => {
    return squads
      .filter(sq => sq.status !== 'DESTROYED')
      .filter(sq => !filterSquad || sq.id === filterSquad)
  }, [squads, filterSquad])

  const allUnitsFiltered = useMemo(() => {
    return infantryUnits.filter(u => {
      const matchSquad = !filterSquad || u.squadId === filterSquad
      const typeDef    = INFANTRY_TYPES.find(t => t.id === u.typeId)
      const matchCat   = !filterCat   || typeDef?.category === filterCat
      return matchSquad && matchCat
    })
  }, [infantryUnits, filterSquad, filterCat])

  // Totals
  const totalUnits = infantryUnits.reduce((a, u) => a + u.count, 0)

  const catCounts = Object.keys(INFANTRY_CATEGORIES).reduce((acc, cat) => ({
    ...acc,
    [cat]: infantryUnits
      .filter(u => INFANTRY_TYPES.find(t => t.id === u.typeId)?.category === cat)
      .reduce((a, u) => a + u.count, 0),
  }), {})

  const handleAdd = (preSquadId = null) => {
    setPresetSquad(preSquadId)
    setShowCreate(true)
  }

  return (
    <div>
      <PageHeader
        title={lang === 'en' ? '◉ Infantry units' : '◉ Unidades de infantería'}
        subtitle={`${totalUnits.toLocaleString()} ${lang === 'en' ? 'infantry across all squads' : 'efectivos de infantería en total'}`}
        actions={
          <button type="button" className="btn-primary" onClick={() => handleAdd()}>
            {lang === 'en' ? '+ New unit' : '+ Nueva unidad'}
          </button>
        }
      />

      {/* Category summary */}
      {totalUnits > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(INFANTRY_CATEGORIES).map(([key, cat]) => (
            catCounts[key] > 0 && (
              <button
                key={key}
                type="button"
                onClick={() => setFilterCat(filterCat === key ? '' : key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                  filterCat === key ? `${catBg[key]} ${catColor[key]}` : 'bg-surface border-border-col text-text-muted hover:border-signal/20'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{lang === 'en' ? cat.labelEn : cat.label}</span>
                <span className="font-semibold">{catCounts[key].toLocaleString()}</span>
              </button>
            )
          ))}
        </div>
      )}

      {/* View toggle + squad filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded border border-border-col overflow-hidden">
          {[
            { key: 'squads', label: lang === 'en' ? '◆ By squad' : '◆ Por escuadra' },
            { key: 'all',    label: lang === 'en' ? '≡ All units' : '≡ Todas las unidades' },
          ].map(v => (
            <button key={v.key} type="button"
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-xs font-display font-semibold transition-colors ${
                view === v.key ? 'bg-signal/15 text-signal' : 'text-text-muted hover:text-text-primary'
              }`}>{v.label}</button>
          ))}
        </div>

        <select className="select w-48" value={filterSquad} onChange={e => setFilterSquad(e.target.value)}>
          <option value="">{lang === 'en' ? 'All squads' : 'Todas las escuadras'}</option>
          {squads.filter(s => s.status !== 'DESTROYED').map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* No squads at all */}
      {squads.filter(s => s.status !== 'DESTROYED').length === 0 ? (
        <EmptyState
          icon="◉"
          title={lang === 'en' ? 'No active squads' : 'Sin escuadras activas'}
          message={lang === 'en' ? 'Create squads first, then assign infantry units to them.' : 'Crea escuadras primero y luego asígnales unidades de infantería.'}
        />
      ) : view === 'squads' ? (
        // ── SQUAD VIEW ──
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
        // ── ALL UNITS TABLE VIEW ──
        <div className="card overflow-x-auto">
          {allUnitsFiltered.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              {lang === 'en' ? 'No infantry units registered yet.' : 'Sin unidades de infantería registradas aún.'}
            </div>
          ) : (
            <table className="war-table">
              <thead>
                <tr>
                  <th>{lang === 'en' ? 'Type' : 'Tipo'}</th>
                  <th>{lang === 'en' ? 'Category' : 'Categoría'}</th>
                  <th>{lang === 'en' ? 'Squad' : 'Escuadra'}</th>
                  <th className="text-right">{lang === 'en' ? 'Count' : 'Cantidad'}</th>
                  <th>{lang === 'en' ? 'Bonuses' : 'Bonificaciones'}</th>
                  <th>{lang === 'en' ? 'Notes' : 'Notas'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allUnitsFiltered.map(unit => {
                  const typeDef = INFANTRY_TYPES.find(t => t.id === unit.typeId)
                  if (!typeDef) return null
                  const cat = INFANTRY_CATEGORIES[typeDef.category]
                  const squad = squads.find(s => s.id === unit.squadId)
                  const bonusPreview = Object.entries(typeDef.bonusPerUnit)
                    .map(([stat, perUnit]) => `+${(perUnit * unit.count).toFixed(0)} ${STAT_LABELS[lang]?.[stat] || stat}`)
                    .join(' · ')
                  return (
                    <tr key={unit.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span className="font-display font-semibold">
                            {lang === 'en' ? typeDef.nameEn : typeDef.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-mono ${catColor[typeDef.category]}`}>
                          {lang === 'en' ? cat.labelEn : cat.label}
                        </span>
                      </td>
                      <td>
                        {squad
                          ? <span className="font-display text-xs">{squad.name}</span>
                          : <span className="text-text-muted text-xs">—</span>
                        }
                      </td>
                      <td className="text-right font-mono font-semibold text-signal">{unit.count}</td>
                      <td className="text-text-muted text-xs font-mono">{bonusPreview}</td>
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
          title={lang === 'en' ? 'Add infantry unit' : 'Añadir unidad de infantería'}
          onClose={() => { setShowCreate(false); setPresetSquad(null) }}
          wide
        >
          <UnitForm
            initial={presetSquad ? { squadId: presetSquad } : null}
            squads={squads.filter(s => s.status !== 'DESTROYED')}
            lang={lang}
            onSave={data => {
              addInfantryUnit(data)
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
          title={lang === 'en' ? 'Edit infantry unit' : 'Editar unidad de infantería'}
          onClose={() => setEditing(null)}
          wide
        >
          <UnitForm
            initial={editing}
            squads={squads.filter(s => s.status !== 'DESTROYED')}
            lang={lang}
            onSave={data => { updateInfantryUnit(editing.id, data); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          title={lang === 'en' ? 'Remove infantry unit' : 'Eliminar unidad de infantería'}
          message={lang === 'en'
            ? 'This unit will be removed from the registry. Continue?'
            : 'La unidad será eliminada del registro. ¿Continuar?'}
          danger
          onConfirm={() => { deleteInfantryUnit(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
