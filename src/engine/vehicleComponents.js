/**
 * Vehicle Components Catalog
 * Each component contributes stat bonuses to the final vehicle.
 * Stats: armor, firepower, mobility, electronics, range, crew, weight (affects mobility)
 *
 * Categories: LAND, AIR, SEA
 */

// ─── Stat display names ──────────────────────────────────────────────────────
export const VEHICLE_STATS = {
  armor:       { label: 'Blindaje',        labelEn: 'Armor',         color: 'safe',   icon: '🛡' },
  firepower:   { label: 'Potencia de fuego', labelEn: 'Firepower',   color: 'danger', icon: '🔫' },
  mobility:    { label: 'Movilidad',       labelEn: 'Mobility',      color: 'signal', icon: '⚡' },
  electronics: { label: 'Electrónica',     labelEn: 'Electronics',   color: 'signal', icon: '📡' },
  range:       { label: 'Alcance',         labelEn: 'Range',         color: 'warn',   icon: '🎯' },
  stealth:     { label: 'Sigilo',          labelEn: 'Stealth',       color: 'muted',  icon: '👁' },
  capacity:    { label: 'Capacidad',       labelEn: 'Capacity',      color: 'safe',   icon: '📦' },
}

// ─── LAND components ─────────────────────────────────────────────────────────
export const LAND_COMPONENTS = {
  // ── Armament ──
  armament: {
    label: 'Armamento', labelEn: 'Armament',
    slots: 1,
    options: [
      { id: 'mg_coaxial',    name: 'Ametralladora coaxial',     nameEn: 'Coaxial MG',          stats: { firepower: 8,  mobility: 0,  armor: 0  }, weight: 1, description: 'Arma secundaria de alto cadencia' },
      { id: 'cannon_20mm',   name: 'Cañón 20mm',                nameEn: '20mm Cannon',         stats: { firepower: 18, mobility: -2, armor: 0  }, weight: 2, description: 'Autocañón ligero antiinfantería' },
      { id: 'cannon_30mm',   name: 'Cañón 30mm',                nameEn: '30mm Cannon',         stats: { firepower: 24, mobility: -3, armor: 0  }, weight: 3, description: 'Autocañón pesado, efectivo contra blindados ligeros' },
      { id: 'cannon_105mm',  name: 'Cañón L7 105mm',            nameEn: 'L7 105mm Gun',        stats: { firepower: 42, mobility: -6, armor: 0  }, weight: 6, description: 'Cañón principal de tanques de generación anterior' },
      { id: 'cannon_120mm',  name: 'Cañón Rheinmetall 120mm',   nameEn: 'Rheinmetall 120mm',   stats: { firepower: 56, mobility: -8, armor: 0  }, weight: 8, description: 'Cañón principal MBT moderno, munición APFSDS' },
      { id: 'howitzer_152',  name: 'Obús 152mm',                nameEn: '152mm Howitzer',      stats: { firepower: 50, mobility: -10,armor: 0  }, weight: 10, description: 'Artillería directa/indirecta de gran calibre' },
      { id: 'atgm',          name: 'Lanzador ATGM',             nameEn: 'ATGM Launcher',       stats: { firepower: 35, mobility: -1, armor: 0, range: 20 }, weight: 2, description: 'Misiles guiados antitanque de largo alcance' },
      { id: 'mortar_120',    name: 'Mortero 120mm',             nameEn: '120mm Mortar',        stats: { firepower: 28, mobility: -3, armor: 0, range: 10 }, weight: 3, description: 'Fuego indirecto orgánico' },
      { id: 'mg_roof',       name: 'Ametralladora de techo',    nameEn: 'Roof-mounted MG',     stats: { firepower: 6,  mobility: 0,  armor: 0  }, weight: 1, description: 'Defensa AA y antiinfantería ligera' },
      { id: 'rws',           name: 'Estación de armas remota',  nameEn: 'Remote Weapon Station', stats: { firepower: 15, electronics: 8, armor: 0 }, weight: 2, description: 'RWS con sensor termográfico integrado' },
    ],
  },
  // ── Armor ──
  protection: {
    label: 'Protección', labelEn: 'Protection',
    slots: 1,
    options: [
      { id: 'armor_steel',   name: 'Blindaje de acero RHA',     nameEn: 'RHA Steel Armor',     stats: { armor: 20, mobility: -3  }, weight: 4, description: 'Blindaje homogéneo estándar' },
      { id: 'armor_chobham', name: 'Blindaje compuesto Chobham',nameEn: 'Chobham Composite',   stats: { armor: 38, mobility: -5  }, weight: 6, description: 'Cerámica y acero, alta protección HEAT' },
      { id: 'armor_era',     name: 'Blindaje reactivo ERA',     nameEn: 'ERA Reactive Armor',  stats: { armor: 28, mobility: -2  }, weight: 3, description: 'Explosivo reactivo, neutraliza HEAT' },
      { id: 'armor_amap',    name: 'AMAP Modular',              nameEn: 'AMAP Modular Armor',  stats: { armor: 45, mobility: -6  }, weight: 7, description: 'Sistema modular de protección avanzada' },
      { id: 'armor_slat',    name: 'Jaula anti-RPG',            nameEn: 'Slat/Cage Armor',     stats: { armor: 15, mobility: -1  }, weight: 2, description: 'Protección anti-RPG de bajo costo' },
      { id: 'armor_light',   name: 'Blindaje ligero MRAP',      nameEn: 'MRAP Light Armor',    stats: { armor: 10, mobility: 2   }, weight: 1, description: 'Ligero, optimizado para minas y IEDs' },
      { id: 'aps',           name: 'Sistema de protección activa', nameEn: 'Active Protection System', stats: { armor: 30, electronics: 12, mobility: -1 }, weight: 4, description: 'Intercepta misiles y cohetes entrantes' },
    ],
  },
  // ── Propulsion ──
  engine: {
    label: 'Motor / Propulsión', labelEn: 'Engine / Propulsion',
    slots: 1,
    options: [
      { id: 'diesel_300',    name: 'Diésel 300hp',              nameEn: '300hp Diesel',        stats: { mobility: 15, range: 5   }, weight: 3, description: 'Motor económico para vehículos ligeros' },
      { id: 'diesel_600',    name: 'Diésel 600hp',              nameEn: '600hp Diesel',        stats: { mobility: 25, range: 8   }, weight: 5, description: 'Motor medio para IFV y APC' },
      { id: 'turbodiesel_1000',name:'Turbodiesel 1000hp',       nameEn: '1000hp Turbodiesel',  stats: { mobility: 35, range: 10  }, weight: 7, description: 'Motor potente para MBT y vehículos pesados' },
      { id: 'turbine_1500',  name: 'Turbina de gas 1500hp',     nameEn: '1500hp Gas Turbine',  stats: { mobility: 45, range: 6   }, weight: 8, description: 'Alta velocidad, alto consumo de combustible' },
      { id: 'hybrid_elec',   name: 'Propulsión híbrida eléctrica', nameEn: 'Hybrid Electric Drive', stats: { mobility: 30, stealth: 15, range: 12 }, weight: 6, description: 'Silencioso, bajo consumo, operación sigilosa' },
      { id: 'engine_atv',    name: 'Motor ATV todo terreno',    nameEn: 'All-Terrain Engine',  stats: { mobility: 20, range: 15  }, weight: 4, description: 'Optimizado para terreno difícil' },
    ],
  },
  // ── Electronics ──
  electronics: {
    label: 'Electrónica / C2', labelEn: 'Electronics / C2',
    slots: 1,
    options: [
      { id: 'radio_basic',   name: 'Radio VHF básica',          nameEn: 'Basic VHF Radio',     stats: { electronics: 5  }, weight: 0, description: 'Comunicaciones de corto alcance' },
      { id: 'c2_digital',    name: 'Sistema C2 digitalizado',   nameEn: 'Digitized C2 System', stats: { electronics: 18, range: 5 }, weight: 1, description: 'Mando y control en tiempo real, intercambio de datos' },
      { id: 'fcs_basic',     name: 'Sistema de control de fuego básico', nameEn: 'Basic FCS', stats: { firepower: 8, electronics: 8 }, weight: 1, description: 'Telemetría láser y estabilizador' },
      { id: 'fcs_advanced',  name: 'FCS con visión térmica',    nameEn: 'Thermal FCS',         stats: { firepower: 15, electronics: 20, stealth: -5 }, weight: 2, description: 'Adquisición de objetivos día/noche' },
      { id: 'radar_battlefield', name: 'Radar de campo de batalla', nameEn: 'Battlefield Radar', stats: { electronics: 25, range: 15 }, weight: 3, description: 'Detección de infantería y vehículos a distancia' },
      { id: 'ecm',           name: 'Contramedidas electrónicas', nameEn: 'ECM Suite',          stats: { electronics: 20, stealth: 20 }, weight: 2, description: 'Jamming de señales y protección contra drones' },
      { id: 'drone_micro',   name: 'Dron de reconocimiento embarcado', nameEn: 'Embedded Recon Drone', stats: { electronics: 15, range: 25 }, weight: 1, description: 'Pequeño UAV lanzado desde el vehículo' },
    ],
  },
  // ── Mobility ──
  suspension: {
    label: 'Suspensión / Chasis', labelEn: 'Suspension / Chassis',
    slots: 1,
    options: [
      { id: 'tracks_standard', name: 'Orugas estándar',         nameEn: 'Standard Tracks',     stats: { mobility: 10, armor: 3   }, weight: 4, description: 'Tracción oruga clásica, todo terreno' },
      { id: 'tracks_wide',   name: 'Orugas anchas de baja presión', nameEn: 'Wide Low-Pressure Tracks', stats: { mobility: 15, armor: 2 }, weight: 5, description: 'Menor presión sobre el suelo, mejor en barro y nieve' },
      { id: 'wheels_4x4',    name: 'Ruedas 4×4',               nameEn: '4×4 Wheels',          stats: { mobility: 18, range: 8   }, weight: 2, description: 'Alta velocidad en carretera, menor en campo' },
      { id: 'wheels_8x8',    name: 'Ruedas 8×8',               nameEn: '8×8 Wheels',          stats: { mobility: 14, range: 10, capacity: 5 }, weight: 3, description: 'Gran capacidad de carga, buena movilidad estratégica' },
      { id: 'suspension_hydro', name: 'Suspensión hidro-neumática', nameEn: 'Hydropneumatic Suspension', stats: { mobility: 20, armor: 2 }, weight: 4, description: 'Altura variable, estabilización de tiro en movimiento' },
    ],
  },
  // ── Support ──
  support: {
    label: 'Equipos de apoyo', labelEn: 'Support Equipment',
    slots: 1,
    optional: true,
    options: [
      { id: 'medkit',        name: 'Kit médico de campaña',     nameEn: 'Field Medical Kit',   stats: { capacity: 8  }, weight: 1, description: 'Suministros médicos embarcados, estabilización de heridos' },
      { id: 'dozer_blade',   name: 'Hoja topadora',             nameEn: 'Dozer Blade',         stats: { armor: 5, mobility: -3 }, weight: 3, description: 'Construcción de fortines y limpieza de obstáculos' },
      { id: 'smoke_system',  name: 'Sistema de humos',          nameEn: 'Smoke System',        stats: { stealth: 18  }, weight: 1, description: 'Granadas de humo para desenganche táctico' },
      { id: 'winch',         name: 'Cabrestante',               nameEn: 'Winch',               stats: { capacity: 5  }, weight: 1, description: 'Recuperación de vehículos atascados' },
      { id: 'mineplow',      name: 'Reja minadora',             nameEn: 'Mine Plow',           stats: { armor: 8, mobility: -5 }, weight: 5, description: 'Limpieza de campos minados' },
      { id: 'fuel_pod',      name: 'Depósito de combustible adicional', nameEn: 'External Fuel Pod', stats: { range: 20, armor: -3 }, weight: 2, description: 'Amplía el rango operativo significativamente' },
      { id: 'trophy',        name: 'Sistema Trophy (APS ligero)', nameEn: 'Trophy Light APS',  stats: { armor: 22, electronics: 8, mobility: -1 }, weight: 3, description: 'Versión compacta del sistema Trophy israelí' },
    ],
  },
}

// ─── AIR components ──────────────────────────────────────────────────────────
export const AIR_COMPONENTS = {
  airframe: {
    label: 'Célula / Fuselaje', labelEn: 'Airframe',
    slots: 1,
    options: [
      { id: 'frame_light_heli',  name: 'Célula helicóptero ligero',  nameEn: 'Light Helicopter Frame',   stats: { mobility: 30, capacity: 4, armor: 2  }, weight: 3, description: 'Scout, observación, transporte ligero' },
      { id: 'frame_medium_heli', name: 'Célula helicóptero medio',   nameEn: 'Medium Helicopter Frame',  stats: { mobility: 22, capacity: 12, armor: 5 }, weight: 6, description: 'Multirrol, transporte de personal' },
      { id: 'frame_attack_heli', name: 'Célula helicóptero de ataque', nameEn: 'Attack Helicopter Frame', stats: { mobility: 25, armor: 15, firepower: 5 }, weight: 7, description: 'Diseñada para vuelo NOE y resistencia al fuego' },
      { id: 'frame_fighter',     name: 'Célula caza supersónico',    nameEn: 'Fighter Jet Frame',        stats: { mobility: 55, range: 20, armor: 8     }, weight: 8, description: 'Alta velocidad, maniobrable, bajo perfil' },
      { id: 'frame_cas',         name: 'Célula CAS / Apoyo a tierra', nameEn: 'CAS Aircraft Frame',      stats: { mobility: 30, armor: 20, capacity: 8  }, weight: 9, description: 'Reforzada contra AAA, slots de armamento múltiples' },
      { id: 'frame_drone_m',     name: 'Dron de combate MALE',       nameEn: 'MALE Combat Drone Frame',  stats: { mobility: 18, stealth: 25, range: 40  }, weight: 2, description: 'Sin tripulante, larga persistencia' },
      { id: 'frame_uav_recon',   name: 'UAV de reconocimiento',      nameEn: 'Recon UAV Frame',          stats: { mobility: 20, stealth: 30, electronics: 10, range: 35 }, weight: 1, description: 'ISR puro, sin armamento' },
    ],
  },
  propulsion_air: {
    label: 'Propulsión', labelEn: 'Propulsion',
    slots: 1,
    options: [
      { id: 'rotor_main',    name: 'Rotor principal turboshaft',  nameEn: 'Main Turboshaft Rotor',  stats: { mobility: 15, range: 8   }, weight: 4, description: 'Motor estándar de helicóptero' },
      { id: 'rotor_coaxial', name: 'Rotores coaxiales',           nameEn: 'Coaxial Rotors',         stats: { mobility: 20, stealth: 10 }, weight: 5, description: 'Sin rotor de cola, más silencioso y compacto' },
      { id: 'turbofan_low',  name: 'Turbofán subsónico',          nameEn: 'Subsonic Turbofan',      stats: { mobility: 28, range: 15  }, weight: 5, description: 'Motor de reacción para aviones subsónicos' },
      { id: 'turbofan_super',name: 'Turbofán supersónico',        nameEn: 'Supersonic Turbofan',    stats: { mobility: 50, range: 12  }, weight: 7, description: 'Alta velocidad, mayor consumo de combustible' },
      { id: 'electric_uav',  name: 'Propulsión eléctrica UAV',    nameEn: 'UAV Electric Propulsion',stats: { mobility: 12, stealth: 20, range: 20 }, weight: 1, description: 'Silencioso, bajo consumo, limitado a drones' },
      { id: 'vtol_fans',     name: 'Ventiladores VTOL',           nameEn: 'VTOL Lift Fans',         stats: { mobility: 22, capacity: 3, armor: -2  }, weight: 4, description: 'Despegue y aterrizaje vertical sin pista' },
    ],
  },
  air_armament: {
    label: 'Armamento aéreo', labelEn: 'Air Armament',
    slots: 1,
    options: [
      { id: 'gun_pod',       name: 'Pod de cañón 20mm',           nameEn: '20mm Gun Pod',           stats: { firepower: 20, mobility: -3  }, weight: 2, description: 'Cañón rotativo antiinfantería y ligero' },
      { id: 'rockets_70mm',  name: 'Cohetes no guiados 70mm',     nameEn: '70mm Unguided Rockets',  stats: { firepower: 25, range: 5      }, weight: 3, description: 'Alta densidad de fuego, menor precisión' },
      { id: 'atgm_air',      name: 'Misiles ATGM aéreos (Hellfire)', nameEn: 'Air-Launched ATGM (Hellfire)', stats: { firepower: 40, range: 20, mobility: -4 }, weight: 4, description: 'Misiles guiados láser antitanque' },
      { id: 'aa_missiles',   name: 'Misiles AA corto alcance',    nameEn: 'Short-Range AA Missiles',stats: { firepower: 30, range: 15, electronics: 8 }, weight: 3, description: 'Defensa aérea y combate AA' },
      { id: 'bombs_guided',  name: 'Bombas de precisión guiadas', nameEn: 'Precision-Guided Bombs', stats: { firepower: 50, range: 25, mobility: -5 }, weight: 6, description: 'PGM para ataque de precisión tierra' },
      { id: 'jdam',          name: 'Bombas JDAM (GPS)',           nameEn: 'JDAM GPS Bombs',         stats: { firepower: 45, range: 30, electronics: 5 }, weight: 5, description: 'Coste efectivo, precisión razonable' },
      { id: 'aam_bvr',       name: 'Misil AAM BVR (AMRAAM)',      nameEn: 'BVR AAM (AMRAAM)',       stats: { firepower: 38, range: 40, electronics: 12 }, weight: 4, description: 'Combate aire-aire más allá del alcance visual' },
    ],
  },
  avionics: {
    label: 'Aviónica / Sensores', labelEn: 'Avionics / Sensors',
    slots: 1,
    options: [
      { id: 'avionics_basic',name: 'Aviónica básica analógica',   nameEn: 'Basic Analog Avionics',  stats: { electronics: 5           }, weight: 0, description: 'Instrumentación clásica VFR' },
      { id: 'avionics_glass',name: 'Cabina de cristal digital',   nameEn: 'Glass Cockpit',          stats: { electronics: 15, mobility: 3 }, weight: 1, description: 'Pantallas MFD, autopiloto digital' },
      { id: 'radar_fire',    name: 'Radar de control de tiro',    nameEn: 'Fire Control Radar',     stats: { firepower: 12, electronics: 20, range: 15 }, weight: 2, description: 'Adquisición y seguimiento de objetivos' },
      { id: 'flir',          name: 'Sensor FLIR/IRST',            nameEn: 'FLIR/IRST Sensor',       stats: { electronics: 18, stealth: -8, range: 12 }, weight: 2, description: 'Visión infrarroja, detección pasiva' },
      { id: 'ew_suite',      name: 'Suite de guerra electrónica', nameEn: 'Electronic Warfare Suite',stats: { electronics: 25, stealth: 22 }, weight: 3, description: 'Jammers, RWR, chaff/flare automático' },
      { id: 'link16',        name: 'Data Link 16',                nameEn: 'Link 16 Data Link',      stats: { electronics: 20, range: 10 }, weight: 1, description: 'Red de datos táctica OTAN' },
    ],
  },
  countermeasures: {
    label: 'Contrame didas / Protección', labelEn: 'Countermeasures / Protection',
    slots: 1,
    optional: true,
    options: [
      { id: 'flare_auto',    name: 'Dispensador de bengalas/chaff auto', nameEn: 'Auto Flare/Chaff Dispenser', stats: { stealth: 20, armor: 5 }, weight: 1, description: 'Protección contra misiles IR y radar' },
      { id: 'armor_titanium',name: 'Blindaje titanio (cockpit)',  nameEn: 'Titanium Cockpit Armor', stats: { armor: 18, mobility: -5  }, weight: 3, description: 'Protección de tripulación contra AAA' },
      { id: 'stealth_coat',  name: 'Recubrimiento furtivo RAM',   nameEn: 'RAM Stealth Coating',    stats: { stealth: 30, armor: 2    }, weight: 2, description: 'Materiales absorbentes de radar' },
      { id: 'dircm',         name: 'DIRCM contra misiles IR',     nameEn: 'DIRCM Anti-IR System',   stats: { stealth: 15, electronics: 10, armor: 8 }, weight: 2, description: 'Láser que interfiere sensores de misiles' },
    ],
  },
}

// ─── SEA components ──────────────────────────────────────────────────────────
export const SEA_COMPONENTS = {
  hull: {
    label: 'Casco', labelEn: 'Hull',
    slots: 1,
    options: [
      { id: 'hull_patrol',   name: 'Casco patrullero ligero',     nameEn: 'Light Patrol Boat Hull',  stats: { mobility: 35, armor: 5,  capacity: 6  }, weight: 2, description: 'Embarcación rápida de vigilancia costera' },
      { id: 'hull_landing',  name: 'Casco lancha desembarco',     nameEn: 'Landing Craft Hull',      stats: { mobility: 15, armor: 8,  capacity: 30 }, weight: 5, description: 'Transporte anfibio de tropas y vehículos' },
      { id: 'hull_corvette', name: 'Casco corbeta',               nameEn: 'Corvette Hull',           stats: { mobility: 28, armor: 20, capacity: 15 }, weight: 8, description: 'Buque de combate litoral polivalente' },
      { id: 'hull_frigate',  name: 'Casco fragata',               nameEn: 'Frigate Hull',            stats: { mobility: 22, armor: 35, capacity: 25 }, weight: 12, description: 'Buque de escolta y lucha antisubmarina' },
      { id: 'hull_destroyer',name: 'Casco destructor',            nameEn: 'Destroyer Hull',          stats: { mobility: 20, armor: 45, capacity: 35 }, weight: 16, description: 'Destructor polivalente de alta mar' },
      { id: 'hull_submarine',name: 'Casco submarino',             nameEn: 'Submarine Hull',          stats: { mobility: 18, armor: 30, stealth: 50, capacity: 8 }, weight: 14, description: 'Operación sumergida, sigilo extremo' },
      { id: 'hull_speedboat', name: 'Lancha rápida RHIB',         nameEn: 'RHIB Speedboat',          stats: { mobility: 45, armor: 2,  capacity: 4  }, weight: 1, description: 'Operaciones especiales y rápidas' },
    ],
  },
  naval_propulsion: {
    label: 'Propulsión naval', labelEn: 'Naval Propulsion',
    slots: 1,
    options: [
      { id: 'prop_diesel_s', name: 'Diésel marino simple',        nameEn: 'Single Marine Diesel',   stats: { mobility: 12, range: 15 }, weight: 3, description: 'Propulsión económica para embarcaciones menores' },
      { id: 'prop_diesel_d', name: 'Diésel marino doble',         nameEn: 'Twin Marine Diesel',     stats: { mobility: 20, range: 12 }, weight: 5, description: 'Redundancia y mayor velocidad' },
      { id: 'prop_gas_turbine', name: 'Turbina de gas naval',     nameEn: 'Naval Gas Turbine',      stats: { mobility: 35, range: 8  }, weight: 7, description: 'Alta velocidad, ideal para destructores' },
      { id: 'prop_combined', name: 'CODAG (combinado diesel+turbina)', nameEn: 'CODAG Combined',    stats: { mobility: 28, range: 14 }, weight: 8, description: 'Económico en crucero, potente en sprint' },
      { id: 'prop_electric', name: 'Propulsión eléctrica (AIP)', nameEn: 'AIP Electric Drive',      stats: { mobility: 15, stealth: 30, range: 20 }, weight: 6, description: 'Ultra silencioso, ideal para submarinos' },
      { id: 'prop_waterjet', name: 'Propulsión waterjet',         nameEn: 'Waterjet Propulsion',    stats: { mobility: 40, range: 10, stealth: 8 }, weight: 4, description: 'Alta velocidad, bajo calado, maniobrable' },
    ],
  },
  naval_armament: {
    label: 'Armamento naval', labelEn: 'Naval Armament',
    slots: 1,
    options: [
      { id: 'naval_mg',      name: 'Ametralladora naval 12.7mm',  nameEn: 'Naval 12.7mm MG',        stats: { firepower: 8              }, weight: 1, description: 'Defensa corto alcance, antipiratería' },
      { id: 'naval_cannon_40', name: 'Cañón naval 40mm Bofors',   nameEn: '40mm Bofors Naval Gun',  stats: { firepower: 20, range: 8   }, weight: 2, description: 'Antiaéreo y superficie, comprobado en combate' },
      { id: 'naval_cannon_76', name: 'Cañón naval 76mm OTO',      nameEn: '76mm OTO Naval Gun',     stats: { firepower: 30, range: 12  }, weight: 4, description: 'Versátil, rápido de fuego, buques medianos' },
      { id: 'naval_cannon_127', name: 'Cañón naval 127mm/5"',     nameEn: '127mm/5" Naval Gun',     stats: { firepower: 45, range: 20  }, weight: 8, description: 'Apoyo a tierra y superficie, destructores' },
      { id: 'torpedoes',     name: 'Torpedos ligeros (324mm)',     nameEn: 'Lightweight Torpedoes',  stats: { firepower: 50, range: 25, stealth: 5 }, weight: 5, description: 'Antisubmarino y antisuperficie' },
      { id: 'ssm_harpoon',   name: 'Misiles antibuque (Harpoon)', nameEn: 'Anti-Ship Missiles (Harpoon)', stats: { firepower: 60, range: 40 }, weight: 6, description: 'Misil sea-skimming de largo alcance' },
      { id: 'vls',           name: 'Sistema VLS (misiles verticales)', nameEn: 'VLS Missile System', stats: { firepower: 70, range: 50, electronics: 8 }, weight: 10, description: 'Lanzador vertical polivalente, múltiples misiones' },
    ],
  },
  naval_electronics: {
    label: 'Electrónica naval', labelEn: 'Naval Electronics',
    slots: 1,
    options: [
      { id: 'nav_basic',     name: 'Navegación básica GPS/chart', nameEn: 'Basic GPS Navigation',   stats: { electronics: 5,  range: 5  }, weight: 0, description: 'Sistemas de navegación estándar' },
      { id: 'radar_surface', name: 'Radar de superficie',         nameEn: 'Surface Search Radar',   stats: { electronics: 15, range: 20 }, weight: 2, description: 'Detección de buques a distancia' },
      { id: 'sonar_hull',    name: 'Sonar de casco (activo/pasivo)', nameEn: 'Hull-Mounted Sonar',   stats: { electronics: 22, range: 18, stealth: -5 }, weight: 3, description: 'Detección antisubmarina' },
      { id: 'sonar_towed',   name: 'Sonar remolcado TASS',        nameEn: 'TASS Towed Array Sonar', stats: { electronics: 28, range: 30 }, weight: 4, description: 'Detección a gran distancia de submarines' },
      { id: 'combat_mgmt',   name: 'Sistema de gestión de combate', nameEn: 'Combat Management System', stats: { electronics: 30, firepower: 10, range: 10 }, weight: 3, description: 'Integra sensores y armas en tiempo real' },
      { id: 'ew_naval',      name: 'Suite EW naval',              nameEn: 'Naval EW Suite',         stats: { electronics: 20, stealth: 25 }, weight: 3, description: 'Detección, identificación y jamming de señales' },
    ],
  },
  naval_protection: {
    label: 'Protección naval', labelEn: 'Naval Protection',
    slots: 1,
    optional: true,
    options: [
      { id: 'ciws',          name: 'Sistema CIWS (Phalanx)',       nameEn: 'CIWS (Phalanx)',         stats: { armor: 25, firepower: 15, electronics: 10 }, weight: 4, description: 'Defensa de punto contra misiles y aeronaves' },
      { id: 'decoys_naval',  name: 'Señuelos y chaff naval',       nameEn: 'Naval Decoys & Chaff',   stats: { stealth: 20, armor: 8    }, weight: 1, description: 'Protección contra misiles guiados' },
      { id: 'armor_belt',    name: 'Cinto blindado',               nameEn: 'Armor Belt',             stats: { armor: 20, mobility: -5  }, weight: 5, description: 'Blindaje lateral contra proyectiles' },
      { id: 'nbcd',          name: 'Protección NBQR',              nameEn: 'CBRN Protection',        stats: { armor: 5, capacity: 3    }, weight: 2, description: 'Nuclear, biológico, químico y radiológico' },
    ],
  },
}

// ─── Derived stat calculator ─────────────────────────────────────────────────
export function calcVehicleStats(components) {
  // components is an object: { category: componentId | null }
  const base = { armor: 0, firepower: 0, mobility: 0, electronics: 0, range: 0, stealth: 0, capacity: 0 }
  // Must pass all component catalogs merged
  return base
}

// ─── Get component by id from a catalog ─────────────────────────────────────
export function findComponent(catalog, id) {
  for (const category of Object.values(catalog)) {
    const found = category.options.find(o => o.id === id)
    if (found) return found
  }
  return null
}

// ─── Calculate stats from selected component ids ─────────────────────────────
export function calcStatsFromComponents(selectedComponents, catalog) {
  const totals = { armor: 0, firepower: 0, mobility: 0, electronics: 0, range: 0, stealth: 0, capacity: 0 }
  for (const compId of Object.values(selectedComponents)) {
    if (!compId) continue
    const comp = findComponent(catalog, compId)
    if (!comp) continue
    for (const [stat, val] of Object.entries(comp.stats)) {
      if (totals[stat] !== undefined) totals[stat] += val
    }
  }
  // Clamp 0–100
  for (const k of Object.keys(totals)) {
    totals[k] = Math.max(0, Math.min(100, totals[k]))
  }
  return totals
}

// ─── Vehicle subtypes ────────────────────────────────────────────────────────
export const LAND_SUBTYPES  = ['MBT', 'IFV', 'APC', 'RECON', 'ARTILLERY', 'ENGINEERING', 'LOGISTICS', 'MRAP', 'SELF_PROPELLED_GUN']
export const AIR_SUBTYPES   = ['ATTACK_HELI', 'TRANSPORT_HELI', 'RECON_HELI', 'FIGHTER', 'CAS', 'BOMBER', 'UAV', 'TRANSPORT']
export const SEA_SUBTYPES   = ['PATROL_BOAT', 'LANDING_CRAFT', 'CORVETTE', 'FRIGATE', 'DESTROYER', 'SUBMARINE', 'SPEEDBOAT', 'CARRIER']
