import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../lib/theme';

interface PartyReq {
  id: string;
  activity: string;
  description: string | null;
  minLevel: number;
  spotsTotal: number;
  spotsFilled: number;
  status: string;
  createdAt: string;
  user: { id: string; battletag: string };
}

const ACTIVITIES = [
  { key: 'helltide',          label: 'Helltide' },
  { key: 'world_boss',        label: 'World Boss' },
  { key: 'nightmare_dungeon', label: 'NMD' },
  { key: 'uber_boss',         label: 'Uber Boss' },
  { key: 'pit',               label: 'Pit' },
  { key: 'pvp',               label: 'PvP' },
  { key: 'leveling',          label: 'Leveling' },
];

const ACTIVITY_COLOR: Record<string, string> = {
  helltide: '#e11d48',
  world_boss: '#a855f7',
  nightmare_dungeon: '#f97316',
  uber_boss: '#ef4444',
  pit: '#71717a',
  pvp: '#8b5cf6',
  leveling: '#22c55e',
};

export default function PartyScreen() {
  const { state } = useAuth();
  const [items, setItems] = useState<PartyReq[]>([]);
  const [activity, setActivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: '40', status: 'open' });
    if (activity) params.set('activity', activity);
    try {
      const res = await api<{ requests: PartyReq[] }>(`/api/party?${params}`);
      setItems(res.requests);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activity]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function join(id: string) {
    try {
      await api(`/api/party/${id}/join`, { method: 'POST', token: state.token });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to join');
    }
  }

  async function remove(id: string) {
    if (!state.token) return;
    try {
      await api(`/api/party/${id}`, { method: 'DELETE', token: state.token });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.tag}>☰  LFG</Text>
            <Text style={styles.title}>Party Finder</Text>
          </View>
          <Pressable onPress={() => setCreateOpen(true)} style={styles.newBtn}>
            <Text style={styles.newBtnText}>+ Post</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: spacing.sm }}
        >
          <Chip label="All" active={activity == null} onPress={() => setActivity(null)} />
          {ACTIVITIES.map((a) => (
            <Chip
              key={a.key}
              label={a.label}
              active={activity === a.key}
              color={ACTIVITY_COLOR[a.key]}
              onPress={() => setActivity(activity === a.key ? null : a.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.amber} size="large" style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
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
          ListEmptyComponent={<Text style={styles.empty}>No open parties.</Text>}
          renderItem={({ item: r }) => {
            const isOwner = r.user.id === state.user?.id;
            const isFull = r.spotsFilled >= r.spotsTotal;
            const canJoin = !!state.user && !isOwner && !isFull && r.status === 'open';
            const color = ACTIVITY_COLOR[r.activity] ?? '#71717a';
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View
                    style={[styles.activityChip, { backgroundColor: `${color}33`, borderColor: `${color}80` }]}
                  >
                    <Text style={[styles.activityChipText, { color }]}>
                      {r.activity.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>Lvl {r.minLevel}+</Text>
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>
                  {r.description ?? '—'}
                </Text>

                <View style={styles.cardFoot}>
                  <Text style={styles.metaText}>
                    by {r.user.battletag.split('#')[0]}
                  </Text>
                  <Text
                    style={[
                      styles.spots,
                      {
                        color:
                          r.spotsFilled >= r.spotsTotal
                            ? colors.red
                            : r.spotsTotal - r.spotsFilled === 1
                            ? '#f97316'
                            : colors.green,
                      },
                    ]}
                  >
                    {r.spotsFilled}/{r.spotsTotal}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                  {canJoin ? (
                    <Pressable style={styles.joinBtn} onPress={() => join(r.id)}>
                      <Text style={styles.joinBtnText}>+ Join</Text>
                    </Pressable>
                  ) : (
                    <Text style={[styles.metaText, { fontStyle: 'italic' }]}>
                      {isOwner ? 'Your request' : isFull ? 'No spots left' : 'Not accepting'}
                    </Text>
                  )}
                  {isOwner && (
                    <Pressable style={styles.deleteBtn} onPress={() => remove(r.id)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <CreatePartyModal
        visible={createOpen}
        token={state.token}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />
    </SafeAreaView>
  );
}

function Chip({
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
        style={[styles.chipText, active && { color: '#18181b', fontWeight: '800' }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CreatePartyModal({
  visible,
  token,
  onClose,
  onCreated,
}: {
  visible: boolean;
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [activity, setActivity] = useState('helltide');
  const [description, setDescription] = useState('');
  const [minLevel, setMinLevel] = useState('60');
  const [spotsTotal, setSpotsTotal] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api('/api/party', {
        method: 'POST',
        token,
        body: {
          activity,
          description: description || undefined,
          minLevel: Number(minLevel),
          spotsTotal,
        },
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.modalTitle}>Looking for group</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.textMute, fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.modalLabel}>Activity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {ACTIVITIES.map((a) => (
              <Chip
                key={a.key}
                label={a.label}
                active={activity === a.key}
                color={ACTIVITY_COLOR[a.key]}
                onPress={() => setActivity(a.key)}
              />
            ))}
          </ScrollView>

          <Text style={styles.modalLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's the plan?"
            placeholderTextColor={colors.textMute}
            multiline
            maxLength={500}
            style={[styles.input, { height: 80 }]}
          />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Min level</Text>
              <TextInput
                value={minLevel}
                onChangeText={setMinLevel}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Spots</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[2, 3, 4].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setSpotsTotal(n)}
                    style={[
                      styles.spotBtn,
                      spotsTotal === n && { backgroundColor: colors.amber, borderColor: colors.amber },
                    ]}
                  >
                    <Text
                      style={{
                        color: spotsTotal === n ? '#18181b' : colors.text,
                        fontWeight: '800',
                      }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            disabled={submitting}
            onPress={submit}
          >
            {submitting ? (
              <ActivityIndicator color="#18181b" />
            ) : (
              <Text style={styles.primaryBtnText}>Post party</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  header:  { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tag:     { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  title:   { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.sm },
  newBtn:  { backgroundColor: colors.amber, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  newBtnText: { color: '#18181b', fontWeight: '800', fontSize: 14 },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  chipText: { color: colors.textDim, fontSize: 12 },
  card: {
    backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  activityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1, alignSelf: 'flex-start' },
  activityChipText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
  cardDesc:  { color: colors.text, fontSize: 14, lineHeight: 19 },
  cardFoot:  { flexDirection: 'row', justifyContent: 'space-between' },
  metaText:  { color: colors.textMute, fontSize: 12 },
  spots:     { fontWeight: '800', fontVariant: ['tabular-nums'] },
  joinBtn:   { backgroundColor: colors.amber, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  joinBtnText: { color: '#18181b', fontWeight: '800', fontSize: 13 },
  deleteBtn: { borderColor: colors.red, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  deleteBtnText: { color: colors.red, fontWeight: '700', fontSize: 13 },
  empty: { color: colors.textMute, textAlign: 'center', marginTop: spacing.xxl },
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bgAlt, padding: spacing.lg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.md,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  modalLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, fontSize: 14,
  },
  spotBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.amber, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  primaryBtnText: { color: '#18181b', fontWeight: '800', fontSize: 15 },
  errorText: { color: colors.red, fontSize: 13 },
});
