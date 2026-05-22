import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { classImage } from '../../lib/assets';
import { ClassBadge } from '../../components/ClassBadge';
import { classColors, colors, radius, spacing } from '../../lib/theme';

const CLASSES = [
  'barbarian', 'druid', 'necromancer', 'rogue',
  'sorcerer', 'spiritborn', 'paladin', 'warlock',
];

interface BuildLite {
  id: string;
  title: string;
  class: string;
  season: number;
  playstyle: string;
  views: number;
  voteScore: number;
  user: { battletag: string };
}

export default function BuildsScreen() {
  const router = useRouter();
  const [builds, setBuilds] = useState<BuildLite[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search input.
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(
    async (append: boolean = false, currentCursor: string | null = null) => {
      const params = new URLSearchParams({ limit: '20' });
      if (filterClass) params.set('class', filterClass);
      if (debounced) params.set('search', debounced);
      if (append && currentCursor) params.set('cursor', currentCursor);

      try {
        const res = await api<{ builds: BuildLite[]; nextCursor: string | null }>(
          `/api/builds?${params}`,
        );
        if (append) {
          setBuilds((prev) => [...prev, ...res.builds]);
        } else {
          setBuilds(res.builds);
        }
        setCursor(res.nextCursor);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filterClass, debounced],
  );

  useEffect(() => {
    setLoading(true);
    void load(false, null);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.tag}>⚔  BUILDS</Text>
        <Text style={styles.title}>Browse builds</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title…"
          placeholderTextColor={colors.textMute}
          style={styles.search}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: spacing.sm }}
        >
          <FilterChip
            label="All"
            active={filterClass == null}
            onPress={() => setFilterClass(null)}
          />
          {CLASSES.map((c) => (
            <FilterChip
              key={c}
              label={c}
              active={filterClass === c}
              color={classColors[c]}
              onPress={() => setFilterClass(filterClass === c ? null : c)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.amber} size="large" style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={builds}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.amber}
              onRefresh={() => {
                setRefreshing(true);
                void load(false, null);
              }}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (cursor && !loadingMore) {
              setLoadingMore(true);
              void load(true, cursor);
            }
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No builds match these filters.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.amber} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
          renderItem={({ item: b }) => (
            <Pressable
              onPress={() => router.push(`/builds/${b.id}`)}
              style={styles.buildCard}
            >
              <Image
                source={classImage(b.class)}
                style={styles.buildBg}
                contentFit="cover"
                contentPosition="top"
              />
              <View style={styles.buildOverlay} />
              <View style={{ padding: spacing.md, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <ClassBadge d4Class={b.class} size="sm" />
                  <View style={styles.seasonChip}>
                    <Text style={styles.seasonChipText}>S{b.season}</Text>
                  </View>
                  <Text style={styles.playstyle}>{b.playstyle}</Text>
                </View>
                <Text style={styles.buildTitle} numberOfLines={2}>{b.title}</Text>
                <View style={styles.buildMeta}>
                  <Text style={styles.buildMetaText}>by {b.user.battletag.split('#')[0]}</Text>
                  <Text style={styles.buildMetaText}>
                    👁 {b.views.toLocaleString()}   ▲ {b.voteScore > 0 ? '+' : ''}{b.voteScore}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && {
          backgroundColor: color ?? colors.amber,
          borderColor: color ?? colors.amber,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && { color: '#18181b', fontWeight: '800' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  header:  { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tag:     { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  title:   { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.sm },
  search: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  chipText: { color: colors.textDim, fontSize: 12, textTransform: 'capitalize' },
  buildCard: {
    backgroundColor: colors.bgAlt, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', position: 'relative',
    minHeight: 130,
  },
  buildBg:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 },
  buildOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,9,11,0.55)' },
  buildTitle:   { color: colors.text, fontSize: 16, fontWeight: '700' },
  buildMeta:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  buildMetaText:{ color: colors.textMute, fontSize: 12 },
  seasonChip:   { backgroundColor: '#451a0399', borderColor: '#92400e', borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  seasonChipText: { color: '#fcd34d', fontSize: 10, fontWeight: '800' },
  playstyle:    { color: colors.textMute, fontSize: 11, textTransform: 'capitalize', marginLeft: 4 },
  empty: { color: colors.textMute, textAlign: 'center', marginTop: spacing.xxl },
});
