/**
 * PaperPod Mobile & Web Application Root
 * Seamless Screen Flow: Discovery Home <-> Paper Detail <-> Interactive Player <-> Customer Center.
 * Integrated with EntitlementProvider for Monetization, Quotas, and Dynamic Paywalls v2.
 */
import React, { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { EntitlementProvider } from './src/context/EntitlementContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { PaperDetailScreen } from './src/screens/PaperDetailScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { CustomerCenterScreen } from './src/screens/CustomerCenterScreen';
import { Paper } from './src/types';

export default function App() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | undefined>(undefined);
  const [showCustomerCenter, setShowCustomerCenter] = useState<boolean>(false);

  // Directly play a paper
  const handleSelectPaper = (paper: Paper, episodeId?: string) => {
    setSelectedPaper(paper);
    setDetailPaper(null);
    setShowCustomerCenter(false);
    setActiveEpisodeId(episodeId);
  };

  // Open the Channel / Detail screen (Screen 2)
  const handleOpenDetail = (paper: Paper) => {
    setDetailPaper(paper);
    setShowCustomerCenter(false);
  };

  // Enter the player from Channel / Detail screen
  const handleEnterPlayerFromDetail = () => {
    if (detailPaper) {
      setSelectedPaper(detailPaper);
      setActiveEpisodeId(detailPaper.id === 'paper-attention-1706' ? 'demo-episode-1706' : undefined);
      setDetailPaper(null);
      setShowCustomerCenter(false);
    }
  };

  const handleBackToHome = () => {
    setSelectedPaper(null);
    setDetailPaper(null);
    setShowCustomerCenter(false);
    setActiveEpisodeId(undefined);
  };

  const handleOpenCustomerCenter = () => {
    setShowCustomerCenter(true);
  };

  return (
    <SafeAreaProvider>
      <EntitlementProvider>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {showCustomerCenter ? (
            <CustomerCenterScreen onBack={() => setShowCustomerCenter(false)} />
          ) : selectedPaper ? (
            <PlayerScreen
              paper={selectedPaper}
              initialEpisodeId={activeEpisodeId}
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
