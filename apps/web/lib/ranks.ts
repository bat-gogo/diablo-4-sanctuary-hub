/**
 * Community rank system for Sanctuary Hub. Score is derived from a user's
 * activity (builds, votes received, comments, party requests) — there is no
 * separate "rank" column in the DB, ranks are computed on read.
 */

export type RankTier = {
  name: string;
  nameEn: string;
  minScore: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
};

export const RANKS: RankTier[] = [
  {
    name: 'Нефалем',
    nameEn: 'Nephalem',
    minScore: 0,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-800',
    borderColor: 'border-zinc-600',
    icon: '◈',
    description: 'Новобранец в Sanctuary',
  },
  {
    name: 'Изследовател',
    nameEn: 'Explorer',
    minScore: 10,
    color: 'text-green-400',
    bgColor: 'bg-green-900/40',
    borderColor: 'border-green-700',
    icon: '⟁',
    description: 'Познава пътищата на Sanctuary',
  },
  {
    name: 'Герой',
    nameEn: 'Hero',
    minScore: 50,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/40',
    borderColor: 'border-blue-700',
    icon: '✦',
    description: 'Доказал се в битка',
  },
  {
    name: 'Шампион',
    nameEn: 'Champion',
    minScore: 200,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/40',
    borderColor: 'border-amber-700',
    icon: '❋',
    description: 'Легендарен боец',
  },
  {
    name: 'Легенда',
    nameEn: 'Legend',
    minScore: 1000,
    color: 'text-red-400',
    bgColor: 'bg-red-900/40',
    borderColor: 'border-red-700',
    icon: '✸',
    description: 'Мит в Sanctuary',
  },
];

export type ScoreStats = {
  buildCount: number;
  totalVotesReceived: number;
  commentCount: number;
  partyRequestCount: number;
};

export function calculateScore(s: ScoreStats): number {
  return (
    s.buildCount * 5 +
    Math.max(0, s.totalVotesReceived) * 2 +
    s.commentCount * 1 +
    s.partyRequestCount * 3
  );
}

export function getRank(score: number): RankTier {
  return [...RANKS].reverse().find((r) => score >= r.minScore) ?? RANKS[0];
}

export function getNextRank(score: number): RankTier | null {
  return RANKS.find((r) => r.minScore > score) ?? null;
}
