/**
 * Turn Engine — pure functions for applying end-of-turn effects to squads.
 * All rates are taken from rules so they stay configurable.
 */

// Default turn effects (used if rules.turnEffects is absent)
export const DEFAULT_TURN_EFFECTS = {
  // Fatigue recovery per turn (active squads not in battle)
  fatigueRecovery:   12,
  // Morale drift toward 75 (baseline), ±per turn
  moraleDriftRate:    3,
  moraleBaseline:    75,
  // Supply regeneration per turn (%)
  supplyRegen:       15,
  // Morale penalty for destroyed squads (already destroyed, no effect)
  destroyedPenalty:   0,
  // Engaged squads get less recovery
  engagedFatigueRecovery: 4,
  engagedSupplyRegen: 5,
}

/**
 * computeSquadTurnEffects(squad, effects)
 * Returns a patch object with the values after one turn.
 * Does NOT mutate the squad.
 */
export function computeSquadTurnEffects(squad, effects = DEFAULT_TURN_EFFECTS) {
  if (squad.status === 'DESTROYED') return null

  const isEngaged = squad.status === 'ENGAGED'

  // Fatigue recovery
  const fatRecovery = isEngaged ? effects.engagedFatigueRecovery : effects.fatigueRecovery
  const newFatigue  = Math.max(0, (squad.fatigue ?? 10) - fatRecovery)

  // Morale drift
  const morale    = squad.morale ?? 75
  const baseline  = effects.moraleBaseline
  const driftRate = effects.moraleDriftRate
  let newMorale   = morale
  if (morale < baseline) newMorale = Math.min(baseline, morale + driftRate)
  else if (morale > baseline) newMorale = Math.max(baseline, morale - driftRate)

  // Supply regen
  const supplyRegen = isEngaged ? effects.engagedSupplyRegen : effects.supplyRegen
  const clamp = (v) => Math.min(100, (v ?? 100) + supplyRegen)

  return {
    fatigue:     Math.round(newFatigue),
    morale:      Math.round(newMorale),
    ammo:        clamp(squad.ammo),
    medSupplies: clamp(squad.medSupplies),
    fuel:        clamp(squad.fuel),
    commsEquip:  clamp(squad.commsEquip),
  }
}
