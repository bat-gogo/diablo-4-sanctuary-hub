export * from './assets';

import type { InferSelectModel } from 'drizzle-orm';
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
  ROLES,
  PLAYSTYLES,
  ACTIVITIES,
  SKILL_TYPES,
  ITEM_TYPES,
  PARTY_STATUSES,
} from '@sanctuary-hub/db';

// Row select types
export type User = InferSelectModel<typeof users>;
export type Character = InferSelectModel<typeof characters>;
export type Skill = InferSelectModel<typeof skills>;
export type Item = InferSelectModel<typeof items>;
export type Build = InferSelectModel<typeof builds>;
export type BuildSkill = InferSelectModel<typeof buildSkills>;
export type PartyRequest = InferSelectModel<typeof partyRequests>;
export type Comment = InferSelectModel<typeof comments>;
export type Vote = InferSelectModel<typeof votes>;

// String-literal unions derived from the enum tuples in packages/db
export type ClassType = (typeof CLASSES)[number];
export type RoleType = (typeof ROLES)[number];
export type PlaystyleType = (typeof PLAYSTYLES)[number];
export type ActivityType = (typeof ACTIVITIES)[number];
export type SkillTypeKind = (typeof SKILL_TYPES)[number];
export type ItemTypeKind = (typeof ITEM_TYPES)[number];
export type PartyStatusType = (typeof PARTY_STATUSES)[number];

// Convenience: standard API envelope used across REST endpoints
export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: {
    nextCursor?: string | null;
    pageSize?: number;
    total?: number;
  };
};
