/**
 * PaperPod Voice Recording & Live Interruption Modal Component
 * 100% Consistent with Luxury Dark Obsidian / Burnt Copper Aesthetics.
 * Features Pulsing Mic Visualizer, Quick Prompt Pills, Text Fallback, and Haptic Feedback.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mic, Send, X, Sparkles, MessageSquare, Volume2, Keyboard } from 'lucide-react-native';
import { theme } from '../../theme';
import { interruptionManager, InterruptionStateData } from '../../services/interruptionManager';

interface VoiceInterruptModalProps {
  visible: boolean;
  episodeId: string;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Why do we divide by sqrt(d_k) in equation 1?',
  'Explain Figure 1 in the HUD',
  'Why replace recurrence with self-attention?',
  'What is the computational complexity difference?',
];

export const VoiceInterruptModal: React.FC<VoiceInterruptModalProps> = ({
  visible,
  episodeId,
  onClose,
}) => {
  const [managerData, setManagerData] = useState<InterruptionStateData>(interruptionManager.getData());
  const [inputText, setInputText] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Animated pulse rings for the microphone
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const unsub = interruptionManager.subscribe((data) => {
      setManagerData(data);
      if (data.state === 'CLARIFYING') {
        // Automatically close modal when transitioning to clarification bubble
        onClose();
      }
    });
    return () => unsub();
  }, [onClose]);

  useEffect(() => {
    if (visible && !isTextMode) {
      // Start ambient pulse animation
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.25,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.15,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.6);
    }
  }, [visible, isTextMode, pulseAnim, pulseOpacity]);

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {}
  };

  const handleMicPress = () => {
    triggerHaptic();
    if (!isRecording) {
      setIsRecording(true);
      // Simulate speech recording window
      setTimeout(() => {
        setIsRecording(false);
        // Default simulated voice question if user spoke
        handleSubmitQuery(inputText.trim() || 'Why do we divide by sqrt(d_k) in equation 1?');
      }, 2500);
    } else {
      setIsRecording(false);
      handleSubmitQuery(inputText.trim() || 'Why do we divide by sqrt(d_k) in equation 1?');
    }
  };

  const handleSubmitQuery = async (query: string) => {
    if (!query.trim()) return;
    triggerHaptic();
    setInputText('');
    await interruptionManager.submitQuestion(query, episodeId);
  };

  const handleSelectQuickPrompt = (prompt: string) => {
    triggerHaptic();
    handleSubmitQuery(prompt);
  };

  const handleCancel = () => {
    triggerHaptic();
    interruptionManager.cancelInterruption();
    onClose();
  };

  const isTranscribing = managerData.state === 'TRANSCRIBING';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <Image
                source={require('../../../assets/avatar_kianna.jpg')}
                style={styles.hostAvatarSmall}
              />
              <View style={styles.headerTextCol}>
                <View style={styles.badgeRow}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE INTERRUPT</Text>
                  </View>
                  <Text style={styles.hostTag}>DR. TAYLOR</Text>
                </View>
                <Text style={styles.sheetTitle}>Ask for Immediate Clarification</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetContent}
            contentContainerStyle={styles.sheetContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Interactive Mic Section */}
            {!isTextMode ? (
              <View style={styles.micInteractionArea}>
                <View style={styles.micWrapper}>
                  {/* Glowing Animated Outer Rings */}
                  <Animated.View
                    style={[
                      styles.pulseRingOuter,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.pulseRingInner,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />

                  <TouchableOpacity
                    style={[styles.mainMicBtn, isRecording && styles.mainMicBtnActive]}
                    onPress={handleMicPress}
                    disabled={isTranscribing}
                    activeOpacity={0.85}
                  >
                    <Mic
                      size={32}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.statusPromptText}>
                  {isTranscribing
                    ? 'Consulting paper vectors with Gemini...'
                    : isRecording
                    ? 'Listening... Tap when done'
                    : 'Tap to speak your question'}
                </Text>
                <Text style={styles.subPromptText}>
                  Audio paused automatically · Dr. Taylor will explain in 2 sentences
                </Text>
              </View>
            ) : (
              /* Text Input Fallback Area */
              <View style={styles.textInputArea}>
                <View style={styles.inputBoxContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type your question for Dr. Taylor..."
                    placeholderTextColor="#52555C"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    autoFocus
                    editable={!isTranscribing}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      (!inputText.trim() || isTranscribing) && styles.sendBtnDisabled,
                    ]}
                    onPress={() => handleSubmitQuery(inputText)}
                    disabled={!inputText.trim() || isTranscribing}
                    activeOpacity={0.8}
                  >
                    <Send size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mode Switcher Toggle Button */}
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={styles.modeToggleBtn}
                onPress={() => {
                  triggerHaptic();
                  setIsTextMode(!isTextMode);
                }}
                activeOpacity={0.7}
              >
                {isTextMode ? (
                  <>
                    <Mic size={14} color="#D97736" />
                    <Text style={styles.modeToggleText}>Switch to Voice Mic</Text>
                  </>
                ) : (
                  <>
                    <Keyboard size={14} color="#D97736" />
                    <Text style={styles.modeToggleText}>Type question instead</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Suggestion Pills */}
            <View style={styles.quickPromptsSection}>
              <View style={styles.quickHeaderRow}>
                <Sparkles size={13} color="#D97736" />
                <Text style={styles.quickSectionTitle}>QUICK IN-CONTEXT QUESTIONS</Text>
              </View>

              <View style={styles.pillsContainer}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.promptPill}
                    onPress={() => handleSelectQuickPrompt(prompt)}
                    disabled={isTranscribing}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.promptPillText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#111215',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D97736',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 54, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97736',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#D97736',
  },
  hostTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#38BDF8',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    paddingHorizontal: 20,
  },
  sheetContentContainer: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  micInteractionArea: {
    alignItems: 'center',
    marginVertical: 12,
  },
  micWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(217, 119, 54, 0.25)',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(217, 119, 54, 0.35)',
  },
  mainMicBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#D97736',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#D97736',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  mainMicBtnActive: {
    backgroundColor: '#E28647',
    transform: [{ scale: 1.08 }],
  },
  statusPromptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subPromptText: {
    fontSize: 12,
    color: '#8B8F97',
    textAlign: 'center',
  },
  textInputArea: {
    marginVertical: 12,
  },
  inputBoxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#17181C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 80,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    paddingTop: 4,
    paddingBottom: 4,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97736',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeToggleRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97736',
  },
  quickPromptsSection: {
    marginTop: 4,
  },
  quickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  quickSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#8B8F97',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  promptPillText: {
    fontSize: 12,
    color: '#C8CBD0',
  },
});
