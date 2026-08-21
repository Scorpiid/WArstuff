import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { simulateBattle } from '../engine/combatEngine'
import PageHeader from '../components/PageHeader'
import FormField from '../components/FormField'
import StatBar from '../components/StatBar'
import { useT } from '../i18n/LanguageContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const modColor = (val) => {
  if (val > 1) return 'text-safe'
  if (val < 1) return 'text-danger'
  return 'text-text-muted'
}
const modLabel = (val, lang) => {
  const pct = Math.round((val - 1) * 100)
  if (pct === 0) return lang === 'en' ? 'Neutral' : 'Neutro'
  return `${pct > 0 ? '+' : ''}${pct}%`
}

// ─── Squad preview card ───────────────────────────────────────────────────────
function SquadPreview({ squad, vehicles, label, color, rules, lang }) {
  const { t } = useT()
  const b = t.battleSim
  if (!squad) return (
    <div className="card p-4 border-dashed flex items-center justify-center min-h-28">
      <span className="text-text-muted text-sm">{b.previewEmpty}</span>
    </div>
  )
  const squadVehicles = vehicles.filter(v => squad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')

  const warnings = []
  if ((squad.fatigue ?? 0) > 70)  warnings.push({ icon: '😴', text: lang === 'en' ? 'High fatigue' : 'Alta fatiga' })
  if ((squad.morale  ?? 80) < 40) warnings.push({ icon: '💔', text: lang === 'en' ? 'Low morale' : 'Baja moral' })
  if ((squad.ammo    ?? 100) < 30) warnings.push({ icon: '📦', text: lang === 'en' ? 'Low ammo' : 'Munición escasa' })
  if ((squad.squadSize ?? 0) === 0) warnings.push({ icon: '☠', text: lang === 'en' ? 'No effectives!' : '¡Sin efectivos!' })

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-base">{squad.name}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${color}`}>{label}</span>
      </div>
      {squad.commander && <p className="text-text-muted text-xs">{b.previewCmd} {squad.commander}</p>}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {warnings.map(w => (
            <span key={w.text} className="text-stat px-1.5 py-0.5 bg-warn/10 border border-warn/30 text-warn rounded font-mono">
              {w.icon} {w.text}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <StatBar label={b.statCombat}     value={squad.combat     ?? 70} />
        <StatBar label={b.statMorale}     value={squad.morale     ?? 80} />
        <StatBar label={b.statExperience} value={squad.experience ?? 60} />
        <StatBar label={b.statFatigue}    value={squad.fatigue    ?? 10} color="warn" />
      </div>
      <div className="text-xs text-text-muted border-t border-border-col/50 pt-2 flex justify-between">
        <span>{b.previewPersonnel.replace('{n}', squad.squadSize ?? 0)}</span>
        <span>{b.previewVehicles.replace('{n}', squadVehicles.length)}</span>
      </div>
    </div>
  )
}

// ─── Phase cards ──────────────────────────────────────────────────────────────
function PhaseCard({ icon, title, rows, highlight }) {
  const outcomeColors = {
    AMBUSH:      'text-danger',
    NO_CONTACT:  'text-text-muted',
    PARTIAL:     'text-warn',
    FULL:        'text-safe',
    ATTACKER:    'text-danger',
    DEFENDER:    'text-safe',
    DRAW:        'text-text-muted',
  }
  return (
    <div className="panel space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-signal text-base">{icon}</span>
        <h3 className="font-display font-semibold text-sm tracking-wide">{title}</h3>
      </div>
      {highlight && (
        <div className={`font-display font-bold text-lg tracking-widest text-center py-1 ${outcomeColors[highlight] || 'text-signal'}`}>
          {highlight.replace(/_/g, ' ')}
        </div>
      )}
      <div className="space-y-1">
        {rows.map(([k, v, color]) => (
          <div key={k} className="flex justify-between items-center">
            <span className="label mb-0 text-xs">{k}</span>
            <span className={`font-mono text-xs font-medium ${color || 'text-signal'}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Active modifier chips ────────────────────────────────────────────────────
function ActiveModChips({ mods, modDefs, rules, lang }) {
  if (mods.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {mods.map(m => {
        const def = modDefs.find(d => d.value === m)
        if (!def) return null
        const ruleVal = rules.battleModifiers[m] ?? 1
        const pct = Math.round((ruleVal - 1) * 100)
        return (
          <div key={m} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${pct >= 0 ? 'bg-safe/10 border-safe/30' : 'bg-danger/10 border-danger/30'}`}>
            <span className={pct >= 0 ? 'text-safe' : 'text-danger'}>{pct > 0 ? '+' : ''}{pct}%</span>
            <span className="text-text-primary font-display font-medium">{def.label}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{def.effect}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Round card ───────────────────────────────────────────────────────────────
function RoundCard({ round, b, expanded, onToggle }) {
  const aWon = round.roundWinner === 'ATTACKER'
  const isDraw = round.roundWinner === 'DRAW'

  return (
    <div className="border border-border-col rounded overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors"
      >
        {/* Round number */}
        <span className="font-display font-bold text-signal w-16 shrink-0">
          {b.roundLabel.replace('{n}', round.roundNum)}
        </span>

        {/* Winner badge */}
        <span className={`text-xs font-mono px-2 py-0.5 rounded border shrink-0 ${
          isDraw ? 'border-text-muted/30 text-text-muted bg-surface-2'
          : aWon  ? 'border-danger/30 text-danger bg-danger/10'
          :         'border-safe/30 text-safe bg-safe/10'
        }`}>
          {isDraw ? b.resultDraw : aWon ? b.badgeAttacker : b.badgeDefender}
        </span>

        {/* Inline casualty summary */}
        <div className="flex gap-3 text-xs font-mono flex-1">
          <span className="text-danger">
            A: <span className="text-danger">☠{round.attacker.killed}</span>
            {' '}<span className="text-warn">⚕{round.attacker.wounded}</span>
          </span>
          <span className="text-text-muted">|</span>
          <span className="text-safe">
            D: <span className="text-danger">☠{round.defender.killed}</span>
            {' '}<span className="text-warn">⚕{round.defender.wounded}</span>
          </span>
        </div>

        {/* Power comparison bar */}
        <div className="flex items-center gap-1 shrink-0 w-28">
          <span className="font-mono text-stat text-danger">{round.attackerPower}</span>
          <div className="flex-1 h-1.5 bg-border-col rounded overflow-hidden">
            <div
              className={`h-1.5 ${aWon ? 'bg-danger' : 'bg-safe'}`}
              style={{ width: `${Math.round((round.attackerPower / (round.attackerPower + round.defenderPower)) * 100)}%` }}
            />
          </div>
          <span className="font-mono text-stat text-safe">{round.defenderPower}</span>
        </div>

        <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-border-col/50 grid grid-cols-2 gap-0 divide-x divide-border-col/50">
          {[
            { label: b.badgeAttacker, data: round.attacker, power: round.attackerPower, col: 'danger' },
            { label: b.badgeDefender, data: round.defender, power: round.defenderPower, col: 'safe' },
          ].map(({ label, data, power, col }) => (
            <div key={label} className="p-3 space-y-1.5">
              <p className={`font-display font-semibold text-xs text-${col} mb-2 uppercase tracking-widest`}>{label}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs">
                {[
                  [b.effectivePower,    power,               'text-signal'],
                  [b.active,            data.activeCountAfter,'text-text-primary'],
                  [b.casualtiesKilled,  data.killed,          'text-danger'],
                  [b.wounded,           data.wounded,         'text-warn'],
                  [b.captured,          data.captured,        'text-signal'],
                  [b.statMorale,        `${data.moraleAfter} (${data.moraleChange >= 0 ? '+' : ''}${data.moraleChange})`,
                    data.moraleChange >= 0 ? 'text-safe' : 'text-danger'],
                  [b.statFatigue,       data.fatigueAfter,    'text-warn'],
                  [b.suppression,       `${data.suppressionAfter}%`, 'text-warn'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between col-span-1">
                    <span className="text-text-muted">{k}</span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Battle result banner ─────────────────────────────────────────────────────
function BattleResultBanner({ result, attackerSquad, defenderSquad, b, lang }) {
  const { winner, reason, attacker, defender } = result
  const aWon = winner === 'ATTACKER'
  const draw = winner === 'DRAW'
  const winLabel = draw ? b.resultDraw : aWon ? b.resultWinAttacker : b.resultWinDefender

  const SizeDiff = ({ before, after }) => {
    if (before == null) return null
    const diff = after - before
    return (
      <div className="flex items-center gap-1 text-xs font-mono">
        <span className="text-text-muted">{before}</span>
        <span className="text-text-muted">→</span>
        <span className={diff < 0 ? 'text-danger' : 'text-safe'}>{after}</span>
        <span className={diff < 0 ? 'text-danger' : 'text-safe'}>({diff})</span>
      </div>
    )
  }

  return (
    <div className={`rounded border overflow-hidden ${
      draw ? 'border-text-muted/30' : aWon ? 'border-danger/40' : 'border-safe/40'
    }`}>
      {/* Banner header */}
      <div className={`px-5 py-3 text-center ${
        draw ? 'bg-surface-2' : aWon ? 'bg-danger/10' : 'bg-safe/10'
      }`}>
        <div className={`font-display font-bold text-2xl tracking-widest ${
          draw ? 'text-text-muted' : aWon ? 'text-danger' : 'text-safe'
        }`}>{winLabel}</div>
        <div className="text-text-muted text-xs mt-0.5 uppercase tracking-widest">
          {reason?.replace(/_/g, ' ')} · {result.totalRounds} {lang === 'en' ? 'rounds' : 'rondas'}
        </div>
      </div>

      {/* Casualty grid */}
      <div className="grid grid-cols-2 divide-x divide-border-col">
        {[
          { label: attackerSquad?.name || b.badgeAttacker, data: attacker, color: 'danger',
            squad: attackerSquad },
          { label: defenderSquad?.name || b.badgeDefender, data: defender, color: 'safe',
            squad: defenderSquad },
        ].map(({ label, data, color, squad }) => (
          <div key={label} className="p-4 space-y-3">
            <h4 className={`font-display font-semibold text-sm text-${color}`}>{label}</h4>

            {/* 2×2 big stat boxes */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: b.killed,    val: data.killed,    col: 'text-danger' },
                { label: b.wounded,   val: data.wounded,   col: 'text-warn'   },
                { label: b.captured,  val: data.captured,  col: 'text-signal' },
                { label: b.remaining, val: data.remaining, col: 'text-text-primary' },
              ].map(({ label: l, val, col }) => (
                <div key={l} className="bg-deep-night border border-border-col/40 rounded p-2 text-center">
                  <div className={`font-mono text-xl font-semibold ${col}`}>{val}</div>
                  <div className="label text-center text-stat">{l}</div>
                </div>
              ))}
            </div>

            {/* Stat changes */}
            <div className="space-y-1 text-xs font-mono border-t border-border-col/40 pt-2">
              <div className="flex justify-between">
                <span className="text-text-muted">{b.finalMorale}</span>
                <span className={data.finalMorale > 50 ? 'text-safe' : data.finalMorale > 25 ? 'text-warn' : 'text-danger'}>
                  {data.finalMorale}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{b.finalFatigue}</span>
                <span className={data.finalFatigue < 50 ? 'text-safe' : data.finalFatigue < 75 ? 'text-warn' : 'text-danger'}>
                  {data.finalFatigue}
                </span>
              </div>
              {squad && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{lang === 'en' ? 'Squad size' : 'Efectivos'}</span>
                  <SizeDiff
                    before={(squad.squadSize ?? 0) + data.killed + data.captured}
                    after={Math.max(0, (squad.squadSize ?? 0))}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BattleSim() {
  const navigate    = useNavigate()
  const { t, lang } = useT()
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
    { value:'open',      label: b.terrains.open,      modifier: b.terrainMods.open,
      effect: lang === 'en' ? 'Open field, attacker advantage' : 'Campo abierto, ventaja atacante' },
    { value:'urban',     label: b.terrains.urban,     modifier: b.terrainMods.urban,
      effect: lang === 'en' ? 'Street fighting, cover for defenders' : 'Combate urbano, cobertura defensora' },
    { value:'forest',    label: b.terrains.forest,    modifier: b.terrainMods.forest,
      effect: lang === 'en' ? 'Limited visibility, stealth favored' : 'Visibilidad limitada, sigilo favorecido' },
    { value:'mountain',  label: b.terrains.mountain,  modifier: b.terrainMods.mountain,
      effect: lang === 'en' ? 'High ground, defenders hold advantage' : 'Terreno elevado, ventaja defensora' },
    { value:'desert',    label: b.terrains.desert,    modifier: b.terrainMods.desert,
      effect: lang === 'en' ? 'Open terrain, neutral conditions' : 'Terreno abierto, condiciones neutras' },
    { value:'jungle',    label: b.terrains.jungle,    modifier: b.terrainMods.jungle,
      effect: lang === 'en' ? 'Dense cover, major attacker penalty' : 'Cobertura densa, penalidad al atacante' },
    { value:'coast',     label: b.terrains.coast,     modifier: b.terrainMods.coast,
      effect: lang === 'en' ? 'Amphibious conditions, slight penalty' : 'Condiciones anfibias, ligera penalidad' },
    { value:'fortified', label: b.terrains.fortified, modifier: b.terrainMods.fortified,
      effect: lang === 'en' ? 'Heavy fortifications, strong defense' : 'Fortif. pesadas, defensa fuerte' },
  ]

  const BATTLE_MODS = [
    { value:'nightOps',       label: b.battleMods.nightOps,
      effect: lang === 'en' ? 'Reduced accuracy, stealth matters more' : 'Precisión reducida, sigilo más relevante',
      icon: '🌙' },
    { value:'heavyRain',      label: b.battleMods.heavyRain,
      effect: lang === 'en' ? 'Visibility cut, mobility reduced' : 'Visibilidad reducida, movilidad afectada',
      icon: '🌧' },
    { value:'airSupport',     label: b.battleMods.airSupport,
      effect: lang === 'en' ? 'Attacker gains +25% combat power' : 'Atacante gana +25% poder de combate',
      icon: '✈' },
    { value:'natoLogistics',  label: b.battleMods.natoLogistics,
      effect: lang === 'en' ? '+10% supply efficiency for attacker' : '+10% eficiencia logística atacante',
      icon: '📦' },
    { value:'encircled',      label: b.battleMods.encircled,
      effect: lang === 'en' ? 'Attacker −30% combat power' : 'Atacante −30% poder de combate',
      icon: '🔄' },
    { value:'surpriseAttack', label: b.battleMods.surpriseAttack,
      effect: lang === 'en' ? '+20% attacker, defender loses initiative' : '+20% atacante, defensor pierde iniciativa',
      icon: '⚡' },
    { value:'lowAmmo',        label: b.battleMods.lowAmmo,
      effect: lang === 'en' ? '−25% combat power both sides' : '−25% poder de combate ambos bandos',
      icon: '📭' },
    { value:'exhausted',      label: b.battleMods.exhausted,
      effect: lang === 'en' ? '−20% combat power, morale hit' : '−20% poder combate, golpe a moral',
      icon: '😮‍💨' },
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
  const currentTerrain = TERRAINS.find(t => t.value === terrain)

  const toggleMod = (mod) => setBattleMods(prev =>
    prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
  )

  const handleSimulate = () => {
    if (!attackerSquad || !defenderSquad || attackerId === defenderId) return
    setSimulating(true)
    setTimeout(() => {
      const aVehicles = vehicles.filter(v => attackerSquad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
      const dVehicles = vehicles.filter(v => defenderSquad.vehicleIds?.includes(v.id) && v.status !== 'DESTROYED')
      const result = simulateBattle({
        attackerSquad, defenderSquad,
        attackerVehicles: aVehicles, defenderVehicles: dVehicles,
        attackerNation, defenderNation,
        terrain, battleModifiers: battleMods, mode, seed,
      }, rules)

      addBattle(result)

      const aRes = result.result.attacker
      const dRes = result.result.defender
      updateSquad(attackerSquad.id, {
        morale:      aRes.finalMorale,
        fatigue:     aRes.finalFatigue,
        suppression: aRes.finalSuppression,
        squadSize:   Math.max(0, (attackerSquad.squadSize ?? 0) - aRes.killed - aRes.captured),
      })
      updateSquad(defenderSquad.id, {
        morale:      dRes.finalMorale,
        fatigue:     dRes.finalFatigue,
        suppression: dRes.finalSuppression,
        squadSize:   Math.max(0, (defenderSquad.squadSize ?? 0) - dRes.killed - dRes.captured),
      })
      addEvent({
        type: 'BATTLE_END',
        message: `${attackerSquad.name} vs ${defenderSquad.name} — ${result.result.winner} (${result.result.reason?.replace(/_/g, ' ')})`,
        battleId: result.id,
      })

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
      <PageHeader
        title={b.title}
        subtitle={b.subtitle}
        actions={simResult && (
          <button className="btn-ghost text-xs" onClick={() => navigate('/battles')}>{b.btnHistory}</button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: config panel ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Forces */}
          <div className="card">
            <div className="card-header">
              <span className="text-signal">⚔</span>
              <h2 className="font-display font-semibold tracking-wide">{b.sectionForces}</h2>
            </div>
            <div className="p-4 space-y-3">
              <FormField label={b.labelAttacker}>
                <select className="select" value={attackerId} onChange={e => setAttackerId(e.target.value)}>
                  <option value="">{b.selectSquad}</option>
                  {squads.filter(s => s.id !== defenderId).map(s => {
                    const n = nations.find(n => n.id === s.nationId)
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name}{n ? ` (${n.name})` : ''} — {s.squadSize ?? 0} {lang === 'en' ? 'men' : 'ef.'}
                      </option>
                    )
                  })}
                </select>
              </FormField>
              <FormField label={b.labelDefender}>
                <select className="select" value={defenderId} onChange={e => setDefenderId(e.target.value)}>
                  <option value="">{b.selectSquad}</option>
                  {squads.filter(s => s.id !== attackerId).map(s => {
                    const n = nations.find(n => n.id === s.nationId)
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name}{n ? ` (${n.name})` : ''} — {s.squadSize ?? 0} {lang === 'en' ? 'men' : 'ef.'}
                      </option>
                    )
                  })}
                </select>
              </FormField>
            </div>
          </div>

          {/* Terrain — now shows effect description */}
          <div className="card">
            <div className="card-header">
              <span className="text-signal">◧</span>
              <h2 className="font-display font-semibold tracking-wide">{b.sectionTerrain}</h2>
              {currentTerrain && (
                <span className={`ml-auto font-mono text-xs font-semibold ${modColor(rules.terrainModifiers[terrain] ?? 1)}`}>
                  {modLabel(rules.terrainModifiers[terrain] ?? 1, lang)}
                </span>
              )}
            </div>
            {/* Selected terrain effect banner */}
            {currentTerrain && (
              <div className="px-3 pt-2 pb-1">
                <div className="text-xs text-text-muted bg-surface-2 rounded px-2 py-1.5 border border-border-col">
                  <span className="text-signal font-display font-semibold">{currentTerrain.label}: </span>
                  {currentTerrain.effect}
                </div>
              </div>
            )}
            <div className="p-3 grid grid-cols-2 gap-1">
              {TERRAINS.map(ter => {
                const tMod = rules.terrainModifiers[ter.value] ?? 1
                return (
                  <button
                    key={ter.value}
                    type="button"
                    onClick={() => setTerrain(ter.value)}
                    className={`text-left px-2 py-2 rounded text-xs transition-colors border ${
                      terrain === ter.value
                        ? 'bg-signal/15 border-signal/40 text-signal'
                        : 'bg-deep-night border-border-col text-text-muted hover:border-signal/20'
                    }`}
                  >
                    <div className="font-display font-medium">{ter.label}</div>
                    <div className={`text-stat font-mono ${modColor(tMod)}`}>{modLabel(tMod, lang)}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Battle modifiers — now with effect + icon */}
          <div className="card">
            <div className="card-header">
              <span className="text-signal">⚡</span>
              <h2 className="font-display font-semibold tracking-wide">{b.sectionMods}</h2>
              {battleMods.length > 0 && (
                <span className="ml-auto font-mono text-xs text-signal">{battleMods.length} active</span>
              )}
            </div>
            <div className="p-3 space-y-1">
              {BATTLE_MODS.map(m => {
                const isOn  = battleMods.includes(m.value)
                const rVal  = rules.battleModifiers[m.value] ?? 1
                const pct   = Math.round((rVal - 1) * 100)
                return (
                  <label
                    key={m.value}
                    className={`flex items-start gap-2 cursor-pointer px-2 py-1.5 rounded transition-colors border ${
                      isOn
                        ? 'bg-signal/5 border-signal/20'
                        : 'border-transparent hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleMod(m.value)}
                      className="accent-signal mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span>{m.icon}</span>
                        <span className="text-xs text-text-primary font-display font-semibold">{m.label}</span>
                        <span className={`ml-auto font-mono text-xs font-bold ${modColor(rVal)}`}>
                          {pct !== 0 ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}
                        </span>
                      </div>
                      <div className="text-text-muted text-stat mt-0.5 leading-tight">{m.effect}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Mode + seed */}
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
                <input className="input flex-1 font-mono" value={seed}
                  onChange={e => { setSeed(e.target.value); setCustomSeed(true) }} />
                <button type="button" className="btn-secondary px-3"
                  onClick={() => { setSeed(Math.random().toString(36).slice(2, 10)); setCustomSeed(false) }}>↺</button>
              </div>
            </FormField>
          </div>

          {/* Active mods summary */}
          {battleMods.length > 0 && (
            <div className="card p-3">
              <p className="label mb-2">{lang === 'en' ? 'Active modifiers' : 'Modificadores activos'}</p>
              <ActiveModChips mods={battleMods} modDefs={BATTLE_MODS} rules={rules} lang={lang} />
            </div>
          )}

          {/* Simulate button */}
          <button
            type="button"
            onClick={handleSimulate}
            disabled={!canSimulate}
            className={`w-full btn text-base py-3 tracking-widest ${
              canSimulate
                ? 'btn-primary'
                : 'bg-surface border border-border-col text-text-muted cursor-not-allowed'
            }`}
          >
            {simulating ? b.btnSimulating : b.btnSimulate}
          </button>
          {attackerId === defenderId && attackerId && (
            <p className="text-danger text-xs text-center">{b.sameSquadError}</p>
          )}
        </div>

        {/* ── RIGHT: preview + results ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Squad previews */}
          <div className="grid grid-cols-2 gap-4">
            <SquadPreview squad={attackerSquad} vehicles={vehicles} label={b.badgeAttacker}
              color="bg-danger/10 text-danger border-danger/30" rules={rules} lang={lang} />
            <SquadPreview squad={defenderSquad} vehicles={vehicles} label={b.badgeDefender}
              color="bg-safe/10 text-safe border-safe/30" rules={rules} lang={lang} />
          </div>

          {/* Results */}
          {simResult ? (
            <div ref={resultRef} className="space-y-4">

              {/* Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display font-bold text-xl tracking-wide">{b.resultTitle}</h2>
                <span className="font-mono text-text-muted text-xs bg-surface border border-border-col rounded px-2 py-0.5">
                  seed: {simResult.seed}
                </span>
                <span className="font-mono text-text-muted text-xs bg-surface border border-border-col rounded px-2 py-0.5">
                  {simResult.mode}
                </span>
              </div>

              {/* 3 phase cards */}
              <div className="grid grid-cols-3 gap-3">
                <PhaseCard
                  icon="👁"
                  title={b.phaseDetection}
                  highlight={simResult.phases.detection.outcome}
                  rows={[
                    [b.phaseReconA,   simResult.phases.detection.attackerRecon,   'text-danger'],
                    [b.phaseStealthD, simResult.phases.detection.defenderStealth, 'text-safe'],
                  ]}
                />
                <PhaseCard
                  icon="⚡"
                  title={b.phaseInitiative}
                  highlight={simResult.phases.initiative.firstMove}
                  rows={[
                    [b.phaseScoreA, simResult.phases.initiative.attackerScore, 'text-danger'],
                    [b.phaseScoreD, simResult.phases.initiative.defenderScore, 'text-safe'],
                  ]}
                />
                <PhaseCard
                  icon="⚔"
                  title={b.phaseSetup}
                  rows={[
                    [b.phasePowerA, simResult.phases.engagementSetup.attackerPower, 'text-danger'],
                    [b.phasePowerD, simResult.phases.engagementSetup.defenderPower, 'text-safe'],
                    [b.phaseTMod,   `×${simResult.phases.engagementSetup.terrainMod}`,
                      modColor(simResult.phases.engagementSetup.terrainMod)],
                  ]}
                />
              </div>

              {/* Result banner */}
              <BattleResultBanner
                result={simResult.result}
                attackerSquad={attackerSquad}
                defenderSquad={defenderSquad}
                b={b}
                lang={lang}
              />

              {/* Rounds */}
              {simResult.rounds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold tracking-wide">
                      {b.roundsTitle.replace('{n}', simResult.rounds.length)}
                    </h3>
                    <button
                      type="button"
                      className="text-text-muted hover:text-signal text-xs"
                      onClick={() => setExpandedRound(expandedRound !== 'all' ? 'all' : null)}
                    >
                      {expandedRound === 'all' ? b.collapseAll : b.expandAll}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {simResult.rounds.map(r => (
                      <RoundCard
                        key={r.roundNum}
                        round={r}
                        b={b}
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
          ) : (
            <div className="card flex items-center justify-center min-h-52">
              <div className="text-center space-y-2">
                <div className="text-5xl text-border-col">⚔</div>
                <p className="text-text-muted text-sm">{b.emptyState}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
