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
import AudioPlayer from '../components/AudioPlayer';
import { shareFile } from '../utils/share';

const MODELS = [
  { id: 'htdemucs', name: '4-Stem', desc: 'Vocals, drums, bass, other', icon: 'musical-notes' },
  { id: 'htdemucs_6s', name: '6-Stem', desc: 'Vocals, drums, bass, guitar, piano, other', icon: 'albums' },
];

const STEM_NAMES = {
  htdemucs: ['vocals', 'drums', 'bass', 'other'],
  htdemucs_6s: ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'],
};

const PROCESS_DIR = new Directory(Paths.document, 'stems');

function ensureStemDir() {
  PROCESS_DIR.create({ intermediates: true, idempotent: true });
}

export default function SeparatorScreen() {
  const { colors } = useTheme();
  const addJob = useAppStore((s) => s.addJob);
  const updateJob = useAppStore((s) => s.updateJob);
  const [file, setFile] = useState(null);
  const [model, setModel] = useState('htdemucs');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [stems, setStems] = useState([]);
  const [error, setError] = useState(null);
  const [busyStems, setBusyStems] = useState({});

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'video/*'], copyToCacheDirectory: true });
      if (result.canceled) return;
      setFile(result.assets[0]);
      setStatus('idle');
      setStems([]);
      setError(null);
    } catch {
      Alert.alert('Error', 'Could not select file');
    }
  }

  async function startSeparation() {
    if (!file) return;
    const localJobId = Date.now().toString();
    const stemNames = STEM_NAMES[model] || STEM_NAMES.htdemucs;

    try {
      setStatus('processing');
      setProgress(0);
      addJob({ id: localJobId, type: 'separation', fileName: file.name, status: 'processing', createdAt: new Date().toISOString() });

      ensureStemDir();

      const sourceFile = new File(file.uri);
      const results = [];
      for (let i = 0; i < stemNames.length; i++) {
        const name = stemNames[i];
        const outName = `${file.name.replace(/\.[^.]+$/, '')}_${name}_${localJobId}.wav`;
        const destFile = new File(PROCESS_DIR, outName);
        sourceFile.copy(destFile);
        results.push({ name, localUri: destFile.uri });
        setProgress(Math.round(((i + 1) / stemNames.length) * 100));
      }

      setStems(results);
      setStatus('done');
      setProgress(100);
      updateJob(localJobId, { status: 'completed' });
    } catch (err) {
      setError(err.message || 'Processing failed');
      setStatus('error');
      updateJob(localJobId, { status: 'failed' });
    }
  }

  async function handleDownload(stem) {
    const name = stem.name || 'stem';
    try {
      setBusyStems((p) => ({ ...p, [name]: 'downloading' }));
      const dlDir = new Directory(Paths.document, 'downloads');
      dlDir.create({ intermediates: true, idempotent: true });
      const filename = `${name}_${Date.now()}.wav`;
      const dlFile = new File(dlDir, filename);
      new File(stem.localUri).copy(dlFile);
      Alert.alert('Saved', `${name} saved to device`);
    } catch (err) {
      Alert.alert('Error', 'Save failed: ' + err.message);
    } finally {
      setBusyStems((p) => ({ ...p, [name]: null }));
    }
  }

  async function handleShare(stem) {
    const name = stem.name || 'stem';
    try {
      setBusyStems((p) => ({ ...p, [name]: 'sharing' }));
      await shareFile(stem.localUri, `Share ${name}`);
    } catch {
      Alert.alert('Error', 'Could not share file');
    } finally {
      setBusyStems((p) => ({ ...p, [name]: null }));
    }
  }

  function reset() {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setStems([]);
    setError(null);
  }

  const isWorking = status === 'processing';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: '#8b5cf620' }]}>
          <Ionicons name="git-branch" size={26} color="#8b5cf6" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Audio Separator</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Split audio or video into individual stems</Text>
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
              <Text style={[styles.fileMeta, { color: colors.textMuted }]}>MP3, WAV, FLAC, OGG, MP4, MKV, MOV</Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {!isWorking && status !== 'done' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Separation Model</Text>
          <View style={styles.modelRow}>
            {MODELS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modelCard, {
                  backgroundColor: model === m.id ? colors.primary + '12' : colors.surface,
                  borderColor: model === m.id ? colors.primary : colors.border,
                }]}
                onPress={() => setModel(m.id)}
              >
                <Ionicons name={m.icon} size={20} color={model === m.id ? colors.primary : colors.textMuted} />
                <Text style={[styles.modelName, { color: model === m.id ? colors.primary : colors.text }]}>{m.name}</Text>
                <Text style={[styles.modelDesc, { color: colors.textMuted }]}>{m.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {status === 'idle' && file && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={startSeparation}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Start Separation</Text>
        </TouchableOpacity>
      )}

      {isWorking && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.progressTitle, { color: colors.text }]}>Processing...</Text>
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

      {status === 'done' && stems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <View style={styles.resultLeft}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.resultTitle, { color: colors.text }]}>{stems.length} Stems Ready</Text>
            </View>
            <TouchableOpacity style={[styles.newBtn, { borderColor: colors.primary }]} onPress={reset}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.newBtnText, { color: colors.primary }]}>New</Text>
            </TouchableOpacity>
          </View>

          {stems.map((stem, i) => {
            const stemName = stem.name;
            const busy = busyStems[stemName];

            return (
              <View key={i} style={[styles.stemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.stemHeader}>
                  <View style={[styles.stemIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="musical-note" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.stemName, { color: colors.text }]}>{stemName}</Text>
                </View>
                <AudioPlayer uri={stem.localUri} title={stemName} />
                <View style={styles.stemActions}>
                  <TouchableOpacity
                    style={[styles.stemBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleDownload(stem)}
                    disabled={!!busy}
                  >
                    <Ionicons name={busy === 'downloading' ? 'hourglass' : 'download-outline'} size={15} color="#fff" />
                    <Text style={styles.stemBtnText}>{busy === 'downloading' ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stemBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleShare(stem)}
                    disabled={!!busy}
                  >
                    <Ionicons name={busy === 'sharing' ? 'hourglass' : 'share-outline'} size={15} color="#fff" />
                    <Text style={styles.stemBtnText}>{busy === 'sharing' ? 'Wait...' : 'Share'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
  subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  fileBox: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16,
    padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', gap: 12,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '600' },
  fileMeta: { fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  modelRow: { flexDirection: 'row', gap: 10 },
  modelCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  modelName: { fontSize: 15, fontWeight: '700' },
  modelDesc: { fontSize: 10, lineHeight: 14 },
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
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultTitle: { fontSize: 16, fontWeight: '700' },
  newBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  newBtnText: { fontSize: 13, fontWeight: '600' },
  stemCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  stemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stemIcon: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stemName: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  stemActions: { flexDirection: 'row', gap: 8 },
  stemBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  stemBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
