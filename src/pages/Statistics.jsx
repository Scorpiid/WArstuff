import { useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import StatBar from '../components/StatBar'
import EmptyState from '../components/EmptyState'

function StatBox({ label, value, sub, color = 'text-signal' }) {
  return (
    <div className="panel text-center">
      <div className={`font-mono font-medium text-3xl ${color}`}>{value}</div>
      <div className="label text-center mt-1">{label}</div>
      {sub && <div className="text-text-muted text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function NationLeaderboard({ nations, squads, battles }) {
  const ranked = nations.map(n => {
    const nationSquads = squads.filter(s => s.nationId === n.id)
    const nationBattles = battles.filter(b => {
      const aSquad = squads.find(s => s.id === b.attackerSquadId)
      const dSquad = squads.find(s => s.id === b.defenderSquadId)
      return aSquad?.nationId === n.id || dSquad?.nationId === n.id
    })
    const wins = nationBattles.filter(b => {
      const aSquad = squads.find(s => s.id === b.attackerSquadId)
      const isAttacker = aSquad?.nationId === n.id
      return (isAttacker && b.result?.winner === 'ATTACKER') || (!isAttacker && b.result?.winner === 'DEFENDER')
    }).length
    const losses = nationBattles.filter(b => {
      const aSquad = squads.find(s => s.id === b.attackerSquadId)
      const isAttacker = aSquad?.nationId === n.id
      return (isAttacker && b.result?.winner === 'DEFENDER') || (!isAttacker && b.result?.winner === 'ATTACKER')
    }).length
    const totalCasualties = nationBattles.reduce((acc, b) => {
      const aSquad = squads.find(s => s.id === b.attackerSquadId)
      const isAttacker = aSquad?.nationId === n.id
      const side = isAttacker ? 'attacker' : 'defender'
      return acc + (b.result?.[side]?.killed || 0)
    }, 0)
    const score = wins * 100 - losses * 50 - totalCasualties * 2

    return { ...n, wins, losses, battles: nationBattles.length, squads: nationSquads.length, totalCasualties, score }
  }).sort((a, b) => b.score - a.score)

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-signal">◈</span>
        <h2 className="font-display font-semibold tracking-wide">Clasificación de naciones</h2>
      </div>
      <div className="p-3">
        <table className="war-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nación</th>
              <th className="text-right">Victorias</th>
              <th className="text-right">Derrotas</th>
              <th className="text-right">Batallas</th>
              <th className="text-right">Escuadras</th>
              <th className="text-right">Bajas</th>
              <th className="text-right">Puntuación</th>
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

function SquadStats({ squads, nations, battles, vehicles }) {
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
    const nation = nations.find(n => n.id === sq.nationId)
    const sqVehicles = vehicles.filter(v => sq.vehicleIds?.includes(v.id))
    return { ...sq, wins, battles: sqBattles.length, totalCasualties, nation, sqVehicles }
  }).sort((a, b) => b.wins - a.wins || a.totalCasualties - b.totalCasualties)

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-signal">◆</span>
        <h2 className="font-display font-semibold tracking-wide">Rendimiento de escuadras</h2>
      </div>
      <div className="p-3">
        <table className="war-table">
          <thead>
            <tr>
              <th>Escuadra</th>
              <th>Nación</th>
              <th>Tipo</th>
              <th className="text-right">V/B</th>
              <th>Combate</th>
              <th>Moral</th>
              <th className="text-right">Bajas</th>
              <th className="text-right">Veh.</th>
            </tr>
          </thead>
          <tbody>
            {squadStats.map(sq => (
              <tr key={sq.id}>
                <td>
                  <div className="font-display font-semibold">{sq.name}</div>
                  {sq.commander && <div className="text-text-muted text-xs">{sq.commander}</div>}
                </td>
                <td>
                  {sq.nation ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sq.nation.color }} />
                      <span className="text-text-muted text-xs">{sq.nation.name}</span>
                    </div>
                  ) : <span className="text-text-muted text-xs">—</span>}
                </td>
                <td className="text-text-muted text-xs">{sq.type}</td>
                <td className="text-right font-mono text-xs">
                  <span className="text-safe">{sq.wins}</span>
                  <span className="text-text-muted">/{sq.battles}</span>
                </td>
                <td className="w-28">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-signal w-6">{sq.combat}</span>
                    <div className="flex-1 h-px bg-border-col relative">
                      <div className="absolute h-px bg-signal" style={{ width: `${sq.combat}%` }} />
                    </div>
                  </div>
                </td>
                <td className="w-28">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs w-6 ${sq.morale > 60 ? 'text-safe' : sq.morale > 30 ? 'text-warn' : 'text-danger'}`}>{sq.morale}</span>
                    <div className="flex-1 h-px bg-border-col relative">
                      <div className={`absolute h-px ${sq.morale > 60 ? 'bg-safe' : sq.morale > 30 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${sq.morale}%` }} />
                    </div>
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

function PersonnelStatusBreakdown({ personnel }) {
  const statuses = ['ACTIVE', 'WOUNDED', 'INCAPACITATED', 'MISSING', 'CAPTURED', 'KILLED', 'RETIRED']
  const counts   = statuses.map(s => ({ status: s, count: personnel.filter(p => p.status === s).length }))
  const total    = personnel.length

  const colors = {
    ACTIVE: 'bg-safe', WOUNDED: 'bg-warn', INCAPACITATED: 'bg-warn-dim',
    MISSING: 'bg-text-muted', CAPTURED: 'bg-signal', KILLED: 'bg-danger', RETIRED: 'bg-border-col',
  }
  const labels = {
    ACTIVE: 'Activo', WOUNDED: 'Herido', INCAPACITATED: 'Incap.',
    MISSING: 'Desap.', CAPTURED: 'Captrd.', KILLED: 'KIA', RETIRED: 'Retirado',
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-signal">◉</span>
        <h2 className="font-display font-semibold tracking-wide">Estado del personal</h2>
        <span className="ml-auto text-text-muted font-mono text-xs">{total} efectivos</span>
      </div>
      <div className="p-4">
        {/* Bar breakdown */}
        {total > 0 && (
          <div className="flex h-4 rounded overflow-hidden mb-3 gap-px">
            {counts.filter(c => c.count > 0).map(({ status, count }) => (
              <div key={status} className={`${colors[status]} transition-all`} style={{ width: `${(count / total) * 100}%` }} title={`${labels[status]}: ${count}`} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          {counts.map(({ status, count }) => (
            <div key={status} className="text-center">
              <div className={`font-mono text-xl font-medium ${
                status === 'ACTIVE' ? 'text-safe' :
                status === 'KILLED' ? 'text-danger' :
                status === 'CAPTURED' ? 'text-signal' :
                status === 'WOUNDED' || status === 'INCAPACITATED' ? 'text-warn' :
                'text-text-muted'
              }`}>{count}</div>
              <div className="label text-center">{labels[status]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BattleSummary({ battles, squads }) {
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
        <div className="card-header"><span className="text-signal">◉</span><h2 className="font-display font-semibold tracking-wide">Resultados de detección</h2></div>
        <div className="p-4 space-y-2">
          {detectionCounts.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="label mb-0 w-28">{label}</span>
              <div className="flex-1 h-px bg-border-col relative">
                <div className="absolute h-px bg-signal" style={{ width: battles.length > 0 ? `${(count / battles.length) * 100}%` : '0%' }} />
              </div>
              <span className="font-mono text-xs text-signal w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="text-signal">◧</span><h2 className="font-display font-semibold tracking-wide">Terrenos más usados</h2></div>
        <div className="p-4 space-y-2">
          {terrainCounts.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-2">Sin datos</p>
          ) : terrainCounts.map(([terrain, count]) => (
            <div key={terrain} className="flex items-center gap-3">
              <span className="label mb-0 w-28 capitalize">{terrain}</span>
              <div className="flex-1 h-px bg-border-col relative">
                <div className="absolute h-px bg-signal" style={{ width: battles.length > 0 ? `${(count / battles.length) * 100}%` : '0%' }} />
              </div>
              <span className="font-mono text-xs text-signal w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Statistics() {
  const nations   = useStore(s => s.nations)
  const squads    = useStore(s => s.squads)
  const personnel = useStore(s => s.personnel)
  const vehicles  = useStore(s => s.vehicles)
  const battles   = useStore(s => s.battles)

  const totalKilled   = battles.reduce((a, b) => a + (b.result?.attacker?.killed || 0) + (b.result?.defender?.killed || 0), 0)
  const totalWounded  = battles.reduce((a, b) => a + (b.result?.attacker?.wounded || 0) + (b.result?.defender?.wounded || 0), 0)
  const totalCaptured = battles.reduce((a, b) => a + (b.result?.attacker?.captured || 0) + (b.result?.defender?.captured || 0), 0)
  const attackerWins  = battles.filter(b => b.result?.winner === 'ATTACKER').length
  const defenderWins  = battles.filter(b => b.result?.winner === 'DEFENDER').length
  const draws         = battles.filter(b => b.result?.winner === 'DRAW').length
  const totalVehicles = vehicles.length
  const destroyedVehicles = vehicles.filter(v => v.status === 'DESTROYED').length

  const noData = nations.length === 0 && squads.length === 0 && battles.length === 0

  if (noData) {
    return (
      <div>
        <PageHeader title="Estadísticas" subtitle="Resumen global de la campaña" />
        <EmptyState icon="◈" title="Sin datos" message="Las estadísticas aparecen aquí a medida que creas naciones, escuadras y simulas batallas." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Resumen global de la campaña" />

      {/* Summary boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Batallas totales"   value={battles.length} />
        <StatBox label="Victorias atacante" value={attackerWins}   color="text-danger" sub={`${battles.length > 0 ? Math.round(attackerWins / battles.length * 100) : 0}%`} />
        <StatBox label="Victorias defensor" value={defenderWins}   color="text-safe"   sub={`${battles.length > 0 ? Math.round(defenderWins / battles.length * 100) : 0}%`} />
        <StatBox label="Empates"            value={draws}          color="text-text-muted" />
        <StatBox label="Muertos totales"    value={totalKilled}    color="text-danger" />
        <StatBox label="Heridos totales"    value={totalWounded}   color="text-warn" />
        <StatBox label="Capturados totales" value={totalCaptured}  color="text-signal" />
        <StatBox label="Vehículos destruidos" value={destroyedVehicles} color="text-danger" sub={`de ${totalVehicles}`} />
      </div>

      <div className="space-y-4">
        {battles.length > 0 && <BattleSummary battles={battles} squads={squads} />}
        {nations.length > 0 && <NationLeaderboard nations={nations} squads={squads} battles={battles} />}
        {squads.length > 0 && <SquadStats squads={squads} nations={nations} battles={battles} vehicles={vehicles} />}
        {personnel.length > 0 && <PersonnelStatusBreakdown personnel={personnel} />}
      </div>
    </div>
  )
}
