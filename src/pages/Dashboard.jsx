import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useT } from '../i18n/LanguageContext'

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
    SQUAD_DELETED: 'text-danger', INFO: 'text-text-muted',
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

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useT()
  const d = t.dashboard

  const nations         = useStore(s => s.nations)
  const squads          = useStore(s => s.squads)
  const vehicles        = useStore(s => s.vehicles)
  const battles         = useStore(s => s.battles)
  const events          = useStore(s => s.events)
  const currentTurn     = useStore(s => s.currentTurn)
  const campaignName    = useStore(s => s.campaignName)
  const setCampaignName = useStore(s => s.setCampaignName)
  const setCurrentTurn  = useStore(s => s.setCurrentTurn)

  const activeSquads    = squads.filter(s => s.status === 'ACTIVE' || s.status === 'ENGAGED')
  const ongoingBattles  = battles.filter(b => b.status === 'IN_PROGRESS')
  const totalKilled     = battles.reduce((a, b) => a + (b.result?.attacker?.killed || 0) + (b.result?.defender?.killed || 0), 0)
  const totalCaptured   = battles.reduce((a, b) => a + (b.result?.attacker?.captured || 0) + (b.result?.defender?.captured || 0), 0)
  const totalWounded    = battles.reduce((a, b) => a + (b.result?.attacker?.wounded || 0) + (b.result?.defender?.wounded || 0), 0)
  const totalEffectives = squads.reduce((a, sq) => a + (sq.squadSize ?? 0), 0)
  const recentEvents    = events.slice(0, 8)

  return (
    <div>
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface border border-border-col rounded px-3 py-2">
            <span className="label mb-0">{t.sidebar.turn}</span>
            <input
              type="number" min="1"
              className="bg-transparent font-mono text-signal w-10 text-center focus:outline-none text-sm"
              value={currentTurn}
              onChange={e => setCurrentTurn(Math.max(1, parseInt(e.target.value) || 1))}
              aria-label={d.turnLabel}
            />
            <div className="flex flex-col gap-0.5">
              <button onClick={() => setCurrentTurn(currentTurn + 1)} className="text-text-muted hover:text-signal text-xs leading-none">▲</button>
              <button onClick={() => setCurrentTurn(Math.max(1, currentTurn - 1))} className="text-text-muted hover:text-signal text-xs leading-none">▼</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon="◈" label={d.colNation}       value={nations.length}         onClick={() => navigate('/nations')} />
        <StatCard icon="◆" label={d.activeSquads}    value={activeSquads.length}    sub={d.ofTotal.replace('{n}', squads.length)} onClick={() => navigate('/squads')} />
        <StatCard icon="◉" label={d.totalEffectives} value={totalEffectives} sub={`${squads.filter(s => s.status === 'DESTROYED').length} ☠`} onClick={() => navigate('/squads')} />
        <StatCard icon="⚔" label={d.ongoingBattles}  value={ongoingBattles.length}  color={ongoingBattles.length > 0 ? 'text-danger' : 'text-signal'} onClick={() => navigate('/battles')} />
        <StatCard icon="☠" label={d.totalCasualties} value={totalKilled}            color="text-danger" sub={d.wounded.replace('{n}', totalWounded)} onClick={() => navigate('/stats')} />
        <StatCard icon="◧" label={d.vehicles}         value={vehicles.length}        sub={d.destroyed.replace('{n}', vehicles.filter(v => v.status === 'DESTROYED').length)} onClick={() => navigate('/vehicles')} />
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
    </div>
  )
}
