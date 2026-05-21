import { z } from 'zod';

const CLASS_ENUM = [
  'barbarian',
  'druid',
  'necromancer',
  'rogue',
  'sorcerer',
  'spiritborn',
  'paladin',
  'warlock',
] as const;

export const characterSchema = z.object({
  name: z.string().min(1).max(64),
  class: z.enum(CLASS_ENUM),
  level: z.number().int().min(1).max(100),
  season: z.number().int().min(1).max(20),
  isHardcore: z.boolean().default(false).optional(),
});

export type CharacterInput = z.infer<typeof characterSchema>;
