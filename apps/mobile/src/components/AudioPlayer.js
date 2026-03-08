import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

export default function AudioPlayer({ uri, title }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const dur = status?.duration ?? 0;
  const isBuffering = status?.isBuffering ?? false;
  const progress = dur > 0 ? currentTime / dur : 0;

  function togglePlay() {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }

  function formatTime(sec) {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: colors.primary + '20' }]}>
        {isBuffering ? (
          <Ionicons name="hourglass" size={18} color={colors.primary} />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={colors.primary} />
        )}
      </TouchableOpacity>

      <View style={styles.details}>
        {title && (
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
          onPress={(e) => {
            if (player && dur > 0) {
              const x = e.nativeEvent.locationX;
              const pct = Math.max(0, Math.min(1, x / 200));
              player.seekTo(pct * dur);
            }
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(currentTime)}</Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(dur)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginTop: 6,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: { flex: 1, gap: 3 },
  title: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 10 },
});
