import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { getDb } from './index';
import {
  builds,
  buildSkills,
  characters,
  comments,
  items,
  partyRequests,
  skills,
  users,
  votes,
  CLASSES,
  PLAYSTYLES,
  ACTIVITIES,
  ITEM_TYPES,
} from './schema';

type ClassType = (typeof CLASSES)[number];
type PlaystyleType = (typeof PLAYSTYLES)[number];
type ActivityType = (typeof ACTIVITIES)[number];
type ItemTypeKind = (typeof ITEM_TYPES)[number];

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function logStep(label: string, count: number, started: number) {
  const ms = Date.now() - started;
  console.log(`  ✓ ${label}: ${count} rows in ${ms}ms`);
}

const db = getDb();

// ───────────────────────────────────────────────────────────────
// Skills — real D4 skill names
// ───────────────────────────────────────────────────────────────

interface SkillDef {
  name: string;
  class: ClassType;
  type: 'active' | 'passive' | 'ultimate';
}

const ULTIMATES = new Set([
  'Call of the Ancients',
  'Iron Maelstrom',
  'Wrath of the Berserker',
  'Petrify',
  'Lacerate',
  'Cataclysm',
  'Army of the Dead',
  'Death Trap',
  'Rain of Arrows',
  'Shadow Clone',
  'Deep Freeze',
  'Inferno',
  'Unrestrained Power',
  'Wrath of Heaven',
]);

const SKILL_LISTS: Record<ClassType, { active: string[]; passive: string[] }> = {
  barbarian: {
    active: [
      'Bash', 'Flay', 'Frenzy', 'Lunging Strike', 'Double Swing',
      'Hammer of the Ancients', 'Upheaval', 'Whirlwind', 'Rend', 'Death Blow',
      'Call of the Ancients', 'Iron Maelstrom', 'Wrath of the Berserker',
      'Challenging Shout', 'War Cry', 'Ground Stomp', 'Rallying Cry', 'Leap',
    ],
    passive: [
      'Booming Voice', 'Raid Leader', 'Aggressive Resistance', 'Prolific Fury',
      'Pit Fighter', 'No Mercy', 'Tempered Fury', 'Invigorating Fury',
    ],
  },
  druid: {
    active: [
      'Storm Strike', 'Wind Shear', 'Claw', 'Maul', 'Shred',
      'Tornado', 'Hurricane', 'Pulverize', 'Landslide', 'Lightning Storm',
      'Wolves', 'Ravens', 'Vine Creeper', 'Trample', 'Boulder',
      'Petrify', 'Lacerate', 'Cataclysm',
    ],
    passive: [
      'Digitigrade Gait', 'Predatory Instinct', 'Iron Fur', 'Ursine Strength',
      'Natural Disaster', 'Defiance', 'Lupine Ferocity',
    ],
  },
  necromancer: {
    active: [
      'Bone Splinters', 'Decompose', 'Hemorrhage', 'Reap',
      'Bone Spear', 'Blight', 'Blood Lance', 'Sever', 'Blood Surge',
      'Bone Prison', 'Blood Wave', 'Army of the Dead',
      'Raise Skeleton', 'Golem', 'Corpse Explosion', 'Corpse Tendrils',
      'Iron Maiden', 'Decrepify',
    ],
    passive: [
      'Unliving Energy', 'Imperfectly Balanced', 'Hewed Flesh',
      'Grim Harvest', 'Fueled by Death', 'Serration', 'Compound Fracture',
    ],
  },
  rogue: {
    active: [
      'Puncture', 'Forceful Arrow', 'Heartseeker', 'Invigorating Strike',
      'Barrage', 'Rapid Fire', 'Penetrating Shot', 'Twisting Blades', 'Flurry',
      'Shadow Step', 'Dash', 'Shadow Imbuement', 'Cold Imbuement', 'Poison Imbuement',
      'Dark Shroud', 'Concealment', 'Smoke Grenade',
      'Death Trap', 'Rain of Arrows', 'Shadow Clone',
    ],
    passive: [
      'Sturdy', 'Siphoning Strikes', 'Exploit', 'Malice', 'Trap Mastery',
      'Eldritch Bounty', 'Frigid Finesse', 'Innervation',
    ],
  },
  sorcerer: {
    active: [
      'Arc Lash', 'Spark', 'Frost Bolt', 'Fire Bolt',
      'Chain Lightning', 'Charged Bolts', 'Frozen Orb', 'Ice Shards',
      'Fireball', 'Incinerate', 'Meteor', 'Blizzard',
      'Ball Lightning', 'Inferno', 'Deep Freeze',
      'Ice Armor', 'Flame Shield', 'Teleport', 'Frost Nova',
    ],
    passive: [
      'Glass Cannon', 'Elemental Attunement', 'Devastation',
      'Align the Elements', 'Mana Shield', 'Protection',
    ],
  },
  spiritborn: {
    active: [
      'Thunderspike', 'Razor Wings', 'Quill Volley', 'Stinger',
      'Crushing Hand', 'Withering Fist', 'Touch of Death', 'Ravager',
      'Counterattack', 'Shell Reef', 'Adaptive Armor', 'Spirit Hall',
      'Symbiotic Presence', 'Unrestrained Power',
    ],
    passive: [
      'Focal Point', 'Feedback Loop', 'Endurance',
      'The Seeker', 'Harmonious', 'Measured Restraint',
    ],
  },
  paladin: {
    active: [
      'Holy Bolt', 'Smite', 'Judgement', 'Consecration',
      'Divine Shield', 'Hammer of Justice', 'Sacred Fire', 'Wrath of Heaven',
      'Aura of Protection', 'Blessed Strike', 'Radiant Shield',
    ],
    passive: [
      'Holy Fervor', 'Divine Strength', 'Crusader',
      'Sacred Ground', 'Righteous Fire', 'Devoted',
    ],
  },
};

function buildSkillDefs(): SkillDef[] {
  const defs: SkillDef[] = [];
  for (const cls of CLASSES) {
    for (const name of SKILL_LISTS[cls].active) {
      defs.push({
        name,
        class: cls,
        type: ULTIMATES.has(name) ? 'ultimate' : 'active',
      });
    }
    for (const name of SKILL_LISTS[cls].passive) {
      defs.push({ name, class: cls, type: 'passive' });
    }
  }
  return defs;
}

async function seedSkills(): Promise<{ id: string; class: ClassType }[]> {
  const start = Date.now();
  const defs = buildSkillDefs();
  const rows = defs.map((d) => ({
    name: d.name,
    class: d.class,
    type: d.type,
    description: faker.lorem.sentence(),
    maxRank: d.type === 'passive' ? 3 : 5,
    iconSlug: d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));

  const inserted: { id: string; class: ClassType }[] = [];
  for (const batch of chunk(rows, 100)) {
    const out = await db
      .insert(skills)
      .values(batch)
      .returning({ id: skills.id, class: skills.class });
    inserted.push(...out);
  }
  logStep('skills', inserted.length, start);
  return inserted;
}

// ───────────────────────────────────────────────────────────────
// Items — mythic + unique + sacred (generated)
// ───────────────────────────────────────────────────────────────

interface ItemSeed {
  name: string;
  type: ItemTypeKind;
  classRestriction: ClassType | null;
  isUnique: boolean;
  isMythic: boolean;
}

const MYTHIC_ITEMS: ItemSeed[] = [
  { name: "Tyrael's Might", type: 'chest', classRestriction: null, isUnique: true, isMythic: true },
  { name: "Andariel's Visage", type: 'helm', classRestriction: null, isUnique: true, isMythic: true },
  { name: 'Harlequin Crest', type: 'helm', classRestriction: null, isUnique: true, isMythic: true },
  { name: 'Melted Heart of Selig', type: 'jewelry', classRestriction: null, isUnique: true, isMythic: true },
  { name: 'Ring of Starless Skies', type: 'jewelry', classRestriction: null, isUnique: true, isMythic: true },
  { name: 'Grandfather', type: 'weapon', classRestriction: null, isUnique: true, isMythic: true },
  { name: 'Doombringer', type: 'weapon', classRestriction: null, isUnique: true, isMythic: true },
  { name: 'The Grandfather', type: 'weapon', classRestriction: 'barbarian', isUnique: true, isMythic: true },
  { name: 'Shako', type: 'helm', classRestriction: null, isUnique: true, isMythic: true },
];

const UNIQUE_ITEMS: ItemSeed[] = [
  { name: 'Azurewrath', type: 'weapon', classRestriction: null, isUnique: true, isMythic: false },
  { name: 'Fleshrender', type: 'weapon', classRestriction: null, isUnique: true, isMythic: false },
  { name: "Paingorger's Gauntlets", type: 'gloves', classRestriction: null, isUnique: true, isMythic: false },
  { name: 'Temerity', type: 'pants', classRestriction: null, isUnique: true, isMythic: false },
  { name: "Arreat's Bearing", type: 'weapon', classRestriction: 'barbarian', isUnique: true, isMythic: false },
  { name: 'Rage of Harrogath', type: 'chest', classRestriction: 'barbarian', isUnique: true, isMythic: false },
  { name: "Ancients' Oath", type: 'weapon', classRestriction: 'barbarian', isUnique: true, isMythic: false },
  { name: 'Mantle of the Mountain', type: 'chest', classRestriction: 'druid', isUnique: true, isMythic: false },
  { name: 'Greatstaff of the Crone', type: 'weapon', classRestriction: 'druid', isUnique: true, isMythic: false },
  { name: 'Waxing Gibbous', type: 'weapon', classRestriction: 'druid', isUnique: true, isMythic: false },
  { name: "Blood Artisan's Cuirass", type: 'chest', classRestriction: 'necromancer', isUnique: true, isMythic: false },
  { name: 'Black River', type: 'weapon', classRestriction: 'necromancer', isUnique: true, isMythic: false },
  { name: 'Howl from Below', type: 'offhand', classRestriction: 'necromancer', isUnique: true, isMythic: false },
  { name: 'Word of Hakan', type: 'jewelry', classRestriction: 'rogue', isUnique: true, isMythic: false },
  { name: 'Condemnation', type: 'weapon', classRestriction: 'rogue', isUnique: true, isMythic: false },
  { name: 'Grasp of Shadow', type: 'gloves', classRestriction: 'rogue', isUnique: true, isMythic: false },
  { name: 'Iceheart Brais', type: 'pants', classRestriction: 'sorcerer', isUnique: true, isMythic: false },
  { name: "Tal Rasha's Iridescent Loop", type: 'jewelry', classRestriction: 'sorcerer', isUnique: true, isMythic: false },
  { name: 'Staff of Lam Esen', type: 'weapon', classRestriction: 'sorcerer', isUnique: true, isMythic: false },
  { name: 'Fractured Winterglass', type: 'jewelry', classRestriction: 'sorcerer', isUnique: true, isMythic: false },
];

const SACRED_ADJ = [
  'Burnished', 'Tempered', 'Hallowed', 'Ancient', 'Rugged', 'Gilded',
  'Shadowed', 'Blessed', 'Cursed', 'Twisted', 'Primal', 'Radiant',
];

const NOUNS_BY_TYPE: Record<ItemTypeKind, string[]> = {
  weapon: ['Blade', 'Axe', 'Mace', 'Spear', 'Flail', 'Scythe', 'Staff', 'Bow', 'Crossbow', 'Dagger', 'Sword', 'Wand'],
  helm: ['Helm', 'Hood', 'Crown', 'Circlet', 'Cap', 'Visage'],
  chest: ['Plate', 'Mail', 'Robe', 'Tunic', 'Coat', 'Cuirass'],
  gloves: ['Gauntlets', 'Grips', 'Gloves', 'Bracers', 'Handguards'],
  boots: ['Greaves', 'Boots', 'Sabatons', 'Treads', 'Stompers'],
  pants: ['Leggings', 'Cuisses', 'Breeches', 'Trousers', 'Chaps'],
  jewelry: ['Ring', 'Amulet', 'Band', 'Signet', 'Locket'],
  offhand: ['Totem', 'Shield', 'Focus', 'Phylactery'],
  armor: ['Suit', 'Garb', 'Vestments', 'Raiment', 'Harness'],
};

function buildSacredItems(n: number): ItemSeed[] {
  const out: ItemSeed[] = [];
  for (let i = 0; i < n; i++) {
    const type = faker.helpers.arrayElement(ITEM_TYPES);
    const adj = faker.helpers.arrayElement(SACRED_ADJ);
    const noun = faker.helpers.arrayElement(NOUNS_BY_TYPE[type]);
    const useRestriction =
      type === 'armor' && faker.datatype.boolean({ probability: 0.5 });
    out.push({
      name: `Sacred ${adj} ${noun}`,
      type,
      classRestriction: useRestriction
        ? faker.helpers.arrayElement(CLASSES)
        : null,
      isUnique: false,
      isMythic: false,
    });
  }
  return out;
}

async function seedItems(): Promise<number> {
  const start = Date.now();
  const all: ItemSeed[] = [...MYTHIC_ITEMS, ...UNIQUE_ITEMS, ...buildSacredItems(80)];
  const rows = all.map((it) => ({
    name: it.name,
    type: it.type,
    classRestriction: it.classRestriction,
    isUnique: it.isUnique,
    isMythic: it.isMythic,
    description: faker.lorem.sentence(),
    requiredLevel: faker.number.int({ min: 1, max: 100 }),
  }));

  let count = 0;
  for (const batch of chunk(rows, 100)) {
    const out = await db.insert(items).values(batch).returning({ id: items.id });
    count += out.length;
  }
  logStep('items', count, start);
  return count;
}

// ───────────────────────────────────────────────────────────────
// Users — 1 admin + 300 regular
// ───────────────────────────────────────────────────────────────

const D4_NAMES = [
  'DarkSlayer', 'HellWalker', 'ShadowBane', 'IronFury', 'VoidHunter',
  'SoulReaper', 'NightBlade', 'BoneBreaker', 'StormCaller', 'FireLord',
  'DeathCoil', 'BloodRite', 'FrostWarden', 'ChaosKnight', 'ArcaneRift',
  'CrimsonEdge', 'AbyssWarden', 'EternalFlame', 'GrimHarvest', 'PlagueBreed',
];

async function seedUsers(): Promise<{ id: string }[]> {
  const start = Date.now();
  const userHash = await bcrypt.hash('Password123!', 12);
  const adminHash = await bcrypt.hash('AdminPass123!', 12);

  // Admin first (single insert so it always exists for testing).
  const [admin] = await db
    .insert(users)
    .values({
      battletag: 'AdminHero#0001',
      email: 'admin@sanctuaryhub.gg',
      passwordHash: adminHash,
      role: 'admin',
      avatarUrl: null,
      createdAt: faker.date.between({ from: '2024-06-01', to: '2026-05-20' }),
    })
    .returning({ id: users.id });

  // Generate 299 regular users with unique battletags / emails.
  const seenTags = new Set<string>(['AdminHero#0001']);
  const seenEmails = new Set<string>(['admin@sanctuaryhub.gg']);
  const rows: typeof users.$inferInsert[] = [];

  while (rows.length < 299) {
    const base = faker.helpers.arrayElement(D4_NAMES);
    const num = faker.number.int({ min: 100, max: 999 });
    const battletag = `${base}${num}#${faker.number.int({ min: 1000, max: 9999 })}`;
    if (seenTags.has(battletag)) continue;
    const email = `${base.toLowerCase()}${num}_${rows.length}@sanctuaryhub.gg`;
    if (seenEmails.has(email)) continue;
    seenTags.add(battletag);
    seenEmails.add(email);
    const created = faker.date.between({ from: '2024-06-01', to: '2026-05-20' });
    rows.push({
      battletag,
      email,
      passwordHash: userHash,
      role: 'user',
      avatarUrl: null,
      createdAt: created,
      updatedAt: created,
    });
  }

  const inserted: { id: string }[] = [{ id: admin.id }];
  for (const batch of chunk(rows, 50)) {
    const out = await db.insert(users).values(batch).returning({ id: users.id });
    inserted.push(...out);
  }
  logStep('users', inserted.length, start);
  return inserted;
}

// ───────────────────────────────────────────────────────────────
// Builds — 800
// ───────────────────────────────────────────────────────────────

const SEASONS = [3, 4, 5, 6, 7];

const BUILD_TITLES: Record<ClassType, string[]> = {
  barbarian: ['Whirlwind Bleed', 'HotA Earthquake', 'Double Swing Berserker', 'Rend Rupture', 'Leap Quake'],
  druid: ['Pulverize Werebear', 'Tornado Wolf', 'Lightning Storm Caster', 'Landslide Boulder', 'Shred Werewolf'],
  necromancer: ['Bone Spear Splintering', 'Blood Surge Nova', 'Minion Army', 'Corpse Explosion', 'Blight Shadow'],
  rogue: ['Twisting Blades Poison', 'Rapid Fire Cold', 'Penetrating Shot', 'Death Trap Burst', 'Shadow Clone'],
  sorcerer: ['Ice Shards Frozen', 'Ball Lightning Arc', 'Blizzard Sorceress', 'Fireball Meteor', 'Chain Lightning'],
  spiritborn: ['Quill Volley Eagle', 'Crushing Hand Gorilla', 'Touch of Death Centipede', 'Ravager Jaguar'],
  paladin: ['Holy Bolt Zealot', 'Smite Consecration', 'Sacred Fire Wrath', 'Hammer Justice'],
};

function pickSeason(): number {
  // 40% chance for season 7, even split for others
  if (faker.datatype.boolean({ probability: 0.4 })) return 7;
  return faker.helpers.arrayElement([3, 4, 5, 6]);
}

async function seedBuilds(
  userIds: { id: string }[],
): Promise<{ id: string; class: ClassType }[]> {
  const start = Date.now();
  const rows: typeof builds.$inferInsert[] = [];
  for (let i = 0; i < 800; i++) {
    const cls = faker.helpers.arrayElement(CLASSES);
    const season = pickSeason();
    const title = `${faker.helpers.arrayElement(BUILD_TITLES[cls])}${
      faker.datatype.boolean({ probability: 0.4 }) ? ` S${season}` : ''
    }`;
    const created = faker.date.between({ from: '2024-06-01', to: '2026-05-20' });
    rows.push({
      userId: faker.helpers.arrayElement(userIds).id,
      title,
      description: faker.lorem.paragraphs(2),
      class: cls,
      season,
      playstyle: faker.helpers.arrayElement(PLAYSTYLES) as PlaystyleType,
      isFeatured: faker.datatype.boolean({ probability: 0.05 }),
      views: faker.number.int({ min: 0, max: 50000 }),
      createdAt: created,
      updatedAt: created,
    });
  }

  const inserted: { id: string; class: ClassType }[] = [];
  for (const batch of chunk(rows, 50)) {
    const out = await db
      .insert(builds)
      .values(batch)
      .returning({ id: builds.id, class: builds.class });
    inserted.push(...out);
  }
  logStep('builds', inserted.length, start);
  return inserted;
}

// ───────────────────────────────────────────────────────────────
// buildSkills — 5-8 per build
// ───────────────────────────────────────────────────────────────

async function seedBuildSkills(
  insertedBuilds: { id: string; class: ClassType }[],
  insertedSkills: { id: string; class: ClassType }[],
): Promise<number> {
  const start = Date.now();
  const skillsByClass = new Map<ClassType, { id: string }[]>();
  for (const cls of CLASSES) {
    skillsByClass.set(
      cls,
      insertedSkills.filter((s) => s.class === cls).map((s) => ({ id: s.id })),
    );
  }

  const rows: typeof buildSkills.$inferInsert[] = [];
  for (const b of insertedBuilds) {
    const pool = skillsByClass.get(b.class) ?? [];
    if (pool.length === 0) continue;
    const n = Math.min(faker.number.int({ min: 5, max: 8 }), pool.length);
    const picked = faker.helpers.shuffle([...pool]).slice(0, n);
    for (let slot = 0; slot < picked.length; slot++) {
      rows.push({
        buildId: b.id,
        skillId: picked[slot].id,
        rank: faker.number.int({ min: 1, max: 5 }),
        slot,
      });
    }
  }

  let count = 0;
  for (const batch of chunk(rows, 100)) {
    const out = await db
      .insert(buildSkills)
      .values(batch)
      .returning({ id: buildSkills.id });
    count += out.length;
  }
  logStep('buildSkills', count, start);
  return count;
}

// ───────────────────────────────────────────────────────────────
// partyRequests — 400
// ───────────────────────────────────────────────────────────────

const PARTY_DESCRIPTIONS: Record<ActivityType, string[]> = {
  helltide: [
    'LFG Helltide farm, any class welcome',
    'Helltide speedrun, 900+ item power pls',
    'Cinder farm, HC friendly',
  ],
  world_boss: [
    'World Boss next spawn, 3 spots',
    'Boss carry available, reply here',
    'Ashava/Wandering Death, all welcome',
  ],
  nightmare_dungeon: [
    'NMD T90+ speedfarm',
    'Nightmare dungeon carries',
    'Key farm + dungeon spam S7',
  ],
  uber_boss: [
    'Uber Lilith prog, BIS build required',
    'Echo of Duriel farm',
    'Tormented Andariel kills',
  ],
  pit: [
    'Pit 100+ push',
    'Pit farm for masterworking mats',
    'Tier 120+ Pit carry',
  ],
  pvp: [
    'Fields of Hatred PvP',
    'PvP 1v1 duels welcome',
    'HC PvP only',
  ],
  leveling: [
    '1-60 leveling group',
    'Campaign co-op',
    'Powerleveling alt S7',
  ],
};

async function seedPartyRequests(
  userIds: { id: string }[],
): Promise<number> {
  const start = Date.now();
  const rows: typeof partyRequests.$inferInsert[] = [];
  for (let i = 0; i < 400; i++) {
    const activity = faker.helpers.arrayElement(ACTIVITIES) as ActivityType;
    const spotsTotal = faker.helpers.arrayElement([2, 3, 4]);
    const spotsFilled = faker.number.int({ min: 0, max: spotsTotal });
    const status =
      spotsFilled === spotsTotal
        ? ('full' as const)
        : faker.helpers.arrayElement(['open', 'open', 'open', 'closed'] as const);
    rows.push({
      userId: faker.helpers.arrayElement(userIds).id,
      activity,
      description: faker.helpers.arrayElement(PARTY_DESCRIPTIONS[activity]),
      minLevel: faker.number.int({ min: 1, max: 100 }),
      spotsTotal,
      spotsFilled,
      status,
      createdAt: faker.date.between({ from: '2025-01-01', to: '2026-05-20' }),
    });
  }
  let count = 0;
  for (const batch of chunk(rows, 100)) {
    const out = await db
      .insert(partyRequests)
      .values(batch)
      .returning({ id: partyRequests.id });
    count += out.length;
  }
  logStep('partyRequests', count, start);
  return count;
}

// ───────────────────────────────────────────────────────────────
// comments — 3000
// ───────────────────────────────────────────────────────────────

const COMMENT_TEMPLATES = [
  'This build absolutely shreds in Pit 100+!',
  'Works great for leveling, swapped Bash for Flay early on',
  'Any alternatives for the Grandfather? Still farming it',
  'Season 7 viable? Which paragon boards?',
  'Tried this yesterday, melted Tormented Duriel first try',
  "Which aspects should I prioritize if I'm early endgame?",
  'Great guide! The skill rotation took me a while to get used to',
  'Can this run HC? Or too squishy without the mythics?',
  "Upvoted, this is the cleanest build guide I've seen",
  "Is Blood Artisan's Cuirass required or optional?",
  'Updated for S7 patch? Damage numbers feel different',
  'Running T100 NMD with this, very smooth',
  'Thanks for the video link in the description!',
  'Would love a budget version without the uniques',
  'This cleared Pit 120 for me, insane damage',
];

async function seedComments(
  userIds: { id: string }[],
  buildIds: { id: string }[],
): Promise<number> {
  const start = Date.now();
  const rows: typeof comments.$inferInsert[] = [];
  for (let i = 0; i < 3000; i++) {
    const base = faker.helpers.arrayElement(COMMENT_TEMPLATES);
    const extra = faker.datatype.boolean({ probability: 0.3 })
      ? ' ' + faker.lorem.sentence()
      : '';
    rows.push({
      userId: faker.helpers.arrayElement(userIds).id,
      buildId: faker.helpers.arrayElement(buildIds).id,
      content: base + extra,
      createdAt: faker.date.between({ from: '2024-06-01', to: '2026-05-20' }),
    });
  }
  let count = 0;
  for (const batch of chunk(rows, 100)) {
    const out = await db
      .insert(comments)
      .values(batch)
      .returning({ id: comments.id });
    count += out.length;
  }
  logStep('comments', count, start);
  return count;
}

// ───────────────────────────────────────────────────────────────
// votes — 6000 unique (userId, buildId)
// ───────────────────────────────────────────────────────────────

async function seedVotes(
  userIds: { id: string }[],
  buildIds: { id: string }[],
): Promise<number> {
  const start = Date.now();
  const target = 6000;
  const seen = new Set<string>();
  const rows: typeof votes.$inferInsert[] = [];

  let attempts = 0;
  const maxAttempts = target * 20;
  while (rows.length < target && attempts < maxAttempts) {
    attempts++;
    const u = faker.helpers.arrayElement(userIds).id;
    const b = faker.helpers.arrayElement(buildIds).id;
    const key = `${u}-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      userId: u,
      buildId: b,
      value: faker.helpers.weightedArrayElement([
        { weight: 4, value: 1 },
        { weight: 1, value: -1 },
      ]),
      createdAt: faker.date.between({ from: '2024-06-01', to: '2026-05-20' }),
    });
  }

  let count = 0;
  for (const batch of chunk(rows, 100)) {
    const out = await db.insert(votes).values(batch).returning({ id: votes.id });
    count += out.length;
  }
  logStep('votes', count, start);
  return count;
}

// ───────────────────────────────────────────────────────────────
// main
// ───────────────────────────────────────────────────────────────

async function main() {
  // Deterministic seed for reproducible runs (date variance still works).
  faker.seed(42);

  console.log('Clearing existing data…');
  await db.delete(votes);
  await db.delete(comments);
  await db.delete(partyRequests);
  await db.delete(buildSkills);
  await db.delete(builds);
  await db.delete(characters);
  await db.delete(users);
  await db.delete(items);
  await db.delete(skills);

  console.log('Seeding…');
  const t0 = Date.now();

  const insertedSkills = await seedSkills();
  await seedItems();
  const insertedUsers = await seedUsers();
  const insertedBuilds = await seedBuilds(insertedUsers);
  await seedBuildSkills(insertedBuilds, insertedSkills);
  await seedPartyRequests(insertedUsers);
  await seedComments(insertedUsers, insertedBuilds);
  await seedVotes(insertedUsers, insertedBuilds);

  console.log(`\nSeed complete in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
