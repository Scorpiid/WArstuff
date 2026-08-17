import { useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import StatBar from '../components/StatBar'
import EmptyState from '../components/EmptyState'
import { useT } from '../i18n/LanguageContext'

function StatBox({ label, value, sub, color = 'text-signal' }) {
  return (
    <div className="panel text-center">
      <div className={`font-mono font-medium text-3xl ${color}`}>{value}</div>
      <div className="label text-center mt-1">{label}</div>
      {sub && <div className="text-text-muted text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function NationLeaderboard({ nations, squads, battles, s }) {
  const ranked = nations.map(n => {
    const nationSquads  = squads.filter(sq => sq.nationId === n.id)
    const nationBattles = battles.filter(b => {
      const aSquad = squads.find(sq => sq.id === b.attackerSquadId)
      const dSquad = squads.find(sq => sq.id === b.defenderSquadId)
      return aSquad?.nationId === n.id || dSquad?.nationId === n.id
    })
    const wins = nationBattles.filter(b => {
      const aSquad    = squads.find(sq => sq.id === b.attackerSquadId)
      const isAttacker = aSquad?.nationId === n.id
      return (isAttacker && b.result?.winner === 'ATTACKER') || (!isAttacker && b.result?.winner === 'DEFENDER')
    }).length
    const losses = nationBattles.filter(b => {
      const aSquad    = squads.find(sq => sq.id === b.attackerSquadId)
      const isAttacker = aSquad?.nationId === n.id
      return (isAttacker && b.result?.winner === 'DEFENDER') || (!isAttacker && b.result?.winner === 'ATTACKER')
    }).length
    const totalCasualties = nationBattles.reduce((acc, b) => {
      const aSquad    = squads.find(sq => sq.id === b.attackerSquadId)
      const isAttacker = aSquad?.nationId === n.id
      const side = isAttacker ? 'attacker' : 'defender'
      return acc + (b.result?.[side]?.killed || 0)
    }, 0)
    const score = wins * 100 - losses * 50 - totalCasualties * 2
    return { ...n, wins, losses, battles: nationBattles.length, squads: nationSquads.length, totalCasualties, score }
  }).sort((a, b) => b.score - a.score)

  return (
    <div className="card">
      <div className="card-header"><span className="text-signal">◈</span><h2 className="font-display font-semibold tracking-wide">{s.nationRanking}</h2></div>
      <div className="p-3">
        <table className="war-table">
          <thead>
            <tr>
              <th>{s.colRank}</th><th>{s.colNation}</th><th className="text-right">{s.colWins}</th>
              <th className="text-right">{s.colLosses}</th><th className="text-right">{s.colBattles}</th>
              <th className="text-right">{s.colSquads}</th><th className="text-right">{s.colCasualties}</th>
              <th className="text-right">{s.colScore}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((n, i) => (
              <tr key={n.id}>
                <td className="text-text-muted font-mono">{i + 1}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                    <span className="font-display font-semibold">{n.name}</span>
                    {n.playerName && <span className="text-text-muted text-xs">({n.playerName})</span>}
                  </div>
                </td>
                <td className="text-right font-mono text-safe">{n.wins}</td>
                <td className="text-right font-mono text-danger">{n.losses}</td>
                <td className="text-right font-mono text-text-muted">{n.battles}</td>
                <td className="text-right font-mono text-text-muted">{n.squads}</td>
                <td className="text-right font-mono text-danger">{n.totalCasualties}</td>
                <td className="text-right font-mono text-signal font-medium">{n.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SquadStats({ squads, nations, battles, vehicles, s }) {
  const squadStats = squads.map(sq => {
    const sqBattles = battles.filter(b => b.attackerSquadId === sq.id || b.defenderSquadId === sq.id)
    const wins = sqBattles.filter(b =>
      (b.attackerSquadId === sq.id && b.result?.winner === 'ATTACKER') ||
      (b.defenderSquadId === sq.id && b.result?.winner === 'DEFENDER')
    ).length
    const totalCasualties = sqBattles.reduce((acc, b) => {
      const side = b.attackerSquadId === sq.id ? 'attacker' : 'defender'
      return acc + (b.result?.[side]?.killed || 0)
    }, 0)
    const nation    = nations.find(n => n.id === sq.nationId)
    const sqVehicles = vehicles.filter(v => sq.vehicleIds?.includes(v.id))
    return { ...sq, wins, battles: sqBattles.length, totalCasualties, nation, sqVehicles }
  }).sort((a, b) => b.wins - a.wins || a.totalCasualties - b.totalCasualties)

  return (
    <div className="card">
      <div className="card-header"><span className="text-signal">◆</span><h2 className="font-display font-semibold tracking-wide">{s.squadPerformance}</h2></div>
      <div className="p-3">
        <table className="war-table">
          <thead>
            <tr>
              <th>{s.colSquad}</th><th>{s.colNation}</th><th>{s.colType}</th>
              <th className="text-right">{s.colWB}</th><th>{s.colCombat}</th>
              <th>{s.colMorale}</th><th className="text-right">{s.colCasualties}</th>
              <th className="text-right">{s.colVeh}</th>
            </tr>
          </thead>
          <tbody>
            {squadStats.map(sq => (
              <tr key={sq.id}>
                <td>
                  <div className="font-display font-semibold">{sq.name}</div>
                  {sq.commander && <div className="text-text-muted text-xs">{sq.commander}</div>}
                </td>
                <td>{sq.nation ? <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: sq.nation.color }} /><span className="text-text-muted text-xs">{sq.nation.name}</span></div> : <span className="text-text-muted text-xs">—</span>}</td>
                <td className="text-text-muted text-xs">{sq.type}</td>
                <td className="text-right font-mono text-xs"><span className="text-safe">{sq.wins}</span><span className="text-text-muted">/{sq.battles}</span></td>
                <td className="w-28">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-signal w-6">{sq.combat}</span>
                    <div className="flex-1 h-px bg-border-col relative"><div className="absolute h-px bg-signal" style={{ width:`${sq.combat}%` }} /></div>
                  </div>
                </td>
                <td className="w-28">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs w-6 ${sq.morale > 60 ? 'text-safe' : sq.morale > 30 ? 'text-warn' : 'text-danger'}`}>{sq.morale}</span>
                    <div className="flex-1 h-px bg-border-col relative"><div className={`absolute h-px ${sq.morale > 60 ? 'bg-safe' : sq.morale > 30 ? 'bg-warn' : 'bg-danger'}`} style={{ width:`${sq.morale}%` }} /></div>
                  </div>
                </td>
                <td className="text-right font-mono text-danger text-xs">{sq.totalCasualties}</td>
                <td className="text-right font-mono text-text-muted text-xs">{sq.sqVehicles.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PersonnelStatusBreakdown({ personnel, s }) {
  const STATUSES = ['ACTIVE','WOUNDED','INCAPACITATED','MISSING','CAPTURED','KILLED','RETIRED']
  const counts   = STATUSES.map(st => ({ status: st, count: personnel.filter(p => p.status === st).length }))
  const total    = personnel.length
  const colors   = { ACTIVE:'bg-safe', WOUNDED:'bg-warn', INCAPACITATED:'bg-warn-dim', MISSING:'bg-text-muted', CAPTURED:'bg-signal', KILLED:'bg-danger', RETIRED:'bg-border-col' }
  const labels   = { ACTIVE:s.statusActive, WOUNDED:s.statusWounded, INCAPACITATED:s.statusIncap, MISSING:s.statusMissing, CAPTURED:s.statusCaptured, KILLED:s.statusKilled, RETIRED:s.statusRetired }

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-signal">◉</span>
        <h2 className="font-display font-semibold tracking-wide">{s.personnelStatus}</h2>
        <span className="ml-auto text-text-muted font-mono text-xs">{s.effectivesTotal.replace('{n}', total)}</span>
      </div>
      <div className="p-4">
        {total > 0 && (
          <div className="flex h-4 rounded overflow-hidden mb-3 gap-px">
            {counts.filter(c => c.count > 0).map(({ status, count }) => (
              <div key={status} className={`${colors[status]} transition-all`} style={{ width:`${(count/total)*100}%` }} title={`${labels[status]}: ${count}`} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          {counts.map(({ status, count }) => (
            <div key={status} className="text-center">
              <div className={`font-mono text-xl font-medium ${status==='ACTIVE'?'text-safe':status==='KILLED'?'text-danger':status==='CAPTURED'?'text-signal':status==='WOUNDED'||status==='INCAPACITATED'?'text-warn':'text-text-muted'}`}>{count}</div>
              <div className="label text-center">{labels[status]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BattleSummary({ battles, s }) {
  const detectionCounts = ['AMBUSH','NO_CONTACT','PARTIAL','FULL'].map(o => ({
    label: o.replace('_', ' '),
    count: battles.filter(b => b.phases?.detection?.outcome === o).length,
  }))
  const terrainCounts = Object.entries(
    battles.reduce((acc, b) => ({ ...acc, [b.terrain || 'unknown']: (acc[b.terrain || 'unknown'] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card">
        <div className="card-header"><span className="text-signal">◉</span><h2 className="font-display font-semibold tracking-wide">{s.detectionResults}</h2></div>
        <div className="p-4 space-y-2">
          {detectionCounts.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="label mb-0 w-28">{label}</span>
              <div className="flex-1 h-px bg-border-col relative"><div className="absolute h-px bg-signal" style={{ width: battles.length > 0 ? `${(count/battles.length)*100}%` : '0%' }} /></div>
              <span className="font-mono text-xs text-signal w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="text-signal">◧</span><h2 className="font-display font-semibold tracking-wide">{s.topTerrains}</h2></div>
        <div className="p-4 space-y-2">
          {terrainCounts.length === 0
            ? <p className="text-text-muted text-sm text-center py-2">{s.noData}</p>
            : terrainCounts.map(([terrain, count]) => (
                <div key={terrain} className="flex items-center gap-3">
                  <span className="label mb-0 w-28 capitalize">{terrain}</span>
                  <div className="flex-1 h-px bg-border-col relative"><div className="absolute h-px bg-signal" style={{ width: battles.length > 0 ? `${(count/battles.length)*100}%` : '0%' }} /></div>
                  <span className="font-mono text-xs text-signal w-8 text-right">{count}</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}

export default function Statistics() {
  const { t } = useT()
  const s = t.statistics
  const nations   = useStore(st => st.nations)
  const squads    = useStore(st => st.squads)
  const personnel = useStore(st => st.personnel)
  const vehicles  = useStore(st => st.vehicles)
  const battles   = useStore(st => st.battles)

  const totalKilled   = battles.reduce((a, b) => a + (b.result?.attacker?.killed || 0) + (b.result?.defender?.killed || 0), 0)
  const totalWounded  = battles.reduce((a, b) => a + (b.result?.attacker?.wounded || 0) + (b.result?.defender?.wounded || 0), 0)
  const totalCaptured = battles.reduce((a, b) => a + (b.result?.attacker?.captured || 0) + (b.result?.defender?.captured || 0), 0)
  const attackerWins  = battles.filter(b => b.result?.winner === 'ATTACKER').length
  const defenderWins  = battles.filter(b => b.result?.winner === 'DEFENDER').length
  const draws         = battles.filter(b => b.result?.winner === 'DRAW').length
  const destroyedVehicles = vehicles.filter(v => v.status === 'DESTROYED').length

  const noData = nations.length === 0 && squads.length === 0 && battles.length === 0

  if (noData) return (
    <div>
      <PageHeader title={s.title} subtitle={s.subtitle} />
      <EmptyState icon="◈" title={s.emptyTitle} message={s.emptyMsg} />
    </div>
  )

  return (
    <div>
      <PageHeader title={s.title} subtitle={s.subtitle} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label={s.totalBattles}      value={battles.length} />
        <StatBox label={s.attackerWins}      value={attackerWins}  color="text-danger" sub={`${battles.length > 0 ? Math.round(attackerWins/battles.length*100) : 0}%`} />
        <StatBox label={s.defenderWins}      value={defenderWins}  color="text-safe"   sub={`${battles.length > 0 ? Math.round(defenderWins/battles.length*100) : 0}%`} />
        <StatBox label={s.draws}             value={draws}         color="text-text-muted" />
        <StatBox label={s.totalKilled}       value={totalKilled}   color="text-danger" />
        <StatBox label={s.totalWounded}      value={totalWounded}  color="text-warn" />
        <StatBox label={s.totalCaptured}     value={totalCaptured} color="text-signal" />
        <StatBox label={s.vehiclesDestroyed} value={destroyedVehicles} color="text-danger" sub={s.of.replace('{n}', vehicles.length)} />
      </div>
      <div className="space-y-4">
        {battles.length  > 0 && <BattleSummary battles={battles} s={s} />}
        {nations.length  > 0 && <NationLeaderboard nations={nations} squads={squads} battles={battles} s={s} />}
        {squads.length   > 0 && <SquadStats squads={squads} nations={nations} battles={battles} vehicles={vehicles} s={s} />}
        {personnel.length > 0 && <PersonnelStatusBreakdown personnel={personnel} s={s} />}
      </div>
    </div>
  )
}
