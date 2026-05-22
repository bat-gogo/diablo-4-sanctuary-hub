import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { classImage } from '../../lib/assets';
import { ClassBadge } from '../../components/ClassBadge';
import { colors, radius, spacing } from '../../lib/theme';

interface PlayerStats {
  buildCount: number;
  totalViews: number;
  voteScore: number;
  commentCount: number;
  partyRequestCount: number;
  score: number;
}

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  season: number;
  isHardcore: boolean;
}

interface PlayerData {
  user: {
    id: string;
    battletag: string;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  characters: Character[];
  stats: PlayerStats;
}

const RANKS = [
  { name: 'Nephalem',  minScore: 0,    icon: '◈', color: '#a1a1aa' },
  { name: 'Explorer',  minScore: 10,   icon: '⟁', color: '#4ade80' },
  { name: 'Hero',      minScore: 50,   icon: '✦', color: '#60a5fa' },
  { name: 'Champion',  minScore: 200,  icon: '❋', color: '#fbbf24' },
  { name: 'Legend',    minScore: 1000, icon: '✸', color: '#f87171' },
];

function rankOf(score: number) {
  return [...RANKS].reverse().find((r) => score >= r.minScore) ?? RANKS[0];
}
function nextRankOf(score: number) {
  return RANKS.find((r) => r.minScore > score) ?? null;
}

export default function ProfileScreen() {
  const { state, logout } = useAuth();
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!state.user) return;
    try {
      const tag = encodeURIComponent(state.user.battletag);
      const res = await api<PlayerData>(`/api/players/${tag}`);
      setData(res);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [state.user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.amber} size="large" style={{ marginTop: spacing.xxl }} />
      </SafeAreaView>
    );
  }

  const rank = rankOf(data.stats.score);
  const next = nextRankOf(data.stats.score);
  const progress = next
    ? Math.round(((data.stats.score - rank.minScore) / (next.minScore - rank.minScore)) * 100)
    : 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.amber}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={{ color: colors.amber, fontSize: 36, fontWeight: '800' }}>
              {data.user.battletag.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.battletag}>
            {data.user.battletag.split('#')[0]}
            <Text style={styles.battletagTag}>  #{data.user.battletag.split('#')[1]}</Text>
          </Text>
          {data.user.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
          <Text style={styles.memberSince}>
            Member since {new Date(data.user.createdAt).toLocaleDateString()}
          </Text>

          {/* Rank */}
          <View style={[styles.rankCard, { borderColor: `${rank.color}80` }]}>
            <Text style={[styles.rankIcon, { color: rank.color }]}>{rank.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankName, { color: rank.color }]}>{rank.name}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              {next ? (
                <Text style={styles.progressLabel}>
                  {data.stats.score - rank.minScore}/{next.minScore - rank.minScore} → {next.name}
                </Text>
              ) : (
                <Text style={[styles.progressLabel, { color: colors.amber }]}>MAX RANK</Text>
              )}
            </View>
            <Text style={[styles.rankScore, { color: rank.color }]}>{data.stats.score}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statGrid}>
          <Stat label="Builds"   value={data.stats.buildCount} />
          <Stat label="Views"    value={data.stats.totalViews} />
          <Stat label="Score"    value={data.stats.voteScore} prefix={data.stats.voteScore > 0 ? '+' : ''} />
          <Stat label="Comments" value={data.stats.commentCount} />
        </View>

        {/* Characters */}
        <Text style={styles.sectionTitle}>Characters</Text>
        {data.characters.length === 0 ? (
          <Text style={styles.empty}>No characters yet — create one on the web app.</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {data.characters.map((c) => (
              <View key={c.id} style={styles.charCard}>
                <Image
                  source={classImage(c.class)}
                  style={styles.charPortrait}
                  contentFit="cover"
                  contentPosition="top"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.charName}>{c.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <ClassBadge d4Class={c.class} size="sm" />
                    <View style={styles.smallChip}>
                      <Text style={styles.smallChipText}>Lvl {c.level}</Text>
                    </View>
                    <View style={[styles.smallChip, { backgroundColor: '#451a0399', borderColor: '#92400e' }]}>
                      <Text style={[styles.smallChipText, { color: '#fcd34d' }]}>S{c.season}</Text>
                    </View>
                    {c.isHardcore && (
                      <View style={[styles.smallChip, { backgroundColor: '#450a0a', borderColor: '#7f1d1d' }]}>
                        <Text style={[styles.smallChipText, { color: colors.red }]}>⚠ HC</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  prefix = '',
}: {
  label: string;
  value: number;
  prefix?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{prefix}{value.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero:      { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#451a03',
    borderColor: colors.amber, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  battletag: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  battletagTag: { color: colors.textMute, fontSize: 18, fontWeight: '600' },
  adminBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm,
    backgroundColor: '#451a0399', borderWidth: 1, borderColor: '#92400e',
  },
  adminBadgeText: { color: '#fcd34d', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  memberSince: { color: colors.textMute, fontSize: 12 },
  rankCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgAlt, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, marginTop: spacing.md,
  },
  rankIcon:  { fontSize: 28, fontWeight: '800' },
  rankName:  { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  rankScore: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.amber },
  progressLabel: { color: colors.textMute, fontSize: 10, marginTop: 4, fontVariant: ['tabular-nums'] },
  statGrid: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  stat: {
    flex: 1, minWidth: '47%',
    backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md,
  },
  statLabel: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  empty: { color: colors.textMute, textAlign: 'center', paddingVertical: spacing.lg },
  charCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.sm,
  },
  charPortrait: { width: 48, height: 48, borderRadius: radius.md },
  charName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  smallChip: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  smallChipText: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
  logout: {
    backgroundColor: '#450a0a', borderColor: '#7f1d1d', borderWidth: 1,
    paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.md,
  },
  logoutText: { color: colors.red, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
});
