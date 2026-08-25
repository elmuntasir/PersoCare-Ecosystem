import React, { useEffect, useState } from 'react';
import { Text, ScrollView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { api } from '@/services/api';
import { Card } from '@/components/shared';
import { colors } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';

type DashboardData = {
  user?: { name?: string };
  upcomingAppointments?: Array<{ id: string; title?: string; date?: string }>;
  medicineAdherence?: { rate?: number; label?: string };
};

export default function DashboardScreen() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/dashboard')
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Could not load dashboard');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  const displayName =
    data?.user?.name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'User';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>Welcome back, {displayName}!</Text>

      {error ? (
        <Card title="Status">
          <Text style={styles.muted}>
            Dashboard API unavailable yet. You&apos;re signed in and ready to use appointments,
            medicine, and profile.
          </Text>
        </Card>
      ) : null}

      <Card title="Upcoming Appointments">
        {data?.upcomingAppointments?.length ? (
          data.upcomingAppointments.map((item) => (
            <Text key={item.id} style={styles.row}>
              {item.title ?? 'Appointment'}
              {item.date ? ` · ${item.date}` : ''}
            </Text>
          ))
        ) : (
          <Text style={styles.muted}>No upcoming appointments.</Text>
        )}
      </Card>

      <Card title="Medicine Adherence">
        <Text style={styles.muted}>
          {data?.medicineAdherence?.label ??
            (data?.medicineAdherence?.rate != null
              ? `${Math.round(data.medicineAdherence.rate * 100)}% this week`
              : 'Track doses from the Medicine tab.')}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.teal900,
    marginBottom: 20,
  },
  row: { color: colors.ink, marginBottom: 6, fontSize: 15 },
  muted: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
});
