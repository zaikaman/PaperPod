/**
 * AudioBookmarkBar Component (T060)
 * Allows listeners to save timestamped audio bookmarks, annotate key research insights,
 * and jump back to exact moments during playback.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Bookmark,
  BookmarkPlus,
  Clock,
  Trash2,
  Plus,
  X,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { theme } from '../../theme';
import { AudioBookmark } from '../../types';

interface AudioBookmarkBarProps {
  episodeId: string;
  currentPositionMs: number;
  durationMs: number;
  bookmarks: AudioBookmark[];
  onSeek: (timestampMs: number) => void;
  onAddBookmark: (timestampMs: number, noteText?: string) => Promise<void>;
  onDeleteBookmark: (bookmarkId: string) => Promise<void>;
}

const formatTime = (millis: number): string => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioBookmarkBar: React.FC<AudioBookmarkBarProps> = ({
  episodeId,
  currentPositionMs,
  durationMs,
  bookmarks,
  onSeek,
  onAddBookmark,
  onDeleteBookmark,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [capturedMs, setCapturedMs] = useState(0);

  const handleOpenAddModal = () => {
    setCapturedMs(currentPositionMs);
    setNoteInput('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const text = noteInput.trim() || `Bookmark at ${formatTime(capturedMs)}`;
      await onAddBookmark(capturedMs, text);
      setModalVisible(false);
    } catch (e) {
      console.warn('[AudioBookmarkBar] Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row: Title & Add Bookmark Action */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Bookmark size={13} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Audio Bookmarks</Text>
          {bookmarks.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{bookmarks.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBookmarkBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <BookmarkPlus size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addBookmarkBtnText}>Bookmark ({formatTime(currentPositionMs)})</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll List of Saved Bookmarks */}
      {bookmarks.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No bookmarks saved yet. Tap &apos;Bookmark&apos; to pin key insights at this timestamp.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {bookmarks.map((bm) => (
            <View key={bm.id} style={styles.bookmarkChip}>
              <TouchableOpacity
                style={styles.bookmarkChipContent}
                onPress={() => onSeek(bm.timestamp_ms)}
                activeOpacity={0.7}
              >
                <View style={styles.timeTag}>
                  <Clock size={10} color={theme.colors.primary} style={{ marginRight: 3 }} />
                  <Text style={styles.timeTagText}>{formatTime(bm.timestamp_ms)}</Text>
                </View>

                <Text style={styles.noteText} numberOfLines={1}>
                  {bm.note_text || `Note at ${formatTime(bm.timestamp_ms)}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteChipBtn}
                onPress={() => onDeleteBookmark(bm.id)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={12} color="#8B8F97" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add / Annotate Bookmark Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBox}>
                  <BookmarkPlus size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Save Research Bookmark</Text>
                  <Text style={styles.modalSubtitle}>
                    Pinned at timestamp {formatTime(capturedMs)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#8B8F97" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add an optional note (e.g. Equation 3 derivation)..."
                placeholderTextColor="#52555C"
                value={noteInput}
                onChangeText={setNoteInput}
                multiline
                maxLength={200}
                autoFocus
              />
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                <Check size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>
                  {isSaving ? 'Saving...' : 'Save Bookmark'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8B8F97',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  addBookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 54, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.45)',
  },
  addBookmarkBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  emptyStateContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyStateText: {
    fontSize: 11,
    color: '#52555C',
    fontStyle: 'italic',
  },
  scrollList: {
    gap: 8,
    paddingVertical: 2,
  },
  bookmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15161A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 5,
    maxWidth: 240,
  },
  bookmarkChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  noteText: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
    flexShrink: 1,
    maxWidth: 140,
  },
  deleteChipBtn: {
    padding: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#111215',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: theme.colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 18,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B8F97',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
