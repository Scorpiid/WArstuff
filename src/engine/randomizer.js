/**
 * Randomizer Engine
 * Generates random squads and personnel across 4 tiers.
 * Name pool covers American, European, Latin, Slavic, Asian, African, Middle-Eastern origins.
 */

// ─── RNG helpers ────────────────────────────────────────────────────────────
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]
const roll  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const fuzz  = (base, spread) => Math.max(0, Math.min(100, base + roll(-spread, spread)))

// ─── Name pools ─────────────────────────────────────────────────────────────
export const FIRST_NAMES = [
  // American / English
  'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
  'Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua',
  'Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan',
  'Gary','Jacob','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon',
  'Frank','Benjamin','Raymond','Gregory','Samuel','Patrick','Jack','Alexander','Dennis','Peter',
  // Female (English)
  'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
  'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Emily','Dorothy','Melissa','Donna',
  'Michelle','Carol','Amanda','Kimberly','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia',
  // Hispanic / Latin
  'Carlos','Miguel','José','Luis','Juan','Alejandro','Diego','Ricardo','Fernando','Andrés',
  'Pablo','Rodrigo','Santiago','Marcos','Javier','Eduardo','Rafael','Sergio','Arturo','Manuel',
  'Gabriel','Héctor','Raúl','Adrián','Emilio','Tomás','Sebastián','Nicolás','Felipe','Ignacio',
  // Female (Hispanic)
  'María','Ana','Carmen','Laura','Rosa','Elena','Sofía','Isabel','Patricia','Valentina',
  'Gabriela','Fernanda','Daniela','Catalina','Adriana','Claudia','Verónica','Natalia','Lucía','Camila',
  // Slavic (Russian/Polish/Ukrainian)
  'Dmitri','Alexei','Nikolai','Ivan','Vladimir','Sergei','Mikhail','Pavel','Anton','Andrei',
  'Boris','Viktor','Yuri','Leonid','Oleg','Anatoli','Fyodor','Maksim','Stanislav','Vasili',
  'Wojciech','Krzysztof','Piotr','Marek','Tomasz','Lukasz','Maciej','Grzegorz','Pawel','Michal',
  // Female (Slavic)
  'Natasha','Olga','Katya','Irina','Svetlana','Tatiana','Ekaterina','Anya','Vera','Galina',
  // German / Nordic
  'Hans','Klaus','Werner','Dieter','Friedrich','Günter','Heinz','Horst','Rainer','Wolfgang',
  'Lars','Erik','Bjorn','Sven','Magnus','Gunnar','Leif','Torsten','Olaf','Ragnar',
  'Heinrich','Karl','Otto','Hermann','Rudolf','Gerhard','Helmut','Erich','Walter','Franz',
  // Female (German/Nordic)
  'Helga','Greta','Ingrid','Astrid','Sigrid','Freya','Brigitte','Hildegard','Ursula','Monika',
  // French / Italian
  'Pierre','Jean','François','Michel','Laurent','Philippe','Claude','Henri','Alain','Bernard',
  'Marco','Luca','Matteo','Lorenzo','Davide','Andrea','Giulio','Roberto','Stefano','Riccardo',
  // East Asian (Chinese/Japanese/Korean)
  'Wei','Zhang','Dong','Peng','Chao','Hao','Jian','Tao','Fang','Ming',
  'Kenji','Hiroshi','Takeshi','Yuki','Ryu','Kenta','Daiki','Shota','Haruki','Naoki',
  'Jin','Hyun','Jun','Min','Seok','Woo','Sung','Tae','Yong','Chan',
  // Female (Asian)
  'Mei','Xiu','Ling','Fang','Jing','Yun','Hui','Lan','Ping','Qing',
  'Yuki','Hana','Sakura','Akiko','Yoko','Misaki','Emi','Nana','Rei','Aoi',
  // South Asian (Indian)
  'Raj','Arjun','Vikram','Rahul','Amit','Ravi','Suresh','Pradeep','Kiran','Anil',
  'Sanjay','Deepak','Ajay','Vijay','Ramesh','Sunil','Ashok','Prakash','Mohan','Dinesh',
  // Female (Indian)
  'Priya','Anita','Sunita','Kavita','Rekha','Meena','Geeta','Sonia','Pooja','Nisha',
  // Middle Eastern (Arabic/Turkish/Persian)
  'Omar','Hassan','Ali','Khalid','Ahmed','Mohamed','Yusuf','Ibrahim','Tariq','Karim',
  'Mehmet','Mustafa','Ahmet','Hasan','Kemal','Osman','Selim','Emre','Berk','Cem',
  'Darius','Cyrus','Arash','Farshid','Reza','Siavash','Shahram','Kaveh','Bahram','Nima',
  // African
  'Kwame','Kofi','Ama','Yaw','Akosua','Kojo','Abena','Kwesi','Adjoa','Fiifi',
  'Chukwu','Emeka','Chioma','Adaeze','Olumide','Femi','Bola','Tunde','Kemi','Seun',
  'Amara','Diallo','Mamadou','Oumar','Ibrahim','Moussa','Abdou','Lamine','Seydou','Tidiane',
  // Female (African)
  'Fatima','Aminata','Mariam','Kadiatou','Fatoumata','Ndeye','Rokhaya','Astou','Coumba','Maimouna',
]

export const LAST_NAMES = [
  // American / English
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore',
  'Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Young','Lewis',
  'Robinson','Walker','Hall','Allen','Scott','King','Wright','Lopez','Hill','Adams',
  'Baker','Gonzalez','Nelson','Carter','Mitchell','Roberts','Evans','Turner','Collins','Stewart',
  'Morris','Rogers','Reed','Cook','Bell','Murphy','Bailey','Rivera','Cooper','Cox',
  // Hispanic
  'García','Martínez','López','González','Rodríguez','Hernández','Torres','Sánchez','Flores','Vargas',
  'Morales','Reyes','Jiménez','Ortiz','Castillo','Ramos','Vega','Mendoza','Rojas','Herrera',
  'Cruz','Delgado','Medina','Aguilar','Castro','Ríos','Moreno','Pereira','Núñez','Cabrera',
  // Slavic
  'Petrov','Ivanov','Sokolov','Volkov','Kozlov','Novikov','Morozov','Popov','Lebedev','Fedorov',
  'Zhukov','Romanov','Baranov','Sergeev','Kuznetsov','Pavlov','Nikitin','Frolov','Kovalev','Bogdanov',
  'Kowalski','Nowak','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak',
  // German / Nordic
  'Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann',
  'Hansen','Nielsen','Jensen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Petersen','Madsen',
  'Eriksson','Lindqvist','Johansson','Bergström','Nilsson','Magnusson','Gunnarsson','Thorvaldsen','Bjornsson','Ulfsson',
  // French / Italian
  'Dupont','Durand','Martin','Bernard','Petit','Robert','Richard','Simon','Laurent','Michel',
  'Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco',
  // East Asian
  'Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou',
  'Tanaka','Yamamoto','Suzuki','Watanabe','Ito','Nakamura','Kobayashi','Kato','Sato','Shimizu',
  'Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Chang','Oh',
  // South Asian
  'Sharma','Singh','Patel','Kumar','Gupta','Verma','Reddy','Shah','Mehta','Chopra',
  'Iyer','Pillai','Nair','Rao','Menon','Krishnan','Venkat','Subramaniam','Natarajan','Rajan',
  // Middle Eastern
  'Al-Rashid','Al-Hassan','Al-Farsi','Al-Khatib','Khalifa','Mansour','Qasim','Haddad','Nasser','Bakr',
  'Yilmaz','Kaya','Demir','Sahin','Celik','Aydin','Arslan','Ozturk','Erdogan','Toprak',
  // African
  'Diallo','Traoré','Koné','Coulibaly','Diarra','Touré','Cissé','Kouyaté','Bah','Camara',
  'Okafor','Eze','Adeyemi','Okonkwo','Abubakar','Musa','Danjuma','Garba','Suleiman','Usman',
  'Mensah','Asante','Boateng','Amponsah','Owusu','Agyei','Adjei','Antwi','Frimpong','Acheampong',
]

// ─── Squad name components ───────────────────────────────────────────────────
const SQUAD_PREFIXES = [
  'Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Ghost','Hunter','Iron','Jade',
  'Kilo','Lima','Mango','Nexus','Omega','Phoenix','Quebec','Raptor','Sierra','Tango',
  'Uniform','Viper','Whiskey','Xray','Yankee','Zulu','Cobra','Dragon','Eagle','Falcon',
  'Griffin','Hammer','Inferno','Javelin','Knight','Lance','Mantis','Neon','Obsidian','Phantom',
  'Quake','Raven','Shadow','Thunder','Ultima','Valkyrie','Warhawk','Xerxes','Yaeger','Zeus',
]
const SQUAD_SUFFIXES = [
  'Squad','Team','Unit','Force','Group','Element','Section','Platoon','Cell','Company',
  'Detachment','Division','Strike','Recon','Assault','Support','Reaper','Hunter','Wolf','Vanguard',
]
const SQUAD_COMMANDERS = [
  'Captain','Major','Lieutenant','Sergeant','Commander','Colonel','Chief','Warrant Officer',
]

// ─── Tier definitions ────────────────────────────────────────────────────────
export const SQUAD_TIERS = {
  recruit: {
    key:         'recruit',
    statMin:     20, statMax: 45,
    moraleBase:  55, moraleSpread: 10,
    fatigueBase: 30, fatigueSpread: 15,
    personnelMin: 4,  personnelMax: 8,
  },
  soldier: {
    key:         'soldier',
    statMin:     45, statMax: 65,
    moraleBase:  70, moraleSpread: 8,
    fatigueBase: 20, fatigueSpread: 10,
    personnelMin: 6,  personnelMax: 10,
  },
  veteran: {
    key:         'veteran',
    statMin:     65, statMax: 82,
    moraleBase:  82, moraleSpread: 6,
    fatigueBase: 12, fatigueSpread: 8,
    personnelMin: 8,  personnelMax: 12,
  },
  elite: {
    key:         'elite',
    statMin:     82, statMax: 98,
    moraleBase:  92, moraleSpread: 5,
    fatigueBase: 5,  fatigueSpread: 5,
    personnelMin: 6,  personnelMax: 10,
  },
}

export const PERSONNEL_TIERS = {
  low: {
    key:         'low',
    statMin:     15, statMax: 40,
    healthMin:   60, healthMax: 100,
  },
  regular: {
    key:         'regular',
    statMin:     40, statMax: 60,
    healthMin:   75, healthMax: 100,
  },
  high: {
    key:         'high',
    statMin:     60, statMax: 78,
    healthMin:   85, healthMax: 100,
  },
  elite: {
    key:         'elite',
    statMin:     78, statMax: 98,
    healthMin:   90, healthMax: 100,
  },
}

const SQUAD_TYPES   = ['Infantry','Special Operations','Armored','Reconnaissance','Artillery','Engineering','Medical','Logistics','Air Assault']
const ROLES         = ['Commander','Rifleman','Machine Gunner','Medic','Scout','Marksman','Engineer','Radio Operator','Driver','Support']
const RANKS_BY_TIER = {
  low:     ['Private','Private First Class','Corporal'],
  regular: ['Sergeant','Staff Sergeant','Corporal'],
  high:    ['Lieutenant','Staff Sergeant','Sergeant'],
  elite:   ['Captain','Major','Lieutenant','Colonel'],
  // squad tiers map to closest
  recruit: ['Private','Private First Class','Corporal'],
  soldier: ['Corporal','Sergeant','Staff Sergeant'],
  veteran: ['Staff Sergeant','Lieutenant','Captain'],
  elite_sq:['Captain','Major','Lieutenant'],
}
const WEAPONS = ['Assault Rifle','Sniper Rifle','Machine Gun','Pistol','Rocket Launcher','Grenade Launcher','SMG','Shotgun']

// ─── Generators ─────────────────────────────────────────────────────────────
export function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
}

export function generateRandomSquad(tierKey, nationId = null) {
  const tier = SQUAD_TIERS[tierKey]
  if (!tier) throw new Error(`Unknown squad tier: ${tierKey}`)

  const stat = () => roll(tier.statMin, tier.statMax)
  const name = `${pick(SQUAD_PREFIXES)} ${pick(SQUAD_SUFFIXES)}`
  const commander = `${pick(SQUAD_COMMANDERS)} ${randomName()}`

  return {
    name,
    nationId,
    commander,
    type:    pick(SQUAD_TYPES),
    status:  'ACTIVE',
    // Combat stats
    training:       stat(),
    morale:         fuzz(tier.moraleBase, tier.moraleSpread),
    experience:     stat(),
    combat:         stat(),
    stealth:        stat(),
    mobility:       stat(),
    accuracy:       stat(),
    defense:        stat(),
    leadership:     stat(),
    medical:        stat(),
    communications: stat(),
    logistics:      stat(),
    // Operational
    fatigue:        fuzz(tier.fatigueBase, tier.fatigueSpread),
    readiness:      roll(
      tierKey === 'recruit' ? 50 : tierKey === 'soldier' ? 65 : tierKey === 'veteran' ? 78 : 88,
      tierKey === 'recruit' ? 75 : tierKey === 'soldier' ? 85 : tierKey === 'veteran' ? 95 : 100,
    ),
    // Supply (elites are better supplied)
    ammo:        roll(tierKey === 'recruit' ? 50 : tierKey === 'soldier' ? 65 : 80, 100),
    medSupplies: roll(tierKey === 'recruit' ? 40 : tierKey === 'soldier' ? 60 : 75, 100),
    fuel:        roll(tierKey === 'recruit' ? 50 : tierKey === 'soldier' ? 65 : 80, 100),
    commsEquip:  roll(tierKey === 'recruit' ? 40 : tierKey === 'soldier' ? 60 : 75, 100),
    // Meta
    vehicleIds:     [],
    _generatedTier: tierKey,
  }
}

export function generateRandomPersonnel(tierKey, squadId = null) {
  const tier = PERSONNEL_TIERS[tierKey]
  if (!tier) throw new Error(`Unknown personnel tier: ${tierKey}`)

  const rankPool = RANKS_BY_TIER[tierKey] || RANKS_BY_TIER.regular
  const stat = () => roll(tier.statMin, tier.statMax)

  return {
    name:       randomName(),
    rank:       pick(rankPool),
    role:       pick(ROLES),
    experience: stat(),
    health:     roll(tier.healthMin, tier.healthMax),
    skill:      stat(),
    weapon:     pick(WEAPONS),
    status:     'ACTIVE',
    squadId,
    notes:      '',
    history:    [],
    _generatedTier: tierKey,
  }
}

// Batch: generate N personnel for a squad
export function generateSquadPersonnel(tierKey, squadId, count) {
  return Array.from({ length: count }, () => generateRandomPersonnel(tierKey, squadId))
}
