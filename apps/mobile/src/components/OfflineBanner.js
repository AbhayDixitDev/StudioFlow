/**
 * Phase 203: Offline banner component.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OfflineBanner({ visible }) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You are offline. Some features may be unavailable.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
