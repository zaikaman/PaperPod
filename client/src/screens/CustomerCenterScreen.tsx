/**
 * PaperPod Customer Center Screen
 * Comprehensive subscription management, active tier inspection, quota tracker, and sandbox tier switcher.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  Zap,
  Mic,
  Headphones,
  Download,
  RotateCcw,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Sliders,
  Check,
} from 'lucide-react-native';
import { theme } from '../theme';
import { useEntitlements } from '../context/EntitlementContext';
import { PaywallModal } from '../components/paywall/PaywallModal';
import { EntitlementTier } from '../types';

interface CustomerCenterScreenProps {
  onBack: () => void;
}

export const CustomerCenterScreen: React.FC<CustomerCenterScreenProps> = ({ onBack }) => {
  const {
    entitlements,
    isPro,
    isStudent,
    conversionsUsed,
    conversionsLimit,
    conversionsRemaining,
    restorePurchases,
    simulateTier,
    resetQuotas,
  } = useEntitlements();

  const [restoring, setRestoring] = useState<boolean>(false);
  const [paywallVisible, setPaywallVisible] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<'CUSTOMER_CENTER_UPGRADE' | 'STUDENT_DISCOUNT'>(
    'CUSTOMER_CENTER_UPGRADE'
  );

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handleRestore = async () => {
    triggerHaptic();
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert('Purchases Restored', 'Your Pro entitlements have been successfully validated.');
      } else {
        Alert.alert('No Active Purchases', 'No previous purchases were found for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message || 'Error communicating with App Store.');
    } finally {
      setRestoring(false);
    }
  };

  const getTierLabel = () => {
    switch (entitlements.tier) {
      case 'pro_annual':
        return 'PaperPod Pro (Annual)';
      case 'pro_monthly':
        return 'PaperPod Pro (Monthly)';
      case 'student_lifetime':
        return 'Student Lifetime Pass';
      default:
        return 'Free Explorer Tier';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            triggerHaptic();
            onBack();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Customer Center</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Tier Hero Card */}
        <View style={[styles.tierCard, isPro && styles.tierCardPro]}>
          <View style={styles.tierCardTop}>
            <View style={styles.tierIconWrap}>
              {isStudent ? (
                <GraduationCap size={20} color={theme.colors.primary} />
              ) : isPro ? (
                <Crown size={20} color={theme.colors.primary} />
              ) : (
                <ShieldCheck size={20} color={theme.colors.textSecondary} />
              )}
            </View>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>{isPro ? 'ACTIVE PLAN' : 'FREE TIER'}</Text>
            </View>
          </View>

          <Text style={styles.tierName}>{getTierLabel()}</Text>
          <Text style={styles.tierDescription}>
            {isStudent
              ? 'Academic lifetime pass verified. Unlimited AI podcasts and voice queries forever.'
              : isPro
              ? 'Unlimited 2-host audio briefings, deep dives, and live voice interruptions.'
              : '2 paper conversions / week, 3-minute executive briefs, 1 voice query per paper.'}
          </Text>

          {/* Quota Progress Visualizers */}
          <View style={styles.quotaSection}>
            <View style={styles.quotaRow}>
              <Text style={styles.quotaLabel}>Weekly Paper Ingestions</Text>
              <Text style={styles.quotaValue}>
                {isPro ? 'Unlimited (∞)' : `${conversionsUsed} / 2 used`}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: isPro ? '100%' : `${Math.min(100, (conversionsUsed / 2) * 100)}%`,
                    backgroundColor: isPro
                      ? theme.colors.success
                      : conversionsRemaining === 0
                      ? '#EF4444'
                      : theme.colors.primary,
                  },
                ]}
              />
            </View>

            <View style={[styles.quotaRow, { marginTop: 12 }]}>
              <Text style={styles.quotaLabel}>Voice Q&A per Paper</Text>
              <Text style={styles.quotaValue}>{isPro ? 'Unlimited (∞)' : '1 Query Included'}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: isPro ? '100%' : '50%',
                    backgroundColor: isPro ? theme.colors.success : theme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {!isPro ? (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                triggerHaptic();
                setPaywallReason('CUSTOMER_CENTER_UPGRADE');
                setPaywallVisible(true);
              }}
              activeOpacity={0.88}
            >
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro · Save 48%</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.proActiveIndicator}>
              <Check size={16} color={theme.colors.success} />
              <Text style={styles.proActiveText}>All Pro Features Unlocked & Active</Text>
            </View>
          )}
        </View>

        {/* Membership Actions Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeading}>MEMBERSHIP & BILLING</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic();
              setPaywallReason('STUDENT_DISCOUNT');
              setPaywallVisible(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconWrap}>
                <GraduationCap size={16} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Academic & Student Pass</Text>
                <Text style={styles.menuItemSub}>Verify .edu email for $39.99 lifetime pass</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleRestore} disabled={restoring}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconWrap}>
                <RotateCcw size={16} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Restore App Store Purchases</Text>
                <Text style={styles.menuItemSub}>Sync prior purchases across iOS & Android devices</Text>
              </View>
            </View>
            {restoring ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <ChevronRight size={18} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Manage Subscription',
                Platform.OS === 'ios'
                  ? 'Manage your PaperPod subscription in Settings -> Apple ID -> Subscriptions.'
                  : 'Manage your PaperPod subscription in Google Play Store -> Payments & Subscriptions.'
              )
            }
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconWrap}>
                <Crown size={16} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Manage App Store Subscription</Text>
                <Text style={styles.menuItemSub}>View renewal date or change payment details</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Developer / Hackathon Judge Sandbox Switcher */}
        <View style={styles.sandboxSection}>
          <View style={styles.sandboxHeader}>
            <Sliders size={14} color={theme.colors.primary} />
            <Text style={styles.sandboxTitle}>HACKATHON EVALUATION SANDBOX</Text>
          </View>
          <Text style={styles.sandboxDesc}>
            Test paywall transitions and entitlement unlocks in real time without real billing:
          </Text>

          <View style={styles.sandboxButtonsRow}>
            <TouchableOpacity
              style={[
                styles.sandboxBtn,
                entitlements.tier === 'free' && styles.sandboxBtnActive,
              ]}
              onPress={() => {
                triggerHaptic();
                simulateTier('free');
              }}
            >
              <Text style={styles.sandboxBtnText}>Free Explorer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sandboxBtn,
                entitlements.tier === 'pro_annual' && styles.sandboxBtnActive,
              ]}
              onPress={() => {
                triggerHaptic();
                simulateTier('pro_annual');
              }}
            >
              <Text style={styles.sandboxBtnText}>Pro Annual</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sandboxBtn,
                entitlements.tier === 'student_lifetime' && styles.sandboxBtnActive,
              ]}
              onPress={() => {
                triggerHaptic();
                simulateTier('student_lifetime');
              }}
            >
              <Text style={styles.sandboxBtnText}>Student Pass</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetQuotaBtn}
            onPress={() => {
              triggerHaptic();
              resetQuotas();
              Alert.alert('Quotas Reset', 'Weekly conversions and voice question counters have been cleared.');
            }}
          >
            <RotateCcw size={12} color={theme.colors.textSecondary} />
            <Text style={styles.resetQuotaBtnText}>Reset Weekly & Voice Quotas</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Comparison Matrix */}
        <View style={styles.perksCard}>
          <Text style={styles.perksHeading}>TIER COMPARISON</Text>

          <View style={styles.perkRow}>
            <Mic size={15} color={theme.colors.primary} />
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>Live Voice Interruption (RAG Q&A)</Text>
              <Text style={styles.perkDesc}>Free: 1 question/paper · Pro: Unlimited</Text>
            </View>
          </View>

          <View style={styles.perkRow}>
            <Headphones size={15} color={theme.colors.primary} />
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>Audio Episode Depth</Text>
              <Text style={styles.perkDesc}>Free: 3-Min Executive Brief · Pro: 15-Min Deep Dives</Text>
            </View>
          </View>

          <View style={styles.perkRow}>
            <Download size={15} color={theme.colors.primary} />
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>Offline Listening</Text>
              <Text style={styles.perkDesc}>Free: Streaming only · Pro: Full Offline Caching</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        reason={paywallReason}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  tierCard: {
    backgroundColor: '#111215',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  tierCardPro: {
    borderColor: 'rgba(217, 119, 54, 0.35)',
    backgroundColor: 'rgba(217, 119, 54, 0.04)',
  },
  tierCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tierDescription: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  quotaSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotaLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  quotaValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  proActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  menuSection: {
    backgroundColor: '#111215',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  menuSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItemSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  sandboxSection: {
    backgroundColor: '#14161C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.2)',
    marginBottom: 20,
  },
  sandboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sandboxTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.primary,
  },
  sandboxDesc: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  sandboxButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  sandboxBtn: {
    flex: 1,
    backgroundColor: '#1E2129',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sandboxBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sandboxBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetQuotaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  resetQuotaBtnText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  perksCard: {
    backgroundColor: '#111215',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  perksHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  perkTextWrap: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  perkDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
