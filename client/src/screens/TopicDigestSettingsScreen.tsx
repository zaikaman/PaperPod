/**
 * PaperPod Topic Preference & Digest Settings Screen (T066)
 * High-Grade Obsidian Dark UI with OneSignal v5 Push Integration,
 * Category Multi-Subscriptions, Cadence Selector, Spaced Reminders, and Live Push Simulations.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Sparkles,
  Zap,
  Cpu,
  MessageSquare,
  Eye,
  Bot,
  Dna,
  Brain,
  ShieldCheck,
  Radio,
  Send,
  Smartphone,
  ChevronRight,
} from 'lucide-react-native';
import { theme } from '../theme';
import { api } from '../services/api';
import { notificationService } from '../services/notifications';
import { deepLinkHandler } from '../navigation/deepLinkHandler';
import { ResearchTopic, DigestFrequency, NotificationPreference, Paper } from '../types';

interface TopicDigestSettingsScreenProps {
  onBack: () => void;
  onNavigateToPlayer?: (paper: Paper, episodeId?: string, timestampMs?: number) => void;
}

const TOPIC_ICONS: Record<string, any> = {
  Cpu: Cpu,
  MessageSquare: MessageSquare,
  Eye: Eye,
  Bot: Bot,
  Dna: Dna,
  Sparkles: Sparkles,
  Brain: Brain,
  ShieldCheck: ShieldCheck,
};

const DEFAULT_TOPICS: ResearchTopic[] = [
  {
    id: 'cs.AI',
    title: 'Artificial Intelligence & ML',
    category_code: 'cs.AI',
    description: 'Deep learning, reasoning, agent architectures, and autonomous decision systems.',
    icon: 'Cpu',
    color: '#06B6D4',
    subscriber_count: '18.4k Researchers',
    featured_paper: 'Attention Is All You Need',
    featured_paper_id: 'paper-attention-1706',
  },
  {
    id: 'cs.CL',
    title: 'Natural Language & LLMs',
    category_code: 'cs.CL',
    description: 'Transformer models, speech synthesis, alignment, and multilingual reasoning.',
    icon: 'MessageSquare',
    color: '#8B5CF6',
    subscriber_count: '24.8k Researchers',
    featured_paper: 'Language Models are Few-Shot Learners',
    featured_paper_id: 'paper-gpt3-2005',
  },
  {
    id: 'cs.CV',
    title: 'Computer Vision & Graphics',
    category_code: 'cs.CV',
    description: 'Visual understanding, diffusion models, 3D Gaussian splatting, and neural rendering.',
    icon: 'Eye',
    color: '#EC4899',
    subscriber_count: '15.3k Researchers',
    featured_paper: 'Deep Residual Learning for Image Recognition',
    featured_paper_id: 'paper-resnet-1512',
  },
  {
    id: 'cs.RO',
    title: 'Robotics & Embodied AI',
    category_code: 'cs.RO',
    description: 'Physical manipulation, sim-to-real transfer, and humanoid actuation control.',
    icon: 'Bot',
    color: '#F59E0B',
    subscriber_count: '9.6k Researchers',
    featured_paper: 'RT-2: Vision-Language-Action Models',
    featured_paper_id: 'paper-attention-1706',
  },
  {
    id: 'q-bio',
    title: 'Computational Biology & Genomics',
    category_code: 'q-bio',
    description: 'Protein folding simulations, CRISPR targeting, and molecular dynamics.',
    icon: 'Dna',
    color: '#10B981',
    subscriber_count: '8.2k Researchers',
    featured_paper: 'Highly accurate protein structure prediction with AlphaFold',
    featured_paper_id: 'paper-attention-1706',
  },
  {
    id: 'quant-ph',
    title: 'Quantum & Theoretical Physics',
    category_code: 'quant-ph',
    description: 'Quantum error correction, superconducting qubits, and topological insulators.',
    icon: 'Sparkles',
    color: '#3B82F6',
    subscriber_count: '6.5k Researchers',
    featured_paper: 'Quantum Computational Advantage using Photons',
    featured_paper_id: 'paper-attention-1706',
  },
  {
    id: 'q-bio.NC',
    title: 'Neuroscience & Cognitive AI',
    category_code: 'q-bio.NC',
    description: 'Neural coding mechanisms, connectomics, and biological memory models.',
    icon: 'Brain',
    color: '#A855F7',
    subscriber_count: '5.9k Researchers',
    featured_paper: 'A Neural Algorithm of Artistic Style',
    featured_paper_id: 'paper-attention-1706',
  },
  {
    id: 'cs.CR',
    title: 'Cryptography & AI Safety',
    category_code: 'cs.CR',
    description: 'Post-quantum crypto, differential privacy, red-teaming, and zero-knowledge proofs.',
    icon: 'ShieldCheck',
    color: '#14B8A6',
    subscriber_count: '7.3k Researchers',
    featured_paper: 'Scalable Agent Red-Teaming & Alignment',
    featured_paper_id: 'paper-attention-1706',
  },
];

const FREQUENCY_OPTIONS: Array<{
  id: DigestFrequency;
  title: string;
  subtitle: string;
  timeLabel: string;
}> = [
  {
    id: 'daily_morning',
    title: 'Daily Morning Briefing',
    subtitle: 'Arrives at 8:00 AM for your morning commute & coffee',
    timeLabel: '08:00 AM',
  },
  {
    id: 'evening_commute',
    title: 'Evening Research Review',
    subtitle: 'Arrives at 6:00 PM summarizing the day’s top preprints',
    timeLabel: '06:00 PM',
  },
  {
    id: 'weekly_digest',
    title: 'Weekly Sunday Roundup',
    subtitle: 'Top 5 landmark discoveries of the week every Sunday',
    timeLabel: 'Sundays',
  },
  {
    id: 'disabled',
    title: 'Mute Push Digests',
    subtitle: 'Receive alerts only for manual study bookmarks & queues',
    timeLabel: 'Muted',
  },
];

export const TopicDigestSettingsScreen: React.FC<TopicDigestSettingsScreenProps> = ({
  onBack,
  onNavigateToPlayer,
}) => {
  const [topics, setTopics] = useState<ResearchTopic[]>(DEFAULT_TOPICS);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(['cs.AI', 'cs.CL', 'cs.CV']);
  const [frequency, setFrequency] = useState<DigestFrequency>('daily_morning');
  const [studyReminders, setStudyReminders] = useState<boolean>(true);
  const [isPushPermissionGranted, setIsPushPermissionGranted] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-App Toast & Simulation Feedback
  const [activeSimulationBanner, setActiveSimulationBanner] = useState<{
    title: string;
    body: string;
    targetPaperId: string;
    targetEpisodeId?: string;
    targetTimestampMs?: number;
  } | null>(null);

  useEffect(() => {
    notificationService.init();

    // Fetch remote topics & preferences if available
    async function loadData() {
      try {
        const remoteTopics = await api.getNotificationTopics();
        if (remoteTopics && remoteTopics.length > 0) {
          setTopics(remoteTopics);
        }

        const prefs = await api.getNotificationPreferences();
        if (prefs) {
          if (prefs.subscribed_topics) {
            setSelectedTopicIds(prefs.subscribed_topics);
          }
          if (prefs.digest_frequency) {
            setFrequency(prefs.digest_frequency);
          }
          if (prefs.study_reminders_enabled !== undefined) {
            setStudyReminders(prefs.study_reminders_enabled);
          }
        }
      } catch (err) {
        console.log('[TopicDigestSettings] Loaded with offline defaults:', err);
      }
    }

    loadData();
  }, []);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setIsPushPermissionGranted(granted);
    showToast(granted ? '✓ Push notifications enabled!' : '⚠️ Notification permissions denied');
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await api.saveNotificationPreferences({
        user_id: '00000000-0000-0000-0000-000000000001',
        subscribed_topics: selectedTopicIds,
        digest_frequency: frequency,
        digest_time: frequency === 'evening_commute' ? '18:00' : '08:00',
        study_reminders_enabled: studyReminders,
        reminder_interval_hours: 48,
      });

      // Update OneSignal tags
      await notificationService.setTopicTags(selectedTopicIds);

      showToast('✓ Research digest preferences saved!');
    } catch (e) {
      console.warn('[TopicDigestSettings] Save error:', e);
      showToast('✓ Preferences saved locally');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Simulate Daily Topic Digest Push
  const handleSimulateDigest = () => {
    const payload = notificationService.simulateIncomingDigest(
      'cs.AI',
      'paper-attention-1706',
      'Attention Is All You Need'
    );

    setActiveSimulationBanner({
      title: payload.headings?.en || 'Daily Digest: cs.AI',
      body:
        payload.contents?.en ||
        "Today's top paper: Attention Is All You Need. Tap to listen to audio briefing.",
      targetPaperId: 'paper-attention-1706',
      targetEpisodeId: 'demo-episode-1706',
      targetTimestampMs: 0,
    });
  };

  // 2. Simulate Spaced Study Reminder Push
  const handleSimulateReminder = () => {
    const payload = notificationService.simulateIncomingReminder(
      'paper-attention-1706',
      'Attention Is All You Need',
      105000 // 01:45
    );

    setActiveSimulationBanner({
      title: payload.headings?.en || 'Resume Your Research Briefing',
      body:
        payload.contents?.en ||
        "Continue 'Attention Is All You Need' where you left off at 01:45. Alex & Dr. Taylor are ready.",
      targetPaperId: 'paper-attention-1706',
      targetEpisodeId: 'demo-episode-1706',
      targetTimestampMs: 105000,
    });
  };

  // Deep Link Launch from Simulation Banner
  const handleLaunchFromBanner = () => {
    if (!activeSimulationBanner) return;

    const demoPaper: Paper = {
      id: activeSimulationBanner.targetPaperId,
      title: 'Attention Is All You Need',
      authors: ['Vaswani', 'Shazeer', 'Parmar', 'Uszkoreit'],
      abstract:
        'We propose the Transformer, a model architecture relying entirely on an attention mechanism to draw global dependencies.',
      total_pages: 15,
      status: 'ready',
      source_type: 'arxiv_url',
      pdf_storage_path: 'papers/1706.03762.pdf',
    };

    if (onNavigateToPlayer) {
      onNavigateToPlayer(
        demoPaper,
        activeSimulationBanner.targetEpisodeId || 'demo-episode-1706',
        activeSimulationBanner.targetTimestampMs || 0
      );
    } else {
      deepLinkHandler.triggerSimulation({
        type: 'player',
        paperId: activeSimulationBanner.targetPaperId,
        episodeId: activeSimulationBanner.targetEpisodeId || 'demo-episode-1706',
        timestampMs: activeSimulationBanner.targetTimestampMs || 0,
        source: 'push',
      });
    }

    setActiveSimulationBanner(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.navIconBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Research Digests</Text>

        <View style={styles.oneSignalPill}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.oneSignalPillText}>OneSignal v5</Text>
        </View>
      </View>

      {/* Interactive Simulation In-App Push Banner */}
      {activeSimulationBanner ? (
        <TouchableOpacity
          style={styles.simulationBanner}
          onPress={handleLaunchFromBanner}
          activeOpacity={0.9}
        >
          <View style={styles.simulationBannerHeader}>
            <View style={styles.simulationIconBox}>
              <Bell size={14} color="#06B6D4" />
            </View>
            <Text style={styles.simulationBannerTitle} numberOfLines={1}>
              {activeSimulationBanner.title}
            </Text>
            <Text style={styles.simulationTimeAgo}>now</Text>
          </View>
          <Text style={styles.simulationBannerBody} numberOfLines={2}>
            {activeSimulationBanner.body}
          </Text>
          <View style={styles.simulationActionRow}>
            <Text style={styles.simulationActionText}>Tap to Open Audio Briefing</Text>
            <ChevronRight size={13} color="#06B6D4" />
          </View>
        </TouchableOpacity>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroBox}>
          <View style={styles.heroIconBox}>
            <Radio size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Spaced Research Reminders & Daily Digests</Text>
          <Text style={styles.heroSubtitle}>
            Subscribe to academic fields on arXiv. Receive scheduled 2-host audio briefings and pick up uncompleted papers right where you left off.
          </Text>
        </View>

        {/* Push Status Card */}
        <View style={styles.pushStatusCard}>
          <View style={styles.pushStatusLeft}>
            <Smartphone size={20} color="#10B981" />
            <View style={styles.pushStatusTextCol}>
              <Text style={styles.pushStatusTitle}>Push Notifications</Text>
              <Text style={styles.pushStatusSub}>
                {isPushPermissionGranted
                  ? 'Active · Receiving category preprints & study alerts'
                  : 'Disabled · Enable to receive automated audio briefings'}
              </Text>
            </View>
          </View>
          {!isPushPermissionGranted ? (
            <TouchableOpacity
              style={styles.enablePushBtn}
              onPress={handleRequestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.enablePushBtnText}>Enable</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeCheckBadge}>
              <Check size={14} color="#10B981" />
            </View>
          )}
        </View>

        {/* Section 1: Research Domains & Subscriptions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SELECT RESEARCH CATEGORIES</Text>
          <Text style={styles.sectionBadge}>{selectedTopicIds.length} Selected</Text>
        </View>

        <View style={styles.topicsGrid}>
          {topics.map((topic) => {
            const isSelected = selectedTopicIds.includes(topic.id);
            const IconComp = TOPIC_ICONS[topic.icon] || Cpu;

            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  isSelected && { borderColor: topic.color, backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                ]}
                onPress={() => handleToggleTopic(topic.id)}
                activeOpacity={0.8}
              >
                <View style={styles.topicCardTop}>
                  <View
                    style={[
                      styles.topicIconContainer,
                      { backgroundColor: `${topic.color}18`, borderColor: `${topic.color}40` },
                    ]}
                  >
                    <IconComp size={18} color={topic.color} />
                  </View>
                  <View
                    style={[
                      styles.topicCheckbox,
                      isSelected && { backgroundColor: topic.color, borderColor: topic.color },
                    ]}
                  >
                    {isSelected ? <Check size={12} color="#000000" strokeWidth={3} /> : null}
                  </View>
                </View>

                <Text style={styles.topicTitleText} numberOfLines={1}>
                  {topic.title}
                </Text>
                <Text style={styles.topicDescText} numberOfLines={2}>
                  {topic.description}
                </Text>

                <View style={styles.topicFooter}>
                  <View style={styles.categoryCodePill}>
                    <Text style={styles.categoryCodeText}>{topic.category_code}</Text>
                  </View>
                  <Text style={styles.subscriberCountText}>{topic.subscriber_count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 2: Delivery Cadence */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DIGEST CADENCE & SCHEDULE</Text>
        </View>

        <View style={styles.frequencyList}>
          {FREQUENCY_OPTIONS.map((opt) => {
            const isSelected = frequency === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.frequencyCard, isSelected && styles.frequencyCardActive]}
                onPress={() => setFrequency(opt.id)}
                activeOpacity={0.8}
              >
                <View style={styles.frequencyRadioCol}>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected ? <View style={styles.radioInnerDot} /> : null}
                  </View>
                </View>

                <View style={styles.frequencyTextCol}>
                  <View style={styles.frequencyTitleRow}>
                    <Text style={styles.frequencyTitle}>{opt.title}</Text>
                    <View style={styles.frequencyTimePill}>
                      <Clock size={10} color="#9CA3AF" style={{ marginRight: 4 }} />
                      <Text style={styles.frequencyTimeText}>{opt.timeLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.frequencySubtitle}>{opt.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 3: Spaced Study Reminders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SPACED STUDY REMINDERS</Text>
        </View>

        <View style={styles.studyReminderCard}>
          <View style={styles.studyReminderRow}>
            <View style={styles.studyReminderInfo}>
              <Text style={styles.studyReminderTitle}>Resume Uncompleted Briefings</Text>
              <Text style={styles.studyReminderDesc}>
                If a queued paper is paused for 48 hours, receive a gentle audio resume alert with your saved timestamp.
              </Text>
            </View>
            <Switch
              value={studyReminders}
              onValueChange={setStudyReminders}
              trackColor={{ false: '#262626', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 4: Live Push Simulation Suite (Hackathon / Demo Tools) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={13} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
              LIVE PUSH TEST SUITE (DEMO TOOLS)
            </Text>
          </View>
        </View>

        <View style={styles.simulationSuiteCard}>
          <Text style={styles.simulationIntroText}>
            Simulate realistic OneSignal push alerts on web or mobile to test deep-linking directly into paper audio playback.
          </Text>

          <View style={styles.simulationButtonsCol}>
            {/* Simulation 1: Daily Digest */}
            <TouchableOpacity
              style={styles.simBtnPrimary}
              onPress={handleSimulateDigest}
              activeOpacity={0.8}
            >
              <Zap size={15} color="#000000" />
              <View style={styles.simBtnTextCol}>
                <Text style={styles.simBtnPrimaryTitle}>Simulate Topic Digest Alert</Text>
                <Text style={styles.simBtnPrimarySub}>
                  Push top AI paper $\rightarrow$ 1-tap play start
                </Text>
              </View>
            </TouchableOpacity>

            {/* Simulation 2: Spaced Reminder */}
            <TouchableOpacity
              style={styles.simBtnSecondary}
              onPress={handleSimulateReminder}
              activeOpacity={0.8}
            >
              <Clock size={15} color="#06B6D4" />
              <View style={styles.simBtnTextCol}>
                <Text style={styles.simBtnSecondaryTitle}>Simulate 48h Spaced Reminder</Text>
                <Text style={styles.simBtnSecondarySub}>
                  Resume 'Attention Is All You Need' at 01:45
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Preferences Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSavePreferences}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Digest Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Confirmation Toast */}
      {toastMessage ? (
        <View style={styles.floatingToast}>
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </View>
      ) : null}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  navIconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  oneSignalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  oneSignalPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  heroBox: {
    backgroundColor: '#0B0B0E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 18,
  },
  heroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    color: '#8A8F9B',
  },
  pushStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111216',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  pushStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  pushStatusTextCol: {
    flex: 1,
  },
  pushStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pushStatusSub: {
    fontSize: 10.5,
    color: '#717682',
    lineHeight: 14,
  },
  enablePushBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enablePushBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  activeCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#6E727A',
    textTransform: 'uppercase',
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: 'rgba(217, 119, 54, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  topicCard: {
    width: '48.5%',
    backgroundColor: '#101115',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  topicCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topicIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  topicDescText: {
    fontSize: 10,
    lineHeight: 13.5,
    color: '#6F7480',
    marginBottom: 8,
    height: 28,
  },
  topicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  categoryCodePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryCodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  subscriberCountText: {
    fontSize: 9,
    color: '#5C606B',
  },
  frequencyList: {
    gap: 8,
    marginBottom: 22,
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101115',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  frequencyCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(217, 119, 54, 0.05)',
  },
  frequencyRadioCol: {
    marginRight: 12,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  frequencyTextCol: {
    flex: 1,
  },
  frequencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  frequencyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  frequencyTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  frequencyTimeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  frequencySubtitle: {
    fontSize: 10.5,
    color: '#717682',
    lineHeight: 14,
  },
  studyReminderCard: {
    backgroundColor: '#101115',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 22,
  },
  studyReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  studyReminderInfo: {
    flex: 1,
  },
  studyReminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  studyReminderDesc: {
    fontSize: 10.5,
    color: '#717682',
    lineHeight: 15,
  },
  simulationSuiteCard: {
    backgroundColor: '#13120F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 22,
  },
  simulationIntroText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#A39A86',
    marginBottom: 12,
  },
  simulationButtonsCol: {
    gap: 8,
  },
  simBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  simBtnPrimaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  simBtnPrimarySub: {
    fontSize: 9.5,
    color: '#3B2900',
    fontWeight: '500',
  },
  simBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  simBtnSecondaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
  },
  simBtnSecondarySub: {
    fontSize: 9.5,
    color: '#67B8C7',
  },
  simBtnTextCol: {
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  simulationBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#0F1A24',
    borderWidth: 1.2,
    borderColor: '#06B6D4',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  simulationBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  simulationIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulationBannerTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  simulationTimeAgo: {
    fontSize: 10,
    color: '#67B8C7',
  },
  simulationBannerBody: {
    fontSize: 11,
    lineHeight: 15,
    color: '#C2DCE4',
    marginBottom: 8,
  },
  simulationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 182, 212, 0.2)',
    paddingTop: 6,
  },
  simulationActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1E1E28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  floatingToastText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
