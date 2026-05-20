import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────
// Enum value lists (kept as plain string tuples so we can reuse
// them in shared type unions in packages/types)
// ─────────────────────────────────────────────────────────────

export const ROLES = ['guest', 'user', 'admin'] as const;

export const CLASSES = [
  'barbarian',
  'druid',
  'necromancer',
  'rogue',
  'sorcerer',
  'spiritborn',
  'paladin',
] as const;

export const SKILL_TYPES = ['active', 'passive', 'ultimate'] as const;

export const ITEM_TYPES = [
  'weapon',
  'armor',
  'jewelry',
  'offhand',
  'helm',
  'chest',
  'gloves',
  'boots',
  'pants',
] as const;

export const PLAYSTYLES = [
  'leveling',
  'endgame',
  'pit',
  'helltide',
  'pvp',
] as const;

export const ACTIVITIES = [
  'helltide',
  'world_boss',
  'nightmare_dungeon',
  'uber_boss',
  'pit',
  'pvp',
  'leveling',
] as const;

export const PARTY_STATUSES = ['open', 'full', 'closed'] as const;

// ─────────────────────────────────────────────────────────────
// 1. users
// ─────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  battletag: varchar('battletag', { length: 64 }).notNull().unique(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 256 }).notNull(),
  role: text('role', { enum: ROLES }).notNull().default('user'),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// 2. characters
// ─────────────────────────────────────────────────────────────

export const characters = pgTable(
  'characters',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 64 }).notNull(),
    class: text('class', { enum: CLASSES }).notNull(),
    level: integer('level').notNull().default(1),
    season: integer('season').notNull(),
    isHardcore: boolean('is_hardcore').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('characters_user_idx').on(t.userId),
  }),
);

// ─────────────────────────────────────────────────────────────
// 3. skills
// ─────────────────────────────────────────────────────────────

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 128 }).notNull(),
    class: text('class', { enum: CLASSES }).notNull(),
    description: text('description'),
    maxRank: integer('max_rank').notNull().default(5),
    type: text('type', { enum: SKILL_TYPES }).notNull(),
    iconSlug: varchar('icon_slug', { length: 128 }),
  },
  (t) => ({
    classIdx: index('skills_class_idx').on(t.class),
  }),
);

// ─────────────────────────────────────────────────────────────
// 4. items
// ─────────────────────────────────────────────────────────────

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 256 }).notNull(),
    type: text('type', { enum: ITEM_TYPES }).notNull(),
    classRestriction: text('class_restriction', { enum: CLASSES }),
    isUnique: boolean('is_unique').notNull().default(false),
    isMythic: boolean('is_mythic').notNull().default(false),
    description: text('description'),
    requiredLevel: integer('required_level').notNull().default(1),
  },
  (t) => ({
    typeIdx: index('items_type_idx').on(t.type),
    classRestrictionIdx: index('items_class_restriction_idx').on(t.classRestriction),
  }),
);

// ─────────────────────────────────────────────────────────────
// 5. builds
// ─────────────────────────────────────────────────────────────

export const builds = pgTable(
  'builds',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 128 }).notNull(),
    description: text('description'),
    class: text('class', { enum: CLASSES }).notNull(),
    season: integer('season').notNull(),
    playstyle: text('playstyle', { enum: PLAYSTYLES }).notNull(),
    isFeatured: boolean('is_featured').notNull().default(false),
    views: integer('views').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    classSeasonIdx: index('builds_class_season_idx').on(t.class, t.season),
    userIdx: index('builds_user_idx').on(t.userId),
    featuredIdx: index('builds_featured_idx').on(t.isFeatured),
    createdAtIdx: index('builds_created_at_idx').on(t.createdAt.desc()),
  }),
);

// ─────────────────────────────────────────────────────────────
// 6. buildSkills
// ─────────────────────────────────────────────────────────────

export const buildSkills = pgTable(
  'build_skills',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    buildId: uuid('build_id')
      .notNull()
      .references(() => builds.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull().default(1),
    slot: integer('slot').notNull(),
  },
  (t) => ({
    buildIdx: index('build_skills_build_idx').on(t.buildId),
    skillIdx: index('build_skills_skill_idx').on(t.skillId),
  }),
);

// ─────────────────────────────────────────────────────────────
// 7. partyRequests
// ─────────────────────────────────────────────────────────────

export const partyRequests = pgTable(
  'party_requests',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activity: text('activity', { enum: ACTIVITIES }).notNull(),
    description: text('description'),
    minLevel: integer('min_level').notNull().default(1),
    spotsTotal: integer('spots_total').notNull().default(4),
    spotsFilled: integer('spots_filled').notNull().default(0),
    status: text('status', { enum: PARTY_STATUSES }).notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusActivityIdx: index('party_requests_status_activity_idx').on(
      t.status,
      t.activity,
    ),
    userIdx: index('party_requests_user_idx').on(t.userId),
  }),
);

// ─────────────────────────────────────────────────────────────
// 8. comments
// ─────────────────────────────────────────────────────────────

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    buildId: uuid('build_id')
      .notNull()
      .references(() => builds.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    buildIdx: index('comments_build_idx').on(t.buildId),
    userIdx: index('comments_user_idx').on(t.userId),
  }),
);

// ─────────────────────────────────────────────────────────────
// 9. votes
// ─────────────────────────────────────────────────────────────

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    buildId: uuid('build_id')
      .notNull()
      .references(() => builds.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userBuildUnique: uniqueIndex('votes_user_build_unique').on(t.userId, t.buildId),
    buildIdx: index('votes_build_idx').on(t.buildId),
    userIdx: index('votes_user_idx').on(t.userId),
  }),
);

// ─────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  builds: many(builds),
  partyRequests: many(partyRequests),
  comments: many(comments),
  votes: many(votes),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
}));

export const buildsRelations = relations(builds, ({ one, many }) => ({
  author: one(users, {
    fields: [builds.userId],
    references: [users.id],
  }),
  buildSkills: many(buildSkills),
  comments: many(comments),
  votes: many(votes),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  buildSkills: many(buildSkills),
}));

export const buildSkillsRelations = relations(buildSkills, ({ one }) => ({
  build: one(builds, {
    fields: [buildSkills.buildId],
    references: [builds.id],
  }),
  skill: one(skills, {
    fields: [buildSkills.skillId],
    references: [skills.id],
  }),
}));

export const partyRequestsRelations = relations(partyRequests, ({ one }) => ({
  user: one(users, {
    fields: [partyRequests.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  build: one(builds, {
    fields: [comments.buildId],
    references: [builds.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  build: one(builds, {
    fields: [votes.buildId],
    references: [builds.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// Schema bundle (handy for db client and migrations)
// ─────────────────────────────────────────────────────────────

export const schema = {
  users,
  characters,
  skills,
  items,
  builds,
  buildSkills,
  partyRequests,
  comments,
  votes,
  usersRelations,
  charactersRelations,
  skillsRelations,
  buildsRelations,
  buildSkillsRelations,
  partyRequestsRelations,
  commentsRelations,
  votesRelations,
};
