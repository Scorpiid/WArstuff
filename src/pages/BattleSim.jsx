import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { simulateBattle } from '../engine/combatEngine'
import { v4 as uuid } from 'uuid'
import PageHeader from '../components/PageHeader'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'

const TERRAINS = [
  { value: 'open',      label: 'Terreno abierto',    modifier: '+10% Atacante' },
  { value: 'urban',     label: 'Urbano',              modifier: '-15% Atacante' },
  { value: 'forest',    label: 'Bosque',              modifier: '-10% Atacante' },
  { value: 'mountain',  label: 'Montaña',             modifier: '-20% Atacante' },
  { value: 'desert',    label: 'Desierto',            modifier: 'Neutro' },
  { value: 'jungle',    label: 'Jungla',              modifier: '-25% Atacante' },
  { value: 'coast',     label: 'Costa',               modifier: '-5% Atacante' },
  { value: 'fortified', label: 'Posición fortif.',    modifier: '-35% Atacante' },
]

const BATTLE_MODS = [
  { value: 'nightOps',       label: 'Operación nocturna' },
  { value: 'heavyRain',      label: 'Lluvia intensa' },
  { value: 'airSupport',     label: 'Apoyo aéreo (atacante)' },
  { value: 'natoLogistics',  label: 'Logística reforzada' },
  { value: 'encircled',      label: 'Atacante encerrado' },
  { value: 'surpriseAttack', label: 'Ataque sorpresa' },
  { value: 'lowAmmo',        label: 'Munición escasa' },
  { value: 'exhausted',      label: 'Tropa agotada' },
]

const MODES = [
  { value: 'SIMPLE',   label: 'Simple',   desc: 'Resolución en 1 ronda' },
  { value: 'STANDARD', label: 'Estándar', desc: 'Simulación balanceada' },
  { value: 'DETAILED', label: 'Detallado',desc: 'Registro ronda a ronda completo' },
]

function SquadPreview({ squad, vehicles, label }) {
  if (!squad) return (
    <div className="card p-4 border-dashed flex items-center justify-center min-h-28">
      <span className="text-text-muted text-sm">Selecciona una escuadra</span>
    </div>
  )
  const squadVehicles = vehicles.filter(v => squad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-base">{squad.name}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
          label === 'ATACANTE'
            ? 'bg-danger/10 text-danger border-danger/30'
            : 'bg-safe/10 text-safe border-safe/30'
        }`}>{label}</span>
      </div>
      {squad.commander && <p className="text-text-muted text-xs">Cmd: {squad.commander}</p>}
      <div className="space-y-1.5">
        <StatBar label="Combate"      value={squad.combat ?? 70} />
        <StatBar label="Moral"        value={squad.morale ?? 80} />
        <StatBar label="Experiencia"  value={squad.experience ?? 60} />
        <StatBar label="Fatiga"       value={squad.fatigue ?? 10} color="warn" />
      </div>
      <div className="text-xs text-text-muted border-t border-border-col/50 pt-2 flex justify-between">
        <span>Personal activo: {squad.personnelIds?.length || 0}</span>
        <span>Vehículos: {squadVehicles.length}</span>
      </div>
    </div>
  )
}

function PhaseResult({ phase, data }) {
  const icons = { DETECTION: '◉', INITIATIVE: '⚡', SETUP: '◈' }
  return (
    <div className="panel">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-signal">{icons[phase]}</span>
        <h3 className="font-display font-semibold tracking-wide">{phase}</h3>
      </div>
      <div className="space-y-1">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center">
            <span className="label mb-0 capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            <span className="font-mono text-xs text-signal">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoundCard({ round, expanded, onToggle }) {
  const aWon = round.roundWinner === 'ATTACKER'
  return (
    <div className="border border-border-col rounded">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-display font-semibold text-signal">Ronda {round.roundNum}</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
            round.roundWinner === 'DRAW'
              ? 'border-text-muted/30 text-text-muted bg-surface-2'
              : aWon ? 'border-danger/30 text-danger bg-danger/10'
              : 'border-safe/30 text-safe bg-safe/10'
          }`}>
            {round.roundWinner === 'DRAW' ? 'EMPATE' : aWon ? 'VICTORIA ATACANTE' : 'VICTORIA DEFENSOR'}
          </span>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <span className="text-danger">A: {round.attacker.killed}☠ {round.attacker.wounded}⚕</span>
          <span className="text-safe">D: {round.defender.killed}☠ {round.defender.wounded}⚕</span>
          <span className="text-text-muted">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t border-border-col/50 grid grid-cols-2 gap-4 pt-3">
          {[
            { label: 'ATACANTE', data: round.attacker, power: round.attackerPower, color: 'danger' },
            { label: 'DEFENSOR', data: round.defender, power: round.defenderPower, color: 'safe' },
          ].map(({ label, data, power, color }) => (
            <div key={label}>
              <p className={`font-display font-semibold text-sm text-${color} mb-2`}>{label}</p>
              <div className="space-y-0.5 font-mono text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Poder efectivo</span><span className="text-signal">{power}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Bajas (muertos)</span><span className="text-danger">{data.killed}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Heridos</span><span className="text-warn">{data.wounded}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Capturados</span><span className="text-signal">{data.captured}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Moral</span>
                  <span className={data.moraleChange >= 0 ? 'text-safe' : 'text-danger'}>
                    {data.moraleAfter} ({data.moraleChange >= 0 ? '+' : ''}{data.moraleChange})
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-text-muted">Fatiga</span><span className="text-warn">{data.fatigueAfter}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Supresión</span><span className="text-warn">{data.suppressionAfter}%</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Activos</span><span className="text-text-primary">{data.activeCountAfter}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BattleResultBanner({ result, attackerSquad, defenderSquad }) {
  const { winner, reason, attacker, defender } = result
  const aWon = winner === 'ATTACKER'
  const draw  = winner === 'DRAW'

  return (
    <div className={`rounded border p-5 ${
      draw   ? 'border-text-muted/30 bg-surface-2' :
      aWon   ? 'border-danger/30 bg-danger/5' :
               'border-safe/30 bg-safe/5'
    }`}>
      <div className="text-center mb-4">
        <div className={`font-display font-bold text-3xl tracking-widest ${draw ? 'text-text-muted' : aWon ? 'text-danger' : 'text-safe'}`}>
          {draw ? 'EMPATE' : aWon ? 'VICTORIA ATACANTE' : 'VICTORIA DEFENSOR'}
        </div>
        <div className="text-text-muted text-xs mt-1 uppercase tracking-widest">{reason?.replace(/_/g, ' ')}</div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { label: attackerSquad?.name || 'Atacante', data: attacker, color: 'danger' },
          { label: defenderSquad?.name || 'Defensor', data: defender, color: 'safe' },
        ].map(({ label, data, color }) => (
          <div key={label} className="space-y-2">
            <h4 className={`font-display font-semibold text-${color}`}>{label}</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Muertos',   val: data.killed,    col: 'text-danger' },
                { label: 'Heridos',   val: data.wounded,   col: 'text-warn' },
                { label: 'Capturados',val: data.captured,  col: 'text-signal' },
                { label: 'Restantes', val: data.remaining, col: 'text-text-primary' },
              ].map(({ label: l, val, col }) => (
                <div key={l} className="bg-deep-night border border-border-col/50 rounded p-2 text-center">
                  <div className={`font-mono text-lg font-medium ${col}`}>{val}</div>
                  <div className="label text-center">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Moral final</span>
                <span className={data.finalMorale > 50 ? 'text-safe' : data.finalMorale > 25 ? 'text-warn' : 'text-danger'}>
                  {data.finalMorale}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fatiga final</span>
                <span className={data.finalFatigue < 50 ? 'text-safe' : data.finalFatigue < 75 ? 'text-warn' : 'text-danger'}>
                  {data.finalFatigue}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BattleSim() {
  const navigate   = useNavigate()
  const squads     = useStore(s => s.squads)
  const nations    = useStore(s => s.nations)
  const vehicles   = useStore(s => s.vehicles)
  const rules      = useStore(s => s.rules)
  const addBattle  = useStore(s => s.addBattle)
  const updateSquad = useStore(s => s.updateSquad)
  const addEvent   = useStore(s => s.addEvent)

  const [attackerId,  setAttackerId]  = useState('')
  const [defenderId,  setDefenderId]  = useState('')
  const [terrain,     setTerrain]     = useState('open')
  const [battleMods,  setBattleMods]  = useState([])
  const [mode,        setMode]        = useState('STANDARD')
  const [seed,        setSeed]        = useState(() => Math.random().toString(36).slice(2, 10))
  const [customSeed,  setCustomSeed]  = useState(false)
  const [simResult,   setSimResult]   = useState(null)
  const [expandedRound, setExpandedRound] = useState(null)
  const [simulating,  setSimulating]  = useState(false)
  const resultRef = useRef(null)

  const attackerSquad = squads.find(s => s.id === attackerId)
  const defenderSquad = squads.find(s => s.id === defenderId)
  const attackerNation = nations.find(n => n.id === attackerSquad?.nationId)
  const defenderNation = nations.find(n => n.id === defenderSquad?.nationId)

  const toggleMod = (mod) => setBattleMods(prev =>
    prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
  )

  const handleSimulate = () => {
    if (!attackerSquad || !defenderSquad) return
    if (attackerId === defenderId) return

    setSimulating(true)
    setTimeout(() => {
      const attackerVehicles = vehicles.filter(v => attackerSquad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
      const defenderVehicles = vehicles.filter(v => defenderSquad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')

      const result = simulateBattle({
        attackerSquad,
        defenderSquad,
        attackerVehicles,
        defenderVehicles,
        attackerNation,
        defenderNation,
        terrain,
        battleModifiers: battleMods,
        mode,
        seed,
      }, rules)

      // Persist battle
      addBattle(result)

      // Apply results back to squads
      const aResult = result.result.attacker
      const dResult = result.result.defender
      updateSquad(attackerSquad.id, {
        morale:  aResult.finalMorale,
        fatigue: aResult.finalFatigue,
        suppression: aResult.finalSuppression,
      })
      updateSquad(defenderSquad.id, {
        morale:  dResult.finalMorale,
        fatigue: dResult.finalFatigue,
        suppression: dResult.finalSuppression,
      })

      addEvent({
        type: 'BATTLE_END',
        message: `Batalla: ${attackerSquad.name} vs ${defenderSquad.name} — ${result.result.winner === 'ATTACKER' ? 'Victoria atacante' : result.result.winner === 'DEFENDER' ? 'Victoria defensor' : 'Empate'} (${result.result.reason?.replace(/_/g, ' ')})`,
        battleId: result.id,
      })

      setSimResult(result)
      setSimulating(false)
      setExpandedRound(null)
      // Auto-scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

      // New seed for next battle
      if (!customSeed) setSeed(Math.random().toString(36).slice(2, 10))
    }, 400)
  }

  const canSimulate = attackerId && defenderId && attackerId !== defenderId && !simulating

  return (
    <div>
      <PageHeader
        title="Simulador de batalla"
        subtitle="Configura los parámetros y ejecuta la simulación"
        actions={
          simResult && (
            <button className="btn-ghost text-xs" onClick={() => navigate('/battles')}>
              Ver historial →
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === LEFT: Config panel === */}
        <div className="lg:col-span-1 space-y-4">
          {/* Squad selection */}
          <div className="card">
            <div className="card-header">
              <span className="text-signal">◈</span>
              <h2 className="font-display font-semibold tracking-wide">Fuerzas</h2>
            </div>
            <div className="p-4 space-y-3">
              <FormField label="Escuadra atacante">
                <select className="select" value={attackerId} onChange={e => setAttackerId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {squads.filter(s => s.id !== defenderId).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {nations.find(n => n.id === s.nationId) ? `(${nations.find(n => n.id === s.nationId).name})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Escuadra defensora">
                <select className="select" value={defenderId} onChange={e => setDefenderId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {squads.filter(s => s.id !== attackerId).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {nations.find(n => n.id === s.nationId) ? `(${nations.find(n => n.id === s.nationId).name})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Terrain */}
          <div className="card">
            <div className="card-header">
              <span className="text-signal">◧</span>
              <h2 className="font-display font-semibold tracking-wide">Terreno</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {TERRAINS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTerrain(t.value)}
                  className={`text-left px-2 py-2 rounded text-xs transition-colors border ${
                    terrain === t.value
                      ? 'bg-signal/15 border-signal/40 text-signal'
                      : 'bg-deep-night border-border-col text-text-muted hover:border-signal/20'
                  }`}
                >
                  <div className="font-display font-medium">{t.label}</div>
                  <div className="text-stat opacity-60">{t.modifier}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Battle modifiers */}
          <div className="card">
            <div className="card-header">
              <span className="text-signal">⚡</span>
              <h2 className="font-display font-semibold tracking-wide">Modificadores</h2>
            </div>
            <div className="p-3 space-y-1">
              {BATTLE_MODS.map(m => (
                <label key={m.value} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-surface-2 px-1 rounded">
                  <input
                    type="checkbox"
                    checked={battleMods.includes(m.value)}
                    onChange={() => toggleMod(m.value)}
                    className="accent-signal"
                  />
                  <span className="text-xs text-text-primary">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mode & Seed */}
          <div className="card p-4 space-y-3">
            <FormField label="Modo de simulación">
              <div className="space-y-1">
                {MODES.map(m => (
                  <label key={m.value} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-surface-2 px-1 rounded">
                    <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="accent-signal" />
                    <div>
                      <span className="text-xs text-text-primary font-display font-semibold">{m.label}</span>
                      <span className="text-text-muted text-xs ml-2">{m.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="Semilla aleatoria">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={seed}
                  onChange={e => { setSeed(e.target.value); setCustomSeed(true) }}
                  placeholder="seed..."
                />
                <button
                  className="btn-secondary px-3"
                  onClick={() => { setSeed(Math.random().toString(36).slice(2, 10)); setCustomSeed(false) }}
                  title="Nueva semilla aleatoria"
                >↺</button>
              </div>
            </FormField>
          </div>

          {/* Simulate button */}
          <button
            onClick={handleSimulate}
            disabled={!canSimulate}
            className={`w-full btn text-base py-3 tracking-widest ${canSimulate ? 'btn-primary' : 'bg-surface border border-border-col text-text-muted cursor-not-allowed'}`}
          >
            {simulating ? '◌ Simulando...' : '⚔ Simular batalla'}
          </button>

          {attackerId === defenderId && attackerId && (
            <p className="text-danger text-xs text-center">La misma escuadra no puede combatir contra sí misma.</p>
          )}
        </div>

        {/* === RIGHT: Preview + Results === */}
        <div className="lg:col-span-2 space-y-4">
          {/* Squad previews */}
          <div className="grid grid-cols-2 gap-4">
            <SquadPreview squad={attackerSquad} vehicles={vehicles} label="ATACANTE" />
            <SquadPreview squad={defenderSquad} vehicles={vehicles} label="DEFENSOR" />
          </div>

          {/* Results */}
          {simResult && (
            <div ref={resultRef} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl tracking-wide">Resultado de batalla</h2>
                <span className="font-mono text-text-muted text-xs">seed: {simResult.seed}</span>
                <span className="font-mono text-text-muted text-xs">{simResult.mode}</span>
              </div>

              {/* Phases summary */}
              <div className="grid grid-cols-3 gap-3">
                <PhaseResult phase="DETECTION" data={{
                  resultado: simResult.phases.detection.outcome,
                  'recon atacante': simResult.phases.detection.attackerRecon,
                  'sigilo defensor': simResult.phases.detection.defenderStealth,
                }} />
                <PhaseResult phase="INITIATIVE" data={{
                  'primer turno': simResult.phases.initiative.firstMove,
                  'puntaje A': simResult.phases.initiative.attackerScore,
                  'puntaje D': simResult.phases.initiative.defenderScore,
                }} />
                <PhaseResult phase="SETUP" data={{
                  'poder A': simResult.phases.engagementSetup.attackerPower,
                  'poder D': simResult.phases.engagementSetup.defenderPower,
                  terreno: simResult.phases.engagementSetup.terrain,
                  'mod terreno': simResult.phases.engagementSetup.terrainMod,
                }} />
              </div>

              {/* Battle result banner */}
              <BattleResultBanner
                result={simResult.result}
                attackerSquad={attackerSquad}
                defenderSquad={defenderSquad}
              />

              {/* Rounds */}
              {simResult.rounds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold tracking-wide">
                      Rondas de combate ({simResult.rounds.length})
                    </h3>
                    <button
                      className="text-text-muted hover:text-signal text-xs"
                      onClick={() => setExpandedRound(expandedRound !== 'all' ? 'all' : null)}
                    >
                      {expandedRound === 'all' ? 'Colapsar todo' : 'Expandir todo'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {simResult.rounds.map(r => (
                      <RoundCard
                        key={r.roundNum}
                        round={r}
                        expanded={expandedRound === 'all' || expandedRound === r.roundNum}
                        onToggle={() => setExpandedRound(
                          expandedRound === r.roundNum ? null : r.roundNum
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!simResult && (
            <div className="card flex items-center justify-center min-h-48">
              <div className="text-center">
                <div className="text-4xl text-border-col mb-3">⚔</div>
                <p className="text-text-muted text-sm">Selecciona las escuadras y ejecuta la simulación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
