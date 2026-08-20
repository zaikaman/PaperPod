/**
 * PaperPod Discovery & Ingestion Home Screen
 * 100% Faithful Clone of Reference Screen 1 with Authentic Academic Research Content.
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
} from 'lucide-react-native';
import { theme } from '../theme';
import { api } from '../services/api';
import { Paper } from '../types';

interface HomeScreenProps {
  onSelectPaper: (paper: Paper, episodeId?: string) => void;
  onOpenDetail?: (paper: Paper) => void;
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

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectPaper, onOpenDetail }) => {
  const [arxivInput, setArxivInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const handleIngest = async () => {
    const query = arxivInput.trim() || '1706.03762';
    setIsIngesting(true);
    try {
      const res = await api.ingestArxiv(query);
      if (res.paper) {
        onSelectPaper(res.paper, res.episode_id);
      }
    } catch (e) {
      console.warn('Ingestion fallback to demo:', e);
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
        <TouchableOpacity style={styles.navIconBtn} activeOpacity={0.7}>
          <Headphones size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#7E828B',
    textAlign: 'center',
    maxWidth: 300,
  },
  ingestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    height: 48,
    paddingLeft: 16,
    paddingRight: 6,
    marginTop: 18,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  ingestInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  ingestActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 54, 0.4)',
    backgroundColor: 'rgba(217, 119, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingestActionBtnFilled: {
    backgroundColor: '#D97736',
    borderColor: '#D97736',
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#656870',
    textTransform: 'uppercase',
  },
  categoriesRow: {
    gap: 12,
    paddingBottom: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121316',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    minWidth: 165,
  },
  categoryCardFirst: {
    borderColor: 'rgba(217, 119, 54, 0.3)',
    backgroundColor: '#151518',
  },
  categoryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryCountText: {
    fontSize: 11,
    color: '#6E727A',
    marginTop: 2,
  },
  storiesList: {
    gap: 14,
    marginTop: 2,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 14,
  },
  storyThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#16171A',
  },
  storyInfoCol: {
    flex: 1,
  },
  storyTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EDEDED',
  },
  storySubText: {
    fontSize: 12,
    color: '#6E727A',
    marginTop: 3,
  },
  wireframePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#D97736',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
