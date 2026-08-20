/**
 * Tactile Audio Scrubber & Controls Component
 * Matching the exact luxury minimal player from the reference design.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react-native';
import { theme } from '../../theme';

interface AudioScrubberProps {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playbackSpeed: number;
  onTogglePlayPause: () => void;
  onSeek: (positionMillis: number) => void;
  onSkip: (deltaMillis: number) => void;
  onChangeSpeed: () => void;
}

const formatTime = (millis: number): string => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioScrubber: React.FC<AudioScrubberProps> = ({
  isPlaying,
  positionMillis,
  durationMillis,
  playbackSpeed,
  onTogglePlayPause,
  onSeek,
  onSkip,
  onChangeSpeed,
}) => {
  const progressRatio = durationMillis > 0 ? Math.min(1, positionMillis / durationMillis) : 0;

  const handleProgressBarPress = (event: any) => {
    if (durationMillis <= 0) return;
    const { locationX } = event.nativeEvent;
    // Assume progress bar width approx 220px in this row
    const targetMillis = Math.floor(Math.max(0, Math.min(1, locationX / 200)) * durationMillis);
    onSeek(targetMillis);
  };

  return (
    <View style={styles.container}>
      {/* Minimalist Scrubber Row (as seen in reference design) */}
      <View style={styles.scrubberRow}>
        {/* Play / Pause Toggle Icon */}
        <TouchableOpacity
          onPress={onTogglePlayPause}
          style={styles.playIconButton}
          activeOpacity={0.7}
        >
          {isPlaying ? (
            <Pause size={18} color={theme.colors.primary} />
          ) : (
            <Play size={18} color={theme.colors.primary} fill={theme.colors.primary} />
          )}
        </TouchableOpacity>

        {/* Progress Bar Track */}
        <TouchableOpacity
          style={styles.progressTrack}
          onPress={handleProgressBarPress}
          activeOpacity={0.9}
        >
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        </TouchableOpacity>

        {/* Time Stamp (e.g. 23:19 / 36:58) */}
        <Text style={styles.timeText}>
          {formatTime(positionMillis)} / {formatTime(durationMillis || 180000)}
        </Text>
      </View>

      {/* Auxiliary Fast Navigation Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={() => onSkip(-15000)}
          style={styles.auxButton}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={theme.colors.textSecondary} />
          <Text style={styles.auxButtonText}>15s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onChangeSpeed}
          style={styles.speedBadge}
          activeOpacity={0.7}
        >
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSkip(15000)}
          style={styles.auxButton}
          activeOpacity={0.7}
        >
          <Text style={styles.auxButtonText}>15s</Text>
          <RotateCw size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    width: '100%',
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  playIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
    minWidth: 85,
    textAlign: 'right',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 14,
  },
  auxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  auxButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  speedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
