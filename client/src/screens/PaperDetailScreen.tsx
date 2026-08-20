/**
 * PaperPod Detail / Overview Screen
 * 100% Faithful Clone of Reference Screen 2 with Academic Paper Metadata.
 * Integrated with Brief vs Deep Dive depth selector and Paywall triggers.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Star, Headphones, Sparkles, Lock } from 'lucide-react-native';
import { theme } from '../theme';
import { Paper } from '../types';
import { useEntitlements } from '../context/EntitlementContext';
import { usePaywallTrigger } from '../hooks/usePaywallTrigger';
import { PaywallModal } from '../components/paywall/PaywallModal';

interface PaperDetailScreenProps {
  paper: Paper;
  onBack: () => void;
  onEnterChannel: () => void;
  onOpenCustomerCenter?: () => void;
}

export const PaperDetailScreen: React.FC<PaperDetailScreenProps> = ({
  paper,
  onBack,
  onEnterChannel,
  onOpenCustomerCenter,
}) => {
  const { isPro } = useEntitlements();
  const {
    isPaywallVisible,
    paywallReason,
    openPaywall,
    closePaywall,
    checkDeepDiveTrigger,
  } = usePaywallTrigger();

  const [selectedDepth, setSelectedDepth] = useState<'brief' | 'deep_dive'>('brief');

  const handleSelectDeepDive = () => {
    if (!isPro) {
      checkDeepDiveTrigger();
    } else {
      setSelectedDepth('deep_dive');
    }
  };

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

        {/* Depth Selector: 3-Min Executive Brief vs 15-Min Deep Dive */}
        <View style={styles.depthSelectorContainer}>
          <TouchableOpacity
            style={[styles.depthCard, selectedDepth === 'brief' && styles.depthCardActive]}
            onPress={() => setSelectedDepth('brief')}
            activeOpacity={0.8}
          >
            <View style={styles.depthCardHeader}>
              <Headphones size={15} color={theme.colors.primary} />
              <Text style={styles.depthBadge}>INCLUDED</Text>
            </View>
            <Text style={styles.depthTitle}>Executive Brief</Text>
            <Text style={styles.depthDesc}>3-minute core findings and high-level intuition.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.depthCard, selectedDepth === 'deep_dive' && styles.depthCardActive]}
            onPress={handleSelectDeepDive}
            activeOpacity={0.8}
          >
            <View style={styles.depthCardHeader}>
              <Sparkles size={15} color={theme.colors.primary} />
              {!isPro ? (
                <View style={styles.lockBadge}>
                  <Lock size={10} color="#FFFFFF" />
                  <Text style={styles.lockBadgeText}>PRO</Text>
                </View>
              ) : (
                <Text style={styles.depthBadge}>ACTIVE</Text>
              )}
            </View>
            <Text style={styles.depthTitle}>Full Deep Dive</Text>
            <Text style={styles.depthDesc}>15-minute analysis of all proofs, ablations & tables.</Text>
          </TouchableOpacity>
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
          <Text style={styles.enterButtonText}>
            Enter {selectedDepth === 'deep_dive' ? 'Deep Dive (15 Min)' : 'Audio Briefing'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={isPaywallVisible}
        onClose={closePaywall}
        reason={paywallReason || 'DEEP_DIVE_REQUEST'}
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
    marginBottom: 16,
  },
  domeMask: {
    width: 290,
    height: 300,
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
    marginBottom: 16,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
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
  depthSelectorContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 18,
  },
  depthCard: {
    flex: 1,
    backgroundColor: '#111215',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  depthCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(217, 119, 54, 0.06)',
  },
  depthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  depthBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  depthTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  depthDesc: {
    fontSize: 10.5,
    color: theme.colors.textSecondary,
    lineHeight: 14,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7E828B',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
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
