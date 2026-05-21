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

const PLAYSTYLE_ENUM = [
  'leveling',
  'endgame',
  'pit',
  'helltide',
  'pvp',
] as const;

export const buildSchema = z.object({
  title: z.string().min(3).max(128),
  description: z.string().max(5000).optional(),
  class: z.enum(CLASS_ENUM),
  season: z.number().int().min(1).max(20),
  playstyle: z.enum(PLAYSTYLE_ENUM),
  skillIds: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        rank: z.number().int().min(1).max(5),
        slot: z.number().int().min(0).max(7),
      }),
    )
    .min(1)
    .max(8),
});

export type BuildInput = z.infer<typeof buildSchema>;

export const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});
