import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import FormField from '../components/FormField'
import { useT } from '../i18n/LanguageContext'

function OverrideModal({ battle, onSave, onClose }) {
  const { t } = useT()
  const b = t.battles
  const [form, setForm] = useState({
    winner:           battle.result?.winner || 'ATTACKER',
    note:             '',
    attackerKilled:   battle.result?.attacker?.killed   ?? 0,
    attackerWounded:  battle.result?.attacker?.wounded  ?? 0,
    attackerCaptured: battle.result?.attacker?.captured ?? 0,
    defenderKilled:   battle.result?.defender?.killed   ?? 0,
    defenderWounded:  battle.result?.defender?.wounded  ?? 0,
    defenderCaptured: battle.result?.defender?.captured ?? 0,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    onSave({
      result: {
        winner: form.winner,
        reason: 'MANUAL_OVERRIDE',
        attacker: { ...battle.result?.attacker, killed: +form.attackerKilled, wounded: +form.attackerWounded, captured: +form.attackerCaptured },
        defender: { ...battle.result?.defender, killed: +form.defenderKilled, wounded: +form.defenderWounded, captured: +form.defenderCaptured },
      },
      note: form.note,
      by: 'ADMIN',
    })
    onClose()
  }

  return (
    <Modal title={b.overrideTitle} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-warn/10 border border-warn/30 rounded p-3 text-warn text-xs">{b.overrideWarning}</div>
        <FormField label={b.overrideWinner}>
          <select className="select" value={form.winner} onChange={e => set('winner', e.target.value)}>
            <option value="ATTACKER">{b.selectWinA}</option>
            <option value="DEFENDER">{b.selectWinD}</option>
            <option value="DRAW">{b.selectDraw}</option>
          </select>
        </FormField>
        <FormField label={b.overrideNote}>
          <textarea className="input resize-none" rows={2} value={form.note}
            onChange={e => set('note', e.target.value)} placeholder={b.overridePlaceholder} />
        </FormField>
        <div className="grid grid-cols-2 gap-6">
          {[
            { prefix:'attacker', label: b.colAttacker },
            { prefix:'defender', label: b.colDefender },
          ].map(({ prefix, label }) => (
            <div key={prefix}>
              <p className="label mb-2">{label}</p>
              <div className="space-y-2">
                {[
                  { key:'Killed',   label: b.overrideKilled },
                  { key:'Wounded',  label: b.overrideWounded },
                  { key:'Captured', label: b.overrideCaptured },
                ].map(({ key, label: lbl }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="label mb-0">{lbl}</span>
                    <input type="number" min="0" className="input w-20 text-right"
                      value={form[`${prefix}${key}`]}
                      onChange={e => set(`${prefix}${key}`, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn-danger" onClick={handleSave}>{t.common.applyOverride}</button>
        </div>
      </div>
    </Modal>
  )
}

function BattleDetail({ battle, squads, onOverride, onClose }) {
  const { t } = useT()
  const b = t.battles
  const [expandedRound, setExpandedRound] = useState(null)
  const aSquad = squads.find(s => s.id === battle.attackerSquadId)
  const dSquad = squads.find(s => s.id === battle.defenderSquadId)
  const winner = battle.result?.winner
  const aWon   = winner === 'ATTACKER'
  const draw   = winner === 'DRAW'
  const winLabel = draw ? b.draw : aWon ? b.winAttacker : b.winDefender

  return (
    <Modal title={b.detailTitle.replace('{a}', aSquad?.name || '?').replace('{d}', dSquad?.name || '?')} onClose={onClose} wide>
      <div className="space-y-4">
        <div className={`rounded border p-4 text-center ${draw ? 'border-text-muted/30' : aWon ? 'border-danger/30' : 'border-safe/30'}`}>
          <div className={`font-display font-bold text-2xl tracking-widest ${draw ? 'text-text-muted' : aWon ? 'text-danger' : 'text-safe'}`}>{winLabel}</div>
          <div className="text-text-muted text-xs mt-1">{battle.result?.reason?.replace(/_/g, ' ')}</div>
          <div className="text-text-muted text-xs mt-0.5">
            {battle.result?.totalRounds} round{battle.result?.totalRounds !== 1 ? 's' : ''} · {battle.mode} · seed: {battle.seed}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: aSquad?.name || b.colAttacker, data: battle.result?.attacker },
            { label: dSquad?.name || b.colDefender, data: battle.result?.defender },
          ].map(({ label, data }) => (
            <div key={label} className="panel space-y-2">
              <h4 className="font-display font-semibold">{label}</h4>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {[
                  [b.killed,     data?.killed,     'text-danger'],
                  [b.wounded,    data?.wounded,    'text-warn'],
                  [b.captured,   data?.captured,   'text-signal'],
                  [b.remaining,  data?.remaining,  'text-text-primary'],
                  [b.finalMorale, data?.finalMorale, ''],
                  [b.finalFatigue,data?.finalFatigue,''],
                ].map(([l, v, c]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-text-muted">{l}</span>
                    <span className={c}>{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {battle.phases && (
          <div className="grid grid-cols-3 gap-2">
            <div className="panel text-xs"><p className="label mb-1">{b.phaseDetection}</p><p className="font-mono text-signal">{battle.phases.detection?.outcome}</p></div>
            <div className="panel text-xs"><p className="label mb-1">{b.phaseInitiative}</p><p className="font-mono text-signal">{battle.phases.initiative?.firstMove}</p></div>
            <div className="panel text-xs"><p className="label mb-1">{b.phaseTerrain}</p><p className="font-mono text-signal capitalize">{battle.terrain}</p></div>
          </div>
        )}

        {battle.rounds?.length > 0 && (
          <div>
            <p className="label mb-2">{b.roundsLabel.replace('{n}', battle.rounds.length)}</p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {battle.rounds.map(r => (
                <div key={r.roundNum} className="border border-border-col rounded">
                  <button onClick={() => setExpandedRound(expandedRound === r.roundNum ? null : r.roundNum)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-2 text-xs">
                    <span className="font-display font-semibold text-signal">{b.roundLabel.replace('{n}', r.roundNum)}</span>
                    <div className="flex gap-4 font-mono">
                      <span className="text-danger">A: {r.attacker.killed}☠ {r.attacker.wounded}⚕</span>
                      <span className="text-safe">D: {r.defender.killed}☠ {r.defender.wounded}⚕</span>
                      <span className={`font-display font-semibold ${r.roundWinner === 'ATTACKER' ? 'text-danger' : 'text-safe'}`}>
                        {r.roundWinner === 'DRAW' ? '—' : r.roundWinner === 'ATTACKER' ? 'A' : 'D'}
                      </span>
                    </div>
                  </button>
                  {expandedRound === r.roundNum && (
                    <div className="px-3 pb-2 border-t border-border-col/50 pt-2 grid grid-cols-2 gap-3">
                      {[{ label: b.colAttacker, d: r.attacker }, { label: b.colDefender, d: r.defender }].map(({ label, d }) => (
                        <div key={label} className="text-xs font-mono space-y-0.5">
                          <p className="font-display font-semibold text-text-muted">{label}</p>
                          <div className="flex justify-between"><span className="text-text-muted">{b.morale}</span><span>{d.moraleAfter} ({d.moraleChange >= 0 ? '+' : ''}{d.moraleChange})</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">{b.fatigue}</span><span>{d.fatigueAfter}</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">{b.suppression}</span><span>{d.suppressionAfter}%</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">{b.active}</span><span>{d.activeCountAfter}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {battle.overrides?.length > 0 && (
          <div className="border border-warn/20 rounded p-3">
            <p className="label mb-2 text-warn">{b.overridesLabel.replace('{n}', battle.overrides.length)}</p>
            {battle.overrides.map((o, i) => (
              <div key={i} className="text-xs text-text-muted border-b border-border-col/50 py-1 last:border-0">
                <span className="text-warn mr-2">{new Date(o.at).toLocaleString()}</span>
                {o.note || b.noNote}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button className="btn-danger" onClick={onOverride}>{b.btnOverride}</button>
          <button className="btn-secondary" onClick={onClose}>{t.common.close}</button>
        </div>
      </div>
    </Modal>
  )
}

export default function Battles() {
  const { t } = useT()
  const b = t.battles
  const battles        = useStore(s => s.battles)
  const squads         = useStore(s => s.squads)
  const nations        = useStore(s => s.nations)
  const overrideBattle = useStore(s => s.overrideBattle)

  const [detail,       setDetail]       = useState(null)
  const [override,     setOverride]     = useState(null)
  const [filterWinner, setFilterWinner] = useState('')
  const [search,       setSearch]       = useState('')

  const filtered = battles.filter(bt => {
    const aSquad = squads.find(s => s.id === bt.attackerSquadId)
    const dSquad = squads.find(s => s.id === bt.defenderSquadId)
    const matchSearch = !search || [aSquad?.name, dSquad?.name].some(n => n?.toLowerCase().includes(search.toLowerCase()))
    const matchWinner = !filterWinner || bt.result?.winner === filterWinner
    return matchSearch && matchWinner
  })

  const subtitle = battles.length === 1 ? b.subtitle.replace('{n}', 1) : b.subtitlePlural.replace('{n}', battles.length)

  return (
    <div>
      <PageHeader title={b.title} subtitle={subtitle} />

      {battles.length > 0 && (
        <div className="flex gap-3 mb-4">
          <input className="input w-48" placeholder={b.filterPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select w-44" value={filterWinner} onChange={e => setFilterWinner(e.target.value)}>
            <option value="">{b.filterAll}</option>
            <option value="ATTACKER">{b.filterWinA}</option>
            <option value="DEFENDER">{b.filterWinD}</option>
            <option value="DRAW">{b.filterDraw}</option>
          </select>
        </div>
      )}

      {battles.length === 0
        ? <EmptyState icon="◎" title={b.emptyTitle} message={b.emptyMsg} />
        : <div className="card overflow-x-auto">
            <table className="war-table">
              <thead>
                <tr>
                  <th>{b.colNum}</th><th>{b.colAttacker}</th><th>{b.colDefender}</th>
                  <th>{b.colTerrain}</th><th>{b.colMode}</th><th>{b.colRounds}</th>
                  <th>{b.colResult}</th><th>{b.colCas}</th><th>{b.colDate}</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bt, idx) => {
                  const aSquad = squads.find(s => s.id === bt.attackerSquadId)
                  const dSquad = squads.find(s => s.id === bt.defenderSquadId)
                  const winner = bt.result?.winner
                  return (
                    <tr key={bt.id}>
                      <td className="text-text-muted font-mono text-xs">{battles.length - idx}</td>
                      <td>
                        <div className="font-display font-medium">{aSquad?.name || '—'}</div>
                        <div className="text-text-muted text-xs">{nations.find(n => n.id === aSquad?.nationId)?.name || ''}</div>
                      </td>
                      <td>
                        <div className="font-display font-medium">{dSquad?.name || '—'}</div>
                        <div className="text-text-muted text-xs">{nations.find(n => n.id === dSquad?.nationId)?.name || ''}</div>
                      </td>
                      <td className="text-text-muted text-xs capitalize">{bt.terrain}</td>
                      <td className="text-text-muted text-xs">{bt.mode}</td>
                      <td className="font-mono text-xs text-text-muted">{bt.result?.totalRounds ?? '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={winner === 'ATTACKER' ? 'VICTORY' : winner === 'DEFENDER' ? 'DEFEAT' : 'DRAW'} />
                          {bt.overrides?.length > 0 && <span className="text-warn text-xs" title="Override">⚠</span>}
                        </div>
                      </td>
                      <td className="font-mono text-xs">
                        <span className="text-danger">{bt.result?.attacker?.killed ?? 0}</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-safe">{bt.result?.defender?.killed ?? 0}</span>
                      </td>
                      <td className="text-text-muted text-xs">{new Date(bt.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn-ghost px-2 py-1 text-xs" onClick={() => setDetail(bt)}>{t.common.view}</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
      }

      {detail && (
        <BattleDetail battle={detail} squads={squads}
          onClose={() => setDetail(null)}
          onOverride={() => { setOverride(detail); setDetail(null) }} />
      )}
      {override && (
        <OverrideModal battle={override}
          onSave={data => overrideBattle(override.id, data)}
          onClose={() => setOverride(null)} />
      )}
    </div>
  )
}
