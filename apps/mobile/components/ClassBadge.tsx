import { StyleSheet, Text, View } from 'react-native';
import { classColors, radius } from '../lib/theme';

interface Props {
  d4Class: string;
  size?: 'sm' | 'md';
}

export function ClassBadge({ d4Class, size = 'md' }: Props) {
  const color = classColors[d4Class] ?? '#71717a';
  const fontSize = size === 'sm' ? 9 : 11;
  const padH = size === 'sm' ? 6 : 8;
  const padV = size === 'sm' ? 2 : 4;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}33`, borderColor: `${color}80`, paddingHorizontal: padH, paddingVertical: padV },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize }]}>{d4Class.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontWeight: '700', letterSpacing: 0.5 },
});
