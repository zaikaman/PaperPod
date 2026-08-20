/**
 * Contextual Paywall Trigger Hook (Paywalls v2)
 * Handles contextual upgrade triggers on voice question limits, weekly ingestion quotas, deep dives, and offline caching.
 */
import { useState, useCallback } from 'react';
import { useEntitlements } from '../context/EntitlementContext';

export type PaywallReason =
  | 'VOICE_INTERRUPT_LIMIT'
  | 'WEEKLY_CONVERSION_LIMIT'
  | 'DEEP_DIVE_REQUEST'
  | 'OFFLINE_DOWNLOAD_REQUEST'
  | 'CUSTOMER_CENTER_UPGRADE'
  | 'STUDENT_DISCOUNT';

export interface PaywallContextData {
  reason: PaywallReason;
  title: string;
  subtitle: string;
  highlightPerk: string;
  badge: string;
}

export const PAYWALL_CONTENT: Record<PaywallReason, PaywallContextData> = {
  VOICE_INTERRUPT_LIMIT: {
    reason: 'VOICE_INTERRUPT_LIMIT',
    title: 'Unlock Unlimited Live Voice Q&A',
    subtitle:
      'Free tier includes 1 live question per paper. Upgrade to Pro to interrupt anywhere and ask Dr. Taylor & Alex unlimited questions.',
    highlightPerk: '🎙️ Unlimited Real-Time Voice Interruptions & Math Clarifications',
    badge: 'VOICE LIMIT REACHED',
  },
  WEEKLY_CONVERSION_LIMIT: {
    reason: 'WEEKLY_CONVERSION_LIMIT',
    title: 'Weekly Ingestion Limit Reached',
    subtitle:
      'You have converted 2/2 free papers this week. Upgrade to Pro for unlimited PDF uploads, arXiv imports, and audio generation.',
    highlightPerk: '⚡ Unlimited Paper Ingestions & Multi-Host Conversions',
    badge: '2/2 CONVERSIONS CONSUMED',
  },
  DEEP_DIVE_REQUEST: {
    reason: 'DEEP_DIVE_REQUEST',
    title: 'Unlock 15-Minute Audio Deep Dives',
    subtitle:
      'Executive briefs cover the high-level takeaways. Full Deep Dives analyze every theorem, ablation table, and architectural nuance.',
    highlightPerk: '🎧 15-Minute Comprehensive Deep Dives with Figure Inspection',
    badge: 'PRO EXCLUSIVE',
  },
  OFFLINE_DOWNLOAD_REQUEST: {
    reason: 'OFFLINE_DOWNLOAD_REQUEST',
    title: 'Download Briefings for Offline Study',
    subtitle:
      'Listen on flights, commutes, or in low-connectivity environments with cached neural audio and vector figures.',
    highlightPerk: '📥 100% Offline Audio & Synchronized Figure HUD Storage',
    badge: 'OFFLINE ACCESS',
  },
  CUSTOMER_CENTER_UPGRADE: {
    reason: 'CUSTOMER_CENTER_UPGRADE',
    title: 'Elevate Your Research Flow with Pro',
    subtitle:
      'Get unlimited multi-host audio briefings, interactive voice Q&A, and full-length deep dives on every academic breakthrough.',
    highlightPerk: '✨ Complete Research Companion Feature Set',
    badge: 'PAPERPOD PRO',
  },
  STUDENT_DISCOUNT: {
    reason: 'STUDENT_DISCOUNT',
    title: 'Academic & Student Pass: 70% Off',
    subtitle:
      'Special one-time lifetime license for university students, professors, and lab researchers with verified academic email.',
    highlightPerk: '🎓 Lifetime Pro Access with $39.99 One-Time Payment',
    badge: 'ACADEMIC DISCOUNT',
  },
};

export const usePaywallTrigger = () => {
  const { isPro, canConvertPaper, canInterruptVoice } = useEntitlements();
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason | null>(null);

  const openPaywall = useCallback((reason: PaywallReason) => {
    setPaywallReason(reason);
    setIsPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallVisible(false);
  }, []);

  /**
   * Checks if user is permitted to perform a voice interruption on paper.
   * If free tier quota is consumed, triggers the Paywall modal with VOICE_INTERRUPT_LIMIT context.
   */
  const checkVoiceInterruptTrigger = useCallback(
    (paperId: string): boolean => {
      if (isPro) return true;
      const allowed = canInterruptVoice(paperId);
      if (!allowed) {
        openPaywall('VOICE_INTERRUPT_LIMIT');
        return false;
      }
      return true;
    },
    [isPro, canInterruptVoice, openPaywall]
  );

  /**
   * Checks if user has remaining weekly paper conversions.
   * If quota exceeded, triggers the Paywall modal with WEEKLY_CONVERSION_LIMIT context.
   */
  const checkWeeklyConversionTrigger = useCallback((): boolean => {
    if (isPro) return true;
    if (!canConvertPaper) {
      openPaywall('WEEKLY_CONVERSION_LIMIT');
      return false;
    }
    return true;
  }, [isPro, canConvertPaper, openPaywall]);

  /**
   * Checks deep dive access.
   */
  const checkDeepDiveTrigger = useCallback((): boolean => {
    if (isPro) return true;
    openPaywall('DEEP_DIVE_REQUEST');
    return false;
  }, [isPro, openPaywall]);

  /**
   * Checks offline download access.
   */
  const checkOfflineDownloadTrigger = useCallback((): boolean => {
    if (isPro) return true;
    openPaywall('OFFLINE_DOWNLOAD_REQUEST');
    return false;
  }, [isPro, openPaywall]);

  return {
    isPaywallVisible,
    paywallReason,
    paywallContext: paywallReason ? PAYWALL_CONTENT[paywallReason] : PAYWALL_CONTENT.CUSTOMER_CENTER_UPGRADE,
    openPaywall,
    closePaywall,
    checkVoiceInterruptTrigger,
    checkWeeklyConversionTrigger,
    checkDeepDiveTrigger,
    checkOfflineDownloadTrigger,
  };
};
