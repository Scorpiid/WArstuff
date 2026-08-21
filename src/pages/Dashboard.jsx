import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { useT } from '../i18n/LanguageContext'
import { computeSquadTurnEffects } from '../engine/turnEngine'

function StatCard({ icon, label, value, sub, color = 'text-signal', onClick }) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:border-signal/30 transition-colors group w-full">
      <div className="flex items-start justify-between mb-2">
        <span className="text-text-muted text-xl">{icon}</span>
        <span className={`font-mono font-medium text-2xl ${color} group-hover:text-signal transition-colors`}>{value}</span>
      </div>
      <div className="label">{label}</div>
      {sub && <div className="text-text-muted text-xs mt-0.5">{sub}</div>}
    </button>
  )
}

function RecentEvent({ event }) {
  const { t } = useT()
  const typeColors = {
    BATTLE_START: 'text-signal', BATTLE_END: 'text-safe',
    BATTLE_OVERRIDE: 'text-warn', NATION_CREATED: 'text-safe',
    SQUAD_CREATED: 'text-safe', NATION_DELETED: 'text-danger',
    SQUAD_DELETED: 'text-danger', SQUAD_DESTROYED: 'text-danger',
    TURN_ADVANCE: 'text-signal', INFO: 'text-text-muted',
  }
  const color = typeColors[event.type] || 'text-text-muted'
  const time  = new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date  = new Date(event.at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })
  const label = t.eventLog.types[event.type] || event.type.replace(/_/g, ' ')
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border-col/50 last:border-0">
      <span className={`font-mono text-stat mt-0.5 shrink-0 ${color}`}>{label}</span>
      <span className="text-text-primary text-xs flex-1">{event.message}</span>
      <span className="text-text-muted text-stat shrink-0">{date} {time}</span>
    </div>
  )
}

// ─── Turn advance preview modal ───────────────────────────────────────────────
function TurnPreviewModal({ squads, turnEffects, currentTurn, onConfirm, onClose, lang }) {
  const previews = squads
    .filter(sq => sq.status !== 'DESTROYED')
    .map(sq => {
      const patch = computeSquadTurnEffects(sq, turnEffects)
      return { squad: sq, patch }
    })
    .filter(p => p.patch)

  const label = (val, newVal, goodDir = 'down') => {
    const diff = newVal - val
    if (diff === 0) return { text: '—', color: 'text-text-muted' }
    const improved = goodDir === 'down' ? diff < 0 : diff > 0
    return {
      text: `${diff > 0 ? '+' : ''}${diff}`,
      color: improved ? 'text-safe' : 'text-danger',
    }
  }

  return (
    <Modal
      title={lang === 'en' ? `Advance to turn ${currentTurn + 1}` : `Avanzar al turno ${currentTurn + 1}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        <p className="text-text-muted text-sm">
          {lang === 'en'
            ? 'The following effects will be applied to all active squads:'
            : 'Los siguientes efectos se aplicarán a todas las escuadras activas:'}
        </p>

        {/* Effects legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { icon: '💤', label: lang === 'en' ? 'Fatigue recovery' : 'Recuperación de fatiga', color: 'text-safe' },
            { icon: '💛', label: lang === 'en' ? 'Morale drift → baseline' : 'Moral deriva hacia base', color: 'text-signal' },
            { icon: '🔧', label: lang === 'en' ? 'Supply regeneration' : 'Regeneración de suministros', color: 'text-safe' },
            { icon: '⚔', label: lang === 'en' ? 'Engaged: reduced recovery' : 'En combate: recuperación reducida', color: 'text-warn' },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 rounded border border-border-col">
              <span>{icon}</span>
              <span className={`${color} font-mono`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Squad preview table */}
        {previews.length > 0 ? (
          <div className="max-h-72 overflow-y-auto">
            <table className="war-table text-xs">
              <thead>
                <tr>
                  <th>{lang === 'en' ? 'Squad' : 'Escuadra'}</th>
                  <th className="text-center">{lang === 'en' ? 'Status' : 'Estado'}</th>
                  <th className="text-center">{lang === 'en' ? 'Fatigue' : 'Fatiga'}</th>
                  <th className="text-center">{lang === 'en' ? 'Morale' : 'Moral'}</th>
                  <th className="text-center">{lang === 'en' ? 'Ammo' : 'Mun.'}</th>
                  <th className="text-center">{lang === 'en' ? 'Fuel' : 'Comb.'}</th>
                </tr>
              </thead>
              <tbody>
                {previews.map(({ squad, patch }) => {
                  const fatDiff  = label(squad.fatigue ?? 10,    patch.fatigue,     'down')
                  const morDiff  = label(squad.morale  ?? 75,    patch.morale,      'up')
                  const ammoDiff = label(squad.ammo    ?? 100,   patch.ammo,        'up')
                  const fuelDiff = label(squad.fuel    ?? 100,   patch.fuel,        'up')
                  return (
                    <tr key={squad.id}>
                      <td>
                        <span className="font-display font-semibold">{squad.name}</span>
                        {squad.status === 'ENGAGED' && (
                          <span className="ml-2 text-warn text-stat">⚔ engaged</span>
                        )}
                      </td>
                      <td className="text-center"><StatusBadge status={squad.status} /></td>
                      <td className="text-center font-mono">
                        <span className="text-text-muted">{squad.fatigue ?? 10}</span>
                        <span className={`ml-1 ${fatDiff.color}`}>{fatDiff.text}</span>
                      </td>
                      <td className="text-center font-mono">
                        <span className="text-text-muted">{squad.morale ?? 75}</span>
                        <span className={`ml-1 ${morDiff.color}`}>{morDiff.text}</span>
                      </td>
                      <td className="text-center font-mono">
                        <span className="text-text-muted">{squad.ammo ?? 100}</span>
                        <span className={`ml-1 ${ammoDiff.color}`}>{ammoDiff.text}</span>
                      </td>
                      <td className="text-center font-mono">
                        <span className="text-text-muted">{squad.fuel ?? 100}</span>
                        <span className={`ml-1 ${fuelDiff.color}`}>{fuelDiff.text}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-4">
            {lang === 'en' ? 'No active squads to update.' : 'Sin escuadras activas para actualizar.'}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onClose}>
            {lang === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            {lang === 'en' ? `⏭ Advance to turn ${currentTurn + 1}` : `⏭ Avanzar al turno ${currentTurn + 1}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t, lang } = useT()
  const d = t.dashboard

  const nations         = useStore(s => s.nations)
  const squads          = useStore(s => s.squads)
  const vehicles        = useStore(s => s.vehicles)
  const battles         = useStore(s => s.battles)
  const events          = useStore(s => s.events)
  const currentTurn     = useStore(s => s.currentTurn)
  const campaignName    = useStore(s => s.campaignName)
  const turnEffects     = useStore(s => s.turnEffects)
  const setCampaignName = useStore(s => s.setCampaignName)
  const setCurrentTurn  = useStore(s => s.setCurrentTurn)
  const advanceTurn     = useStore(s => s.advanceTurn)

  const [showTurnPreview, setShowTurnPreview] = useState(false)

  const activeSquads    = squads.filter(s => s.status === 'ACTIVE' || s.status === 'ENGAGED')
  const ongoingBattles  = battles.filter(b => b.status === 'IN_PROGRESS')
  const totalKilled     = battles.reduce((a, b) => a + (b.result?.attacker?.killed || 0) + (b.result?.defender?.killed || 0), 0)
  const totalWounded    = battles.reduce((a, b) => a + (b.result?.attacker?.wounded || 0) + (b.result?.defender?.wounded || 0), 0)
  const totalEffectives = squads.reduce((a, sq) => a + (sq.squadSize ?? 0), 0)
  const recentEvents    = events.slice(0, 8)

  const handleAdvanceTurn = () => {
    advanceTurn()
    setShowTurnPreview(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <input
            className="bg-transparent font-display font-semibold text-3xl text-text-primary tracking-wide border-b border-transparent hover:border-border-col focus:border-signal focus:outline-none transition-colors w-80"
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            aria-label={d.campaignNameLabel}
          />
          <p className="section-subtitle mt-1">{d.subtitle}</p>
        </div>

        {/* Turn controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface border border-border-col rounded px-3 py-2">
            <span className="label mb-0">{t.sidebar.turn}</span>
            <input
              type="number" min="1"
              className="bg-transparent font-mono text-signal w-10 text-center focus:outline-none text-sm"
              value={currentTurn}
              onChange={e => setCurrentTurn(Math.max(1, parseInt(e.target.value) || 1))}
              aria-label={d.turnLabel}
            />
          </div>
          {/* Advance turn button */}
          <button
            onClick={() => setShowTurnPreview(true)}
            className="btn-primary flex items-center gap-2"
            title={lang === 'en' ? 'Advance turn — applies fatigue recovery, morale drift and supply regen to all squads' : 'Avanzar turno — aplica recuperación de fatiga, deriva de moral y suministros a todas las escuadras'}
          >
            <span>⏭</span>
            <span>{lang === 'en' ? `Turn ${currentTurn + 1}` : `Turno ${currentTurn + 1}`}</span>
          </button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon="◈" label={d.colNation}        value={nations.length}        onClick={() => navigate('/nations')} />
        <StatCard icon="◆" label={d.activeSquads}     value={activeSquads.length}   sub={d.ofTotal.replace('{n}', squads.length)} onClick={() => navigate('/squads')} />
        <StatCard icon="◉" label={d.totalEffectives}  value={totalEffectives}       sub={`${squads.filter(s => s.status === 'DESTROYED').length} ☠`} onClick={() => navigate('/squads')} />
        <StatCard icon="⚔" label={d.ongoingBattles}   value={ongoingBattles.length} color={ongoingBattles.length > 0 ? 'text-danger' : 'text-signal'} onClick={() => navigate('/battles')} />
        <StatCard icon="☠" label={d.totalCasualties}  value={totalKilled}           color="text-danger" sub={d.wounded.replace('{n}', totalWounded)} onClick={() => navigate('/stats')} />
        <StatCard icon="◧" label={d.vehicles}          value={vehicles.length}       sub={d.destroyed.replace('{n}', vehicles.filter(v => v.status === 'DESTROYED').length)} onClick={() => navigate('/vehicles')} />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="btn-primary"   onClick={() => navigate('/battle')}>  {d.btnSimulate}</button>
        <button className="btn-secondary" onClick={() => navigate('/battles')}> {d.btnBattles}</button>
        <button className="btn-secondary" onClick={() => navigate('/nations')}> {d.btnNations}</button>
        <button className="btn-secondary" onClick={() => navigate('/squads')}>  {d.btnSquads}</button>
        <button className="btn-ghost"     onClick={() => navigate('/log')}>     {d.btnLog}</button>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <span className="text-signal text-sm">◈</span>
            <h2 className="font-display font-semibold text-base tracking-wide">{d.activeNations}</h2>
          </div>
          <div className="p-3">
            {nations.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">{d.noNations}</p>
            ) : (
              <table className="war-table">
                <thead>
                  <tr>
                    <th>{d.colNation}</th><th>{d.colPlayer}</th>
                    <th className="text-right">{d.colSquads}</th>
                    <th className="text-right">{d.colIntel}</th>
                  </tr>
                </thead>
                <tbody>
                  {nations.map(n => (
                    <tr key={n.id} className="cursor-pointer" onClick={() => navigate('/nations')}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                          <span className="font-display font-medium">{n.name}</span>
                        </div>
                      </td>
                      <td className="text-text-muted">{n.playerName || '—'}</td>
                      <td className="text-right font-mono">{n.squadIds?.length || 0}</td>
                      <td className="text-right font-mono text-signal">{n.intelligence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="text-signal text-sm">≡</span>
            <h2 className="font-display font-semibold text-base tracking-wide">{d.recentEvents}</h2>
            <button className="ml-auto text-text-muted hover:text-signal text-xs" onClick={() => navigate('/log')}>{d.viewAll}</button>
          </div>
          <div className="p-3">
            {recentEvents.length === 0
              ? <p className="text-text-muted text-sm text-center py-4">{d.noEvents}</p>
              : recentEvents.map(ev => <RecentEvent key={ev.id} event={ev} />)
            }
          </div>
        </div>
      </div>

      {battles.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <span className="text-signal text-sm">⚔</span>
            <h2 className="font-display font-semibold text-base tracking-wide">{d.recentBattles}</h2>
            <button className="ml-auto text-text-muted hover:text-signal text-xs" onClick={() => navigate('/battles')}>{d.viewAllBattles}</button>
          </div>
          <div className="p-3">
            <table className="war-table">
              <thead>
                <tr>
                  <th>{d.colAttacker}</th><th>{d.colDefender}</th>
                  <th>{d.colTerrain}</th><th>{d.colResult}</th>
                  <th className="text-right">{d.colCasA}</th>
                  <th className="text-right">{d.colCasD}</th>
                </tr>
              </thead>
              <tbody>
                {battles.slice(0, 5).map(b => {
                  const aSquad = squads.find(s => s.id === b.attackerSquadId)
                  const dSquad = squads.find(s => s.id === b.defenderSquadId)
                  const winner = b.result?.winner
                  return (
                    <tr key={b.id}>
                      <td className="font-display font-medium">{aSquad?.name || t.common.unknown}</td>
                      <td className="font-display font-medium">{dSquad?.name || t.common.unknown}</td>
                      <td className="text-text-muted capitalize">{b.terrain || '—'}</td>
                      <td>
                        <StatusBadge status={winner === 'ATTACKER' ? 'VICTORY' : winner === 'DEFENDER' ? 'DEFEAT' : 'DRAW'} />
                      </td>
                      <td className="text-right font-mono text-danger">{b.result?.attacker?.killed ?? '—'}</td>
                      <td className="text-right font-mono text-danger">{b.result?.defender?.killed ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Turn advance preview modal */}
      {showTurnPreview && (
        <TurnPreviewModal
          squads={squads}
          turnEffects={turnEffects}
          currentTurn={currentTurn}
          onConfirm={handleAdvanceTurn}
          onClose={() => setShowTurnPreview(false)}
          lang={lang}
        />
      )}
    </div>
  )
}
