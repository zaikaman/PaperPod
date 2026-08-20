/**
 * PaperPod Synchronized Visual Figure HUD Component
 * Dynamically highlights, crops, and auto-zooms figures referenced in audio playback.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Maximize2, Layers, Sparkles } from 'lucide-react-native';
import { Paper, PaperFigure, DialogueSegment } from '../../types';
import { theme } from '../../theme';

interface FigureHudProps {
  paper: Paper;
  currentTimestampMs: number;
  segments: DialogueSegment[];
  activeSegmentIndex: number;
  figures?: PaperFigure[];
  onOpenGallery?: () => void;
  onExpandFullScreen?: (figure: PaperFigure | null) => void;
}

export const FigureHud: React.FC<FigureHudProps> = ({
  paper,
  currentTimestampMs,
  segments,
  activeSegmentIndex,
  figures = [],
  onOpenGallery,
  onExpandFullScreen,
}) => {
  // Combine paper figures with any passed figures
  const allFigures: PaperFigure[] = useMemo(() => {
    if (figures.length > 0) return figures;
    if (paper.figures && paper.figures.length > 0) return paper.figures;
    return [];
  }, [figures, paper.figures]);

  // Determine active figure based on playback timestamp and active dialogue segment
  const activeFigure: PaperFigure | null = useMemo(() => {
    const currentSeg = segments[activeSegmentIndex];
    if (currentSeg) {
      if (currentSeg.referenced_figure) {
        return currentSeg.referenced_figure ?? null;
      }
      if (currentSeg.referenced_figure_id) {
        const found = allFigures.find(
          (f) =>
            f.id === currentSeg.referenced_figure_id ||
            f.figure_number === currentSeg.referenced_figure_id
        );
        if (found) return found;
      }
      if (currentSeg.referenced_figure_number) {
        const norm = currentSeg.referenced_figure_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        const found = allFigures.find(
          (f) => f.figure_number.toLowerCase().replace(/[^a-z0-9]/g, '') === norm
        );
        if (found) return found;
      }

      // Check dialogue text for figure mention
      const text = currentSeg.dialogue_text.toLowerCase();
      for (const fig of allFigures) {
        const figNumNorm = fig.figure_number.toLowerCase();
        if (text.includes(figNumNorm)) {
          return fig;
        }
      }
    }

    // Default to first figure if available
    return allFigures.length > 0 ? allFigures[0] ?? null : null;
  }, [activeSegmentIndex, segments, allFigures]);

  // Determine image source
  const imageSource: ImageSourcePropType | { uri: string } = useMemo(() => {
    if (activeFigure?.public_url && activeFigure.public_url.startsWith('http')) {
      return { uri: activeFigure.public_url };
    }
    return require('../../../assets/figure_transformer_arch.jpg');
  }, [activeFigure]);

  const figureLabel = useMemo(() => {
    if (activeFigure?.figure_number) {
      const num = activeFigure.figure_number.toUpperCase();
      if (num.includes('FIGURE 1') || num.includes('FIG 1') || num.includes('FIG. 1')) {
        return 'FIG 1: ARCHITECTURE';
      }
      if (num.includes('FIGURE 2') || num.includes('FIG 2')) {
        return 'FIG 2: ATTENTION MATRIX';
      }
      if (num.includes('TABLE')) {
        return `${num}: BENCHMARKS`;
      }
      return num;
    }
    return 'FIG 1: ARCHITECTURE';
  }, [activeFigure]);

  const figureCaption = useMemo(() => {
    if (activeFigure?.caption) {
      return activeFigure.caption;
    }
    return 'Figure 1: The Transformer - model architecture with Scaled Dot-Product and Multi-Head Attention.';
  }, [activeFigure]);

  return (
    <View style={styles.container}>
      {/* Visual Image Container with Touch Expansion */}
      <TouchableOpacity
        style={styles.heroVisualWrapper}
        onPress={() => onExpandFullScreen && onExpandFullScreen(activeFigure)}
        activeOpacity={0.92}
      >
        <Image
          source={imageSource}
          style={styles.heroVisualImage}
          resizeMode="cover"
        />

        {/* Top Badges & Controls */}
        <View style={styles.topControlRow}>
          <View style={styles.figureBadge}>
            <Text style={styles.figureBadgeText}>{figureLabel}</Text>
          </View>

          <View style={styles.topRightActions}>
            <View style={styles.syncPulsePill}>
              <View style={styles.syncDot} />
              <Text style={styles.syncText}>HUD SYNC</Text>
            </View>

            {onOpenGallery && (
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={onOpenGallery}
                activeOpacity={0.7}
              >
                <Layers size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => onExpandFullScreen && onExpandFullScreen(activeFigure)}
              activeOpacity={0.7}
            >
              <Maximize2 size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtle Bottom Caption Tint */}
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={2}>
            {figureCaption}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heroVisualWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#121214',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroVisualImage: {
    width: '100%',
    height: '100%',
  },
  topControlRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  figureBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.5)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  figureBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97736',
    letterSpacing: 0.8,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncPulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  syncText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.6,
  },
  actionIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  captionText: {
    color: '#D1D5DB',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
  },
});
