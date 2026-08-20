/**
 * PaperPod Mobile & Web Application Root
 * Seamless Screen Flow:
 *  - Discovery Home
 *  - Research Channel / Detail Screen
 *  - Interactive Audio Player (with Synchronized HUD & Voice Clarifications)
 *  - Customer Center (RevenueCat Paywalls v2)
 *  - Topic Preference & Digest Settings (OneSignal v5 Push & Spaced Reminders)
 * Integrated with deepLinkHandler for push notification routing directly into player playback.
 */
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { EntitlementProvider } from './src/context/EntitlementContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { PaperDetailScreen } from './src/screens/PaperDetailScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { CustomerCenterScreen } from './src/screens/CustomerCenterScreen';
import { TopicDigestSettingsScreen } from './src/screens/TopicDigestSettingsScreen';
import { deepLinkHandler } from './src/navigation/deepLinkHandler';
import { notificationService } from './src/services/notifications';
import { Paper, DeepLinkTarget } from './src/types';

const DEMO_PRESET_PAPERS: Record<string, Paper> = {
  'paper-attention-1706': {
    id: 'paper-attention-1706',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
    abstract:
      'We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies.',
    total_pages: 15,
    status: 'ready',
    source_type: 'arxiv_url',
    arxiv_id: '1706.03762',
    pdf_storage_path: 'papers/1706.03762.pdf',
  },
  'paper-resnet-1512': {
    id: 'paper-resnet-1512',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    abstract:
      'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
    total_pages: 12,
    status: 'ready',
    source_type: 'arxiv_url',
    arxiv_id: '1512.03385',
    pdf_storage_path: 'papers/1512.03385.pdf',
  },
  'paper-gpt3-2005': {
    id: 'paper-gpt3-2005',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder'],
    abstract:
      'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance.',
    total_pages: 75,
    status: 'ready',
    source_type: 'arxiv_url',
    arxiv_id: '2005.14165',
    pdf_storage_path: 'papers/2005.14165.pdf',
  },
};

export default function App() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | undefined>(undefined);
  const [activeInitialTimestampMs, setActiveInitialTimestampMs] = useState<number | undefined>(undefined);
  const [showCustomerCenter, setShowCustomerCenter] = useState<boolean>(false);
  const [showTopicDigests, setShowTopicDigests] = useState<boolean>(false);

  // Initialize OneSignal and Deep Link Handler on startup
  useEffect(() => {
    notificationService.init();

    const cleanup = deepLinkHandler.init((target: DeepLinkTarget) => {
      console.log('[App] Deep link received target:', target);

      if (target.type === 'player' && target.paperId) {
        const targetPaper =
          DEMO_PRESET_PAPERS[target.paperId] || {
            id: target.paperId,
            title: 'Attention Is All You Need',
            authors: ['Vaswani et al.'],
            abstract: 'Transformer model based on self-attention.',
            total_pages: 15,
            status: 'ready',
            source_type: 'arxiv_url',
            pdf_storage_path: 'papers/1706.03762.pdf',
          };

        setSelectedPaper(targetPaper);
        setActiveEpisodeId(target.episodeId || 'demo-episode-1706');
        setActiveInitialTimestampMs(target.timestampMs || 0);
        setDetailPaper(null);
        setShowCustomerCenter(false);
        setShowTopicDigests(false);
      } else if (target.type === 'settings') {
        setShowTopicDigests(true);
        setShowCustomerCenter(false);
        setSelectedPaper(null);
        setDetailPaper(null);
      }
    });

    return () => cleanup();
  }, []);

  // Directly play a paper
  const handleSelectPaper = (paper: Paper, episodeId?: string, timestampMs?: number) => {
    setSelectedPaper(paper);
    setDetailPaper(null);
    setShowCustomerCenter(false);
    setShowTopicDigests(false);
    setActiveEpisodeId(episodeId);
    setActiveInitialTimestampMs(timestampMs);
  };

  // Open the Channel / Detail screen (Screen 2)
  const handleOpenDetail = (paper: Paper) => {
    setDetailPaper(paper);
    setShowCustomerCenter(false);
    setShowTopicDigests(false);
  };

  // Enter the player from Channel / Detail screen
  const handleEnterPlayerFromDetail = () => {
    if (detailPaper) {
      setSelectedPaper(detailPaper);
      setActiveEpisodeId(detailPaper.id === 'paper-attention-1706' ? 'demo-episode-1706' : undefined);
      setActiveInitialTimestampMs(undefined);
      setDetailPaper(null);
      setShowCustomerCenter(false);
      setShowTopicDigests(false);
    }
  };

  const handleBackToHome = () => {
    setSelectedPaper(null);
    setDetailPaper(null);
    setShowCustomerCenter(false);
    setShowTopicDigests(false);
    setActiveEpisodeId(undefined);
    setActiveInitialTimestampMs(undefined);
  };

  const handleOpenCustomerCenter = () => {
    setShowCustomerCenter(true);
    setShowTopicDigests(false);
  };

  const handleOpenTopicDigests = () => {
    setShowTopicDigests(true);
    setShowCustomerCenter(false);
  };

  return (
    <SafeAreaProvider>
      <EntitlementProvider>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {showCustomerCenter ? (
            <CustomerCenterScreen onBack={() => setShowCustomerCenter(false)} />
          ) : showTopicDigests ? (
            <TopicDigestSettingsScreen
              onBack={() => setShowTopicDigests(false)}
              onNavigateToPlayer={(paper, epId, ts) => handleSelectPaper(paper, epId, ts)}
            />
          ) : selectedPaper ? (
            <PlayerScreen
              paper={selectedPaper}
              initialEpisodeId={activeEpisodeId}
              initialTimestampMs={activeInitialTimestampMs}
              onBack={handleBackToHome}
              onOpenCustomerCenter={handleOpenCustomerCenter}
            />
          ) : detailPaper ? (
            <PaperDetailScreen
              paper={detailPaper}
              onBack={handleBackToHome}
              onEnterChannel={handleEnterPlayerFromDetail}
              onOpenCustomerCenter={handleOpenCustomerCenter}
            />
          ) : (
            <HomeScreen
              onSelectPaper={handleSelectPaper}
              onOpenDetail={handleOpenDetail}
              onOpenCustomerCenter={handleOpenCustomerCenter}
              onOpenTopicDigests={handleOpenTopicDigests}
            />
          )}
        </SafeAreaView>
      </EntitlementProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
