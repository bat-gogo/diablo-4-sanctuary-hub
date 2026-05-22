/**
 * Shared design tokens for the Expo app. Mirrors the web app's
 * zinc + amber palette so the two clients feel consistent.
 */

export const colors = {
  bg:        '#09090b', // zinc-950
  bgAlt:     '#18181b', // zinc-900
  card:      '#27272a', // zinc-800
  border:    '#3f3f46', // zinc-700
  borderAlt: '#52525b', // zinc-600
  text:      '#fafafa', // zinc-50
  textDim:   '#a1a1aa', // zinc-400
  textMute:  '#71717a', // zinc-500
  amber:     '#f59e0b',
  amberDim:  '#fbbf24',
  red:       '#ef4444',
  green:     '#22c55e',
  blue:      '#3b82f6',
};

export const classColors: Record<string, string> = {
  barbarian:   '#ef4444',
  druid:       '#22c55e',
  necromancer: '#a855f7',
  rogue:       '#eab308',
  sorcerer:    '#3b82f6',
  spiritborn:  '#14b8a6',
  paladin:     '#f59e0b',
  warlock:     '#64748b',
};

export const playstyleColors: Record<string, string> = {
  leveling: '#71717a',
  endgame:  '#f97316',
  pit:      '#ef4444',
  helltide: '#e11d48',
  pvp:      '#8b5cf6',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };
