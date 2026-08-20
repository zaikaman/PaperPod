/**
 * Dynamic Paywall v2 Modal Component for PaperPod
 * Features:
 * - Obsidian & Burnt Copper luxury styling
 * - Contextual trigger messaging (Voice limit, Weekly limit, Deep dives)
 * - Plan selection cards (Annual with 14-day free trial, Monthly, Student Lifetime)
 * - Academic discount (.edu) verification tab
 * - Restore purchases & seamless StoreKit sandbox checkout
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  Sparkles,
  Mic,
  Headphones,
  Layers,
  Download,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { theme } from '../../theme';
import { useEntitlements } from '../../context/EntitlementContext';
import { PaywallReason, PAYWALL_CONTENT } from '../../hooks/usePaywallTrigger';
import { PaywallPackage, FALLBACK_OFFERINGS, purchasesService } from '../../services/purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: PaywallReason;
  onSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  reason = 'CUSTOMER_CENTER_UPGRADE',
  onSuccess,
}) => {
  const { purchasePackage, restorePurchases, verifyStudentEmail, isStudent } = useEntitlements();
  const [selectedPlan, setSelectedPlan] = useState<string>('paperpod_pro_annual');
  const [activeTab, setActiveTab] = useState<'standard' | 'student'>(
    reason === 'STUDENT_DISCOUNT' ? 'student' : 'standard'
  );
  const [packages, setPackages] = useState<PaywallPackage[]>(FALLBACK_OFFERINGS);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [studentVerifying, setStudentVerifying] = useState<boolean>(false);
  const [studentVerified, setStudentVerified] = useState<boolean>(isStudent);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const contextData = PAYWALL_CONTENT[reason] || PAYWALL_CONTENT.CUSTOMER_CENTER_UPGRADE;

  useEffect(() => {
    if (visible) {
      purchasesService.getOfferings().then((pkgs) => {
        if (pkgs && pkgs.length > 0) {
          setPackages(pkgs);
        }
      });
      if (reason === 'STUDENT_DISCOUNT') {
        setActiveTab('student');
        setSelectedPlan('paperpod_student_lifetime');
      }
    }
  }, [visible, reason]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSelectPlan = (planId: string) => {
    triggerHaptic();
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setLoading(true);
    setStatusMessage(null);
    try {
      const planToBuy = activeTab === 'student' ? 'paperpod_student_lifetime' : selectedPlan;
      const success = await purchasePackage(planToBuy);
      if (success) {
        setStatusMessage('✨ Welcome to PaperPod Pro! All features unlocked.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setStatusMessage('Purchase was cancelled or could not be completed.');
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setStatusMessage(null);
    try {
      const success = await restorePurchases();
      if (success) {
        setStatusMessage('✓ Prior purchases successfully restored!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setStatusMessage('No active prior purchases found for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message || 'Unable to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handleVerifyStudent = async () => {
    if (!studentEmail.trim()) {
      Alert.alert('Enter Academic Email', 'Please enter your university (.edu) email address.');
      return;
    }
    setStudentVerifying(true);
    try {
      const res = await verifyStudentEmail(studentEmail);
      if (res.success) {
        setStudentVerified(true);
        setSelectedPlan('paperpod_student_lifetime');
        setStatusMessage('🎓 Academic email verified! Student Pass unlocked.');
      } else {
        Alert.alert('Verification Notice', res.message);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Verification failed');
    } finally {
      setStudentVerifying(false);
    }
  };

  const getCtaLabel = () => {
    if (activeTab === 'student') {
      return 'Unlock Student Lifetime Access · $39.99';
    }
    if (selectedPlan === 'paperpod_pro_annual') {
      return 'Start 14-Day Free Trial · Then $49.99/yr';
    }
    return 'Start 7-Day Free Trial · Then $7.99/mo';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Bar with Close Button */}
          <View style={styles.topBar}>
            <View style={styles.badgePill}>
              <Sparkles size={12} color={theme.colors.primary} />
              <Text style={styles.badgePillText}>{contextData.badge}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Titles */}
            <View style={styles.header}>
              <Text style={styles.heroTitle}>{contextData.title}</Text>
              <Text style={styles.heroSubtitle}>{contextData.subtitle}</Text>
            </View>

            {/* Context Highlight Perk Box */}
            <View style={styles.contextPerkBox}>
              <Zap size={16} color={theme.colors.primary} />
              <Text style={styles.contextPerkText}>{contextData.highlightPerk}</Text>
            </View>

            {/* Tab Switcher: Standard vs Academic */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'standard' && styles.tabButtonActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveTab('standard');
                }}
              >
                <Text
                  style={[styles.tabButtonText, activeTab === 'standard' && styles.tabButtonTextActive]}
                >
                  Standard Plans
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'student' && styles.tabButtonActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveTab('student');
                  setSelectedPlan('paperpod_student_lifetime');
                }}
              >
                <GraduationCap
                  size={14}
                  color={activeTab === 'student' ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text
                  style={[styles.tabButtonText, activeTab === 'student' && styles.tabButtonTextActive]}
                >
                  Academic Pass (-70%)
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'standard' ? (
              /* Standard Offerings Cards */
              <View style={styles.plansContainer}>
                {/* Annual Plan Card (Featured) */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === 'paperpod_pro_annual' && styles.planCardSelected,
                  ]}
                  onPress={() => handleSelectPlan('paperpod_pro_annual')}
                  activeOpacity={0.85}
                >
                  <View style={styles.planCardHeader}>
                    <View style={styles.planBadgeGlow}>
                      <Text style={styles.planBadgeText}>BEST VALUE · SAVE 48%</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedPlan === 'paperpod_pro_annual' && styles.checkboxSelected,
                      ]}
                    >
                      {selectedPlan === 'paperpod_pro_annual' && (
                        <Check size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </View>

                  <View style={styles.planDetailsRow}>
                    <View>
                      <Text style={styles.planName}>Pro Annual</Text>
                      <Text style={styles.planSubtext}>14-day free trial · $4.16 / month billed yearly</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>$49.99</Text>
                      <Text style={styles.planPeriod}>/ year</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Monthly Plan Card */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === 'paperpod_pro_monthly' && styles.planCardSelected,
                  ]}
                  onPress={() => handleSelectPlan('paperpod_pro_monthly')}
                  activeOpacity={0.85}
                >
                  <View style={styles.planCardHeader}>
                    <View style={styles.trialBadge}>
                      <Text style={styles.trialBadgeText}>7-DAY TRIAL</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedPlan === 'paperpod_pro_monthly' && styles.checkboxSelected,
                      ]}
                    >
                      {selectedPlan === 'paperpod_pro_monthly' && (
                        <Check size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </View>

                  <View style={styles.planDetailsRow}>
                    <View>
                      <Text style={styles.planName}>Pro Monthly</Text>
                      <Text style={styles.planSubtext}>Flexible monthly subscription</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>$7.99</Text>
                      <Text style={styles.planPeriod}>/ month</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* Academic & Student Verification Tab */
              <View style={styles.studentSection}>
                <View style={styles.studentPerkBanner}>
                  <GraduationCap size={22} color={theme.colors.primary} />
                  <View style={styles.studentPerkTextContainer}>
                    <Text style={styles.studentPerkTitle}>University & Lab Student Lifetime</Text>
                    <Text style={styles.studentPerkDesc}>
                      One-time payment of $39.99 (70% discount off annual). Never expires.
                    </Text>
                  </View>
                </View>

                {!studentVerified ? (
                  <View style={styles.verifyBox}>
                    <Text style={styles.verifyLabel}>Verify Academic Email (.edu / .ac.uk)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. researcher@stanford.edu"
                        placeholderTextColor={theme.colors.textMuted}
                        value={studentEmail}
                        onChangeText={setStudentEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleVerifyStudent}
                        disabled={studentVerifying}
                      >
                        {studentVerifying ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.verifyButtonText}>Verify</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.verifyHelper}>
                      Instant verification for all accredited educational domains.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.verifiedSuccessBox}>
                    <ShieldCheck size={18} color={theme.colors.success} />
                    <Text style={styles.verifiedSuccessText}>
                      Academic Email Verified! $39.99 Lifetime Pass Unlocked.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.planCard, styles.planCardSelected, { marginTop: 12 }]}
                  activeOpacity={0.9}
                >
                  <View style={styles.planCardHeader}>
                    <View style={styles.planBadgeGlow}>
                      <Text style={styles.planBadgeText}>STUDENT EXCLUSIVE · 70% OFF</Text>
                    </View>
                    <View style={[styles.checkbox, styles.checkboxSelected]}>
                      <Check size={12} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.planDetailsRow}>
                    <View>
                      <Text style={styles.planName}>Student Lifetime Pass</Text>
                      <Text style={styles.planSubtext}>One-time payment · Unlimited access forever</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>$39.99</Text>
                      <Text style={styles.planPeriod}>one-time</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Feature Perks Matrix */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresSectionTitle}>EVERYTHING INCLUDED WITH PRO</Text>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <Mic size={15} color={theme.colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureHeading}>Unlimited Live Voice Q&A</Text>
                  <Text style={styles.featureDesc}>
                    Interrupt anytime to ask Dr. Taylor & Alex math analogies and intuition.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <Headphones size={15} color={theme.colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureHeading}>15-Minute Audio Deep Dives</Text>
                  <Text style={styles.featureDesc}>
                    Full-length technical briefings analyzing every proof and baseline table.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <Layers size={15} color={theme.colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureHeading}>Synchronized High-Res Visual HUD</Text>
                  <Text style={styles.featureDesc}>
                    Pinch-to-zoom vector diagrams, charts, and equations in real time.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <Download size={15} color={theme.colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureHeading}>100% Offline Study Mode</Text>
                  <Text style={styles.featureDesc}>
                    Download episodes and figure assets for plane trips and commutes.
                  </Text>
                </View>
              </View>
            </View>

            {/* Feedback Message */}
            {statusMessage && (
              <View style={styles.statusMessageBox}>
                <Text style={styles.statusMessageText}>{statusMessage}</Text>
              </View>
            )}

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handlePurchase}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.ctaButtonContent}>
                  <Text style={styles.ctaButtonText}>{getCtaLabel()}</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Secondary Actions & Legal */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={handleRestore}
                disabled={restoring}
                style={styles.footerLink}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                ) : (
                  <Text style={styles.footerLinkText}>Restore Purchases</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.footerDivider}>·</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Terms of Service', 'PaperPod standard terms and conditions.')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Terms</Text>
              </TouchableOpacity>
              <Text style={styles.footerDivider}>·</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Privacy Policy', 'PaperPod privacy and data security policy.')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Privacy</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimerText}>
              Subscribed plans renew automatically unless cancelled at least 24 hours prior to end of current period. Manage in Account Settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0C0D10',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.3)',
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scrollInner: {
    paddingBottom: 24,
  },
  header: {
    marginTop: 4,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  contextPerkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 54, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.25)',
    marginBottom: 16,
  },
  contextPerkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#20222A',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  plansContainer: {
    gap: 10,
    marginBottom: 18,
  },
  planCard: {
    backgroundColor: '#121418',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(217, 119, 54, 0.06)',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planBadgeGlow: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  trialBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trialBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  planDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planSubtext: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },
  studentSection: {
    marginBottom: 18,
  },
  studentPerkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(217, 119, 54, 0.1)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.25)',
  },
  studentPerkTextContainer: {
    flex: 1,
  },
  studentPerkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentPerkDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  verifyBox: {
    backgroundColor: '#121418',
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  verifyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1C22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifyHelper: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  verifiedSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 10,
  },
  verifiedSuccessText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
    flex: 1,
  },
  featuresSection: {
    backgroundColor: '#121418',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featuresSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  statusMessageBox: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  footerDivider: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  disclaimerText: {
    fontSize: 9.5,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
  },
});
