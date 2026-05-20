/**
 * R2 asset manifest for Sanctuary Hub.
 *
 * Keys follow `{category}/{slug}.{ext}` where ext reflects what was actually
 * uploaded — real D4 art lives as `.png` (from sunderarmor.com/DIABLO4/...),
 * thematic fallbacks live as `.svg` (game-icons.net, MIT).
 *
 * The bucket is publicly readable at NEXT_PUBLIC_R2_PUBLIC_URL.
 */

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

export const ASSETS = {
  // Real D4 class portraits.
  classes: {
    barbarian:   'classes/barbarian.png',
    druid:       'classes/druid.png',
    necromancer: 'classes/necromancer.png',
    rogue:       'classes/rogue.png',
    sorcerer:    'classes/sorcerer.png',
    spiritborn:  'classes/spiritborn.png',
    paladin:     'classes/paladin.png',
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
  // Mix of real D4 skill PNGs and themed SVG fallbacks.
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
