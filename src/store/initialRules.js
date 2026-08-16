// Default combat rules — all values editable via Rules Editor
export const DEFAULT_RULES = {
  // Random factor applied to combat power
  randomFactorMin: 0.85,
  randomFactorMax: 1.15,

  // Weights for combat power formula (0–1 scale, multiplied)
  weights: {
    training:    0.15,
    experience:  0.20,
    morale:      0.15,
    fatigue:     0.10,   // inverted: high fatigue = penalty
    leadership:  0.10,
    equipment:   0.15,
    vehicle:     0.15,
  },

  // Detection thresholds (attacker recon vs defender stealth)
  detection: {
    noContact:       20,   // diff ≤ 20 → No Contact
    partial:         50,   // diff ≤ 50 → Partial Detection
    full:            80,   // diff ≤ 80 → Full Detection
    ambushThreshold: 30,   // defender stealth > attacker recon by this → Ambush
  },

  // Morale thresholds
  morale: {
    retreatThreshold:   35,  // morale below this → possible retreat
    surrenderThreshold: 15,  // morale below this → possible surrender
    collapseThreshold:  5,   // morale below this → immediate surrender
    roundLossHit:       5,   // morale lost per round lost
    casualtyHit:        3,   // morale lost per casualty
    commanderLossHit:   15,  // morale hit on commander KIA
    victoryGain:        4,   // morale gained per round won
    retreatSuccess:     8,   // morale gained on successful retreat
  },

  // Fatigue
  fatigue: {
    perRound:           4,   // fatigue gained per combat round
    highFatigueThreshold: 70, // fatigue > this → significant penalty
    highFatiguePenalty:  0.75,// multiply combat power
    restRecovery:       15,  // fatigue removed per rest action
  },

  // Casualty rates — applied to losing side
  casualties: {
    baseKillRate:       0.08,  // fraction of hits that are kills
    baseWoundRate:      0.18,  // fraction of hits that are wounds
    baseCaptureRate:    0.05,  // fraction of hits → capture (if morale broken)
    medicalSaveChance:  0.30,  // chance medic reduces kill to wound
    vehicleDestroyChance: 0.12,// chance vehicle destroyed per round
  },

  // Suppression
  suppression: {
    perRound:            15,   // suppression applied per round (losing side)
    decayPerRound:       8,    // suppression reduced per round
    highThreshold:       60,   // suppression > this → major penalty
    combatPenalty:       0.25, // effectiveness reduction at high suppression
    accuracyPenalty:     0.20,
    mobilityPenalty:     0.15,
  },

  // Terrain modifiers (multiplier on attacker power)
  terrainModifiers: {
    open:        1.10,
    urban:       0.85,
    forest:      0.90,
    mountain:    0.80,
    desert:      1.00,
    jungle:      0.75,
    coast:       0.95,
    fortified:   0.65,
  },

  // Battle modifiers
  battleModifiers: {
    nightOps:         0.85,
    heavyRain:        0.90,
    airSupport:       1.25,
    natoLogistics:    1.10,
    encircled:        0.70,
    surpriseAttack:   1.20,
    lowAmmo:          0.75,
    exhausted:        0.80,
  },

  // Vehicle bonuses (flat addition to power score)
  vehicleBonuses: {
    ifv:       12,
    apc:        8,
    mbt:       20,
    recon:      6,
    artillery: 15,
    helicopter: 18,
    logistics:  4,
  },

  // Max rounds before battle ends in stalemate
  maxRounds: 10,

  // Simulation mode default
  defaultMode: 'STANDARD', // SIMPLE | STANDARD | DETAILED

  // Supply system enabled
  supplySystemEnabled: true,
}
