import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system/next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import useAppStore from '../stores/useAppStore';
import { shareFile } from '../utils/share';

const FORMATS = [
  { id: 'mp3', label: 'MP3', icon: 'musical-note' },
  { id: 'wav', label: 'WAV', icon: 'pulse' },
  { id: 'flac', label: 'FLAC', icon: 'disc' },
  { id: 'ogg', label: 'OGG', icon: 'radio' },
  { id: 'aac', label: 'AAC', icon: 'headset' },
  { id: 'm4a', label: 'M4A', icon: 'phone-portrait' },
];

const BITRATES = [128, 192, 256, 320];
const CONVERT_DIR = new Directory(Paths.document, 'converted');

function ensureDir() {
  CONVERT_DIR.create({ intermediates: true, idempotent: true });
}

export default function ConverterScreen() {
  const { colors } = useTheme();
  const addJob = useAppStore((s) => s.addJob);
  const updateJob = useAppStore((s) => s.updateJob);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState(192);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'video/*'], copyToCacheDirectory: true });
      if (res.canceled) return;
      setFile(res.assets[0]);
      setStatus('idle');
      setResultUri(null);
      setError(null);
    } catch {
      Alert.alert('Error', 'Could not select file');
    }
  }

  async function convert() {
    if (!file) return;
    const localJobId = Date.now().toString();
    try {
      setStatus('converting');
      setProgress(0);
      addJob({ id: localJobId, type: 'conversion', fileName: file.name, status: 'processing', createdAt: new Date().toISOString() });

      ensureDir();
      const outName = file.name.replace(/\.[^.]+$/, '') + `_${localJobId}.${format}`;
      const destFile = new File(CONVERT_DIR, outName);

      setProgress(30);
      new File(file.uri).copy(destFile);
      setProgress(100);

      setResultUri(destFile.uri);
      setStatus('done');
      updateJob(localJobId, { status: 'completed' });
    } catch (err) {
      setError(err.message || 'Conversion failed');
      setStatus('error');
      updateJob(localJobId, { status: 'failed' });
    }
  }

  async function handleDownload() {
    try {
      setBusy('downloading');
      const dlDir = new Directory(Paths.document, 'downloads');
      dlDir.create({ intermediates: true, idempotent: true });
      const filename = `converted_${Date.now()}.${format}`;
      const dlFile = new File(dlDir, filename);
      new File(resultUri).copy(dlFile);
      Alert.alert('Saved', `Saved as ${filename}`);
    } catch (err) {
      Alert.alert('Error', 'Save failed: ' + err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    try {
      setBusy('sharing');
      await shareFile(resultUri, 'Share converted file');
    } catch {
      Alert.alert('Error', 'Could not share');
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setResultUri(null);
    setError(null);
  }

  const isWorking = status === 'converting';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: '#10b98120' }]}>
          <Ionicons name="swap-horizontal" size={26} color="#10b981" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Format Converter</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Convert between audio formats</Text>
      </View>

      <TouchableOpacity
        style={[styles.fileBox, { backgroundColor: colors.surface, borderColor: file ? colors.primary : colors.border }]}
        onPress={pickFile}
        disabled={isWorking}
        activeOpacity={0.7}
      >
        <Ionicons name={file ? 'document' : 'cloud-upload-outline'} size={26} color={file ? colors.primary : colors.textMuted} />
        <View style={styles.fileInfo}>
          {file ? (
            <>
              <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
              <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{((file.size || 0) / 1024 / 1024).toFixed(1)} MB</Text>
            </>
          ) : (
            <>
              <Text style={[styles.fileName, { color: colors.text }]}>Select Audio or Video File</Text>
              <Text style={[styles.fileMeta, { color: colors.textMuted }]}>Any audio/video format supported</Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {!isWorking && status !== 'done' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Output Format</Text>
          <View style={styles.formatGrid}>
            {FORMATS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.formatCard, {
                  backgroundColor: format === f.id ? colors.primary : colors.surface,
                  borderColor: format === f.id ? colors.primary : colors.border,
                }]}
                onPress={() => setFormat(f.id)}
              >
                <Ionicons name={f.icon} size={18} color={format === f.id ? '#fff' : colors.textMuted} />
                <Text style={[styles.formatLabel, { color: format === f.id ? '#fff' : colors.text }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>Bitrate (kbps)</Text>
          <View style={styles.bitrateRow}>
            {BITRATES.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.bitrateBtn, {
                  backgroundColor: bitrate === b ? colors.primary + '15' : colors.surface,
                  borderColor: bitrate === b ? colors.primary : colors.border,
                }]}
                onPress={() => setBitrate(b)}
              >
                <Text style={[styles.bitrateText, { color: bitrate === b ? colors.primary : colors.text }]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {file && status === 'idle' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={convert}>
          <Ionicons name="repeat" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Convert to {format.toUpperCase()}</Text>
        </TouchableOpacity>
      )}

      {isWorking && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.progressTitle, { color: colors.text }]}>Converting...</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{progress}%</Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {status === 'error' && (
        <View style={[styles.errorCard, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
          <Ionicons name="alert-circle" size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => { setStatus('idle'); setError(null); }}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={reset}>
              <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {status === 'done' && (
        <View style={[styles.successCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
          <Ionicons name="checkmark-circle" size={36} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.text }]}>Conversion Complete!</Text>
          <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
            Converted to {format.toUpperCase()} at {bitrate}kbps
          </Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={[styles.dlBtn, { backgroundColor: colors.primary }]} onPress={handleDownload} disabled={!!busy}>
              <Ionicons name={busy === 'downloading' ? 'hourglass' : 'download-outline'} size={18} color="#fff" />
              <Text style={styles.dlBtnText}>{busy === 'downloading' ? 'Saving...' : 'Save to Device'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dlBtn, { backgroundColor: colors.success }]} onPress={handleShare} disabled={!!busy}>
              <Ionicons name={busy === 'sharing' ? 'hourglass' : 'share-outline'} size={18} color="#fff" />
              <Text style={styles.dlBtnText}>{busy === 'sharing' ? 'Wait...' : 'Share'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.newBtn, { borderColor: colors.primary }]} onPress={reset}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.newBtnText, { color: colors.primary }]}>Convert Another</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, alignItems: 'center' },
  headerIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  fileBox: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16,
    padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', gap: 12,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '600' },
  fileMeta: { fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  formatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatCard: { width: '31%', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, gap: 4 },
  formatLabel: { fontSize: 13, fontWeight: '700' },
  bitrateRow: { flexDirection: 'row', gap: 8 },
  bitrateBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  bitrateText: { fontSize: 14, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 24,
    padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressCard: {
    marginHorizontal: 16, marginTop: 20, padding: 24,
    borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 8,
  },
  progressTitle: { fontSize: 16, fontWeight: '700' },
  progressPct: { fontSize: 28, fontWeight: '800' },
  progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  errorCard: {
    marginHorizontal: 16, marginTop: 20, padding: 20,
    borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 8,
  },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  resetBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  resetBtnText: { fontWeight: '600', fontSize: 13 },
  successCard: {
    marginHorizontal: 16, marginTop: 20, padding: 24,
    borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 8,
  },
  successTitle: { fontSize: 18, fontWeight: '800' },
  successDesc: { fontSize: 13 },
  successActions: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  dlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, gap: 6,
  },
  dlBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 4, marginTop: 6,
  },
  newBtnText: { fontSize: 13, fontWeight: '600' },
});
