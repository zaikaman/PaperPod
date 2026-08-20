/**
 * PaperPod Interactive Audio Player Screen
 * 100% Faithful Clone of Reference Screen 3 with Transformer Architecture Figure HUD.
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
  ThumbsUp,
  Play,
  Pause,
  Mic,
  MessageSquare,
  Maximize2,
} from 'lucide-react-native';
import { theme } from '../theme';
import { Paper, Episode, DialogueSegment, WordTiming } from '../types';
import { api } from '../services/api';
import { audioPlayer, PlaybackState } from '../services/audioPlayer';
import { getSegmentWords } from '../utils/transcript';
import { DEMO_EPISODE_SEGMENTS } from '../data/demoEpisode';

interface PlayerScreenProps {
  paper: Paper;
  initialEpisodeId?: string;
  onBack: () => void;
  onOpenInterruptionModal?: () => void;
}

const DEFAULT_SEGMENTS: DialogueSegment[] = DEMO_EPISODE_SEGMENTS;

const RESEARCH_COMMENTS = [
  {
    id: 'c1',
    name: 'Wilson Rothman',
    time: '28min',
    avatar: require('../../assets/avatar_wilson.jpg'),
    text: 'How does dividing by sqrt(d_k) in equation 1 prevent vanishing gradients in softmax?',
    likes: 9,
  },
  {
    id: 'c2',
    name: 'Dr. Kianna Stanton',
    time: '2h',
    avatar: require('../../assets/avatar_kianna.jpg'),
    text: 'Multi-head attention projects Queries, Keys, and Values into 8 parallel sub-spaces of dimension 64.',
    likes: 31,
  },
];

const SECTION_TITLES = [
  'Section 1: Motivation & The Recurrence Bottleneck',
  'Section 2: Transformer Multi-Head Self-Attention',
  'Section 3: Scaled Dot-Product Attention Equation',
  'Section 4: Queries, Keys, Values & Gradient Stability',
];

const formatTime = (millis: number): string => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  paper,
  initialEpisodeId,
  onBack,
  onOpenInterruptionModal,
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioPlayer.getState());
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
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
          const audioUrl =
            epData.audio_url || `http://localhost:8000/api/v1/papers/episodes/${epData.id}/stream`;
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

  const handleTogglePlay = async () => {
    const epId = initialEpisodeId || currentEpisode?.id || 'demo-episode-1706';
    const audioUrl =
      currentEpisode?.audio_url || `http://localhost:8000/api/v1/papers/episodes/${epId}/stream`;
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

  const handleProgressBarPress = (event: any) => {
    const duration = playbackState.durationMillis || 66000;
    const { locationX } = event.nativeEvent;
    const ratio = Math.max(0, Math.min(1, locationX / 200));
    handleSeek(Math.floor(ratio * duration));
  };

  const progressRatio =
    playbackState.durationMillis > 0
      ? Math.min(1, playbackState.positionMillis / playbackState.durationMillis)
      : 0;

  const currentSectionTitle =
    SECTION_TITLES[activeSegmentIndex] ||
    `Section ${activeSegmentIndex + 1}: Attention Mechanism`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header: Back Arrow on Left, Pill on Right */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.navIconBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.storyTagPill}>
          <Text style={styles.storyTagText} numberOfLines={1}>
            {paper.title || 'Attention Is All You Need'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Figure HUD Visual Image Card (Figure 1: Transformer Architecture Blueprint) */}
        <View style={styles.heroVisualWrapper}>
          <Image
            source={require('../../assets/figure_transformer_arch.jpg')}
            style={styles.heroVisualImage}
            resizeMode="cover"
          />
          <View style={styles.figureBadge}>
            <Text style={styles.figureBadgeText}>FIG 1: ARCHITECTURE</Text>
          </View>
        </View>

        {/* Section / Chapter Title */}
        <Text style={styles.chapterTitleText}>{currentSectionTitle}</Text>

        {/* Minimalist Scrubber Row */}
        <View style={styles.scrubberRow}>
          <TouchableOpacity
            onPress={handleTogglePlay}
            style={styles.playPauseToggleBtn}
            activeOpacity={0.7}
          >
            {playbackState.isPlaying ? (
              <Pause size={17} color="#D97736" />
            ) : (
              <Play size={17} color="#D97736" fill="#D97736" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.progressTrack}
            onPress={handleProgressBarPress}
            activeOpacity={0.9}
          >
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          </TouchableOpacity>

          <Text style={styles.timeLabel}>
            {formatTime(playbackState.positionMillis)} /{' '}
            {formatTime(playbackState.durationMillis || 66000)}
          </Text>
        </View>

        {/* Floating Active Speaker Badge */}
        <View style={styles.floatingSpeakerBadgeRow}>
          <View style={styles.speakerPill}>
            <MessageSquare size={13} color="#D97736" />
          </View>
        </View>

        {/* Synced Reading / Transcript Stream */}
        <View style={styles.transcriptStream}>
          {segments.map((seg, idx) => {
            const isCurrent = idx === activeSegmentIndex;
            const isPast = idx < activeSegmentIndex;
            const words = getSegmentWords(seg);

            return (
              <View key={seg.id || idx} style={styles.dialogueBlock}>
                <Text style={styles.dialogueTextWrapper}>
                  {words.map((w, wIdx) => {
                    const isSpoken = playbackState.positionMillis >= w.start_ms;
                    const isWordActive =
                      playbackState.positionMillis >= w.start_ms &&
                      playbackState.positionMillis <= w.end_ms;

                    return (
                      <Text
                        key={wIdx}
                        onPress={() => handleSeek(w.start_ms)}
                        style={[
                          styles.wordDefault,
                          isPast && styles.wordPast,
                          isCurrent && styles.wordCurrentSeg,
                          isSpoken && styles.wordSpoken,
                          isWordActive && styles.wordActiveHighlight,
                        ]}
                      >
                        {w.text}{' '}
                      </Text>
                    );
                  })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Other Researchers Asked Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsSectionTitle}>Other Researchers Asked</Text>

          <View style={styles.commentsList}>
            {RESEARCH_COMMENTS.map((comm) => (
              <View key={comm.id} style={styles.commentItem}>
                <View style={styles.commentHeaderRow}>
                  <Image source={comm.avatar} style={styles.commentAvatar} />
                  <View style={styles.commentUserCol}>
                    <Text style={styles.commentUserName}>{comm.name}</Text>
                    <Text style={styles.commentUserTime}>{comm.time}</Text>
                  </View>
                  <View style={styles.commentLikesRow}>
                    <ThumbsUp size={12} color="#D97736" />
                    <Text style={styles.commentLikesText}>{comm.likes}</Text>
                  </View>
                </View>
                <Text style={styles.commentBodyText}>{comm.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Live Interruption Button */}
      <View style={styles.floatingMicContainer}>
        <TouchableOpacity
          style={styles.floatingMicBtn}
          onPress={onOpenInterruptionModal}
          activeOpacity={0.85}
        >
          <Mic size={16} color="#FFFFFF" />
          <Text style={styles.floatingMicText}>Tap to Interrupt & Ask</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navIconBtn: {
    padding: 6,
  },
  storyTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    maxWidth: 220,
  },
  storyTagText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 90,
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
  },
  heroVisualImage: {
    width: '100%',
    height: '100%',
  },
  figureBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  figureBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97736',
    letterSpacing: 1,
  },
  chapterTitleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  playPauseToggleBtn: {
    padding: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D97736',
    borderRadius: 1.5,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7E828B',
    fontVariant: ['tabular-nums'],
    minWidth: 80,
    textAlign: 'right',
  },
  floatingSpeakerBadgeRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  speakerPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderWidth: 1,
    borderColor: '#D97736',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptStream: {
    marginVertical: 12,
    gap: 16,
  },
  dialogueBlock: {
    paddingVertical: 2,
  },
  dialogueTextWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    lineHeight: 22,
  },
  wordDefault: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#383B44',
  },
  wordPast: {
    color: '#4B4E57',
  },
  wordCurrentSeg: {
    color: '#6C707A',
  },
  wordSpoken: {
    color: '#D1D5DB',
    fontWeight: '400',
  },
  wordActiveHighlight: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(217, 119, 54, 0.45)',
    fontWeight: '700',
    borderRadius: 3,
  },
  commentsSection: {
    marginTop: 26,
  },
  commentsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    gap: 6,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E2024',
  },
  commentUserCol: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentUserTime: {
    fontSize: 10,
    color: '#656870',
    marginTop: 1,
  },
  commentLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97736',
  },
  commentBodyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8B8F97',
    paddingLeft: 38,
  },
  floatingMicContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  floatingMicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D97736',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 24,
    shadowColor: '#D97736',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingMicText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
