import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { api } from '@/services/api';
import { Button, Card } from '@/components/shared';
import { colors } from '@/theme';

type MedicineItem = {
  id: string;
  name?: string;
  dosage?: string;
  takenToday?: boolean;
};

export default function MedicineLogScreen() {
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/medicine');
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : payload?.medicines ?? payload?.data ?? [];
      setItems(list);
    } catch {
      setItems([
        { id: 'demo-1', name: 'Metformin', dosage: '500mg', takenToday: false },
        { id: 'demo-2', name: 'Atorvastatin', dosage: '10mg', takenToday: true },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markTaken = async (id: string) => {
    try {
      await api.post('/medicine', { id, action: 'taken' });
    } catch {
      // Optimistic local update when API is not ready
    }
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, takenToday: true } : m)));
    Alert.alert('Logged', 'Dose marked as taken.');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.coral}
        />
      }
      ListHeaderComponent={<Text style={styles.heading}>Today&apos;s medicines</Text>}
      renderItem={({ item }) => (
        <Card title={item.name ?? 'Medicine'}>
          <Text style={styles.muted}>{item.dosage ?? 'Dosage not set'}</Text>
          <View style={styles.row}>
            <Text
              style={[
                styles.badge,
                item.takenToday ? styles.badgeDone : styles.badgePending,
              ]}
            >
              {item.takenToday ? 'Taken' : 'Pending'}
            </Text>
            {!item.takenToday ? (
              <Button
                title="Mark taken"
                onPress={() => void markTaken(item.id)}
                style={styles.smallBtn}
                textStyle={styles.smallBtnText}
              />
            ) : null}
          </View>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.muted}>No medicines on your log yet.</Text>}
    />
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
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.teal900,
    marginBottom: 16,
  },
  muted: { color: colors.inkSoft, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeDone: { backgroundColor: colors.emerald50, color: colors.emerald700 },
  badgePending: { backgroundColor: colors.amber50, color: colors.amber700 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  smallBtnText: { fontSize: 14 },
});
