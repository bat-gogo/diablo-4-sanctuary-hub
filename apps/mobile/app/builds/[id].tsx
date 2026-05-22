import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { classImage, skillIcon } from '../../lib/assets';
import { ClassBadge } from '../../components/ClassBadge';
import { colors, playstyleColors, radius, spacing } from '../../lib/theme';

interface BuildDetail {
  id: string;
  title: string;
  description: string | null;
  class: string;
  season: number;
  playstyle: string;
  isFeatured: boolean;
  views: number;
  voteScore: number;
  commentCount: number;
  createdAt: string;
  user: { id: string; battletag: string };
  buildSkills: Array<{
    slot: number;
    rank: number;
    skill: {
      id: string;
      name: string;
      type: 'active' | 'passive' | 'ultimate';
      iconSlug: string | null;
    };
  }>;
}

export default function BuildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useAuth();
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteScore, setVoteScore] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<{ build: BuildDetail }>(`/api/builds/${id}`);
      setBuild(res.build);
      setVoteScore(res.build.voteScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function vote(value: 1 | -1) {
    if (!state.token || !build) return;
    setVoting(true);
    try {
      const res = await api<{ voteScore: number }>(
        `/api/builds/${build.id}/vote`,
        { method: 'POST', token: state.token, body: { value } },
      );
      setVoteScore(res.voteScore);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Vote failed');
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.amber} size="large" style={{ marginTop: spacing.xxl }} />
      </SafeAreaView>
    );
  }

  if (error || !build) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: spacing.lg, alignItems: 'center', gap: spacing.md }}>
          <Text style={styles.errorText}>{error ?? 'Build not found'}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const active   = build.buildSkills.filter((s) => s.skill.type === 'active');
  const passive  = build.buildSkills.filter((s) => s.skill.type === 'passive');
  const ultimate = build.buildSkills.filter((s) => s.skill.type === 'ultimate');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={classImage(build.class)}
          style={styles.heroBg}
          contentFit="cover"
          contentPosition="top"
        />
        <View style={styles.heroOverlay} />

        <Pressable onPress={() => router.back()} style={styles.backBtnInline}>
          <Text style={styles.backBtnInlineText}>← Builds</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <ClassBadge d4Class={build.class} />
          <View
            style={[
              styles.smallChip,
              {
                backgroundColor: `${playstyleColors[build.playstyle] ?? '#52525b'}33`,
                borderColor: `${playstyleColors[build.playstyle] ?? '#52525b'}80`,
              },
            ]}
          >
            <Text style={[styles.smallChipText, { color: playstyleColors[build.playstyle] ?? colors.text }]}>
              {build.playstyle.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.smallChip, { backgroundColor: '#451a0399', borderColor: '#92400e' }]}>
            <Text style={[styles.smallChipText, { color: '#fcd34d' }]}>S{build.season}</Text>
          </View>
          {build.isFeatured && (
            <View style={[styles.smallChip, { backgroundColor: colors.amber }]}>
              <Text style={[styles.smallChipText, { color: '#18181b' }]}>★ FEATURED</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{build.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            by <Text style={{ color: colors.text }}>{build.user.battletag.split('#')[0]}</Text>
          </Text>
          <Text style={styles.metaText}>👁 {build.views.toLocaleString()}</Text>
          <Text style={[styles.metaText, voteScore != null && voteScore > 0 && { color: colors.green }]}>
            ▲ {voteScore != null && voteScore > 0 ? '+' : ''}{voteScore ?? build.voteScore}
          </Text>
          <Text style={styles.metaText}>💬 {build.commentCount}</Text>
        </View>

        {/* Vote buttons */}
        {state.user && state.user.id !== build.user.id && (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              style={[styles.voteBtn, { borderColor: colors.green }]}
              onPress={() => vote(1)}
              disabled={voting}
            >
              <Text style={[styles.voteBtnText, { color: colors.green }]}>▲ Upvote</Text>
            </Pressable>
            <Pressable
              style={[styles.voteBtn, { borderColor: colors.red }]}
              onPress={() => vote(-1)}
              disabled={voting}
            >
              <Text style={[styles.voteBtnText, { color: colors.red }]}>▼ Downvote</Text>
            </Pressable>
          </View>
        )}

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.descCard}>
          <Text style={styles.descText}>
            {build.description ?? <Text style={{ color: colors.textMute }}>No description.</Text>}
          </Text>
        </View>

        {/* Skill kit */}
        {build.buildSkills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Skill kit{' '}
              <Text style={{ color: colors.textMute, fontWeight: '400', fontSize: 14 }}>
                ({build.buildSkills.length})
              </Text>
            </Text>
            <SkillGroup label="Active"   skills={active}   d4Class={build.class} />
            <SkillGroup label="Passive"  skills={passive}  d4Class={build.class} />
            <SkillGroup label="Ultimate" skills={ultimate} d4Class={build.class} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SkillGroup({
  label,
  skills,
  d4Class,
}: {
  label: string;
  skills: BuildDetail['buildSkills'];
  d4Class: string;
}) {
  if (skills.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={{ gap: 6 }}>
        {skills.map(({ skill, rank }) => (
          <View key={skill.id} style={styles.skillCard}>
            <Image
              source={skillIcon(skill.iconSlug, d4Class, skill.type)}
              style={styles.skillIcon}
              contentFit="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillSub}>
                Rank {rank} · {skill.type}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  hero:    { height: 200, position: 'relative', backgroundColor: colors.bgAlt },
  heroBg:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.55 },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'transparent',
  },
  backBtnInline: {
    position: 'absolute', top: spacing.lg, left: spacing.lg,
    backgroundColor: 'rgba(9,9,11,0.7)', paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, borderColor: colors.border, borderWidth: 1,
  },
  backBtnInlineText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  backBtn: { padding: spacing.md, backgroundColor: colors.bgAlt, borderRadius: radius.md },
  backBtnText: { color: colors.text },
  errorText: { color: colors.red, fontSize: 15 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', lineHeight: 32 },
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomColor: colors.border, borderBottomWidth: 1,
  },
  metaText: { color: colors.textDim, fontSize: 13 },
  voteBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center', backgroundColor: colors.bgAlt,
  },
  voteBtnText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: spacing.md },
  descCard: {
    backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md,
  },
  descText: { color: colors.textDim, fontSize: 14, lineHeight: 21 },
  groupLabel: {
    color: colors.textDim, fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: spacing.sm,
  },
  skillCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.sm,
  },
  skillIcon: { width: 36, height: 36, borderRadius: 6 },
  skillName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  skillSub: { color: colors.textMute, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  smallChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1 },
  smallChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
