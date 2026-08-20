/**
 * PaperPod Detail / Overview Screen
 * 100% Faithful Clone of Reference Screen 2 with Academic Paper Metadata.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Star } from 'lucide-react-native';
import { theme } from '../theme';
import { Paper } from '../types';

interface PaperDetailScreenProps {
  paper: Paper;
  onBack: () => void;
  onEnterChannel: () => void;
}

export const PaperDetailScreen: React.FC<PaperDetailScreenProps> = ({
  paper,
  onBack,
  onEnterChannel,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.navIconBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIconBtn} activeOpacity={0.7}>
          <Star size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Arch Dome Hero Portrait Visual */}
        <View style={styles.domeHeroContainer}>
          <View style={styles.domeMask}>
            <Image
              source={require('../../assets/hero_portrait.jpg')}
              style={styles.domeImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Title & Metadata Tags */}
        <View style={styles.metaSection}>
          <Text style={styles.titleText}>{paper.title || 'Attention Is All You Need'}</Text>
          <Text style={styles.categoryTags}>
            MACHINE LEARNING · NEURAL ARCHITECTURE
          </Text>
        </View>

        {/* 3-Column Metrics Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{paper.total_pages || 15}</Text>
            <Text style={styles.statLabel}>Pages</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>1.2M</Text>
            <Text style={styles.statLabel}>Citations</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Audio Rating</Text>
          </View>
        </View>

        {/* Editorial Abstract */}
        <Text style={styles.descriptionText}>
          {paper.abstract ||
            'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.'}
        </Text>

        {/* Action Button: Enter Audio Briefing */}
        <TouchableOpacity
          style={styles.enterButton}
          onPress={onEnterChannel}
          activeOpacity={0.8}
        >
          <Text style={styles.enterButtonText}>Enter Audio Briefing</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  domeHeroContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  domeMask: {
    width: 290,
    height: 310,
    borderTopLeftRadius: 145,
    borderTopRightRadius: 145,
    borderBottomLeftRadius: 145,
    borderBottomRightRadius: 145,
    overflow: 'hidden',
    backgroundColor: '#141416',
  },
  domeImage: {
    width: '100%',
    height: '100%',
  },
  metaSection: {
    alignItems: 'center',
    marginBottom: 22,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 320,
  },
  categoryTags: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#D97736',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '85%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#6E727A',
    marginTop: 3,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7E828B',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  enterButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#000000',
    borderWidth: 1.2,
    borderColor: '#C86A32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
