'use client';

const COLOR_FILTERS: Record<string, string> = {
  amber:  'invert(80%) sepia(50%) saturate(500%) hue-rotate(5deg) brightness(1.1)',
  gold:   'invert(85%) sepia(60%) saturate(700%) hue-rotate(10deg)',
  red:    'invert(30%) sepia(90%) saturate(700%) hue-rotate(330deg) brightness(1.2)',
  purple: 'invert(40%) sepia(60%) saturate(500%) hue-rotate(240deg)',
  green:  'invert(60%) sepia(50%) saturate(400%) hue-rotate(90deg)',
  teal:   'invert(70%) sepia(40%) saturate(400%) hue-rotate(150deg)',
  blue:   'invert(50%) sepia(60%) saturate(500%) hue-rotate(190deg)',
  white:  'invert(100%)',
  gray:   'invert(60%)',
};

/** Map D4 class → preferred icon tint. */
export const CLASS_ICON_COLORS: Record<string, keyof typeof COLOR_FILTERS> = {
  barbarian:   'red',
  druid:       'green',
  necromancer: 'purple',
  rogue:       'gold',
  sorcerer:    'blue',
  spiritborn:  'teal',
  paladin:     'amber',
};

interface GameIconProps {
  src: string;
  alt: string;
  size?: number;
  color?: keyof typeof COLOR_FILTERS;
  className?: string;
}

/**
 * Display an icon from the R2 assets bucket. For SVGs we apply a CSS filter
 * for tinting (since game-icons are black/transparent by default). For PNGs
 * (real D4 art) we render as-is.
 */
export function GameIcon({
  src,
  alt,
  size = 32,
  color = 'amber',
  className = '',
}: GameIconProps) {
  const isSvg = src.endsWith('.svg') || src.includes('.svg?');
  const style: React.CSSProperties = isSvg
    ? { filter: COLOR_FILTERS[color] ?? COLOR_FILTERS.amber, width: size, height: size }
    : { width: size, height: size };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={style}
      className={`inline-block ${className}`}
    />
  );
}
