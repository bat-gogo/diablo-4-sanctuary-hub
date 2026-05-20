import { z } from 'zod';

const ACTIVITY_ENUM = [
  'helltide',
  'world_boss',
  'nightmare_dungeon',
  'uber_boss',
  'pit',
  'pvp',
  'leveling',
] as const;

export const partyRequestSchema = z.object({
  activity: z.enum(ACTIVITY_ENUM),
  description: z.string().max(500).optional(),
  minLevel: z.number().int().min(1).max(100),
  spotsTotal: z.number().int().min(2).max(4),
});

export type PartyRequestInput = z.infer<typeof partyRequestSchema>;
