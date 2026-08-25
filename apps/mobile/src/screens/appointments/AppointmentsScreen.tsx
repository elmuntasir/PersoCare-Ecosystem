import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Card } from '@/components/shared';
import { colors } from '@/theme';
import type { AppointmentsStackParamList } from '@/navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<AppointmentsStackParamList, 'AppointmentsList'>;
};

const PLACEHOLDER = [
  { id: '1', title: 'General checkup', date: 'Coming soon' },
  { id: '2', title: 'Follow-up', date: 'Coming soon' },
];

export default function AppointmentsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={PLACEHOLDER}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            title="Book appointment"
            onPress={() => navigation.navigate('BookAppointment')}
            style={styles.cta}
          />
        }
        renderItem={({ item }) => (
          <Card title={item.title}>
            <Text style={styles.muted}>{item.date}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.muted}>No appointments yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 16 },
  cta: { marginBottom: 16 },
  muted: { color: colors.inkSoft, fontSize: 14 },
});
