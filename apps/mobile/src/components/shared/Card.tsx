import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

type CardProps = {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ title, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.sage200,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.teal900,
    marginBottom: 8,
  },
});
