import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { simulateBattle } from '../engine/combatEngine'
import { v4 as uuid } from 'uuid'
import PageHeader from '../components/PageHeader'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'
import { useT } from '../i18n/LanguageContext'

function SquadPreview({ squad, vehicles, label, color }) {
  const { t } = useT()
  const b = t.battleSim
  if (!squad) return (
    <div className="card p-4 border-dashed flex items-center justify-center min-h-28">
      <span className="text-text-muted text-sm">{b.previewEmpty}</span>
    </div>
  )
  const squadVehicles = vehicles.filter(v => squad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-base">{squad.name}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${color}`}>{label}</span>
      </div>
      {squad.commander && <p className="text-text-muted text-xs">{b.previewCmd} {squad.commander}</p>}
      <div className="space-y-1.5">
        <StatBar label={b.statCombat}     value={squad.combat     ?? 70} />
        <StatBar label={b.statMorale}     value={squad.morale     ?? 80} />
        <StatBar label={b.statExperience} value={squad.experience ?? 60} />
        <StatBar label={b.statFatigue}    value={squad.fatigue    ?? 10} color="warn" />
      </div>
      <div className="text-xs text-text-muted border-t border-border-col/50 pt-2 flex justify-between">
        <span>{b.previewPersonnel.replace('{n}', squad.personnelIds?.length || 0)}</span>
        <span>{b.previewVehicles.replace('{n}', squadVehicles.length)}</span>
      </div>
    </div>
  )
}

function PhaseResult({ phaseLabel, data }) {
  return (
    <div className="panel">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-signal">◉</span>
        <h3 className="font-display font-semibold tracking-wide">{phaseLabel}</h3>
      </div>
      <div className="space-y-1">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center">
            <span className="label mb-0 capitalize">{k}</span>
            <span className="font-mono text-xs text-signal">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoundCard({ round, b, expanded, onToggle }) {
  const aWon = round.roundWinner === 'ATTACKER'
  const winLabel = round.roundWinner === 'DRAW' ? b.resultDraw : aWon ? b.resultWinAttacker : b.resultWinDefender
  return (
    <div className="border border-border-col rounded">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-surface-2 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-display font-semibold text-signal">{b.roundLabel.replace('{n}', round.roundNum)}</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
            round.roundWinner === 'DRAW' ? 'border-text-muted/30 text-text-muted bg-surface-2'
              : aWon ? 'border-danger/30 text-danger bg-danger/10'
              : 'border-safe/30 text-safe bg-safe/10'
          }`}>{winLabel}</span>
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
            { label: b.badgeAttacker, data: round.attacker, power: round.attackerPower, color: 'danger' },
            { label: b.badgeDefender, data: round.defender, power: round.defenderPower, color: 'safe' },
          ].map(({ label, data, power, color }) => (
            <div key={label}>
              <p className={`font-display font-semibold text-sm text-${color} mb-2`}>{label}</p>
              <div className="space-y-0.5 font-mono text-xs">
                <div className="flex justify-between"><span className="text-text-muted">{b.effectivePower}</span><span className="text-signal">{power}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{b.casualtiesKilled}</span><span className="text-danger">{data.killed}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{b.wounded}</span><span className="text-warn">{data.wounded}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{b.captured}</span><span className="text-signal">{data.captured}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{b.statMorale}</span>
                  <span className={data.moraleChange >= 0 ? 'text-safe' : 'text-danger'}>
                    {data.moraleAfter} ({data.moraleChange >= 0 ? '+' : ''}{data.moraleChange})
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-text-muted">{b.statFatigue}</span><span className="text-warn">{data.fatigueAfter}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{b.suppression}</span><span className="text-warn">{data.suppressionAfter}%</span></div>
                <div className="flex justify-between"><span className="text-text-muted">{b.active}</span><span className="text-text-primary">{data.activeCountAfter}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BattleResultBanner({ result, attackerSquad, defenderSquad, b }) {
  const { winner, reason, attacker, defender } = result
  const aWon = winner === 'ATTACKER'
  const draw  = winner === 'DRAW'
  const winLabel = draw ? b.resultDraw : aWon ? b.resultWinAttacker : b.resultWinDefender

  return (
    <div className={`rounded border p-5 ${draw ? 'border-text-muted/30 bg-surface-2' : aWon ? 'border-danger/30 bg-danger/5' : 'border-safe/30 bg-safe/5'}`}>
      <div className="text-center mb-4">
        <div className={`font-display font-bold text-3xl tracking-widest ${draw ? 'text-text-muted' : aWon ? 'text-danger' : 'text-safe'}`}>{winLabel}</div>
        <div className="text-text-muted text-xs mt-1 uppercase tracking-widest">{reason?.replace(/_/g, ' ')}</div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: attackerSquad?.name || b.badgeAttacker, data: attacker, color: 'danger' },
          { label: defenderSquad?.name || b.badgeDefender, data: defender, color: 'safe' },
        ].map(({ label, data, color }) => (
          <div key={label} className="space-y-2">
            <h4 className={`font-display font-semibold text-${color}`}>{label}</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: b.killed,    val: data.killed,    col: 'text-danger' },
                { label: b.wounded,   val: data.wounded,   col: 'text-warn' },
                { label: b.captured,  val: data.captured,  col: 'text-signal' },
                { label: b.remaining, val: data.remaining, col: 'text-text-primary' },
              ].map(({ label: l, val, col }) => (
                <div key={l} className="bg-deep-night border border-border-col/50 rounded p-2 text-center">
                  <div className={`font-mono text-lg font-medium ${col}`}>{val}</div>
                  <div className="label text-center">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">{b.finalMorale}</span>
                <span className={data.finalMorale > 50 ? 'text-safe' : data.finalMorale > 25 ? 'text-warn' : 'text-danger'}>{data.finalMorale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{b.finalFatigue}</span>
                <span className={data.finalFatigue < 50 ? 'text-safe' : data.finalFatigue < 75 ? 'text-warn' : 'text-danger'}>{data.finalFatigue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BattleSim() {
  const navigate    = useNavigate()
  const { t }       = useT()
  const b           = t.battleSim
  const squads      = useStore(s => s.squads)
  const nations     = useStore(s => s.nations)
  const vehicles    = useStore(s => s.vehicles)
  const rules       = useStore(s => s.rules)
  const addBattle   = useStore(s => s.addBattle)
  const updateSquad = useStore(s => s.updateSquad)
  const addEvent    = useStore(s => s.addEvent)

  const [attackerId,    setAttackerId]    = useState('')
  const [defenderId,    setDefenderId]    = useState('')
  const [terrain,       setTerrain]       = useState('open')
  const [battleMods,    setBattleMods]    = useState([])
  const [mode,          setMode]          = useState('STANDARD')
  const [seed,          setSeed]          = useState(() => Math.random().toString(36).slice(2, 10))
  const [customSeed,    setCustomSeed]    = useState(false)
  const [simResult,     setSimResult]     = useState(null)
  const [expandedRound, setExpandedRound] = useState(null)
  const [simulating,    setSimulating]    = useState(false)
  const resultRef = useRef(null)

  const TERRAINS = [
    { value:'open',      label: b.terrains.open,      modifier: b.terrainMods.open },
    { value:'urban',     label: b.terrains.urban,     modifier: b.terrainMods.urban },
    { value:'forest',    label: b.terrains.forest,    modifier: b.terrainMods.forest },
    { value:'mountain',  label: b.terrains.mountain,  modifier: b.terrainMods.mountain },
    { value:'desert',    label: b.terrains.desert,    modifier: b.terrainMods.desert },
    { value:'jungle',    label: b.terrains.jungle,    modifier: b.terrainMods.jungle },
    { value:'coast',     label: b.terrains.coast,     modifier: b.terrainMods.coast },
    { value:'fortified', label: b.terrains.fortified, modifier: b.terrainMods.fortified },
  ]
  const BATTLE_MODS = [
    { value:'nightOps',       label: b.battleMods.nightOps },
    { value:'heavyRain',      label: b.battleMods.heavyRain },
    { value:'airSupport',     label: b.battleMods.airSupport },
    { value:'natoLogistics',  label: b.battleMods.natoLogistics },
    { value:'encircled',      label: b.battleMods.encircled },
    { value:'surpriseAttack', label: b.battleMods.surpriseAttack },
    { value:'lowAmmo',        label: b.battleMods.lowAmmo },
    { value:'exhausted',      label: b.battleMods.exhausted },
  ]
  const MODES = [
    { value:'SIMPLE',   label: b.modes.SIMPLE.label,   desc: b.modes.SIMPLE.desc },
    { value:'STANDARD', label: b.modes.STANDARD.label, desc: b.modes.STANDARD.desc },
    { value:'DETAILED', label: b.modes.DETAILED.label, desc: b.modes.DETAILED.desc },
  ]

  const attackerSquad  = squads.find(s => s.id === attackerId)
  const defenderSquad  = squads.find(s => s.id === defenderId)
  const attackerNation = nations.find(n => n.id === attackerSquad?.nationId)
  const defenderNation = nations.find(n => n.id === defenderSquad?.nationId)

  const toggleMod = (mod) => setBattleMods(prev =>
    prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
  )

  const handleSimulate = () => {
    if (!attackerSquad || !defenderSquad || attackerId === defenderId) return
    setSimulating(true)
    setTimeout(() => {
      const aVehicles = vehicles.filter(v => attackerSquad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
      const dVehicles = vehicles.filter(v => defenderSquad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
      const result = simulateBattle({ attackerSquad, defenderSquad, attackerVehicles: aVehicles, defenderVehicles: dVehicles, attackerNation, defenderNation, terrain, battleModifiers: battleMods, mode, seed }, rules)
      addBattle(result)
      updateSquad(attackerSquad.id, { morale: result.result.attacker.finalMorale, fatigue: result.result.attacker.finalFatigue, suppression: result.result.attacker.finalSuppression })
      updateSquad(defenderSquad.id, { morale: result.result.defender.finalMorale, fatigue: result.result.defender.finalFatigue, suppression: result.result.defender.finalSuppression })
      addEvent({ type: 'BATTLE_END', message: `${attackerSquad.name} vs ${defenderSquad.name} — ${result.result.winner} (${result.result.reason?.replace(/_/g, ' ')})`, battleId: result.id })
      setSimResult(result)
      setSimulating(false)
      setExpandedRound(null)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      if (!customSeed) setSeed(Math.random().toString(36).slice(2, 10))
    }, 400)
  }

  const canSimulate = attackerId && defenderId && attackerId !== defenderId && !simulating

  return (
    <div>
      <PageHeader title={b.title} subtitle={b.subtitle}
        actions={simResult && <button className="btn-ghost text-xs" onClick={() => navigate('/battles')}>{b.btnHistory}</button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <div className="card-header"><span className="text-signal">◈</span><h2 className="font-display font-semibold tracking-wide">{b.sectionForces}</h2></div>
            <div className="p-4 space-y-3">
              <FormField label={b.labelAttacker}>
                <select className="select" value={attackerId} onChange={e => setAttackerId(e.target.value)}>
                  <option value="">{b.selectSquad}</option>
                  {squads.filter(s => s.id !== defenderId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}{nations.find(n => n.id === s.nationId) ? ` (${nations.find(n => n.id === s.nationId).name})` : ''}</option>
                  ))}
                </select>
              </FormField>
              <FormField label={b.labelDefender}>
                <select className="select" value={defenderId} onChange={e => setDefenderId(e.target.value)}>
                  <option value="">{b.selectSquad}</option>
                  {squads.filter(s => s.id !== attackerId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}{nations.find(n => n.id === s.nationId) ? ` (${nations.find(n => n.id === s.nationId).name})` : ''}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="text-signal">◧</span><h2 className="font-display font-semibold tracking-wide">{b.sectionTerrain}</h2></div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {TERRAINS.map(ter => (
                <button key={ter.value} onClick={() => setTerrain(ter.value)}
                  className={`text-left px-2 py-2 rounded text-xs transition-colors border ${terrain === ter.value ? 'bg-signal/15 border-signal/40 text-signal' : 'bg-deep-night border-border-col text-text-muted hover:border-signal/20'}`}>
                  <div className="font-display font-medium">{ter.label}</div>
                  <div className="text-stat opacity-60">{ter.modifier}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="text-signal">⚡</span><h2 className="font-display font-semibold tracking-wide">{b.sectionMods}</h2></div>
            <div className="p-3 space-y-1">
              {BATTLE_MODS.map(m => (
                <label key={m.value} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-surface-2 px-1 rounded">
                  <input type="checkbox" checked={battleMods.includes(m.value)} onChange={() => toggleMod(m.value)} className="accent-signal" />
                  <span className="text-xs text-text-primary">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <FormField label={b.labelMode}>
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
            <FormField label={b.labelSeed}>
              <div className="flex gap-2">
                <input className="input flex-1" value={seed} onChange={e => { setSeed(e.target.value); setCustomSeed(true) }} />
                <button className="btn-secondary px-3" onClick={() => { setSeed(Math.random().toString(36).slice(2, 10)); setCustomSeed(false) }}>↺</button>
              </div>
            </FormField>
          </div>

          <button onClick={handleSimulate} disabled={!canSimulate}
            className={`w-full btn text-base py-3 tracking-widest ${canSimulate ? 'btn-primary' : 'bg-surface border border-border-col text-text-muted cursor-not-allowed'}`}>
            {simulating ? b.btnSimulating : b.btnSimulate}
          </button>
          {attackerId === defenderId && attackerId && <p className="text-danger text-xs text-center">{b.sameSquadError}</p>}
        </div>

        {/* Preview + Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SquadPreview squad={attackerSquad} vehicles={vehicles} label={b.badgeAttacker} color="bg-danger/10 text-danger border-danger/30" />
            <SquadPreview squad={defenderSquad} vehicles={vehicles} label={b.badgeDefender} color="bg-safe/10 text-safe border-safe/30" />
          </div>

          {simResult && (
            <div ref={resultRef} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl tracking-wide">{b.resultTitle}</h2>
                <span className="font-mono text-text-muted text-xs">seed: {simResult.seed}</span>
                <span className="font-mono text-text-muted text-xs">{simResult.mode}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <PhaseResult phaseLabel={b.phaseDetection} data={{
                  [b.phaseOutcome]:  simResult.phases.detection.outcome,
                  [b.phaseReconA]:   simResult.phases.detection.attackerRecon,
                  [b.phaseStealthD]: simResult.phases.detection.defenderStealth,
                }} />
                <PhaseResult phaseLabel={b.phaseInitiative} data={{
                  [b.phaseFirst]:  simResult.phases.initiative.firstMove,
                  [b.phaseScoreA]: simResult.phases.initiative.attackerScore,
                  [b.phaseScoreD]: simResult.phases.initiative.defenderScore,
                }} />
                <PhaseResult phaseLabel={b.phaseSetup} data={{
                  [b.phasePowerA]:  simResult.phases.engagementSetup.attackerPower,
                  [b.phasePowerD]:  simResult.phases.engagementSetup.defenderPower,
                  [b.phaseTerrain]: simResult.phases.engagementSetup.terrain,
                  [b.phaseTMod]:    simResult.phases.engagementSetup.terrainMod,
                }} />
              </div>
              <BattleResultBanner result={simResult.result} attackerSquad={attackerSquad} defenderSquad={defenderSquad} b={b} />
              {simResult.rounds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold tracking-wide">{b.roundsTitle.replace('{n}', simResult.rounds.length)}</h3>
                    <button className="text-text-muted hover:text-signal text-xs"
                      onClick={() => setExpandedRound(expandedRound !== 'all' ? 'all' : null)}>
                      {expandedRound === 'all' ? b.collapseAll : b.expandAll}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {simResult.rounds.map(r => (
                      <RoundCard key={r.roundNum} round={r} b={b}
                        expanded={expandedRound === 'all' || expandedRound === r.roundNum}
                        onToggle={() => setExpandedRound(expandedRound === r.roundNum ? null : r.roundNum)} />
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
                <p className="text-text-muted text-sm">{b.emptyState}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
