/**
 * PaperPod Mobile & Web Application Root
 * Seamless 3-Screen Flow: Discovery Home -> Channel/Paper Detail -> Interactive Player.
 */
import React, { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { PaperDetailScreen } from './src/screens/PaperDetailScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { Paper } from './src/types';

export default function App() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | undefined>(undefined);

  // Directly play a paper
  const handleSelectPaper = (paper: Paper, episodeId?: string) => {
    setSelectedPaper(paper);
    setDetailPaper(null);
    setActiveEpisodeId(episodeId);
  };

  // Open the Channel / Detail screen (Screen 2)
  const handleOpenDetail = (paper: Paper) => {
    setDetailPaper(paper);
  };

  // Enter the player from Channel / Detail screen
  const handleEnterPlayerFromDetail = () => {
    if (detailPaper) {
      setSelectedPaper(detailPaper);
      setActiveEpisodeId(detailPaper.id === 'paper-attention-1706' ? 'demo-episode-1706' : undefined);
      setDetailPaper(null);
    }
  };

  const handleBackToHome = () => {
    setSelectedPaper(null);
    setDetailPaper(null);
    setActiveEpisodeId(undefined);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {selectedPaper ? (
          <PlayerScreen
            paper={selectedPaper}
            initialEpisodeId={activeEpisodeId}
            onBack={handleBackToHome}
          />
        ) : detailPaper ? (
          <PaperDetailScreen
            paper={detailPaper}
            onBack={handleBackToHome}
            onEnterChannel={handleEnterPlayerFromDetail}
          />
        ) : (
          <HomeScreen
            onSelectPaper={handleSelectPaper}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
