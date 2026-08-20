/**
 * PaperPod Figure Gallery Drawer Component
 * Allows users to browse all paper figures, view captions, and jump audio scrubber to timestamps.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { X, Clock, Maximize2, Layers } from 'lucide-react-native';
import { PaperFigure, DialogueSegment } from '../../types';
import { theme } from '../../theme';

interface FigureGalleryProps {
  visible: boolean;
  onClose: () => void;
  figures: PaperFigure[];
  activeFigureId?: string | null;
  segments?: DialogueSegment[];
  onSelectFigure: (figure: PaperFigure, timestampMs?: number) => void;
}

const formatTimestamp = (millis: number): string => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const FigureGallery: React.FC<FigureGalleryProps> = ({
  visible,
  onClose,
  figures,
  activeFigureId,
  segments = [],
  onSelectFigure,
}) => {
  // Find timestamp for a figure if it's referenced in any segment
  const getFigureTimestamp = (figure: PaperFigure): number | undefined => {
    const figNum = figure.figure_number.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedSeg = segments.find((s) => {
      if (s.referenced_figure_id && (s.referenced_figure_id === figure.id || s.referenced_figure_id === figure.figure_number)) {
        return true;
      }
      if (s.referenced_figure?.id === figure.id) {
        return true;
      }
      if (s.referenced_figure_number) {
        const segNum = s.referenced_figure_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (segNum === figNum) return true;
      }
      const text = s.dialogue_text.toLowerCase().replace(/[^a-z0-9]/g, '');
      return text.includes(figNum);
    });

    return matchedSeg?.audio_start_ms;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.headerTitleRow}>
              <Layers size={18} color="#D97736" />
              <Text style={styles.headerTitle}>Figures & Diagrams</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{figures.length}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subheading}>
            Tap any figure to inspect or jump the audio briefing to where it is discussed.
          </Text>

          {/* Figures Scroll List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {figures.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No extracted figures found in this paper.</Text>
              </View>
            ) : (
              figures.map((fig) => {
                const isActive =
                  activeFigureId === fig.id ||
                  activeFigureId === fig.figure_number;
                const timestampMs = getFigureTimestamp(fig);

                // Image source resolver
                let imageSource: any;
                if (fig.public_url && fig.public_url.startsWith('http')) {
                  imageSource = { uri: fig.public_url };
                } else {
                  imageSource = require('../../../assets/figure_transformer_arch.jpg');
                }

                return (
                  <TouchableOpacity
                    key={fig.id || fig.figure_number}
                    style={[
                      styles.figureCard,
                      isActive && styles.figureCardActive,
                    ]}
                    onPress={() => {
                      onSelectFigure(fig, timestampMs);
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Thumbnail Image Container */}
                    <View style={styles.thumbnailWrapper}>
                      <Image
                        source={imageSource}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      <View style={styles.figureBadge}>
                        <Text style={styles.figureBadgeText}>
                          {fig.figure_number.toUpperCase()}
                        </Text>
                      </View>

                      {timestampMs !== undefined && (
                        <View style={styles.timestampBadge}>
                          <Clock size={10} color="#FFFFFF" />
                          <Text style={styles.timestampBadgeText}>
                            {formatTimestamp(timestampMs)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Figure Details */}
                    <View style={styles.cardDetails}>
                      <View style={styles.cardMetaRow}>
                        <Text style={styles.pageLabel}>Page {fig.page_number}</Text>
                        {isActive && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>NOW PLAYING</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.captionText} numberOfLines={3}>
                        {fig.caption || 'Extracted model schematic and diagram.'}
                      </Text>

                      {timestampMs !== undefined && (
                        <View style={styles.jumpHintRow}>
                          <Clock size={11} color="#D97736" />
                          <Text style={styles.jumpHintText}>
                            Tap to jump audio to {formatTimestamp(timestampMs)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#090A0C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '82%',
    paddingBottom: 30,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: '#D97736',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  subheading: {
    fontSize: 12,
    color: '#7E828B',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 6,
    lineHeight: 17,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7E828B',
    fontSize: 13,
  },
  figureCard: {
    flexDirection: 'row',
    backgroundColor: '#111215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    gap: 12,
    padding: 10,
  },
  figureCardActive: {
    borderColor: '#D97736',
    backgroundColor: '#161413',
  },
  thumbnailWrapper: {
    width: 105,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1B1C20',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  figureBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(217, 119, 54, 0.5)',
  },
  figureBadgeText: {
    color: '#D97736',
    fontSize: 8.5,
    fontWeight: '700',
  },
  timestampBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  timestampBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#656870',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: 'rgba(217, 119, 54, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#D97736',
  },
  activePillText: {
    color: '#D97736',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  captionText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#9CA0AB',
    marginBottom: 6,
  },
  jumpHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jumpHintText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#D97736',
  },
});
