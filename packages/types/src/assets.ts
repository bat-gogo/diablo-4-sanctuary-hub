/**
 * R2 asset manifest for Sanctuary Hub.
 *
 * Keys follow `{category}/{slug}.{ext}` where ext reflects what was actually
 * uploaded:
 *   - `.webp` — real D4 art from Fandom Wiki (classes + 26 named uniques)
 *   - `.png`  — real D4 skill icons from d4builds' CDN (sunderarmor.com)
 *   - `.svg`  — game-icons.net thematic fallbacks (MIT)
 *
 * The bucket is publicly readable at NEXT_PUBLIC_R2_PUBLIC_URL.
 */

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

export const ASSETS = {
  // Real D4 promo art (Blizzard, hosted on Fandom Wiki CDN).
  classes: {
    barbarian:   'classes/barbarian.webp',
    druid:       'classes/druid.webp',
    necromancer: 'classes/necromancer.webp',
    rogue:       'classes/rogue.webp',
    sorcerer:    'classes/sorcerer.webp',
    spiritborn:  'classes/spiritborn.webp',
    paladin:     'classes/paladin.webp',
    warlock:     'classes/warlock.webp',
  },
  itemTypes: {
    weapon:  'items/weapon.svg',
    axe:     'items/axe.svg',
    mace:    'items/mace.svg',
    scythe:  'items/scythe.svg',
    staff:   'items/staff.svg',
    bow:     'items/bow.svg',
    dagger:  'items/dagger.svg',
    wand:    'items/wand.svg',
    helm:    'items/helm.svg',
    chest:   'items/chest.svg',
    gloves:  'items/gloves.svg',
    boots:   'items/boots.svg',
    pants:   'items/pants.svg',
    offhand: 'items/offhand.svg',
    jewelry: 'items/jewelry.svg',
    amulet:  'items/amulet.svg',
    mythic:  'items/mythic.svg',
    unique:  'items/unique.svg',
  },
  /**
   * Real D4 inventory icons for specific unique + mythic items, keyed by the
   * exact item name as it appears in the seed schema. Items not in this map
   * (3 of 30: Grandfather, Mantle of the Mountain, Blood Artisan's Cuirass)
   * fall back to type icons via uniqueItemIcon().
   */
  uniques: {
    "Tyrael's Might":               'uniques/tyrael_s_might.webp',
    "Andariel's Visage":            'uniques/andariel_s_visage.webp',
    "Harlequin Crest":              'uniques/harlequin_crest.webp',
    "Melted Heart of Selig":        'uniques/melted_heart_of_selig.webp',
    "Ring of Starless Skies":       'uniques/ring_of_starless_skies.webp',
    "Doombringer":                  'uniques/doombringer.webp',
    "Shako":                        'uniques/shako.webp',
    "Azurewrath":                   'uniques/azurewrath.webp',
    "Fleshrender":                  'uniques/fleshrender.webp',
    "Paingorger's Gauntlets":       'uniques/paingorger_s_gauntlets.webp',
    "Temerity":                     'uniques/temerity.webp',
    "Arreat's Bearing":             'uniques/arreat_s_bearing.webp',
    "Rage of Harrogath":            'uniques/rage_of_harrogath.webp',
    "Ancients' Oath":               'uniques/ancients_oath.webp',
    "Greatstaff of the Crone":      'uniques/greatstaff_of_the_crone.webp',
    "Waxing Gibbous":               'uniques/waxing_gibbous.webp',
    "Black River":                  'uniques/black_river.webp',
    "Howl from Below":              'uniques/howl_from_below.webp',
    "Word of Hakan":                'uniques/word_of_hakan.webp',
    "Condemnation":                 'uniques/condemnation.webp',
    "Grasp of Shadow":              'uniques/grasp_of_shadow.webp',
    "Iceheart Brais":               'uniques/iceheart_brais.webp',
    "Tal Rasha's Iridescent Loop":  'uniques/tal_rasha_s_iridescent_loop.webp',
    "Staff of Lam Esen":            'uniques/staff_of_lam_esen.webp',
    "Fractured Winterglass":        'uniques/fractured_winterglass.webp',
  } as Record<string, string>,
  // Mix of real D4 skill PNGs (d4builds CDN) and themed SVG fallbacks.
  skills: {
    active:            'skills/active.svg',
    passive:           'skills/passive.svg',
    ultimate:          'skills/ultimate.svg',
    barbarian_skill:   'skills/barbarian_skill.png',
    druid_skill:       'skills/druid_skill.png',
    necromancer_skill: 'skills/necromancer_skill.png',
    rogue_skill:       'skills/rogue_skill.png',
    sorcerer_skill:    'skills/sorcerer_skill.png',
    spiritborn_skill:  'skills/spiritborn_skill.svg',
    paladin_skill:     'skills/paladin_skill.svg',
    whirlwind: 'skills/whirlwind.png',
    fireball:  'skills/fireball.png',
    ice:       'skills/ice.png',
    lightning: 'skills/lightning.png',
    poison:    'skills/poison.png',
    bone:      'skills/bone.png',
    blood:     'skills/blood.png',
    storm:     'skills/storm.png',
    earth:     'skills/earth.png',
    shadow:    'skills/shadow.png',
    teleport:  'skills/teleport.png',
    shout:     'skills/shout.png',
    leap:      'skills/leap.png',
    minion:    'skills/minion.png',
    trap:      'skills/trap.png',
    dash:      'skills/dash.png',
    holy:      'skills/holy.svg',
    corpse:    'skills/corpse.png',
    golem:     'skills/golem.png',
    raven:     'skills/raven.png',
    wolf:      'skills/wolf.png',
  },
  events: {
    helltide:  'events/helltide.svg',
    worldboss: 'events/worldboss.svg',
    legion:    'events/legion.svg',
    pit:       'events/pit.svg',
    pvp:       'events/pvp.svg',
  },
  ui: {
    avatarPlaceholder: 'ui/avatar-placeholder.svg',
    favicon:           'ui/favicon.svg',
    swordIcon:         'ui/sword-icon.svg',
    skullIcon:         'ui/skull-icon.svg',
    potionIcon:        'ui/potion-icon.svg',
  },
} as const;

export function assetUrl(path: string): string {
  return `${R2_BASE}/${path}`;
}

export function classImage(className: string): string {
  const key = className as keyof typeof ASSETS.classes;
  return assetUrl(ASSETS.classes[key] ?? ASSETS.classes.barbarian);
}

export function itemTypeIcon(
  type: string,
  isMythic = false,
  isUnique = false,
): string {
  if (isMythic) return assetUrl(ASSETS.itemTypes.mythic);
  if (isUnique) return assetUrl(ASSETS.itemTypes.unique);
  const key = type as keyof typeof ASSETS.itemTypes;
  return assetUrl(ASSETS.itemTypes[key] ?? ASSETS.itemTypes.weapon);
}

/**
 * Real D4 inventory icon for a named unique/mythic item, falling back to
 * the type icon (with mythic/unique badge) if we don't have art for it.
 */
export function uniqueItemIcon(
  itemName: string,
  itemType: string,
  isMythic = false,
): string {
  const path = ASSETS.uniques[itemName];
  if (path) return assetUrl(path);
  return itemTypeIcon(itemType, isMythic, true);
}

export function skillIcon(
  iconSlug: string | null,
  skillClass: string,
  skillType: string,
): string {
  if (iconSlug) {
    const key = iconSlug as keyof typeof ASSETS.skills;
    if (ASSETS.skills[key]) return assetUrl(ASSETS.skills[key]);
  }
  const classKey = `${skillClass}_skill` as keyof typeof ASSETS.skills;
  if (ASSETS.skills[classKey]) return assetUrl(ASSETS.skills[classKey]);
  const typeKey = skillType as keyof typeof ASSETS.skills;
  return assetUrl(ASSETS.skills[typeKey] ?? ASSETS.skills.active);
}

export function eventImage(eventType: string): string {
  const key = eventType as keyof typeof ASSETS.events;
  return assetUrl(ASSETS.events[key] ?? ASSETS.events.helltide);
}
