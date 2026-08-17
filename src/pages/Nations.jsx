import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'
import { useT } from '../i18n/LanguageContext'

const DOCTRINES = [
  'Combined Arms','Special Operations','Armored Assault','Guerrilla Warfare',
  'Naval Projection','Air Superiority','Defensive Fortification','Rapid Response','Psychological Ops',
]
const COLORS = [
  '#C8A84B','#C0392B','#2E7D52','#2980B9','#8E44AD',
  '#E67E22','#1ABC9C','#E91E63','#607D8B','#FF5722',
]
const EMPTY_FORM = {
  name:'', playerName:'', color:'#C8A84B', flag:'',
  description:'', doctrine:'Combined Arms', intelligence:50, logistics:50,
}

function NationForm({ initial = EMPTY_FORM, onSave, onCancel }) {
  const { t } = useT()
  const n = t.nations
  const [form, setForm] = useState({ ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={n.formName}>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder={n.placeholderName} />
        </FormField>
        <FormField label={n.formPlayer}>
          <input className="input" value={form.playerName} onChange={e => set('playerName', e.target.value)} placeholder={n.placeholderPlayer} />
        </FormField>
      </div>
      <FormField label={n.formDoctrine}>
        <select className="select" value={form.doctrine} onChange={e => set('doctrine', e.target.value)}>
          {DOCTRINES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </FormField>
      <FormField label={n.formDesc}>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder={n.placeholderDesc} />
      </FormField>
      <FormField label={n.formColor}>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)}
              className="w-7 h-7 rounded border-2 transition-all"
              style={{ backgroundColor: c, borderColor: form.color === c ? '#E8EAF0' : 'transparent' }} />
          ))}
          <input type="color" className="w-7 h-7 rounded cursor-pointer bg-transparent border border-border-col"
            value={form.color} onChange={e => set('color', e.target.value)} />
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={n.formIntel.replace('{n}', form.intelligence)}>
          <input type="range" min="0" max="100" value={form.intelligence} onChange={e => set('intelligence', +e.target.value)} className="w-full accent-signal" />
        </FormField>
        <FormField label={n.formLogistics.replace('{n}', form.logistics)}>
          <input type="range" min="0" max="100" value={form.logistics} onChange={e => set('logistics', +e.target.value)} className="w-full accent-signal" />
        </FormField>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary">{n.btnSave}</button>
      </div>
    </form>
  )
}

function NationCard({ nation, squads, onEdit, onDelete, onAssign }) {
  const { t } = useT()
  const n = t.nations
  const nationSquads = squads.filter(s => nation.squadIds?.includes(s.id))
  return (
    <div className="card hover:border-border-col/80 transition-colors">
      <div className="card-header gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: nation.color }} />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-base tracking-wide truncate">{nation.name}</h3>
          {nation.playerName && <p className="text-text-muted text-xs">{nation.playerName}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button className="btn-ghost px-2 py-1 text-xs" onClick={onEdit}>{t.common.edit}</button>
          <button className="btn-ghost px-2 py-1 text-xs text-danger hover:text-danger" onClick={onDelete}>{t.common.delete}</button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="label mb-0">{n.labelDoctrine}</span>
          <span className="font-mono text-xs text-signal">{nation.doctrine}</span>
        </div>
        <StatBar label={n.labelIntel}    value={nation.intelligence} />
        <StatBar label={n.labelLogistics} value={nation.logistics} />
        {nation.description && <p className="text-text-muted text-xs border-t border-border-col/50 pt-2">{nation.description}</p>}
        <div className="border-t border-border-col/50 pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="label mb-0">{n.labelSquads.replace('{n}', nationSquads.length)}</span>
            <button className="text-signal text-xs hover:underline" onClick={onAssign}>{n.btnAssign}</button>
          </div>
          {nationSquads.length === 0
            ? <p className="text-text-muted text-xs">{n.noSquads}</p>
            : <div className="space-y-1">
                {nationSquads.map(sq => (
                  <div key={sq.id} className="flex items-center gap-2 text-xs">
                    <span className="text-signal">◆</span>
                    <span className="text-text-primary font-display">{sq.name}</span>
                    <span className="text-text-muted ml-auto">{sq.type}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}

function AssignSquadModal({ nation, squads, onAssign, onRemove, onClose }) {
  const { t } = useT()
  const n = t.nations
  const assigned  = squads.filter(s => nation.squadIds?.includes(s.id))
  const available = squads.filter(s => !nation.squadIds?.includes(s.id))
  return (
    <Modal title={n.assignTitle.replace('{name}', nation.name)} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="label mb-2">{n.assignedLabel}</p>
          {assigned.length === 0
            ? <p className="text-text-muted text-sm">{t.common.none}</p>
            : <div className="space-y-1">
                {assigned.map(sq => (
                  <div key={sq.id} className="flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded">
                    <span className="font-display text-sm">{sq.name}</span>
                    <button className="text-danger text-xs hover:underline" onClick={() => onRemove(sq.id)}>{t.common.remove}</button>
                  </div>
                ))}
              </div>
          }
        </div>
        <div>
          <p className="label mb-2">{n.availableLabel}</p>
          {available.length === 0
            ? <p className="text-text-muted text-sm">{n.allAssigned}</p>
            : <div className="space-y-1">
                {available.map(sq => (
                  <div key={sq.id} className="flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded">
                    <div>
                      <span className="font-display text-sm">{sq.name}</span>
                      {sq.nationId && <span className="text-text-muted text-xs ml-2">{n.reassign}</span>}
                    </div>
                    <button className="text-signal text-xs hover:underline" onClick={() => onAssign(sq.id)}>{t.common.assign}</button>
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="flex justify-end">
          <button className="btn-secondary" onClick={onClose}>{t.common.close}</button>
        </div>
      </div>
    </Modal>
  )
}

export default function Nations() {
  const { t } = useT()
  const n = t.nations
  const nations               = useStore(s => s.nations)
  const squads                = useStore(s => s.squads)
  const addNation             = useStore(s => s.addNation)
  const updateNation          = useStore(s => s.updateNation)
  const deleteNation          = useStore(s => s.deleteNation)
  const assignSquadToNation   = useStore(s => s.assignSquadToNation)
  const removeSquadFromNation = useStore(s => s.removeSquadFromNation)

  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [deleting,   setDeleting]   = useState(null)
  const [assigning,  setAssigning]  = useState(null)

  const subtitle = nations.length === 1 ? n.subtitle.replace('{n}', 1) : n.subtitlePlural.replace('{n}', nations.length)

  return (
    <div>
      <PageHeader title={n.title} subtitle={subtitle}
        actions={<button className="btn-primary" onClick={() => setShowCreate(true)}>{n.btnNew}</button>} />

      {nations.length === 0
        ? <EmptyState icon="◈" title={n.emptyTitle} message={n.emptyMsg}
            action={{ label: n.btnNew, onClick: () => setShowCreate(true) }} />
        : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nations.map(nat => (
              <NationCard key={nat.id} nation={nat} squads={squads}
                onEdit={()   => setEditing(nat)}
                onDelete={() => setDeleting(nat.id)}
                onAssign={()  => setAssigning(nat)} />
            ))}
          </div>
      }

      {showCreate && (
        <Modal title={n.modalCreate} onClose={() => setShowCreate(false)} wide>
          <NationForm onSave={data => { addNation(data); setShowCreate(false) }} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title={n.modalEdit.replace('{name}', editing.name)} onClose={() => setEditing(null)} wide>
          <NationForm initial={editing}
            onSave={data => { updateNation(editing.id, data); setEditing(null) }}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title={n.deleteTitle} message={n.deleteMsg} danger
          onConfirm={() => { deleteNation(deleting); setDeleting(null) }}
          onCancel={() => setDeleting(null)} />
      )}
      {assigning && (
        <AssignSquadModal nation={assigning} squads={squads}
          onAssign={sqId => assignSquadToNation(assigning.id, sqId)}
          onRemove={sqId => removeSquadFromNation(sqId)}
          onClose={() => setAssigning(null)} />
      )}
    </div>
  )
}
