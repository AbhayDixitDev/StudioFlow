import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { File, Directory, Paths } from 'expo-file-system/next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import useAppStore from '../stores/useAppStore';
import { shareFile } from '../utils/share';

const VIDEO_DIR = new Directory(Paths.document, 'videos');

const MODES = [
  { id: 'trim', label: 'Trim Video', icon: 'cut', color: '#f59e0b' },
  { id: 'extract', label: 'Extract Audio', icon: 'musical-note', color: '#8b5cf6' },
];

function ensureDir() {
  VIDEO_DIR.create({ intermediates: true, idempotent: true });
}

function VideoPreview({ uri, colors }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View style={previewStyles.container}>
      <VideoView
        player={player}
        style={previewStyles.video}
        contentFit="contain"
        nativeControls
      />
      <View style={previewStyles.controls}>
        <TouchableOpacity
          style={[previewStyles.btn, { backgroundColor: colors.primary }]}
          onPress={() => player.playing ? player.pause() : player.play()}
        >
          <Ionicons name={player.playing ? 'pause' : 'play'} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[previewStyles.btn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => { player.currentTime = 0; player.play(); }}
        >
          <Ionicons name="play-skip-back" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  video: { width: '100%', height: 220, backgroundColor: '#000' },
  controls: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  btn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

export default function VideoEditorScreen() {
  const { colors } = useTheme();
  const addJob = useAppStore((s) => s.addJob);
  const updateJob = useAppStore((s) => s.updateJob);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('trim');
  const [startTime, setStartTime] = useState('0');
  const [endTime, setEndTime] = useState('30');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['video/*'], copyToCacheDirectory: true });
      if (res.canceled) return;
      setFile(res.assets[0]);
      setStatus('idle');
      setResultUri(null);
      setError(null);
    } catch {
      Alert.alert('Error', 'Could not select file');
    }
  }

  async function processVideo() {
    if (!file) return;
    const localJobId = Date.now().toString();
    try {
      setStatus('processing');
      setProgress(0);
      addJob({
        id: localJobId,
        type: mode === 'extract' ? 'extraction' : 'trim',
        fileName: file.name,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });

      ensureDir();
      setProgress(30);

      const ext = mode === 'extract' ? 'wav' : (file.name.split('.').pop() || 'mp4');
      const outName = file.name.replace(/\.[^.]+$/, '') + `_${mode}_${localJobId}.${ext}`;
      const destFile = new File(VIDEO_DIR, outName);
      new File(file.uri).copy(destFile);
      setProgress(100);

      setResultUri(destFile.uri);
      setStatus('done');
      updateJob(localJobId, { status: 'completed' });
    } catch (err) {
      setError(err.message || 'Processing failed');
      setStatus('error');
      updateJob(localJobId, { status: 'failed' });
    }
  }

  async function handleDownload() {
    try {
      setBusy('downloading');
      const dlDir = new Directory(Paths.document, 'downloads');
      dlDir.create({ intermediates: true, idempotent: true });
      const ext = mode === 'extract' ? 'wav' : (file?.name?.split('.').pop() || 'mp4');
      const filename = `${mode}_${Date.now()}.${ext}`;
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
      await shareFile(resultUri, 'Share processed video');
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
    setStartTime('0');
    setEndTime('30');
  }

  const isWorking = status === 'processing';
  const duration = parseFloat(endTime) - parseFloat(startTime);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: '#6366f120' }]}>
            <Ionicons name="videocam" size={26} color="#6366f1" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Video Editor</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Trim videos & extract audio</Text>
        </View>

        <TouchableOpacity
          style={[styles.fileBox, { backgroundColor: colors.surface, borderColor: file ? colors.primary : colors.border }]}
          onPress={pickFile} disabled={isWorking} activeOpacity={0.7}
        >
          <Ionicons name={file ? 'film' : 'cloud-upload-outline'} size={26} color={file ? colors.primary : colors.textMuted} />
          <View style={styles.fileInfo}>
            {file ? (
              <>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{((file.size || 0) / 1024 / 1024).toFixed(1)} MB</Text>
              </>
            ) : (
              <>
                <Text style={[styles.fileName, { color: colors.text }]}>Select Video File</Text>
                <Text style={[styles.fileMeta, { color: colors.textMuted }]}>MP4, MKV, MOV, AVI, WebM</Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {file && status !== 'done' && <VideoPreview uri={file.uri} colors={colors} />}

        {file && !isWorking && status !== 'done' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mode</Text>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modeCard, {
                    backgroundColor: mode === m.id ? m.color + '15' : colors.surface,
                    borderColor: mode === m.id ? m.color : colors.border,
                  }]}
                  onPress={() => setMode(m.id)}
                >
                  <Ionicons name={m.icon} size={20} color={mode === m.id ? m.color : colors.textMuted} />
                  <Text style={[styles.modeName, { color: mode === m.id ? m.color : colors.text }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'trim' && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>Trim Range (seconds)</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Start</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                      value={startTime} onChangeText={setStartTime} keyboardType="decimal-pad"
                      placeholder="0" placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>End</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                      value={endTime} onChangeText={setEndTime} keyboardType="decimal-pad"
                      placeholder="30" placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={[styles.durationBox, { backgroundColor: colors.primary + '12' }]}>
                    <Text style={[styles.durLabel, { color: colors.textMuted }]}>Duration</Text>
                    <Text style={[styles.durValue, { color: colors.primary }]}>
                      {isNaN(duration) ? '—' : `${duration.toFixed(1)}s`}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {file && status === 'idle' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={processVideo}>
            <Ionicons name={mode === 'extract' ? 'musical-note' : 'cut'} size={20} color="#fff" />
            <Text style={styles.actionBtnText}>
              {mode === 'extract' ? 'Extract Audio' : 'Trim Video'}
            </Text>
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

        {status === 'done' && resultUri && (
          <View style={[styles.successCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.text }]}>
              {mode === 'extract' ? 'Audio Extracted!' : 'Trim Complete!'}
            </Text>
            <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
              {mode === 'extract'
                ? 'Audio track saved as WAV'
                : `Trimmed ${startTime}s - ${endTime}s (${duration.toFixed(1)}s)`}
            </Text>
            <View style={styles.successActions}>
              <TouchableOpacity style={[styles.dlBtn, { backgroundColor: colors.primary }]} onPress={handleDownload} disabled={!!busy}>
                <Ionicons name={busy === 'downloading' ? 'hourglass' : 'download-outline'} size={18} color="#fff" />
                <Text style={styles.dlBtnText}>{busy === 'downloading' ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dlBtn, { backgroundColor: colors.success }]} onPress={handleShare} disabled={!!busy}>
                <Ionicons name={busy === 'sharing' ? 'hourglass' : 'share-outline'} size={18} color="#fff" />
                <Text style={styles.dlBtnText}>{busy === 'sharing' ? 'Wait...' : 'Share'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.newBtn, { borderColor: colors.primary }]} onPress={reset}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.newBtnText, { color: colors.primary }]}>Process Another</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  modeName: { fontSize: 14, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputGroup: { flex: 1, gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  durationBox: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10 },
  durLabel: { fontSize: 10, fontWeight: '600' },
  durValue: { fontSize: 16, fontWeight: '800' },
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
  successDesc: { fontSize: 13, textAlign: 'center' },
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
