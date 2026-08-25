import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card } from '@/components/shared';
import { colors } from '@/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? '—';
  const userId = session?.user?.id ?? '—';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not sign out';
      Alert.alert('Error', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>

      <Card title="Account">
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
        <Text style={[styles.label, styles.spaced]}>User ID</Text>
        <Text style={styles.value} numberOfLines={1}>
          {userId}
        </Text>
      </Card>

      <Card title="Identity">
        <Text style={styles.muted}>
          eKYC via Didit will be available in a later mobile release. Use the web app for
          verification for now.
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button title="Sign out" onPress={() => void handleSignOut()} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.teal900,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  spaced: { marginTop: 12 },
  value: { fontSize: 16, color: colors.ink },
  muted: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  actions: { marginTop: 8 },
});
