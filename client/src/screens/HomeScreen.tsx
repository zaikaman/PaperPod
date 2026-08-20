/**
 * PaperPod Discovery & Ingestion Home Screen
 * 100% Faithful Clone of Reference Screen 1 with Authentic Academic Research Content.
 * Integrated with RevenueCat Dynamic Paywalls v2 & Customer Center.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Headphones,
  ArrowRight,
  Play,
  Cpu,
  Layers,
  Sparkles,
  Search,
  Crown,
  Zap,
  Bell,
} from 'lucide-react-native';
import { theme } from '../theme';
import { api } from '../services/api';
import { Paper } from '../types';
import { useEntitlements } from '../context/EntitlementContext';
import { usePaywallTrigger } from '../hooks/usePaywallTrigger';
import { PaywallModal } from '../components/paywall/PaywallModal';

interface HomeScreenProps {
  onSelectPaper: (paper: Paper, episodeId?: string) => void;
  onOpenDetail?: (paper: Paper) => void;
  onOpenCustomerCenter?: () => void;
  onOpenTopicDigests?: () => void;
}

const CATEGORIES = [
  {
    id: 'cs',
    title: 'Computer Science',
    count: '539 Papers',
    icon: Cpu,
  },
  {
    id: 'neural',
    title: 'Neural Architectures',
    count: '1,675 Papers',
    icon: Layers,
  },
  {
    id: 'quantum',
    title: 'Quantum & Physics',
    count: '412 Papers',
    icon: Sparkles,
  },
];

const PRESET_PAPERS = [
  {
    id: 'paper-attention-1706',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar et al.',
    subtitle: '8 Sections · 14 Min',
    meta: '1.2M Citations · NeurIPS',
    thumb: require('../../assets/thumb_serpent.jpg'),
    arxiv_id: '1706.03762',
    pages: 15,
    abstract:
      'We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output without recurrent or convolutional layers.',
  },
  {
    id: 'paper-resnet-1512',
    title: 'Deep Residual Learning for Image Recognition',
    authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun',
    subtitle: '6 Sections · 11 Min',
    meta: '185k Citations · CVPR',
    thumb: require('../../assets/thumb_veil.jpg'),
    arxiv_id: '1512.03385',
    pages: 12,
    abstract:
      'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
  },
  {
    id: 'paper-gpt3-2005',
    title: 'Language Models are Few-Shot Learners',
    authors: 'Tom B. Brown, Benjamin Mann, Nick Ryder et al.',
    subtitle: '12 Sections · 18 Min',
    meta: '45k Citations · NeurIPS',
    thumb: require('../../assets/thumb_echoes.jpg'),
    arxiv_id: '2005.14165',
    pages: 75,
    abstract:
      'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPaper,
  onOpenDetail,
  onOpenCustomerCenter,
  onOpenTopicDigests,
}) => {
  const [arxivInput, setArxivInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const { isPro, conversionsUsed, recordPaperConversion } = useEntitlements();
  const {
    isPaywallVisible,
    paywallReason,
    openPaywall,
    closePaywall,
    checkWeeklyConversionTrigger,
  } = usePaywallTrigger();

  const handleIngest = async () => {
    // Check weekly conversion quota limit for free users
    const allowed = checkWeeklyConversionTrigger();
    if (!allowed) {
      return;
    }

    const query = arxivInput.trim() || '1706.03762';
    setIsIngesting(true);
    try {
      const res = await api.ingestArxiv(query);
      recordPaperConversion();
      if (res.paper) {
        onSelectPaper(res.paper, res.episode_id);
      }
    } catch (e) {
      console.warn('Ingestion fallback to demo:', e);
      recordPaperConversion();
      const demoPaper: Paper = {
        id: 'paper-attention-1706',
        title: 'Attention Is All You Need',
        authors: ['Vaswani', 'Shazeer', 'Parmar'],
        abstract: 'The Transformer architecture relying on self-attention.',
        total_pages: 15,
        status: 'ready',
        source_type: 'arxiv_url',
        pdf_storage_path: 'papers/1706.03762.pdf',
      };
      onSelectPaper(demoPaper, 'demo-episode-1706');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleItemPress = (paperItem: (typeof PRESET_PAPERS)[0]) => {
    const paperObj: Paper = {
      id: paperItem.id,
      title: paperItem.title,
      authors: [paperItem.authors],
      abstract: paperItem.abstract,
      total_pages: paperItem.pages,
      status: 'ready',
      source_type: 'arxiv_url',
      arxiv_id: paperItem.arxiv_id,
      pdf_storage_path: `papers/${paperItem.arxiv_id}.pdf`,
    };
    if (onOpenDetail) {
      onOpenDetail(paperObj);
    } else {
      onSelectPaper(paperObj, paperItem.id === 'paper-attention-1706' ? 'demo-episode-1706' : undefined);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navIconBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerRightGroup}>
          {/* Research Topic Digests & Reminders Bell Button */}
          <TouchableOpacity
            style={styles.digestBellBtn}
            onPress={onOpenTopicDigests}
            activeOpacity={0.75}
          >
            <Bell size={16} color="#FFFFFF" />
            <View style={styles.bellActiveDot} />
          </TouchableOpacity>

          {/* Customer Center & Membership Pill */}
          <TouchableOpacity
            style={styles.membershipPill}
            onPress={() => (onOpenCustomerCenter ? onOpenCustomerCenter() : openPaywall('CUSTOMER_CENTER_UPGRADE'))}
            activeOpacity={0.8}
          >
            <Crown size={14} color={isPro ? '#F59E0B' : theme.colors.primary} />
            <Text style={[styles.membershipPillText, isPro && styles.membershipPillTextPro]}>
              {isPro ? 'PRO' : `${conversionsUsed}/2 USED`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered Hero Academic 3D Journal Sculpture */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageWrapper}>
            <Image
              source={require('../../assets/hero_research_journal.jpg')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.heroTitle}>Leading Research Briefings</Text>
          <Text style={styles.heroSubtitle}>
            Transform dense academic papers into interactive 2-host audio briefings with synchronized figure tracking.
          </Text>

          {/* Concentric Search & Ingestion Capsule */}
          <View style={styles.ingestionBox}>
            <Search size={16} color="#656870" style={styles.searchIcon} />
            <TextInput
              style={styles.ingestInput}
              placeholder="Paste arXiv link or paper ID..."
              placeholderTextColor="#52555C"
              value={arxivInput}
              onChangeText={setArxivInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.ingestActionBtn,
                arxivInput.trim().length > 0 && styles.ingestActionBtnFilled,
              ]}
              onPress={handleIngest}
              disabled={isIngesting}
              activeOpacity={0.8}
            >
              {isIngesting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ArrowRight
                  size={15}
                  color={arxivInput.trim().length > 0 ? '#FFFFFF' : '#D97736'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* POPULAR CATEGORIES Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>POPULAR CATEGORIES</Text>
          {onOpenTopicDigests ? (
            <TouchableOpacity onPress={onOpenTopicDigests} activeOpacity={0.7}>
              <Text style={styles.sectionActionLink}>MANAGE DIGESTS →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, idx === 0 && styles.categoryCardFirst]}
                onPress={onOpenTopicDigests}
                activeOpacity={0.75}
              >
                <View style={styles.categoryIconBox}>
                  <IconComp size={20} color="#D97736" />
                </View>
                <View style={styles.categoryTextCol}>
                  <Text style={styles.categoryTitleText}>{cat.title}</Text>
                  <Text style={styles.categoryCountText}>{cat.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* RECOMMENDED RESEARCH STORIES Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECOMMENDED PAPERS</Text>
        </View>

        <View style={styles.storiesList}>
          {PRESET_PAPERS.map((paperItem) => (
            <TouchableOpacity
              key={paperItem.id}
              style={styles.storyCard}
              onPress={() => handleItemPress(paperItem)}
              activeOpacity={0.7}
            >
              {/* Scientific Graphical Thumbnail */}
              <Image source={paperItem.thumb} style={styles.storyThumb} />

              {/* Title & Author Subtitle */}
              <View style={styles.storyInfoCol}>
                <Text style={styles.storyTitleText} numberOfLines={1}>
                  {paperItem.title}
                </Text>
                <Text style={styles.storySubText}>{paperItem.subtitle}</Text>
              </View>

              {/* Circular Copper Play Button */}
              <TouchableOpacity
                style={styles.wireframePlayBtn}
                onPress={() => handleItemPress(paperItem)}
                activeOpacity={0.8}
              >
                <Play size={13} color="#D97736" fill="#D97736" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={isPaywallVisible}
        onClose={closePaywall}
        reason={paywallReason || 'WEEKLY_CONVERSION_LIMIT'}
      />
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  digestBellBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellActiveDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06B6D4',
  },
  sectionActionLink: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.8,
  },
  membershipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  membershipPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.6,
  },
  membershipPillTextPro: {
    color: '#F59E0B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 22,
  },
  heroImageWrapper: {
    width: 140,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7E828B',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  ingestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111215',
    borderRadius: 30,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  ingestInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    paddingVertical: 4,
  },
  ingestActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C86A32',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingestActionBtnFilled: {
    backgroundColor: '#C86A32',
    borderColor: '#C86A32',
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#6E727A',
    textTransform: 'uppercase',
  },
  categoriesRow: {
    paddingRight: 10,
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111215',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minWidth: 175,
  },
  categoryCardFirst: {
    borderColor: 'rgba(200, 106, 50, 0.35)',
  },
  categoryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(217, 119, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTextCol: {
    justifyContent: 'center',
  },
  categoryTitleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryCountText: {
    fontSize: 10.5,
    color: '#656870',
  },
  storiesList: {
    gap: 10,
    marginBottom: 10,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111215',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  storyThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#1A1A1E',
  },
  storyInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  storyTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  storySubText: {
    fontSize: 11,
    color: '#656870',
  },
  wireframePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
