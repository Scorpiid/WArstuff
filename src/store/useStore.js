import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import { DEFAULT_RULES } from './initialRules'

// ─── Helper ────────────────────────────────────────────────────────────────
const ts = () => new Date().toISOString()

// ─── Default squad stats ───────────────────────────────────────────────────
export const defaultSquadStats = () => ({
  training:       70,
  morale:         80,
  experience:     60,
  fatigue:        10,
  readiness:      90,
  combat:         70,
  stealth:        60,
  mobility:       70,
  medical:        50,
  communications: 70,
  leadership:     65,
  logistics:      60,
  accuracy:       70,
  defense:        65,
  suppression:    0,
  // Supply
  ammo:           100,
  medSupplies:    100,
  fuel:           100,
  commsEquip:     100,
})

// ─── Active personnel count helper ────────────────────────────────────────
// Returns count of ACTIVE personnel in a squad (used for destruction check)
function activePersonnelCount(personnel, personnelIds) {
  if (!personnelIds || personnelIds.length === 0) return null // null = no personnel tracked
  return personnel.filter(p => personnelIds.includes(p.id) && p.status === 'ACTIVE').length
}

// ─── Store ─────────────────────────────────────────────────────────────────
const useStore = create(
  immer((set, get) => ({

    // ── Meta ──────────────────────────────────────────────────────────────
    currentTurn: 1,
    campaignName: 'New Campaign',
    campaignStarted: ts(),

    setCurrentTurn: (n) => set(s => { s.currentTurn = n }),
    setCampaignName: (name) => set(s => { s.campaignName = name }),

    // ── Rules ─────────────────────────────────────────────────────────────
    rules: { ...DEFAULT_RULES },

    updateRules: (patch) => set(s => { Object.assign(s.rules, patch) }),
    updateRulesSection: (section, patch) => set(s => { Object.assign(s.rules[section], patch) }),
    resetRules: () => set(s => { s.rules = { ...DEFAULT_RULES } }),

    // ── Nations ───────────────────────────────────────────────────────────
    nations: [],

    addNation: (data) => set(s => {
      const nation = {
        id: uuid(),
        name: data.name || 'Nueva Nación',
        color: data.color || '#C8A84B',
        flag: data.flag || '',
        playerName: data.playerName || '',
        description: data.description || '',
        doctrine: data.doctrine || 'Combined Arms',
        intelligence: data.intelligence ?? 50,
        logistics: data.logistics ?? 50,
        score: 0,
        squadIds: [],
        createdAt: ts(),
      }
      s.nations.push(nation)
      get().addEvent({ type: 'NATION_CREATED', message: `Nación creada: ${nation.name}`, nationId: nation.id })
    }),

    updateNation: (id, patch) => set(s => {
      const n = s.nations.find(x => x.id === id)
      if (n) Object.assign(n, patch)
    }),

    deleteNation: (id) => set(s => {
      const nation = s.nations.find(x => x.id === id)
      if (!nation) return
      s.squads.forEach(sq => { if (sq.nationId === id) sq.nationId = null })
      s.nations = s.nations.filter(x => x.id !== id)
      get().addEvent({ type: 'NATION_DELETED', message: `Nación eliminada: ${nation.name}` })
    }),

    assignSquadToNation: (nationId, squadId) => set(s => {
      s.nations.forEach(n => { n.squadIds = n.squadIds.filter(id => id !== squadId) })
      const nation = s.nations.find(x => x.id === nationId)
      if (nation && !nation.squadIds.includes(squadId)) nation.squadIds.push(squadId)
      const squad = s.squads.find(x => x.id === squadId)
      if (squad) squad.nationId = nationId
    }),

    removeSquadFromNation: (squadId) => set(s => {
      s.nations.forEach(n => { n.squadIds = n.squadIds.filter(id => id !== squadId) })
      const squad = s.squads.find(x => x.id === squadId)
      if (squad) squad.nationId = null
    }),

    // ── Squads ────────────────────────────────────────────────────────────
    squads: [],

    addSquad: (data) => set(s => {
      const squad = {
        id: uuid(),
        name: data.name || 'Nueva Escuadra',
        nationId: data.nationId || null,
        commander: data.commander || '',
        type: data.type || 'Infantry',
        status: data.status || 'ACTIVE',
        personnelIds: [],
        vehicleIds: [],
        ...defaultSquadStats(),
        // Allow individual stat overrides from data (not nested in stats obj)
        ...(Object.fromEntries(
          Object.entries(data).filter(([k]) => k in defaultSquadStats())
        )),
        createdAt: ts(),
      }
      s.squads.push(squad)
      if (squad.nationId) {
        const nation = s.nations.find(x => x.id === squad.nationId)
        if (nation && !nation.squadIds.includes(squad.id)) nation.squadIds.push(squad.id)
      }
      get().addEvent({ type: 'SQUAD_CREATED', message: `Escuadra creada: ${squad.name}`, squadId: squad.id })
    }),

    updateSquad: (id, patch) => set(s => {
      const sq = s.squads.find(x => x.id === id)
      if (sq) Object.assign(sq, patch)
    }),

    deleteSquad: (id) => set(s => {
      const sq = s.squads.find(x => x.id === id)
      if (!sq) return
      s.nations.forEach(n => { n.squadIds = n.squadIds.filter(x => x !== id) })
      s.squads = s.squads.filter(x => x.id !== id)
      get().addEvent({ type: 'SQUAD_DELETED', message: `Escuadra eliminada: ${sq.name}` })
    }),

    // ── Personnel ─────────────────────────────────────────────────────────
    personnel: [],

    addPersonnel: (data) => set(s => {
      const p = {
        id: uuid(),
        name: data.name || 'Sin nombre',
        rank: data.rank || 'Private',
        role: data.role || 'Rifleman',
        experience: data.experience ?? 50,
        health: data.health ?? 100,
        skill: data.skill ?? 50,
        weapon: data.weapon || 'Assault Rifle',
        status: data.status || 'ACTIVE',
        squadId: data.squadId || null,
        notes: data.notes || '',
        history: [],
        createdAt: ts(),
      }
      s.personnel.push(p)
      if (p.squadId) {
        const sq = s.squads.find(x => x.id === p.squadId)
        if (sq && !sq.personnelIds.includes(p.id)) sq.personnelIds.push(p.id)
      }
    }),

    updatePersonnel: (id, patch) => set(s => {
      const p = s.personnel.find(x => x.id === id)
      if (!p) return
      const oldStatus = p.status
      Object.assign(p, patch)
      if (patch.status && patch.status !== oldStatus) {
        p.history.push({ from: oldStatus, to: patch.status, at: ts() })
      }
      // Check squad destruction after personnel status change
      if (patch.status && p.squadId) {
        const sq = s.squads.find(x => x.id === p.squadId)
        if (sq && sq.status !== 'DESTROYED') {
          const activeCount = s.personnel.filter(
            per => sq.personnelIds.includes(per.id) && per.status === 'ACTIVE'
          ).length
          if (activeCount === 0 && sq.personnelIds.length > 0) {
            sq.status = 'DESTROYED'
            get().addEvent({
              type: 'SQUAD_DESTROYED',
              message: `Escuadra destruida: ${sq.name} — sin personal activo`,
              squadId: sq.id,
            })
          }
        }
      }
    }),

    setPersonnelStatus: (id, status, note = '') => set(s => {
      const p = s.personnel.find(x => x.id === id)
      if (!p) return
      p.history.push({ from: p.status, to: status, at: ts(), note })
      p.status = status
      // Check squad destruction
      if (p.squadId) {
        const sq = s.squads.find(x => x.id === p.squadId)
        if (sq && sq.status !== 'DESTROYED') {
          const activeCount = s.personnel.filter(
            per => sq.personnelIds.includes(per.id) && per.status === 'ACTIVE'
          ).length
          if (activeCount === 0 && sq.personnelIds.length > 0) {
            sq.status = 'DESTROYED'
            get().addEvent({
              type: 'SQUAD_DESTROYED',
              message: `Escuadra destruida: ${sq.name} — sin personal activo`,
              squadId: sq.id,
            })
          }
        }
      }
    }),

    assignPersonnelToSquad: (personnelId, squadId) => set(s => {
      s.squads.forEach(sq => { sq.personnelIds = sq.personnelIds.filter(id => id !== personnelId) })
      const sq = s.squads.find(x => x.id === squadId)
      if (sq && !sq.personnelIds.includes(personnelId)) sq.personnelIds.push(personnelId)
      const p = s.personnel.find(x => x.id === personnelId)
      if (p) p.squadId = squadId
      // Revive DESTROYED squad if someone is assigned back and is ACTIVE
      if (sq && sq.status === 'DESTROYED') {
        const activeCount = s.personnel.filter(
          per => sq.personnelIds.includes(per.id) && per.status === 'ACTIVE'
        ).length
        if (activeCount > 0) sq.status = 'ACTIVE'
      }
    }),

    // ── Vehicles (land + air) ──────────────────────────────────────────────
    vehicles: [],

    addVehicle: (data) => set(s => {
      const v = {
        id: uuid(),
        name: data.name || 'Vehículo',
        category: data.category || 'LAND',  // LAND | AIR
        subtype: data.subtype || 'APC',
        // Modular components: { categoryKey: componentId }
        components: data.components || {},
        // Derived stats (calculated from components)
        armor:       data.armor       ?? 0,
        firepower:   data.firepower   ?? 0,
        mobility:    data.mobility    ?? 0,
        electronics: data.electronics ?? 0,
        range:       data.range       ?? 0,
        stealth:     data.stealth     ?? 0,
        capacity:    data.capacity    ?? 0,
        // Operational
        crewSize:   data.crewSize   ?? 2,
        health:     data.health     ?? 100,
        fuel:       data.fuel       ?? 100,
        ammo:       data.ammo       ?? 100,
        status:     data.status     || 'OPERATIONAL',
        squadId:    data.squadId    || null,
        damageLog:  [],   // [{at, component, description, healthBefore, healthAfter}]
        history:    [],   // [{from, to, at}]
        createdAt:  ts(),
      }
      s.vehicles.push(v)
      if (v.squadId) {
        const sq = s.squads.find(x => x.id === v.squadId)
        if (sq && !sq.vehicleIds.includes(v.id)) sq.vehicleIds.push(v.id)
      }
    }),

    updateVehicle: (id, patch) => set(s => {
      const v = s.vehicles.find(x => x.id === id)
      if (!v) return
      const oldStatus = v.status
      const oldHealth = v.health
      Object.assign(v, patch)
      // Log status changes
      if (patch.status && patch.status !== oldStatus) {
        v.history.push({ from: oldStatus, to: patch.status, at: ts() })
      }
      // Log damage when health decreases
      if (patch.health !== undefined && patch.health < oldHealth) {
        v.damageLog.push({
          at: ts(),
          healthBefore: oldHealth,
          healthAfter: patch.health,
          component: patch.damagedComponent || 'General',
          description: patch.damageDescription || 'Daño recibido en combate',
        })
      }
    }),

    // Record damage explicitly
    recordVehicleDamage: (id, { component, description, healthLost }) => set(s => {
      const v = s.vehicles.find(x => x.id === id)
      if (!v) return
      const newHealth = Math.max(0, v.health - (healthLost || 0))
      v.damageLog.push({
        at: ts(),
        healthBefore: v.health,
        healthAfter: newHealth,
        component: component || 'General',
        description: description || 'Daño recibido',
      })
      v.health = newHealth
      if (newHealth === 0 && v.status !== 'DESTROYED') {
        v.history.push({ from: v.status, to: 'DESTROYED', at: ts() })
        v.status = 'DESTROYED'
      }
    }),

    deleteVehicle: (id) => set(s => {
      s.squads.forEach(sq => { sq.vehicleIds = sq.vehicleIds.filter(x => x !== id) })
      s.vehicles = s.vehicles.filter(x => x.id !== id)
    }),

    assignVehicleToSquad: (vehicleId, squadId) => set(s => {
      s.squads.forEach(sq => { sq.vehicleIds = sq.vehicleIds.filter(id => id !== vehicleId) })
      const sq = s.squads.find(x => x.id === squadId)
      if (sq && !sq.vehicleIds.includes(vehicleId)) sq.vehicleIds.push(vehicleId)
      const v = s.vehicles.find(x => x.id === vehicleId)
      if (v) v.squadId = squadId
    }),

    // ── Vessels (sea) ──────────────────────────────────────────────────────
    vessels: [],

    addVessel: (data) => set(s => {
      const v = {
        id: uuid(),
        name: data.name || 'Embarcación',
        subtype: data.subtype || 'PATROL_BOAT',
        components: data.components || {},
        // Derived stats
        armor:       data.armor       ?? 0,
        firepower:   data.firepower   ?? 0,
        mobility:    data.mobility    ?? 0,
        electronics: data.electronics ?? 0,
        range:       data.range       ?? 0,
        stealth:     data.stealth     ?? 0,
        capacity:    data.capacity    ?? 0,
        // Operational
        crewSize:   data.crewSize   ?? 10,
        health:     data.health     ?? 100,
        fuel:       data.fuel       ?? 100,
        ammo:       data.ammo       ?? 100,
        status:     data.status     || 'OPERATIONAL',
        nationId:   data.nationId   || null,
        damageLog:  [],
        history:    [],
        createdAt:  ts(),
      }
      s.vessels.push(v)
      get().addEvent({
        type: 'VESSEL_CREATED',
        message: `Embarcación creada: ${v.name}`,
        nationId: v.nationId,
      })
    }),

    updateVessel: (id, patch) => set(s => {
      const v = s.vessels.find(x => x.id === id)
      if (!v) return
      const oldStatus = v.status
      const oldHealth = v.health
      Object.assign(v, patch)
      if (patch.status && patch.status !== oldStatus) {
        v.history.push({ from: oldStatus, to: patch.status, at: ts() })
      }
      if (patch.health !== undefined && patch.health < oldHealth) {
        v.damageLog.push({
          at: ts(),
          healthBefore: oldHealth,
          healthAfter: patch.health,
          component: patch.damagedComponent || 'General',
          description: patch.damageDescription || 'Daño recibido',
        })
      }
    }),

    recordVesselDamage: (id, { component, description, healthLost }) => set(s => {
      const v = s.vessels.find(x => x.id === id)
      if (!v) return
      const newHealth = Math.max(0, v.health - (healthLost || 0))
      v.damageLog.push({
        at: ts(),
        healthBefore: v.health,
        healthAfter: newHealth,
        component: component || 'General',
        description: description || 'Daño recibido',
      })
      v.health = newHealth
      if (newHealth === 0 && v.status !== 'DESTROYED') {
        v.history.push({ from: v.status, to: 'DESTROYED', at: ts() })
        v.status = 'DESTROYED'
      }
    }),

    deleteVessel: (id) => set(s => {
      s.vessels = s.vessels.filter(x => x.id !== id)
      get().addEvent({ type: 'VESSEL_DELETED', message: `Embarcación eliminada: ${id}` })
    }),

    // ── Battles ───────────────────────────────────────────────────────────
    battles: [],

    addBattle: (battle) => set(s => { s.battles.push(battle) }),

    updateBattle: (id, patch) => set(s => {
      const b = s.battles.find(x => x.id === id)
      if (b) Object.assign(b, patch)
    }),

    overrideBattle: (id, override) => set(s => {
      const b = s.battles.find(x => x.id === id)
      if (!b) return
      b.overrides = b.overrides || []
      b.overrides.push({ ...override, at: ts() })
      if (override.result) Object.assign(b.result, override.result)
      get().addEvent({
        type: 'BATTLE_OVERRIDE',
        message: `Override manual aplicado a batalla: ${b.id}`,
        battleId: id,
      })
    }),

    // ── Events / Log ──────────────────────────────────────────────────────
    events: [],

    addEvent: (data) => set(s => {
      s.events.unshift({
        id: uuid(),
        type: data.type || 'INFO',
        message: data.message || '',
        nationId: data.nationId || null,
        squadId: data.squadId || null,
        battleId: data.battleId || null,
        turn: get().currentTurn,
        at: ts(),
      })
      if (s.events.length > 1000) s.events = s.events.slice(0, 1000)
    }),

    clearEvents: () => set(s => { s.events = [] }),

    // ── Save / Load ───────────────────────────────────────────────────────
    exportCampaign: () => {
      const s = get()
      return JSON.stringify({
        version: '1.1',
        exportedAt: ts(),
        campaignName: s.campaignName,
        currentTurn: s.currentTurn,
        rules:     s.rules,
        nations:   s.nations,
        squads:    s.squads,
        personnel: s.personnel,
        vehicles:  s.vehicles,
        vessels:   s.vessels,
        battles:   s.battles,
        events:    s.events,
      }, null, 2)
    },

    importCampaign: (json) => {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json
        set(s => {
          if (data.campaignName) s.campaignName = data.campaignName
          if (data.currentTurn)  s.currentTurn  = data.currentTurn
          if (data.rules)        s.rules        = data.rules
          if (data.nations)      s.nations      = data.nations
          if (data.squads)       s.squads       = data.squads
          if (data.personnel)    s.personnel    = data.personnel
          if (data.vehicles)     s.vehicles     = data.vehicles
          if (data.vessels)      s.vessels      = data.vessels
          if (data.battles)      s.battles      = data.battles
          if (data.events)       s.events       = data.events
        })
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e.message }
      }
    },

    resetCampaign: () => set(s => {
      s.nations    = []
      s.squads     = []
      s.personnel  = []
      s.vehicles   = []
      s.vessels    = []
      s.battles    = []
      s.events     = []
      s.currentTurn = 1
      s.campaignName = 'New Campaign'
      s.rules = { ...DEFAULT_RULES }
    }),

  }))
)

export default useStore
