import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../lib/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [battletag, setBattletag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = password === confirm;

  async function submit() {
    setSubmitting(true);
    setError(null);
    if (!matches) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }
    try {
      await register(battletag, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>⚔  SANCTUARY HUB</Text>
            <Text style={styles.tagline}>Join the community</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>

            <Text style={styles.label}>Battletag</Text>
            <TextInput
              value={battletag}
              onChangeText={setBattletag}
              placeholder="Name#1234"
              placeholderTextColor={colors.textMute}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.hint}>format: Name#1234 (3–12 letter name, 4-digit tag)</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMute}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMute}
              autoCapitalize="none"
              secureTextEntry
              style={styles.input}
            />

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              placeholderTextColor={colors.textMute}
              autoCapitalize="none"
              secureTextEntry
              style={[styles.input, !matches && confirm.length > 0 && { borderColor: colors.red }]}
            />
            {!matches && confirm.length > 0 && (
              <Text style={{ color: colors.red, fontSize: 12 }}>Passwords don&apos;t match</Text>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.btnPrimary, submitting && { opacity: 0.6 }]}
              disabled={submitting || !battletag || !email || !password || !matches}
              onPress={submit}
            >
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.btnPrimaryText}>Create account</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" replace style={styles.footerLink}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg },
  header:    { alignItems: 'center', marginTop: spacing.xl },
  logo:      { color: colors.amber, fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  tagline:   { color: colors.textDim, fontSize: 14, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.sm },
  label: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginTop: spacing.xs },
  hint:  { color: colors.textMute, fontSize: 11, marginTop: -4 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.red,
    backgroundColor: '#450a0a',
    padding: spacing.sm,
    borderRadius: radius.md,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  btnPrimary: {
    backgroundColor: colors.amber,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnPrimaryText: { color: '#18181b', fontWeight: '800', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  footerText: { color: colors.textDim, fontSize: 14 },
  footerLink:  { color: colors.amber, fontSize: 14, fontWeight: '700' },
});
