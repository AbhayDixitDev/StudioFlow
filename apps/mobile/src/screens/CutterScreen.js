import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import useAppStore from '../stores/useAppStore';
import { downloadFile } from '../utils/fileManager';
import { shareFile } from '../utils/share';

export default function CutterScreen() {
  const { colors } = useTheme();
  const addJob = useAppStore((s) => s.addJob);
  const updateJob = useAppStore((s) => s.updateJob);
  const [file, setFile] = useState(null);
  const [startTime, setStartTime] = useState('0');
  const [endTime, setEndTime] = useState('30');
  const [fadeIn, setFadeIn] = useState('0');
  const [fadeOut, setFadeOut] = useState('0');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true });
      if (res.canceled) return;
      setFile(res.assets[0]);
      setStatus('idle');
      setResult(null);
      setError(null);
    } catch {
      Alert.alert('Error', 'Could not select file');
    }
  }

  function validateTimes() {
    const s = parseFloat(startTime);
    const e = parseFloat(endTime);
    if (isNaN(s) || isNaN(e)) { Alert.alert('Invalid Input', 'Times must be numbers'); return false; }
    if (s >= e) { Alert.alert('Invalid Range', 'End time must be greater than start time'); return false; }
    if (s < 0) { Alert.alert('Invalid Input', 'Start time cannot be negative'); return false; }
    return true;
  }

  async function cutAudio() {
    if (!file || !validateTimes()) return;
    const localJobId = Date.now().toString();
    try {
      setStatus('uploading');
      setProgress(0);
      addJob({ id: localJobId, type: 'cut', fileName: file.name, status: 'uploading', createdAt: new Date().toISOString() });

      const formData = new FormData();
      formData.append('audio', { uri: file.uri, name: file.name, type: file.mimeType || 'audio/mpeg' });
      const uploadRes = await api.post('/audio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 50)); },
      });

      setStatus('cutting');
      setProgress(50);
      updateJob(localJobId, { status: 'processing' });
      const fileId = uploadRes.data.file?.id || uploadRes.data.file?._id;
      const cutRes = await api.post('/audio/cut', {
        fileId,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
        fadeIn: parseFloat(fadeIn) || 0,
        fadeOut: parseFloat(fadeOut) || 0,
      });

      const jobId = cutRes.data.jobId;
      if (jobId) {
        const poll = setInterval(async () => {
          try {
            const jobRes = await api.get(`/jobs/${jobId}`);
            const job = jobRes.data.job || jobRes.data;
            setProgress(50 + Math.round((job.progress || 0) * 0.5));
            if (job.status === 'completed') {
              clearInterval(poll);
              setResult(job.result || job.output || { path: `/api/audio/download/${jobId}` });
              setStatus('done');
              setProgress(100);
              updateJob(localJobId, { status: 'completed' });
            } else if (job.status === 'failed') {
              clearInterval(poll);
              setError(job.error || 'Cutting failed');
              setStatus('error');
              updateJob(localJobId, { status: 'failed' });
            }
          } catch {
            clearInterval(poll);
            setError('Lost connection');
            setStatus('error');
            updateJob(localJobId, { status: 'failed' });
          }
        }, 2000);
      } else {
        setResult(cutRes.data);
        setStatus('done');
        setProgress(100);
        updateJob(localJobId, { status: 'completed' });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStatus('error');
      updateJob(localJobId, { status: 'failed' });
    }
  }

  async function handleDownload() {
    try {
      setBusy('downloading');
      const path = result?.path || result?.url || `/api/audio/download/${result?.jobId}`;
      const ext = file?.name?.split('.').pop() || 'mp3';
      const filename = `cut_${Date.now()}.${ext}`;
      await downloadFile(path, filename);
      Alert.alert('Saved', `File saved as ${filename}`);
    } catch (err) {
      Alert.alert('Error', 'Download failed: ' + err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    try {
      setBusy('sharing');
      const path = result?.path || result?.url || `/api/audio/download/${result?.jobId}`;
      const ext = file?.name?.split('.').pop() || 'mp3';
      const filename = `cut_${Date.now()}.${ext}`;
      const uri = await downloadFile(path, filename);
      await shareFile(uri, 'Share cut audio');
    } catch {
      Alert.alert('Error', 'Could not share');
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setFile(null); setStatus('idle'); setProgress(0); setResult(null); setError(null);
    setStartTime('0'); setEndTime('30'); setFadeIn('0'); setFadeOut('0');
  }

  const isWorking = status === 'uploading' || status === 'cutting';
  const duration = parseFloat(endTime) - parseFloat(startTime);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: '#f59e0b20' }]}>
            <Ionicons name="cut" size={26} color="#f59e0b" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Audio Cutter</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Trim and cut audio precisely</Text>
        </View>

        <TouchableOpacity
          style={[styles.fileBox, { backgroundColor: colors.surface, borderColor: file ? colors.primary : colors.border }]}
          onPress={pickFile} disabled={isWorking} activeOpacity={0.7}
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
                <Text style={[styles.fileName, { color: colors.text }]}>Select Audio File</Text>
                <Text style={[styles.fileMeta, { color: colors.textMuted }]}>Any audio format supported</Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {file && !isWorking && status !== 'done' && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Trim Range (seconds)</Text>
            </View>
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

            <View style={[styles.sectionRow, { marginTop: 18 }]}>
              <Ionicons name="trending-up" size={18} color={colors.warning} />
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Fades (seconds)</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Fade In</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={fadeIn} onChangeText={setFadeIn} keyboardType="decimal-pad"
                  placeholder="0" placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Fade Out</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={fadeOut} onChangeText={setFadeOut} keyboardType="decimal-pad"
                  placeholder="0" placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>
        )}

        {file && status === 'idle' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={cutAudio}>
            <Ionicons name="cut" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Cut Audio</Text>
          </TouchableOpacity>
        )}

        {isWorking && (
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              {status === 'uploading' ? 'Uploading...' : 'Cutting...'}
            </Text>
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
            <Text style={[styles.successTitle, { color: colors.text }]}>Cut Complete!</Text>
            <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
              Trimmed {startTime}s - {endTime}s ({duration.toFixed(1)}s)
              {parseFloat(fadeIn) > 0 ? ` · Fade in: ${fadeIn}s` : ''}
              {parseFloat(fadeOut) > 0 ? ` · Fade out: ${fadeOut}s` : ''}
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
              <Text style={[styles.newBtnText, { color: colors.primary }]}>Cut Another</Text>
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { fontSize: 16, fontWeight: '700' },
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
