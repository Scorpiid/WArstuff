/**
 * Combat Engine — pure functions, no side effects, no store imports.
 * All formulas use the rules object passed as parameter.
 * seedrandom ensures reproducible results per battle seed.
 */
import seedrandom from 'seedrandom'
import { v4 as uuid } from 'uuid'

// ─── RNG ───────────────────────────────────────────────────────────────────
function makeRng(seed) {
  const rng = seedrandom(seed)
  return {
    next: () => rng(),                          // [0, 1)
    range: (min, max) => min + rng() * (max - min),
    roll: (prob) => rng() < prob,               // boolean
    int: (min, max) => Math.floor(min + rng() * (max - min + 1)),
  }
}

// ─── Stat normalizer ───────────────────────────────────────────────────────
// Converts a 0–100 stat to a 0–1 multiplier
const norm = (v) => Math.max(0, Math.min(100, v ?? 50)) / 100

// ─── Vehicle power contribution ───────────────────────────────────────────
function calcVehiclePower(vehicles, rules) {
  let power = 0
  vehicles.forEach(v => {
    if (v.status === 'DESTROYED') return
    const typeKey = v.type?.toLowerCase().replace(' ', '') || 'apc'
    power += rules.vehicleBonuses[typeKey] ?? 8
    // Scale by health and fuel
    power *= (norm(v.health) * 0.7 + 0.3)
    power *= (norm(v.fuel) * 0.5 + 0.5)
  })
  return power
}

// ─── Squad base combat power ───────────────────────────────────────────────
function calcBasePower(squad, vehicles, rules) {
  const w = rules.weights
  const fatigueMultiplier  = 1 - (norm(squad.fatigue  ?? 0) * w.fatigue)
  const trainingMultiplier = 1 - ((1 - norm(squad.training))   * w.training)
  const expMultiplier      = 1 - ((1 - norm(squad.experience)) * w.experience)
  const moraleMultiplier   = 1 - ((1 - norm(squad.morale))     * w.morale)
  const leaderMultiplier   = 1 - ((1 - norm(squad.leadership)) * w.leadership)
  const equipMultiplier    = 1 - ((1 - norm(squad.communications)) * w.equipment)

  // Suppression penalty
  const suppMultiplier = squad.suppression > rules.suppression.highThreshold
    ? (1 - rules.suppression.combatPenalty)
    : 1

  // Active personnel count
  const activeCount = squad.personnelIds?.length ?? 10
  const basePower = (squad.combat ?? 70) + activeCount * 0.5

  const vehiclePower = calcVehiclePower(vehicles, rules)

  const raw = (basePower + vehiclePower)
    * trainingMultiplier
    * expMultiplier
    * moraleMultiplier
    * fatigueMultiplier
    * leaderMultiplier
    * equipMultiplier
    * suppMultiplier

  return Math.max(1, raw)
}

// ─── Derived stats ─────────────────────────────────────────────────────────
export function calcDerivedStats(squad, vehicles = [], rules) {
  const base = calcBasePower(squad, vehicles, rules)
  return {
    combatPower:         Math.round(base),
    offensivePower:      Math.round(base * norm(squad.training ?? 70) * 1.1),
    defensivePower:      Math.round(base * norm(squad.defense ?? 65) * 1.0),
    survivalProbability: Math.round((norm(squad.health ?? 100) * 0.4 + norm(squad.morale ?? 80) * 0.3 + norm(squad.training ?? 70) * 0.3) * 100),
    moraleStability:     Math.round(norm(squad.morale ?? 80) * norm(squad.leadership ?? 65) * 100),
    suppressionResist:   Math.round((norm(squad.morale ?? 80) * 0.5 + norm(squad.training ?? 70) * 0.5) * 100),
  }
}

// ─── Phase 1: Detection ────────────────────────────────────────────────────
function resolveDetection(attacker, defender, terrain, rng) {
  const attackerRecon  = (attacker.communications ?? 70) * 0.6 + (attacker.stealth ?? 60) * 0.2 + (attacker.experience ?? 60) * 0.2
  const defenderStealth = (defender.stealth ?? 60) * 0.7 + (defender.training ?? 70) * 0.3
  const terrainStealthBonus = terrain === 'forest' || terrain === 'jungle' ? 15 : terrain === 'urban' ? 10 : 0

  const effectiveStealth = defenderStealth + terrainStealthBonus
  const diff = attackerRecon - effectiveStealth + rng.range(-10, 10)

  let outcome
  if (diff < -30) outcome = 'AMBUSH'
  else if (diff < 0) outcome = 'NO_CONTACT'
  else if (diff < 30) outcome = 'PARTIAL'
  else outcome = 'FULL'

  return { outcome, attackerRecon: Math.round(attackerRecon), defenderStealth: Math.round(effectiveStealth), diff: Math.round(diff) }
}

// ─── Phase 2: Initiative ───────────────────────────────────────────────────
function resolveInitiative(attacker, defender, detectionOutcome, rng) {
  const aScore = (attacker.leadership ?? 65) * 0.4 + (attacker.experience ?? 60) * 0.3 + (attacker.morale ?? 80) * 0.3 + rng.range(0, 20)
  const dScore = (defender.leadership ?? 65) * 0.4 + (defender.experience ?? 60) * 0.3 + (defender.morale ?? 80) * 0.3 + rng.range(0, 20)

  // Bonuses from detection
  const aBonus = detectionOutcome === 'FULL' ? 15 : detectionOutcome === 'AMBUSH' ? -20 : 0
  const dBonus = detectionOutcome === 'AMBUSH' ? 20 : 0

  const aFinal = aScore + aBonus
  const dFinal = dScore + dBonus

  return {
    attackerScore: Math.round(aFinal),
    defenderScore: Math.round(dFinal),
    firstMove: aFinal >= dFinal ? 'ATTACKER' : 'DEFENDER',
  }
}

// ─── Combat round ──────────────────────────────────────────────────────────
function resolveRound(roundNum, aState, dState, rules, rng) {
  const log = []

  const applyRandom = (power) =>
    power * rng.range(rules.randomFactorMin, rules.randomFactorMax)

  const aEffective = applyRandom(aState.power)
  const dEffective = applyRandom(dState.power)

  const total = aEffective + dEffective
  const aAdvantage = aEffective / total   // 0–1, how much attacker dominates

  // Hits: higher advantage → more hits on opponent
  const aHits = Math.round(dState.activeCount * aAdvantage * 0.35)
  const dHits = Math.round(aState.activeCount * (1 - aAdvantage) * 0.35)

  // Casualties from hits
  const calcCas = (hits, medCapability, rules) => {
    const medSave = norm(medCapability ?? 50) * rules.casualties.medicalSaveChance
    let killed = 0, wounded = 0, captured = 0

    for (let i = 0; i < hits; i++) {
      const r = rng.next()
      if (r < rules.casualties.baseKillRate * (1 - medSave)) killed++
      else if (r < rules.casualties.baseKillRate * (1 - medSave) + rules.casualties.baseWoundRate) wounded++
      else wounded++
    }
    return { killed, wounded, captured }
  }

  const aCas = calcCas(dHits, aState.squad.medical ?? 50, rules)  // attacker takes dHits
  const dCas = calcCas(aHits, dState.squad.medical ?? 50, rules)  // defender takes aHits

  // Suppression
  const aSupp = Math.max(0, aState.suppression - rules.suppression.decayPerRound + (aAdvantage < 0.5 ? rules.suppression.perRound : 0))
  const dSupp = Math.max(0, dState.suppression - rules.suppression.decayPerRound + (aAdvantage > 0.5 ? rules.suppression.perRound : 0))

  // Morale changes
  const roundWinner = aEffective >= dEffective ? 'ATTACKER' : 'DEFENDER'
  const aMoraleChange = (roundWinner === 'ATTACKER' ? rules.morale.victoryGain : -rules.morale.roundLossHit) - aCas.killed * rules.morale.casualtyHit
  const dMoraleChange = (roundWinner === 'DEFENDER' ? rules.morale.victoryGain : -rules.morale.roundLossHit) - dCas.killed * rules.morale.casualtyHit

  const newAMorale = Math.max(0, Math.min(100, aState.morale + aMoraleChange))
  const newDMorale = Math.max(0, Math.min(100, dState.morale + dMoraleChange))

  // Fatigue
  const newAFatigue = Math.min(100, aState.fatigue + rules.fatigue.perRound)
  const newDFatigue = Math.min(100, dState.fatigue + rules.fatigue.perRound)

  // Active counts after casualties
  const newAActive = Math.max(0, aState.activeCount - aCas.killed - aCas.captured)
  const newDActive = Math.max(0, dState.activeCount - dCas.killed - dCas.captured)

  log.push(`Round ${roundNum}: Attacker power ${Math.round(aEffective)} vs Defender power ${Math.round(dEffective)}`)

  return {
    roundNum,
    attackerPower: Math.round(aEffective),
    defenderPower: Math.round(dEffective),
    roundWinner,
    attacker: {
      hits: dHits,
      killed: aCas.killed,
      wounded: aCas.wounded,
      captured: aCas.captured,
      moraleAfter: Math.round(newAMorale),
      moraleChange: Math.round(aMoraleChange),
      fatigueAfter: Math.round(newAFatigue),
      suppressionAfter: Math.round(aSupp),
      activeCountAfter: newAActive,
    },
    defender: {
      hits: aHits,
      killed: dCas.killed,
      wounded: dCas.wounded,
      captured: dCas.captured,
      moraleAfter: Math.round(newDMorale),
      moraleChange: Math.round(dMoraleChange),
      fatigueAfter: Math.round(newDFatigue),
      suppressionAfter: Math.round(dSupp),
      activeCountAfter: newDActive,
    },
    log,
  }
}

// ─── Check end conditions ──────────────────────────────────────────────────
function checkEndCondition(aState, dState, rules) {
  if (aState.activeCount <= 0) return { ended: true, winner: 'DEFENDER', reason: 'ATTACKER_ELIMINATED' }
  if (dState.activeCount <= 0) return { ended: true, winner: 'ATTACKER', reason: 'DEFENDER_ELIMINATED' }
  if (aState.morale <= rules.morale.collapseThreshold) return { ended: true, winner: 'DEFENDER', reason: 'ATTACKER_SURRENDERED' }
  if (dState.morale <= rules.morale.collapseThreshold) return { ended: true, winner: 'ATTACKER', reason: 'DEFENDER_SURRENDERED' }
  if (aState.morale <= rules.morale.retreatThreshold && aState.activeCount < dState.activeCount * 0.5)
    return { ended: true, winner: 'DEFENDER', reason: 'ATTACKER_RETREATED' }
  if (dState.morale <= rules.morale.retreatThreshold && dState.activeCount < aState.activeCount * 0.5)
    return { ended: true, winner: 'ATTACKER', reason: 'DEFENDER_RETREATED' }
  return { ended: false }
}

// ─── Main simulation function ──────────────────────────────────────────────
/**
 * simulateBattle(config, rules)
 * config = {
 *   attackerSquad, defenderSquad,
 *   attackerVehicles[], defenderVehicles[],
 *   attackerNation, defenderNation,
 *   terrain, battleModifiers[], mode, seed
 * }
 */
export function simulateBattle(config, rules) {
  const seed = config.seed || uuid()
  const rng  = makeRng(seed)
  const mode = config.mode || rules.defaultMode

  const aSquad = config.attackerSquad
  const dSquad = config.defenderSquad
  const aVehicles = config.attackerVehicles || []
  const dVehicles = config.defenderVehicles || []

  // Terrain multiplier
  const terrainKey = (config.terrain || 'open').toLowerCase()
  const terrainMod = rules.terrainModifiers[terrainKey] ?? 1.0

  // Battle modifiers (array of modifier keys)
  let battleModMult = 1.0
  ;(config.battleModifiers || []).forEach(modKey => {
    const mod = rules.battleModifiers[modKey]
    if (mod) battleModMult *= mod
  })

  // ── Phase 1: Detection ──
  const detection = resolveDetection(aSquad, dSquad, terrainKey, rng)

  // ── Phase 2: Initiative ──
  const initiative = resolveInitiative(aSquad, dSquad, detection.outcome, rng)

  // ── Phase 3: Engagement Setup ──
  let aBasePower = calcBasePower(aSquad, aVehicles, rules) * terrainMod * battleModMult
  let dBasePower = calcBasePower(dSquad, dVehicles, rules)

  // Detection bonus/penalty
  if (detection.outcome === 'AMBUSH')   { dBasePower *= 1.25; aBasePower *= 0.8 }
  if (detection.outcome === 'FULL')     { aBasePower *= 1.10 }
  if (detection.outcome === 'NO_CONTACT') { aBasePower *= 0.9 }

  const engagementSetup = {
    attackerPower: Math.round(aBasePower),
    defenderPower: Math.round(dBasePower),
    terrainMod,
    battleModMult: Math.round(battleModMult * 100) / 100,
    terrain: terrainKey,
    appliedModifiers: config.battleModifiers || [],
  }

  // ── Phase 4: Combat Rounds ──
  const rounds = []
  const maxRounds = rules.maxRounds || 10

  let aState = {
    squad: aSquad,
    power: aBasePower,
    morale: aSquad.morale ?? 80,
    fatigue: aSquad.fatigue ?? 10,
    suppression: aSquad.suppression ?? 0,
    activeCount: aSquad.personnelIds?.length || 10,
  }
  let dState = {
    squad: dSquad,
    power: dBasePower,
    morale: dSquad.morale ?? 80,
    fatigue: dSquad.fatigue ?? 10,
    suppression: dSquad.suppression ?? 0,
    activeCount: dSquad.personnelIds?.length || 10,
  }

  let endCondition = { ended: false }
  let winnerRounds = { ATTACKER: 0, DEFENDER: 0 }

  for (let r = 1; r <= maxRounds; r++) {
    const roundResult = resolveRound(r, aState, dState, rules, rng)
    rounds.push(roundResult)

    // Update states
    aState = {
      ...aState,
      power: aState.power * (0.95 + roundResult.attacker.moraleChange * 0.003),
      morale: roundResult.attacker.moraleAfter,
      fatigue: roundResult.attacker.fatigueAfter,
      suppression: roundResult.attacker.suppressionAfter,
      activeCount: roundResult.attacker.activeCountAfter,
    }
    dState = {
      ...dState,
      power: dState.power * (0.95 + roundResult.defender.moraleChange * 0.003),
      morale: roundResult.defender.moraleAfter,
      fatigue: roundResult.defender.fatigueAfter,
      suppression: roundResult.defender.suppressionAfter,
      activeCount: roundResult.defender.activeCountAfter,
    }

    if (roundResult.roundWinner === 'ATTACKER') winnerRounds.ATTACKER++
    else winnerRounds.DEFENDER++

    endCondition = checkEndCondition(aState, dState, rules)
    if (endCondition.ended) break

    // SIMPLE mode: 1 round only
    if (mode === 'SIMPLE') break
  }

  // ── Final result ──
  if (!endCondition.ended) {
    // Stalemate — winner is whoever won more rounds
    if (winnerRounds.ATTACKER > winnerRounds.DEFENDER) {
      endCondition = { ended: true, winner: 'ATTACKER', reason: 'ROUNDS_MAJORITY' }
    } else if (winnerRounds.DEFENDER > winnerRounds.ATTACKER) {
      endCondition = { ended: true, winner: 'DEFENDER', reason: 'ROUNDS_MAJORITY' }
    } else {
      endCondition = { ended: true, winner: 'DRAW', reason: 'STALEMATE' }
    }
  }

  // Tally totals
  const totals = (side) => rounds.reduce((acc, r) => ({
    killed:   acc.killed   + r[side].killed,
    wounded:  acc.wounded  + r[side].wounded,
    captured: acc.captured + r[side].captured,
  }), { killed: 0, wounded: 0, captured: 0 })

  const aTotals = totals('attacker')
  const dTotals = totals('defender')

  const result = {
    id: uuid(),
    seed,
    mode,
    attackerSquadId: aSquad.id,
    defenderSquadId: dSquad.id,
    attackerNationId: config.attackerNation?.id || aSquad.nationId,
    defenderNationId: config.defenderNation?.id || dSquad.nationId,
    terrain: terrainKey,
    battleModifiers: config.battleModifiers || [],
    createdAt: new Date().toISOString(),

    phases: {
      detection,
      initiative,
      engagementSetup,
    },

    rounds,

    result: {
      winner: endCondition.winner,
      reason: endCondition.reason,
      totalRounds: rounds.length,
      attacker: {
        ...aTotals,
        remaining: aState.activeCount,
        finalMorale: Math.round(aState.morale),
        finalFatigue: Math.round(aState.fatigue),
        finalSuppression: Math.round(aState.suppression),
      },
      defender: {
        ...dTotals,
        remaining: dState.activeCount,
        finalMorale: Math.round(dState.morale),
        finalFatigue: Math.round(dState.fatigue),
        finalSuppression: Math.round(dState.suppression),
      },
    },

    overrides: [],
    status: 'COMPLETED',
  }

  return result
}
