import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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
import { colors, radius, spacing } from '../../lib/theme';
import { ClassBadge } from '../../components/ClassBadge';

interface BuildLite {
  id: string;
  title: string;
  class: string;
  season: number;
  playstyle: string;
  isFeatured: boolean;
  views: number;
  voteScore: number;
  user: { battletag: string };
}

interface EventsApi {
  helltide:  { nextSpawn: number | null };
  worldBoss: { name: string; nextSpawn: number | null };
  legion:    { nextSpawn: number | null };
  source: 'diablo4.life' | 'calculated';
}

function formatCountdown(target: number | null, now: number): string {
  if (target == null) return '--:--';
  const ms = Math.max(0, target - now);
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const [featured, setFeatured] = useState<BuildLite[]>([]);
  const [events, setEvents] = useState<EventsApi | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [b, e] = await Promise.all([
        api<{ builds: BuildLite[] }>('/api/builds/featured'),
        api<EventsApi>('/api/events'),
      ]);
      setFeatured(b.builds);
      setEvents(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 1Hz tick for countdowns.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.amber}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.tag}>⚔  SANCTUARY HUB</Text>
          <Text style={styles.greet}>
            Welcome,{' '}
            <Text style={{ color: colors.amber }}>
              {state.user?.battletag.split('#')[0]}
            </Text>
          </Text>
        </View>

        {/* Live events */}
        <Text style={styles.sectionTitle}>⚡  Live events</Text>
        {events ? (
          <View style={styles.eventGrid}>
            <EventCard label="Helltide"   target={events.helltide.nextSpawn}  sub="Demonic surge" now={now} />
            <EventCard label="World Boss" target={events.worldBoss.nextSpawn} sub={events.worldBoss.name} now={now} />
            <EventCard label="Legion"     target={events.legion.nextSpawn}    sub="Every 25 min" now={now} />
          </View>
        ) : (
          <ActivityIndicator color={colors.amber} style={{ marginVertical: spacing.lg }} />
        )}
        {events?.source === 'diablo4.life' && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live · diablo4.life</Text>
          </View>
        )}

        {/* Featured */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>★  Featured builds</Text>
        {loading ? (
          <ActivityIndicator color={colors.amber} style={{ marginVertical: spacing.xl }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : featured.length === 0 ? (
          <Text style={styles.empty}>No featured builds yet.</Text>
        ) : (
          <View style={{ gap: spacing.md }}>
            {featured.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push(`/builds/${b.id}`)}
                style={styles.buildCard}
              >
                <Image
                  source={classImage(b.class)}
                  style={styles.buildBg}
                  contentFit="cover"
                  contentPosition="top"
                  transition={200}
                />
                <View style={styles.buildOverlay} />
                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <ClassBadge d4Class={b.class} size="sm" />
                    <View style={styles.seasonChip}>
                      <Text style={styles.seasonChipText}>S{b.season}</Text>
                    </View>
                    {b.isFeatured && (
                      <View style={styles.featuredChip}>
                        <Text style={styles.featuredChipText}>★ FEATURED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.buildTitle} numberOfLines={2}>
                    {b.title}
                  </Text>
                  <View style={styles.buildMeta}>
                    <Text style={styles.buildMetaText}>
                      by {b.user.battletag.split('#')[0]}
                    </Text>
                    <Text style={styles.buildMetaText}>
                      👁 {b.views.toLocaleString()}   ▲ {b.voteScore > 0 ? '+' : ''}{b.voteScore}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({
  label,
  sub,
  target,
  now,
}: {
  label: string;
  sub: string;
  target: number | null;
  now: number;
}) {
  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventLabel}>{label}</Text>
      <Text style={styles.eventTime}>{formatCountdown(target, now)}</Text>
      <Text style={styles.eventSub} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header:    { marginBottom: spacing.lg },
  tag:       { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  greet:     { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  eventGrid: { flexDirection: 'row', gap: spacing.sm },
  eventCard: {
    flex: 1, backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md, gap: 4, minHeight: 90,
  },
  eventLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  eventTime:  { color: colors.amber, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  eventSub:   { color: colors.textMute, fontSize: 10 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill,
    backgroundColor: '#052e16', borderWidth: 1, borderColor: '#14532d', marginTop: spacing.sm,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  liveBadgeText: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  buildCard: {
    backgroundColor: colors.bgAlt, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', position: 'relative',
    minHeight: 140,
  },
  buildBg:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 },
  buildOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,9,11,0.6)' },
  buildTitle:  { color: colors.text, fontSize: 17, fontWeight: '700' },
  buildMeta:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  buildMetaText: { color: colors.textMute, fontSize: 12 },
  seasonChip: { backgroundColor: '#451a0399', borderColor: '#92400e', borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  seasonChipText: { color: '#fcd34d', fontSize: 10, fontWeight: '800' },
  featuredChip: { backgroundColor: colors.amber, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  featuredChipText: { color: '#18181b', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  empty: { color: colors.textMute, textAlign: 'center', paddingVertical: spacing.xl },
  error: { color: colors.red, backgroundColor: '#450a0a', padding: spacing.md, borderRadius: radius.md },
});
