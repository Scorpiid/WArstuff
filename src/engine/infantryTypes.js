/**
 * Infantry Unit Types catalog
 * Each type contributes stat bonuses to the parent squad when assigned.
 * unitCount × bonusPerUnit = total contribution.
 */

export const INFANTRY_CATEGORIES = {
  assault:    { label: 'Asalto',             labelEn: 'Assault',           icon: '⚔', color: 'danger' },
  support:    { label: 'Apoyo',              labelEn: 'Support',           icon: '🔫', color: 'warn'   },
  specialist: { label: 'Especialistas',      labelEn: 'Specialists',       icon: '⚙', color: 'signal' },
  medical:    { label: 'Sanitarios',         labelEn: 'Medical',           icon: '⚕', color: 'safe'   },
  recon:      { label: 'Reconocimiento',     labelEn: 'Reconnaissance',    icon: '👁', color: 'signal' },
  logistics:  { label: 'Logística',          labelEn: 'Logistics',         icon: '📦', color: 'muted'  },
}

export const INFANTRY_TYPES = [
  // ── Assault ──────────────────────────────────────────────────────────────
  {
    id: 'rifleman',
    category: 'assault',
    name: 'Fusilero',             nameEn: 'Rifleman',
    description: 'Infantería de línea estándar. Base de toda escuadra de combate.',
    descriptionEn: 'Standard line infantry. The backbone of any combat squad.',
    bonusPerUnit: { combat: 0.4, defense: 0.2 },
    minCount: 1, maxCount: 200,
  },
  {
    id: 'assault_trooper',
    category: 'assault',
    name: 'Soldado de asalto',    nameEn: 'Assault trooper',
    description: 'Especializado en combate cerrado y avance bajo fuego.',
    descriptionEn: 'Specialized in close combat and advancing under fire.',
    bonusPerUnit: { combat: 0.6, mobility: 0.2, defense: -0.1 },
    minCount: 1, maxCount: 100,
  },
  {
    id: 'paratrooper',
    category: 'assault',
    name: 'Paracaidista',         nameEn: 'Paratrooper',
    description: 'Tropa aerotransportada de élite. Alta movilidad táctica.',
    descriptionEn: 'Elite airborne troops. High tactical mobility.',
    bonusPerUnit: { combat: 0.5, mobility: 0.5, stealth: 0.2 },
    minCount: 1, maxCount: 80,
  },
  {
    id: 'ranger',
    category: 'assault',
    name: 'Ranger',               nameEn: 'Ranger',
    description: 'Infantería ligera de operaciones especiales, entrenada para misiones detrás de líneas.',
    descriptionEn: 'Light special operations infantry, trained for behind-enemy-lines missions.',
    bonusPerUnit: { combat: 0.7, stealth: 0.5, experience: 0.3 },
    minCount: 1, maxCount: 60,
  },

  // ── Support ───────────────────────────────────────────────────────────────
  {
    id: 'machine_gunner',
    category: 'support',
    name: 'Ametralladora',        nameEn: 'Machine gunner',
    description: 'Fuego de supresión sostenido. Domina sectores de tiro.',
    descriptionEn: 'Sustained suppression fire. Controls fields of fire.',
    bonusPerUnit: { combat: 0.3, defense: 0.5 },
    minCount: 1, maxCount: 30,
  },
  {
    id: 'anti_tank',
    category: 'support',
    name: 'Unidad antitanque',    nameEn: 'Anti-tank unit',
    description: 'Equipados con RPG/ATGM para neutralizar blindados enemigos.',
    descriptionEn: 'Equipped with RPGs/ATGMs to neutralize enemy armor.',
    bonusPerUnit: { combat: 0.8, defense: 0.3 },
    minCount: 1, maxCount: 40,
  },
  {
    id: 'anti_air',
    category: 'support',
    name: 'Defensa antiaérea MANPADS', nameEn: 'MANPADS anti-air',
    description: 'Misiles portátiles antiaéreos. Protección contra helicópteros y drones.',
    descriptionEn: 'Portable air defense missiles. Protection against helicopters and drones.',
    bonusPerUnit: { defense: 0.6, combat: 0.2 },
    minCount: 1, maxCount: 20,
  },
  {
    id: 'mortar_crew',
    category: 'support',
    name: 'Equipo de mortero',    nameEn: 'Mortar crew',
    description: 'Fuego indirecto orgánico. Apoya ataques sin línea visual directa.',
    descriptionEn: 'Organic indirect fire. Supports attacks without direct line of sight.',
    bonusPerUnit: { combat: 0.5, defense: 0.4 },
    minCount: 1, maxCount: 20,
  },
  {
    id: 'sniper',
    category: 'support',
    name: 'Francotirador',        nameEn: 'Sniper',
    description: 'Eliminación de objetivos de alto valor a larga distancia.',
    descriptionEn: 'High-value target elimination at long range.',
    bonusPerUnit: { combat: 0.5, stealth: 0.6, accuracy: 0.8 },
    minCount: 1, maxCount: 20,
  },

  // ── Specialists ───────────────────────────────────────────────────────────
  {
    id: 'engineer',
    category: 'specialist',
    name: 'Ingeniero de combate', nameEn: 'Combat engineer',
    description: 'Demoliciones, brechas, puentes y desminado.',
    descriptionEn: 'Demolitions, breaching, bridging, and mine clearing.',
    bonusPerUnit: { combat: 0.2, defense: 0.4, mobility: 0.3 },
    minCount: 1, maxCount: 30,
  },
  {
    id: 'demo_expert',
    category: 'specialist',
    name: 'Experto en explosivos', nameEn: 'Demolitions expert',
    description: 'Especialista en explosivos y sabotaje de infraestructura.',
    descriptionEn: 'Specialist in explosives and infrastructure sabotage.',
    bonusPerUnit: { combat: 0.6, stealth: 0.3 },
    minCount: 1, maxCount: 15,
  },
  {
    id: 'radio_operator',
    category: 'specialist',
    name: 'Operador de radio',    nameEn: 'Radio operator',
    description: 'Comunicaciones tácticas. Mejora coordinación y apoyo de fuego.',
    descriptionEn: 'Tactical communications. Improves coordination and fire support.',
    bonusPerUnit: { communications: 1.0, leadership: 0.2 },
    minCount: 1, maxCount: 10,
  },
  {
    id: 'drone_operator',
    category: 'specialist',
    name: 'Operador de drones',   nameEn: 'Drone operator',
    description: 'ISR táctica con UAVs. Detecta posiciones enemigas.',
    descriptionEn: 'Tactical ISR with UAVs. Detects enemy positions.',
    bonusPerUnit: { stealth: 0.5, combat: 0.3, communications: 0.5 },
    minCount: 1, maxCount: 10,
  },
  {
    id: 'jtac',
    category: 'specialist',
    name: 'JTAC (Control aéreo)', nameEn: 'JTAC (Air controller)',
    description: 'Dirige apoyos aéreos y artillería. Multiplicador de combate.',
    descriptionEn: 'Directs air support and artillery. Combat multiplier.',
    bonusPerUnit: { combat: 1.0, leadership: 0.5 },
    minCount: 1, maxCount: 5,
  },

  // ── Medical ───────────────────────────────────────────────────────────────
  {
    id: 'combat_medic',
    category: 'medical',
    name: 'Médico de combate',    nameEn: 'Combat medic',
    description: 'Estabiliza heridos en combate. Reduce mortalidad de bajas.',
    descriptionEn: 'Stabilizes wounded in combat. Reduces casualty mortality.',
    bonusPerUnit: { medical: 1.2, morale: 0.3 },
    minCount: 1, maxCount: 30,
  },
  {
    id: 'field_surgeon',
    category: 'medical',
    name: 'Cirujano de campo',    nameEn: 'Field surgeon',
    description: 'Cirugía avanzada en condiciones de campo. Salva vidas críticas.',
    descriptionEn: 'Advanced field surgery. Saves critically wounded.',
    bonusPerUnit: { medical: 2.0, morale: 0.5 },
    minCount: 1, maxCount: 5,
  },
  {
    id: 'stretcher_bearer',
    category: 'medical',
    name: 'Camillero',            nameEn: 'Stretcher bearer',
    description: 'Evacuación de heridos bajo fuego. Mantiene moral alta.',
    descriptionEn: 'Evacuation of wounded under fire. Keeps morale high.',
    bonusPerUnit: { medical: 0.6, morale: 0.4 },
    minCount: 1, maxCount: 20,
  },

  // ── Recon ─────────────────────────────────────────────────────────────────
  {
    id: 'scout',
    category: 'recon',
    name: 'Explorador',           nameEn: 'Scout',
    description: 'Avanzado de reconocimiento. Detecta posiciones enemigas.',
    descriptionEn: 'Forward reconnaissance. Detects enemy positions.',
    bonusPerUnit: { stealth: 0.6, mobility: 0.4, communications: 0.2 },
    minCount: 1, maxCount: 20,
  },
  {
    id: 'pathfinder',
    category: 'recon',
    name: 'Guía de vanguardia',   nameEn: 'Pathfinder',
    description: 'Abre rutas y asegura zonas de aterrizaje.',
    descriptionEn: 'Opens routes and secures landing zones.',
    bonusPerUnit: { stealth: 0.5, mobility: 0.6 },
    minCount: 1, maxCount: 10,
  },
  {
    id: 'intelligence_officer',
    category: 'recon',
    name: 'Oficial de inteligencia', nameEn: 'Intelligence officer',
    description: 'Análisis de inteligencia táctica. Mejora la toma de decisiones.',
    descriptionEn: 'Tactical intelligence analysis. Improves decision making.',
    bonusPerUnit: { stealth: 0.3, leadership: 0.8, communications: 0.4 },
    minCount: 1, maxCount: 5,
  },

  // ── Logistics ─────────────────────────────────────────────────────────────
  {
    id: 'supply_clerk',
    category: 'logistics',
    name: 'Auxiliar de suministros', nameEn: 'Supply clerk',
    description: 'Gestión de suministros y reposición de material.',
    descriptionEn: 'Supply management and material replenishment.',
    bonusPerUnit: { logistics: 0.8 },
    minCount: 1, maxCount: 20,
  },
  {
    id: 'mechanic',
    category: 'logistics',
    name: 'Mecánico de campaña',  nameEn: 'Field mechanic',
    description: 'Reparación de vehículos y equipos en campo.',
    descriptionEn: 'Vehicle and equipment repair in the field.',
    bonusPerUnit: { logistics: 0.6, mobility: 0.2 },
    minCount: 1, maxCount: 15,
  },
  {
    id: 'ammo_bearer',
    category: 'logistics',
    name: 'Portamunicional',      nameEn: 'Ammo bearer',
    description: 'Transporte y distribución de munición bajo fuego.',
    descriptionEn: 'Transport and distribution of ammunition under fire.',
    bonusPerUnit: { logistics: 0.4, combat: 0.1 },
    minCount: 1, maxCount: 30,
  },
]

/**
 * Calculate the total stat bonuses from a list of infantry units.
 * units = [{ typeId, count }]
 */
export function calcInfantryBonuses(units) {
  const totals = {
    combat: 0, accuracy: 0, defense: 0, stealth: 0,
    mobility: 0, morale: 0, medical: 0, communications: 0,
    leadership: 0, logistics: 0, experience: 0,
  }
  for (const { typeId, count } of units) {
    const def = INFANTRY_TYPES.find(t => t.id === typeId)
    if (!def || !count) continue
    for (const [stat, perUnit] of Object.entries(def.bonusPerUnit)) {
      if (totals[stat] !== undefined) totals[stat] += perUnit * count
    }
  }
  // Round and clamp 0-100
  for (const k of Object.keys(totals)) {
    totals[k] = Math.max(0, Math.min(100, Math.round(totals[k])))
  }
  return totals
}
