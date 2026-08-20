/**
 * PaperPod Interactive Audio Player Screen
 * Faithfully styled after Reference Screen 3 with Synchronized Figure HUD & Live Transcript.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  ThumbsUp,
  Maximize2,
  Mic,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../theme';
import { Paper, Episode, DialogueSegment, WordTiming } from '../types';
import { api } from '../services/api';
import { audioPlayer, PlaybackState } from '../services/audioPlayer';
import { AudioScrubber } from '../components/audio/AudioScrubber';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { getSegmentWords } from '../utils/transcript';
import { DEMO_EPISODE_SEGMENTS } from '../data/demoEpisode';

interface PlayerScreenProps {
  paper: Paper;
  initialEpisodeId?: string;
  onBack: () => void;
  onOpenInterruptionModal?: () => void;
}

const DEFAULT_SEGMENTS: DialogueSegment[] = DEMO_EPISODE_SEGMENTS;

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  paper,
  initialEpisodeId,
  onBack,
  onOpenInterruptionModal,
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioPlayer.getState());
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [bookmarked, setBookmarked] = useState(false);
  const [episodeSegments, setEpisodeSegments] = useState<DialogueSegment[]>(DEFAULT_SEGMENTS);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  // Load episode audio and segments dynamically
  useEffect(() => {
    let isMounted = true;

    async function loadEpisodeData() {
      try {
        let epData: Episode | null = null;
        if (initialEpisodeId) {
          epData = await api.getEpisode(initialEpisodeId);
        } else if (paper.id) {
          const paperDetail = await api.getPaper(paper.id);
          if (paperDetail.episodes && paperDetail.episodes.length > 0) {
            epData = paperDetail.episodes[0] || null;
          }
        }

        if (epData && isMounted) {
          setCurrentEpisode(epData);
          if (epData.segments && epData.segments.length > 0) {
            setEpisodeSegments(epData.segments as any);
          }
          const audioUrl = epData.audio_url || `http://localhost:8000/api/v1/papers/episodes/${epData.id}/stream`;
          await audioPlayer.loadAudio(audioUrl, true);
        }
      } catch (e) {
        console.warn('[PlayerScreen] Could not fetch remote episode, using fallback:', e);
      }
    }

    loadEpisodeData();

    return () => {
      isMounted = false;
    };
  }, [paper.id, initialEpisodeId]);

  const segments = episodeSegments.length > 0 ? episodeSegments : DEFAULT_SEGMENTS;

  useEffect(() => {
    const unsubscribe = audioPlayer.subscribe((state) => {
      setPlaybackState(state);

      // Find active segment by current playback timestamp
      const pos = state.positionMillis;
      const index = segments.findIndex(
        (seg) => pos >= seg.audio_start_ms && pos < seg.audio_end_ms
      );
      if (index !== -1 && index !== activeSegmentIndex) {
        setActiveSegmentIndex(index);
      }
    });

    return () => unsubscribe();
  }, [segments, activeSegmentIndex]);

  const activeSegment = segments[activeSegmentIndex] || segments[0];
  const isHostAlex = activeSegment?.speaker === 'alex';

  const handleTogglePlay = async () => {
    const epId = initialEpisodeId || currentEpisode?.id || 'demo-episode-1706';
    const audioUrl = currentEpisode?.audio_url || `http://localhost:8000/api/v1/papers/episodes/${epId}/stream`;
    try {
      await audioPlayer.loadAudio(audioUrl, false);
      await audioPlayer.togglePlayPause();
    } catch (e) {
      console.warn('[PlayerScreen] Play error:', e);
    }
  };

  const handleSeek = (pos: number) => {
    audioPlayer.seekTo(pos);
  };

  const handleSkip = (delta: number) => {
    audioPlayer.skip(delta);
  };

  const handleChangeSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx] || 1.0;
    setPlaybackSpeed(nextSpeed);
    audioPlayer.setPlaybackSpeed(nextSpeed);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.paperTitleTag}>
          <Text style={styles.paperTagText} numberOfLines={1}>
            {paper.title || 'Attention Is All You Need'}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => setBookmarked(!bookmarked)}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Bookmark
              size={18}
              color={bookmarked ? theme.colors.primary : theme.colors.textSecondary}
              fill={bookmarked ? theme.colors.primary : 'none'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Synchronized Figure HUD / Hero Visual Card (Matching Reference Screen 3) */}
        <View style={styles.figureCard}>
          <View style={styles.figureHeader}>
            <View style={styles.figureBadge}>
              <Sparkles size={12} color={theme.colors.primary} />
              <Text style={styles.figureBadgeText}>
                {activeSegment?.referenced_figure_id ? 'Figure 1: Transformer' : 'Figure 1: Architecture'}
              </Text>
            </View>

            <TouchableOpacity style={styles.autoZoomPill} activeOpacity={0.8}>
              <Maximize2 size={12} color={theme.colors.primary} />
              <Text style={styles.autoZoomText}>Auto-Zoom</Text>
            </TouchableOpacity>
          </View>

          {/* Diagram Display Container */}
          <View style={styles.figureImageContainer}>
            <View style={styles.diagramMockBox}>
              <View style={styles.diagramLayer}>
                <Text style={styles.diagramLayerText}>Output Probabilities</Text>
              </View>
              <View style={[styles.diagramLayer, styles.diagramLayerActive]}>
                <Text style={[styles.diagramLayerText, styles.diagramLayerActiveText]}>
                  Multi-Head Self Attention
                </Text>
              </View>
              <View style={styles.diagramLayer}>
                <Text style={styles.diagramLayerText}>Positional Encoding</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section / Chapter Heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.chapterLabel}>
            Section {activeSegmentIndex + 1}: {isHostAlex ? 'Core Intuition & Motivation' : 'Mathematical Formulation'}
          </Text>
        </View>

        {/* Minimalist Scrubber & Playback Controls */}
        <AudioScrubber
          isPlaying={playbackState.isPlaying}
          positionMillis={playbackState.positionMillis}
          durationMillis={playbackState.durationMillis || 45000}
          playbackSpeed={playbackSpeed}
          onTogglePlayPause={handleTogglePlay}
          onSeek={handleSeek}
          onSkip={handleSkip}
          onChangeSpeed={handleChangeSpeed}
        />

        {/* Active Host Avatar Pill & Animated Waveform */}
        <View style={styles.hostIndicatorCard}>
          <View
            style={[
              styles.hostAvatarCircle,
              { borderColor: isHostAlex ? theme.colors.hostAlex : theme.colors.hostTaylor },
            ]}
          >
            <Text style={styles.hostAvatarInitial}>
              {isHostAlex ? 'A' : 'T'}
            </Text>
          </View>

          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>
              {isHostAlex ? 'Alex (Curious Analyst)' : 'Dr. Taylor (Lead Scientist)'}
            </Text>
            <Text style={styles.hostRole}>
              {isHostAlex ? 'Explaining via analogies' : 'Breaking down math equations'}
            </Text>
          </View>

          <WaveformVisualizer
            isPlaying={playbackState.isPlaying}
            speaker={activeSegment?.speaker}
            barCount={14}
            height={28}
          />
        </View>

        {/* Interactive Synced Transcript Area */}
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptSectionLabel}>LIVE SYNCED TRANSCRIPT</Text>

          {segments.map((seg, idx) => {
            const isCurrent = idx === activeSegmentIndex;
            return (
              <TouchableOpacity
                key={seg.id || idx}
                style={[
                  styles.transcriptLine,
                  isCurrent && styles.transcriptLineActive,
                ]}
                onPress={() => handleSeek(seg.audio_start_ms)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.transcriptSpeaker,
                    { color: seg.speaker === 'alex' ? theme.colors.hostAlex : theme.colors.hostTaylor },
                  ]}
                >
                  {seg.speaker.toUpperCase()}:
                </Text>
                <Text style={styles.transcriptTextWrapper}>
                  {getSegmentWords(seg).map((w, wIdx) => {
                    const isSpoken = playbackState.positionMillis >= w.start_ms;
                    const isCurrent =
                      playbackState.positionMillis >= w.start_ms &&
                      playbackState.positionMillis <= w.end_ms;
                    return (
                      <Text
                        key={wIdx}
                        onPress={() => handleSeek(w.start_ms)}
                        style={[
                          styles.wordInactive,
                          isSpoken && styles.wordSpoken,
                          isCurrent && styles.wordCurrent,
                        ]}
                      >
                        {w.text}{' '}
                      </Text>
                    );
                  })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Community & Interruption Notes Section (Cloning reference "Other Readers Say") */}
        <View style={styles.communitySection}>
          <Text style={styles.communitySectionLabel}>OTHER RESEARCHERS ASKED</Text>

          <View style={styles.communityCard}>
            <View style={styles.communityCardHeader}>
              <View style={styles.userAvatarBox}>
                <Text style={styles.userAvatarInitial}>W</Text>
              </View>
              <View style={styles.userInfoBox}>
                <Text style={styles.userName}>Wilson Rothman</Text>
                <Text style={styles.userTime}>28min ago</Text>
              </View>
              <View style={styles.likeBadge}>
                <ThumbsUp size={12} color={theme.colors.primary} />
                <Text style={styles.likeCount}>9</Text>
              </View>
            </View>
            <Text style={styles.commentText}>
              "How does dividing by sqrt(d_k) prevent the vanishing gradient in softmax?"
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Live Voice Interruption Button (Bottom Pill) */}
      <View style={styles.floatingActionContainer}>
        <TouchableOpacity
          style={styles.micButton}
          onPress={onOpenInterruptionModal}
          activeOpacity={0.85}
        >
          <View style={styles.micIconCircle}>
            <Mic size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.micButtonText}>Tap to Interrupt & Ask</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperTitleTag: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  paperTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  figureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  figureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  figureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.25)',
  },
  figureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  autoZoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  autoZoomText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  figureImageContainer: {
    height: 160,
    backgroundColor: theme.colors.backgroundSubtle,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  diagramMockBox: {
    width: '85%',
    gap: 8,
  },
  diagramLayer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  diagramLayerActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
  },
  diagramLayerText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  diagramLayerActiveText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  sectionHeadingRow: {
    marginVertical: 6,
  },
  chapterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  hostIndicatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: 12,
    gap: 12,
  },
  hostAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: theme.colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  hostRole: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  transcriptContainer: {
    marginTop: 16,
    gap: 12,
  },
  transcriptSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  transcriptLine: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.65,
  },
  transcriptLineActive: {
    borderColor: theme.colors.borderAccent,
    backgroundColor: 'rgba(217, 119, 54, 0.07)',
    opacity: 1.0,
  },
  transcriptSpeaker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  transcriptTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  transcriptTextWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    lineHeight: 22,
  },
  wordInactive: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#656870',
  },
  wordSpoken: {
    color: '#D1D5DB',
    fontWeight: '500',
  },
  wordCurrent: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(217, 119, 54, 0.40)',
    fontWeight: '700',
    borderRadius: 3,
  },
  communitySection: {
    marginTop: 24,
  },
  communitySectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  communityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  communityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userInfoBox: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  userTime: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  likeCount: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  commentText: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  micIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
