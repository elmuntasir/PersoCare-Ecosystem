import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '@/components/shared';
import { colors } from '@/theme';
import type { AppointmentsStackParamList } from '@/navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<AppointmentsStackParamList, 'BookAppointment'>;
};

export default function BookAppointmentScreen({ navigation }: Props) {
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please describe the reason for your visit.');
      return;
    }
    setLoading(true);
    try {
      // Wire to API when booking endpoints are ready for mobile.
      await new Promise((r) => setTimeout(r, 400));
      Alert.alert('Request saved', 'Appointment booking will sync with the PersoCare API next.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Reason for visit</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="e.g. Follow-up on lab results"
        placeholderTextColor={colors.inkSoft}
        value={reason}
        onChangeText={setReason}
        multiline
      />

      <Text style={styles.label}>Preferred date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.inkSoft}
        value={preferredDate}
        onChangeText={setPreferredDate}
      />

      <Button title="Submit request" onPress={handleBook} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  label: {
    color: colors.teal900,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.sage200,
    color: colors.ink,
    fontSize: 16,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});
