import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import useAppStore from '../stores/useAppStore';

const tools = [
  { key: 'Separator', title: 'Audio Separator', desc: 'Split songs into stems using AI', icon: 'git-branch', color: '#8b5cf6' },
  { key: 'Converter', title: 'Format Converter', desc: 'Convert between audio formats', icon: 'swap-horizontal', color: '#10b981' },
  { key: 'Cutter', title: 'Audio Cutter', desc: 'Trim and cut audio precisely', icon: 'cut', color: '#f59e0b' },
];

const JOB_ICONS = { separation: 'git-branch', conversion: 'swap-horizontal', cut: 'cut' };

function statusColor(status, colors) {
  if (status === 'completed') return colors.success;
  if (status === 'failed') return colors.error;
  return colors.warning;
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const jobs = useAppStore((s) => s.jobs);
  const recent = jobs.slice(0, 5);
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const inProgress = jobs.filter((j) => j.status === 'processing' || j.status === 'uploading').length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appName, { color: colors.primary }]}>StudioFlow</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Audio tools in your pocket</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {jobs.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{jobs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.success }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Done</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tools</Text>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.key}
            style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate(tool.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.toolIcon, { backgroundColor: tool.color + '15' }]}>
              <Ionicons name={tool.icon} size={24} color={tool.color} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>{tool.title}</Text>
              <Text style={[styles.toolDesc, { color: colors.textMuted }]}>{tool.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { paddingBottom: 30 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {recent.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No activity yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Separate, convert, or cut an audio file to get started
            </Text>
          </View>
        ) : (
          recent.map((job) => {
            const sc = statusColor(job.status, colors);
            return (
              <View key={job.id} style={[styles.jobRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.jobIconWrap, { backgroundColor: sc + '15' }]}>
                  <Ionicons name={JOB_ICONS[job.type] || 'musical-note'} size={16} color={sc} />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={[styles.jobName, { color: colors.text }]} numberOfLines={1}>
                    {job.fileName || 'Untitled'}
                  </Text>
                  <Text style={[styles.jobMeta, { color: colors.textMuted }]}>
                    {job.type} · {new Date(job.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc + '15' }]}>
                  <Text style={[styles.statusText, { color: sc }]}>{job.status}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  headerLeft: {},
  appName: { fontSize: 28, fontWeight: '800' },
  tagline: { fontSize: 14, marginTop: 2 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  toolCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 14,
  },
  toolIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  toolInfo: { flex: 1 },
  toolTitle: { fontSize: 16, fontWeight: '700' },
  toolDesc: { fontSize: 12, marginTop: 2 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontSize: 13, textAlign: 'center' },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10,
  },
  jobIconWrap: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 14, fontWeight: '600' },
  jobMeta: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});
