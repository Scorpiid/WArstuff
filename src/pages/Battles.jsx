import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import FormField from '../components/FormField'

function OverrideModal({ battle, onSave, onClose }) {
  const [form, setForm] = useState({
    winner:           battle.result?.winner || 'ATTACKER',
    reason:           'MANUAL_OVERRIDE',
    note:             '',
    attackerKilled:   battle.result?.attacker?.killed ?? 0,
    attackerWounded:  battle.result?.attacker?.wounded ?? 0,
    attackerCaptured: battle.result?.attacker?.captured ?? 0,
    defenderKilled:   battle.result?.defender?.killed ?? 0,
    defenderWounded:  battle.result?.defender?.wounded ?? 0,
    defenderCaptured: battle.result?.defender?.captured ?? 0,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    onSave({
      result: {
        winner:  form.winner,
        reason:  form.reason,
        attacker: {
          ...battle.result?.attacker,
          killed:   +form.attackerKilled,
          wounded:  +form.attackerWounded,
          captured: +form.attackerCaptured,
        },
        defender: {
          ...battle.result?.defender,
          killed:   +form.defenderKilled,
          wounded:  +form.defenderWounded,
          captured: +form.defenderCaptured,
        },
      },
      note: form.note,
      by: 'ADMIN',
    })
    onClose()
  }

  return (
    <Modal title="Override manual" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-warn/10 border border-warn/30 rounded p-3 text-warn text-xs">
          Todos los overrides son registrados permanentemente en el historial de batalla.
        </div>

        <FormField label="Resultado ganador">
          <select className="select" value={form.winner} onChange={e => set('winner', e.target.value)}>
            <option value="ATTACKER">Victoria atacante</option>
            <option value="DEFENDER">Victoria defensor</option>
            <option value="DRAW">Empate</option>
          </select>
        </FormField>

        <FormField label="Nota del override">
          <textarea className="input resize-none" rows={2} value={form.note}
            onChange={e => set('note', e.target.value)} placeholder="Razón del ajuste manual..." />
        </FormField>

        <div className="grid grid-cols-2 gap-6">
          {[
            { prefix: 'attacker', label: 'Atacante' },
            { prefix: 'defender', label: 'Defensor' },
          ].map(({ prefix, label }) => (
            <div key={prefix}>
              <p className="label mb-2">{label}</p>
              <div className="space-y-2">
                {['Killed', 'Wounded', 'Captured'].map(stat => (
                  <div key={stat} className="flex items-center justify-between gap-2">
                    <span className="label mb-0">{stat}</span>
                    <input type="number" min="0" className="input w-20 text-right"
                      value={form[`${prefix}${stat}`]}
                      onChange={e => set(`${prefix}${stat}`, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-danger" onClick={handleSave}>Aplicar override</button>
        </div>
      </div>
    </Modal>
  )
}

function BattleDetail({ battle, squads, onOverride, onClose }) {
  const [expandedRound, setExpandedRound] = useState(null)
  const aSquad = squads.find(s => s.id === battle.attackerSquadId)
  const dSquad = squads.find(s => s.id === battle.defenderSquadId)
  const winner = battle.result?.winner
  const aWon   = winner === 'ATTACKER'
  const draw   = winner === 'DRAW'

  return (
    <Modal title={`Batalla — ${aSquad?.name || '?'} vs ${dSquad?.name || '?'}`} onClose={onClose} wide>
      <div className="space-y-4">
        {/* Result banner */}
        <div className={`rounded border p-4 text-center ${draw ? 'border-text-muted/30' : aWon ? 'border-danger/30' : 'border-safe/30'}`}>
          <div className={`font-display font-bold text-2xl tracking-widest ${draw ? 'text-text-muted' : aWon ? 'text-danger' : 'text-safe'}`}>
            {draw ? 'EMPATE' : aWon ? 'VICTORIA ATACANTE' : 'VICTORIA DEFENSOR'}
          </div>
          <div className="text-text-muted text-xs mt-1">{battle.result?.reason?.replace(/_/g, ' ')}</div>
          <div className="text-text-muted text-xs mt-0.5">
            {battle.result?.totalRounds} ronda{battle.result?.totalRounds !== 1 ? 's' : ''} · {battle.mode} · seed: {battle.seed}
          </div>
        </div>

        {/* Casualties grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: aSquad?.name || 'Atacante', data: battle.result?.attacker },
            { label: dSquad?.name || 'Defensor', data: battle.result?.defender },
          ].map(({ label, data }) => (
            <div key={label} className="panel space-y-2">
              <h4 className="font-display font-semibold">{label}</h4>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {[
                  ['Muertos',    data?.killed,    'text-danger'],
                  ['Heridos',    data?.wounded,   'text-warn'],
                  ['Capturados', data?.captured,  'text-signal'],
                  ['Restantes',  data?.remaining, 'text-text-primary'],
                  ['Moral final',data?.finalMorale,''],
                  ['Fatiga final',data?.finalFatigue,''],
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

        {/* Phases */}
        {battle.phases && (
          <div className="grid grid-cols-3 gap-2">
            <div className="panel text-xs">
              <p className="label mb-1">Detección</p>
              <p className="font-mono text-signal">{battle.phases.detection?.outcome}</p>
            </div>
            <div className="panel text-xs">
              <p className="label mb-1">Iniciativa</p>
              <p className="font-mono text-signal">{battle.phases.initiative?.firstMove}</p>
            </div>
            <div className="panel text-xs">
              <p className="label mb-1">Terreno</p>
              <p className="font-mono text-signal capitalize">{battle.terrain}</p>
            </div>
          </div>
        )}

        {/* Rounds replay */}
        {battle.rounds?.length > 0 && (
          <div>
            <p className="label mb-2">Rondas ({battle.rounds.length})</p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {battle.rounds.map(r => (
                <div key={r.roundNum} className="border border-border-col rounded">
                  <button
                    onClick={() => setExpandedRound(expandedRound === r.roundNum ? null : r.roundNum)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-2 text-xs"
                  >
                    <span className="font-display font-semibold text-signal">Ronda {r.roundNum}</span>
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
                      {[{ label: 'ATACANTE', d: r.attacker }, { label: 'DEFENSOR', d: r.defender }].map(({ label, d }) => (
                        <div key={label} className="text-xs font-mono space-y-0.5">
                          <p className="font-display font-semibold text-text-muted">{label}</p>
                          <div className="flex justify-between"><span className="text-text-muted">Moral</span><span>{d.moraleAfter} ({d.moraleChange >= 0 ? '+' : ''}{d.moraleChange})</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">Fatiga</span><span>{d.fatigueAfter}</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">Supresión</span><span>{d.suppressionAfter}%</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">Activos</span><span>{d.activeCountAfter}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overrides log */}
        {battle.overrides?.length > 0 && (
          <div className="border border-warn/20 rounded p-3">
            <p className="label mb-2 text-warn">Overrides aplicados ({battle.overrides.length})</p>
            {battle.overrides.map((o, i) => (
              <div key={i} className="text-xs text-text-muted border-b border-border-col/50 py-1 last:border-0">
                <span className="text-warn mr-2">{new Date(o.at).toLocaleString('es')}</span>
                {o.note || 'Sin nota'}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button className="btn-danger" onClick={onOverride}>Override manual</button>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </Modal>
  )
}

export default function Battles() {
  const battles        = useStore(s => s.battles)
  const squads         = useStore(s => s.squads)
  const nations        = useStore(s => s.nations)
  const overrideBattle = useStore(s => s.overrideBattle)

  const [detail,   setDetail]   = useState(null)
  const [override, setOverride] = useState(null)
  const [filterWinner, setFilterWinner] = useState('')
  const [search,       setSearch]       = useState('')

  const filtered = battles.filter(b => {
    const aSquad = squads.find(s => s.id === b.attackerSquadId)
    const dSquad = squads.find(s => s.id === b.defenderSquadId)
    const matchSearch = !search || [aSquad?.name, dSquad?.name].some(n => n?.toLowerCase().includes(search.toLowerCase()))
    const matchWinner = !filterWinner || b.result?.winner === filterWinner
    return matchSearch && matchWinner
  })

  return (
    <div>
      <PageHeader
        title="Historial de batallas"
        subtitle={`${battles.length} batalla${battles.length !== 1 ? 's' : ''} registrada${battles.length !== 1 ? 's' : ''}`}
      />

      {battles.length > 0 && (
        <div className="flex gap-3 mb-4">
          <input className="input w-48" placeholder="Buscar escuadra..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select w-44" value={filterWinner} onChange={e => setFilterWinner(e.target.value)}>
            <option value="">Todos los resultados</option>
            <option value="ATTACKER">Victoria atacante</option>
            <option value="DEFENDER">Victoria defensor</option>
            <option value="DRAW">Empate</option>
          </select>
        </div>
      )}

      {battles.length === 0 ? (
        <EmptyState icon="◎" title="Sin batallas" message="Usa el Simulador para crear la primera batalla." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="war-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Atacante</th>
                <th>Defensor</th>
                <th>Terreno</th>
                <th>Modo</th>
                <th>Rondas</th>
                <th>Resultado</th>
                <th>Bajas A/D</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, idx) => {
                const aSquad = squads.find(s => s.id === b.attackerSquadId)
                const dSquad = squads.find(s => s.id === b.defenderSquadId)
                const winner = b.result?.winner
                const hasOverride = b.overrides?.length > 0
                return (
                  <tr key={b.id}>
                    <td className="text-text-muted font-mono text-xs">{battles.length - idx}</td>
                    <td>
                      <div className="font-display font-medium">{aSquad?.name || '—'}</div>
                      <div className="text-text-muted text-xs">{nations.find(n => n.id === aSquad?.nationId)?.name || ''}</div>
                    </td>
                    <td>
                      <div className="font-display font-medium">{dSquad?.name || '—'}</div>
                      <div className="text-text-muted text-xs">{nations.find(n => n.id === dSquad?.nationId)?.name || ''}</div>
                    </td>
                    <td className="text-text-muted text-xs capitalize">{b.terrain}</td>
                    <td className="text-text-muted text-xs">{b.mode}</td>
                    <td className="font-mono text-xs text-text-muted">{b.result?.totalRounds ?? '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={
                          winner === 'ATTACKER' ? 'VICTORY' :
                          winner === 'DEFENDER' ? 'DEFEAT'  : 'DRAW'
                        } />
                        {hasOverride && <span className="text-warn text-xs" title="Override aplicado">⚠</span>}
                      </div>
                    </td>
                    <td className="font-mono text-xs">
                      <span className="text-danger">{b.result?.attacker?.killed ?? 0}</span>
                      <span className="text-text-muted">/</span>
                      <span className="text-safe">{b.result?.defender?.killed ?? 0}</span>
                    </td>
                    <td className="text-text-muted text-xs">{new Date(b.createdAt).toLocaleDateString('es')}</td>
                    <td>
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setDetail(b)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <BattleDetail
          battle={detail}
          squads={squads}
          onClose={() => setDetail(null)}
          onOverride={() => { setOverride(detail); setDetail(null) }}
        />
      )}

      {override && (
        <OverrideModal
          battle={override}
          onSave={(data) => overrideBattle(override.id, data)}
          onClose={() => setOverride(null)}
        />
      )}
    </div>
  )
}
