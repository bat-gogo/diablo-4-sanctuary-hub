import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../lib/theme';

interface DemoAccount {
  label: string;
  email: string;
  password: string;
  variant: 'admin' | 'user';
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Admin demo', email: 'admin@sanctuaryhub.gg', password: 'AdminPass123!', variant: 'admin' },
  { label: 'User demo',  email: 'user@test.com',          password: 'Password123!',  variant: 'user'  },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(emailOverride?: string, passwordOverride?: string) {
    setSubmitting(true);
    setError(null);
    try {
      await login(emailOverride ?? email, passwordOverride ?? password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>⚔  SANCTUARY HUB</Text>
            <Text style={styles.tagline}>The Diablo IV community hub</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMute}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMute}
              autoCapitalize="none"
              secureTextEntry
              style={styles.input}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.btnPrimary, submitting && { opacity: 0.6 }]}
              disabled={submitting || !email || !password}
              onPress={() => submit()}
            >
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.btnPrimaryText}>Login</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>quick demo</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={{ gap: spacing.sm }}>
              {DEMO_ACCOUNTS.map((a) => (
                <Pressable
                  key={a.variant}
                  onPress={() => submit(a.email, a.password)}
                  disabled={submitting}
                  style={[
                    styles.btnSecondary,
                    a.variant === 'admin' && {
                      borderColor: '#b45309',
                      backgroundColor: '#451a03',
                    },
                  ]}
                >
                  <Text style={{
                    color: a.variant === 'admin' ? '#fbbf24' : colors.text,
                    fontWeight: '700',
                    letterSpacing: 0.4,
                  }}>
                    {a.variant === 'admin' ? '◈ ' : '◇ '}{a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account yet?</Text>
            <Link href="/(auth)/register" replace style={styles.footerLink}>
              Register
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: spacing.xl },
  logo:      { color: colors.amber, fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  tagline:   { color: colors.textDim, fontSize: 14, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.sm },
  label: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMute, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  btnSecondary: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  footerText: { color: colors.textDim, fontSize: 14 },
  footerLink:  { color: colors.amber, fontSize: 14, fontWeight: '700' },
});
