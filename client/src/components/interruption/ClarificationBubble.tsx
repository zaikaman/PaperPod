/**
 * PaperPod Host Clarification Floating Bubble Component
 * Displays Dr. Taylor's animated avatar, spoken clarification text, context section tag,
 * progress bar, and instant "Resume Briefing" action.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Volume2, Play, Sparkles, X, FastForward, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../theme';
import { interruptionManager, InterruptionStateData } from '../../services/interruptionManager';

interface ClarificationBubbleProps {
  data: InterruptionStateData;
  onDismiss?: () => void;
}

export const ClarificationBubble: React.FC<ClarificationBubbleProps> = ({
  data,
  onDismiss,
}) => {
  const glowAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing halo glow for speaking avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim, slideAnim, fadeAnim]);

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {}
  };

  const handleResumeNow = async () => {
    triggerHaptic();
    await interruptionManager.resumeBriefing();
    if (onDismiss) onDismiss();
  };

  const progressRatio =
    data.durationMs > 0
      ? Math.min(1, data.elapsedClarificationMs / data.durationMs)
      : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Top Banner Row */}
      <View style={styles.topBanner}>
        <View style={styles.badgeRow}>
          <View style={styles.clarificationTag}>
            <Sparkles size={11} color="#38BDF8" />
            <Text style={styles.clarificationTagText}>DR. TAYLOR CLARIFICATION</Text>
          </View>
          {data.relevantSectionHeading ? (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText} numberOfLines={1}>
                {data.relevantSectionHeading}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.closeActionBtn}
          onPress={handleResumeNow}
          activeOpacity={0.7}
        >
          <X size={15} color="#8B8F97" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentRow}>
        {/* Host Avatar with Sound Aura */}
        <View style={styles.avatarWrapper}>
          <Animated.View
            style={[
              styles.avatarHalo,
              {
                transform: [{ scale: glowAnim }],
              },
            ]}
          />
          <Image
            source={require('../../../assets/avatar_kianna.jpg')}
            style={styles.avatarImage}
          />
          <View style={styles.soundIndicatorPill}>
            <Volume2 size={10} color="#FFFFFF" />
          </View>
        </View>

        {/* Text Col */}
        <View style={styles.textCol}>
          {data.queryText ? (
            <Text style={styles.userQueryText} numberOfLines={1}>
              “{data.queryText}”
            </Text>
          ) : null}
          <Text style={styles.clarificationBodyText}>
            {data.clarificationText}
          </Text>
        </View>
      </View>

      {/* Bottom Progress and Resume Bar */}
      <View style={styles.footerRow}>
        {/* Progress Track */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
        </View>

        <TouchableOpacity
          style={styles.resumeBtn}
          onPress={handleResumeNow}
          activeOpacity={0.8}
        >
          <Text style={styles.resumeBtnText}>Resume Briefing</Text>
          <FastForward size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#17181C',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D97736',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#D97736',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  clarificationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  clarificationTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#38BDF8',
  },
  sectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 160,
  },
  sectionBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#A0A4AD',
  },
  closeActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 119, 54, 0.35)',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D97736',
  },
  soundIndicatorPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D97736',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  userQueryText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#D97736',
    marginBottom: 4,
  },
  clarificationBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D97736',
    borderRadius: 2,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 54, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D97736',
    gap: 6,
  },
  resumeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
