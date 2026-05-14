import { PrimaryButton } from '@/components/ui/primary-button';
import { getHomeRoute } from '@/lib/auth/roles';
import { setSession } from '@/lib/auth/session';
import { injectDevSession } from '@/lib/dev/mock-session';
import type { User, UserRole } from '@/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const VALID_ROLES = new Set<string>([
  'super_admin', 'district_admin', 'school_admin', 'teacher', 'student', 'guardian',
]);

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function handleDevLogin() {
    injectDevSession();
    router.replace('/(admin)' as never);
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!res.ok) {
        // Use a generic message for all auth failures to prevent user enumeration (SEC-08)
        throw new Error('Invalid email or password. Please try again.');
      }

      const data = await res.json() as {
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
      };

      // Validate the role from the API response before trusting it
      if (!VALID_ROLES.has(data.user?.role)) {
        throw new Error('Invalid session data received. Please try again.');
      }

      setSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      });

      const homeRoute = getHomeRoute(data.user.role as UserRole);
      router.replace(homeRoute as never);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      Alert.alert('Login error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>4E</Text>
        <Text style={styles.tagline}>Education for Everyone</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        {loading
          ? <ActivityIndicator color="#FFA12B" style={{ marginTop: 12 }} />
          : <PrimaryButton label="SIGN IN" onPress={handleLogin} disabled={loading} />
        }

        {__DEV__ && (
          <PrimaryButton label="⚡ DEV LOGIN" onPress={handleDevLogin} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F97316',
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: '#222',
    backgroundColor: '#FAFAFA',
  },

});
