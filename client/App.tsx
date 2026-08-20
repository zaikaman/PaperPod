/**
 * PaperPod Mobile & Web Application Root
 * Seamless navigation between Discovery/Ingestion Home and Interactive Player.
 */
import React, { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { theme } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { Paper } from './src/types';

export default function App() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | undefined>(undefined);

  const handleSelectPaper = (paper: Paper, episodeId?: string) => {
    setSelectedPaper(paper);
    setActiveEpisodeId(episodeId);
  };

  const handleBackToHome = () => {
    setSelectedPaper(null);
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
        ) : (
          <HomeScreen onSelectPaper={handleSelectPaper} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
