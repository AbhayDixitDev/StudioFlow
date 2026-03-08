import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet, Alert, Linking, ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import useAppStore from '../stores/useAppStore';
import { clearDownloads, getCacheSize, formatBytes } from '../utils/fileManager';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const clearJobs = useAppStore((s) => s.clearJobs);
  const [cacheSize, setCacheSize] = useState(0);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    getCacheSize().then(setCacheSize);
  }, []);

  async function handleClearCache() {
    Alert.alert('Clear Cache', 'This will delete all processed files and job history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            await clearDownloads();
            await clearJobs();
            setCacheSize(0);
            Alert.alert('Cleared', 'Cache and history cleared');
          } catch {
            Alert.alert('Error', 'Could not clear cache');
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="settings" size={28} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Appearance */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.textSecondary} />
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Storage */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="folder-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Storage</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Processed Files</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{formatBytes(cacheSize)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.warning, marginTop: 10 }]}
          onPress={handleClearCache}
          disabled={clearing}
        >
          {clearing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.btnText}>Clear Cache & History</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>About</Text>
        </View>
        <Text style={[styles.aboutText, { color: colors.text }]}>StudioFlow v1.0.0</Text>
        <Text style={[styles.aboutDesc, { color: colors.textMuted }]}>Audio & video tools, all in one place</Text>
        <Text style={[styles.aboutNote, { color: colors.textMuted }]}>All processing runs locally on your device</Text>
        <View style={styles.aboutRow}>
          <TouchableOpacity
            style={[styles.aboutLink, { borderColor: colors.border }]}
            onPress={() => Linking.openURL('https://github.com/AbhayDixitDev/StudioFlow')}
          >
            <Ionicons name="logo-github" size={18} color={colors.text} />
            <Text style={[styles.aboutLinkText, { color: colors.text }]}>GitHub</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800' },
  card: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderRadius: 10, gap: 6,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  aboutText: { fontSize: 16, fontWeight: '700' },
  aboutDesc: { fontSize: 13, marginTop: 2 },
  aboutNote: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  aboutRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  aboutLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  aboutLinkText: { fontSize: 13, fontWeight: '600' },
});
