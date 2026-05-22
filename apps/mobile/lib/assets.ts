/**
 * R2 asset URL helper for the mobile app. The shared @sanctuary-hub/types
 * package reads NEXT_PUBLIC_R2_PUBLIC_URL which only exists on web — here
 * we read EXPO_PUBLIC_R2_PUBLIC_URL with a baked-in default so the bundle
 * always knows where the assets live, even when the env var is missing.
 */
const R2_BASE =
  process.env.EXPO_PUBLIC_R2_PUBLIC_URL ??
  'https://pub-2d890d5d6d8d4694973387ba2949550d.r2.dev';

export function assetUrl(path: string): string {
  return `${R2_BASE}/${path}`;
}

export function classImage(d4Class: string): string {
  return assetUrl(`classes/${d4Class.toLowerCase()}.webp`);
}

export function skillIcon(
  iconSlug: string | null,
  d4Class: string,
  type: string,
): string {
  if (iconSlug) {
    // Try the archetype mapping first (matches the web asset manifest).
    const KNOWN = new Set([
      'whirlwind', 'fireball', 'ice', 'lightning', 'poison',
      'bone', 'blood', 'storm', 'earth', 'shadow',
      'teleport', 'shout', 'leap', 'minion', 'trap',
      'dash', 'holy', 'corpse', 'golem', 'raven', 'wolf',
    ]);
    if (KNOWN.has(iconSlug)) {
      const ext = ['holy', 'active', 'passive', 'ultimate'].includes(iconSlug)
        ? 'svg'
        : 'png';
      return assetUrl(`skills/${iconSlug}.${ext}`);
    }
  }
  // Class-scoped fallback (e.g. barbarian_skill.png).
  const classKey = `${d4Class}_skill`;
  if (['barbarian', 'druid', 'necromancer', 'rogue', 'sorcerer'].includes(d4Class)) {
    return assetUrl(`skills/${classKey}.png`);
  }
  // Otherwise generic SVG by type.
  return assetUrl(`skills/${type}.svg`);
}
