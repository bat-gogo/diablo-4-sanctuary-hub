export const CLASS_ORDER = [
  'barbarian',
  'druid',
  'necromancer',
  'rogue',
  'sorcerer',
  'spiritborn',
  'paladin',
  'warlock',
] as const;

export type ClassSlug = (typeof CLASS_ORDER)[number];

export const CLASS_TAGLINE: Record<ClassSlug, string> = {
  barbarian:   'Unmatched strength. An arsenal for every foe.',
  druid:       'Shapeshifter of the wilds. Earth, wind, and storm.',
  necromancer: 'Commander of the dead. Bone, blood, and shadow.',
  rogue:       'Agile predator. Poison, shadow, precision.',
  sorcerer:    'Master of elements. Fire, ice, and lightning unleashed.',
  spiritborn:  'Apex predator of Nahantu. Four Spirit Guardians.',
  paladin:     'Reborn through light. Divine justice in Sanctuary.',
  warlock:     'Forbidden knowledge. Demons bound to iron will.',
};

export const CLASS_LORE: Record<ClassSlug, string[]> = {
  barbarian: [
    'The Barbarian has unparalleled physical strength and expertly wields an entire arsenal in battle, switching between weapons mid-combo to suit the moment.',
    'Born from the survivors of Mount Arreat\'s ruin, the Barbarians of Sanctuary channel an inner fury that turns pain into damage. Where mages chant and rogues whisper, the Barbarian roars.',
  ],
  druid: [
    'A primal warrior who calls upon the spirits of the wild and the wrath of nature itself, the Druid shifts seamlessly between human, werebear, and werewolf forms.',
    'Worshippers of the great Spirits of Scosglen, Druids draw equal strength from Earth, Storm and the Companion beasts that hunt at their side. They are the storm before the storm.',
  ],
  necromancer: [
    'Schooled in the cult of Rathma, the Necromancer raises legions of the dead, harvests bone and blood from the slain, and walks the line between life and death with cold precision.',
    'Three pillars define their craft — Bone for offense, Blood for sustain, Shadow for the unwilling sacrifice. Their power grows with every corpse left behind.',
  ],
  rogue: [
    'A versatile melee/ranged hybrid, the Rogue stalks her prey from the shadows, layering imbuements of cold, poison and shadow on her arrows and daggers before striking.',
    'Trained in the secret Order of the Bright Path, Rogues weave between worlds — present one moment, gone the next — leaving only a quiet body and a faint smell of nightshade.',
  ],
  sorcerer: [
    'A glass cannon that turns enemies to ash, ice, or arcs of lightning. The Sorcerer trades robust defenses for raw destructive power and the freedom to teleport across the battlefield.',
    'Trained at Caldeum\'s Yshari Sanctum, Sorcerers learn to channel raw elemental energy through fragile mortal flesh. The price is constant peril — and unmatched obliteration.',
  ],
  spiritborn: [
    'Introduced in Vessel of Hatred, the Spiritborn bond with one of four Spirit Guardians from Nahantu — Jaguar, Eagle, Gorilla, or Centipede — each granting different combat virtues.',
    'Where other classes use steel and spellbooks, the Spiritborn channel the jungle itself. Their weapons, their armor, even their breath answer to the Spirit they have chosen.',
  ],
  paladin: [
    'Reborn through the Light of Akarat, the Paladin marches at the front of every charge, smiting demons with blessed hammers and shielding allies behind walls of consecrated faith.',
    'Long thought lost after the fall of Westmarch, the order rose again when Sanctuary needed them most. Where a Paladin walks, the dark hesitates.',
  ],
  warlock: [
    'Forbidden by the Cathedral and feared by the cults, the Warlock binds demonic patrons to his will, paying for raw power in fragments of his own soul.',
    'Hellfire surges, cursed bargains, eldritch summons — every Warlock skill is a contract. Cast too often, and the contract starts reading you.',
  ],
};
