/**
 * PaperPod Entitlements & Subscription Context
 * Manages active tier, weekly paper conversion quotas, per-paper voice question limits, and Purchases SDK sync.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserEntitlements, EntitlementTier } from '../types';
import { purchasesService } from '../services/purchases';
import { api } from '../services/api';

interface EntitlementContextType {
  entitlements: UserEntitlements;
  isPro: boolean;
  isStudent: boolean;
  conversionsUsed: number;
  conversionsLimit: number;
  conversionsRemaining: number;
  canConvertPaper: boolean;
  canInterruptVoice: (paperId: string) => boolean;
  canAccessDeepDives: boolean;
  voiceQuestionsUsedForPaper: (paperId: string) => number;
  recordPaperConversion: () => boolean;
  recordVoiceQuestion: (paperId: string) => boolean;
  refreshEntitlements: () => Promise<void>;
  purchasePackage: (packageIdentifier: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  verifyStudentEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  simulateTier: (tier: EntitlementTier) => void;
  resetQuotas: () => void;
}

const DEFAULT_USER_ID = 'demo-user-001';

const INITIAL_ENTITLEMENTS: UserEntitlements = {
  user_id: DEFAULT_USER_ID,
  tier: 'free',
  weekly_conversions_used: 1,
  weekly_conversions_limit: 2,
  weekly_reset_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  is_student_verified: false,
  can_convert_paper: true,
  can_interrupt_voice: true,
  can_access_deep_dives: false,
};

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

export const EntitlementProvider: React.FC<{ children: ReactNode; userId?: string }> = ({
  children,
  userId = DEFAULT_USER_ID,
}) => {
  const [entitlements, setEntitlements] = useState<UserEntitlements>({
    ...INITIAL_ENTITLEMENTS,
    user_id: userId,
  });

  // Track voice interruptions per paper: { [paperId]: count }
  const [voiceInterruptionCounts, setVoiceInterruptionCounts] = useState<Record<string, number>>({
    'paper-attention-1706': 1, // Demo starts with 1 query already used so 2nd triggers paywall
  });

  const isPro = entitlements.tier !== 'free';
  const isStudent = entitlements.tier === 'student_lifetime' || entitlements.is_student_verified;
  const conversionsLimit = isPro ? 9999 : 2;
  const conversionsUsed = entitlements.weekly_conversions_used;
  const conversionsRemaining = Math.max(0, conversionsLimit - conversionsUsed);
  const canConvertPaper = isPro || conversionsRemaining > 0;
  const canAccessDeepDives = isPro;

  // Initialize RevenueCat SDK & fetch backend entitlements
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await purchasesService.setupPurchases(userId);
        const { isPro: isPurchasesPro, isStudent: isPurchasesStudent } =
          await purchasesService.checkEntitlements();

        if (isMounted) {
          if (isPurchasesPro) {
            setEntitlements((prev) => ({
              ...prev,
              tier: isPurchasesStudent ? 'student_lifetime' : 'pro_annual',
              weekly_conversions_limit: 9999,
              can_convert_paper: true,
              can_access_deep_dives: true,
            }));
          }
        }

        // Try syncing from backend
        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'}/api/entitlements/${userId}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data) {
              setEntitlements((prev) => ({
                ...prev,
                ...data,
              }));
            }
          }
        } catch {
          // Keep local fallback
        }
      } catch (err) {
        console.warn('[EntitlementContext] Init error:', err);
      }
    };

    init();

    // Listen for real-time customer info updates from RevenueCat
    purchasesService.addCustomerInfoUpdateListener((customerInfo) => {
      if (customerInfo && isMounted) {
        const activeKeys = Object.keys(customerInfo.entitlements.active);
        const hasPro = activeKeys.includes('pro_access') || activeKeys.includes('student_pass');
        const hasStudent = activeKeys.includes('student_pass');

        if (hasPro) {
          setEntitlements((prev) => ({
            ...prev,
            tier: hasStudent ? 'student_lifetime' : 'pro_annual',
            weekly_conversions_limit: 9999,
            can_convert_paper: true,
            can_access_deep_dives: true,
          }));
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const voiceQuestionsUsedForPaper = useCallback(
    (paperId: string): number => {
      return voiceInterruptionCounts[paperId] || 0;
    },
    [voiceInterruptionCounts]
  );

  const canInterruptVoice = useCallback(
    (paperId: string): boolean => {
      if (isPro) return true;
      const count = voiceQuestionsUsedForPaper(paperId);
      return count < 1; // Free tier allows 1 free voice interruption per paper
    },
    [isPro, voiceQuestionsUsedForPaper]
  );

  const recordPaperConversion = useCallback((): boolean => {
    if (!canConvertPaper) return false;

    setEntitlements((prev) => {
      const nextUsed = prev.weekly_conversions_used + 1;
      return {
        ...prev,
        weekly_conversions_used: nextUsed,
        can_convert_paper: isPro || nextUsed < 2,
      };
    });

    // Notify backend
    try {
      fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'}/api/entitlements/${userId}/consume-conversion`, {
        method: 'POST',
      }).catch(() => {});
    } catch {}

    return true;
  }, [canConvertPaper, isPro, userId]);

  const recordVoiceQuestion = useCallback(
    (paperId: string): boolean => {
      if (!canInterruptVoice(paperId)) return false;

      setVoiceInterruptionCounts((prev) => ({
        ...prev,
        [paperId]: (prev[paperId] || 0) + 1,
      }));
      return true;
    },
    [canInterruptVoice]
  );

  const refreshEntitlements = useCallback(async (): Promise<void> => {
    try {
      const { isPro: isPurchasesPro, isStudent: isPurchasesStudent } =
        await purchasesService.checkEntitlements();
      if (isPurchasesPro) {
        setEntitlements((prev) => ({
          ...prev,
          tier: isPurchasesStudent ? 'student_lifetime' : 'pro_annual',
          weekly_conversions_limit: 9999,
          can_convert_paper: true,
          can_access_deep_dives: true,
        }));
      }
    } catch (e) {
      console.warn('[EntitlementContext] Refresh error:', e);
    }
  }, []);

  const purchasePackage = useCallback(
    async (packageIdentifier: string): Promise<boolean> => {
      const { success, activeEntitlements } = await purchasesService.purchasePackage(packageIdentifier);
      if (success) {
        const isStudentPkg = packageIdentifier.includes('student');
        setEntitlements((prev) => ({
          ...prev,
          tier: isStudentPkg
            ? 'student_lifetime'
            : packageIdentifier.includes('annual')
            ? 'pro_annual'
            : 'pro_monthly',
          weekly_conversions_limit: 9999,
          can_convert_paper: true,
          can_access_deep_dives: true,
          is_student_verified: isStudentPkg ? true : prev.is_student_verified,
        }));
        return true;
      }
      return false;
    },
    []
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    const { success, activeEntitlements } = await purchasesService.restorePurchases();
    if (success && activeEntitlements.length > 0) {
      setEntitlements((prev) => ({
        ...prev,
        tier: activeEntitlements.includes('student_pass') ? 'student_lifetime' : 'pro_annual',
        weekly_conversions_limit: 9999,
        can_convert_paper: true,
        can_access_deep_dives: true,
      }));
      return true;
    }
    return false;
  }, []);

  const verifyStudentEmail = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'}/api/entitlements/${userId}/verify-student`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_email: email }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          setEntitlements((prev) => ({
            ...prev,
            is_student_verified: true,
          }));
          return { success: true, message: data.message || 'Academic status verified!' };
        }
        return { success: false, message: data.detail || 'Invalid academic email address.' };
      } catch (err: any) {
        // Local validation fallback
        const isEdu = email.toLowerCase().includes('.edu') || email.toLowerCase().includes('.ac.');
        if (isEdu) {
          setEntitlements((prev) => ({
            ...prev,
            is_student_verified: true,
          }));
          return { success: true, message: 'Student status verified! Student Lifetime pass unlocked.' };
        }
        return { success: false, message: 'Please provide a valid .edu or academic email.' };
      }
    },
    [userId]
  );

  const simulateTier = useCallback((tier: EntitlementTier) => {
    const isProTier = tier !== 'free';
    setEntitlements((prev) => ({
      ...prev,
      tier,
      weekly_conversions_limit: isProTier ? 9999 : 2,
      weekly_conversions_used: isProTier ? prev.weekly_conversions_used : 1,
      can_convert_paper: true,
      can_access_deep_dives: isProTier,
      is_student_verified: tier === 'student_lifetime' ? true : prev.is_student_verified,
    }));
  }, []);

  const resetQuotas = useCallback(() => {
    setEntitlements((prev) => ({
      ...prev,
      weekly_conversions_used: 0,
      can_convert_paper: true,
    }));
    setVoiceInterruptionCounts({});
  }, []);

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        isPro,
        isStudent,
        conversionsUsed,
        conversionsLimit,
        conversionsRemaining,
        canConvertPaper,
        canInterruptVoice,
        canAccessDeepDives,
        voiceQuestionsUsedForPaper,
        recordPaperConversion,
        recordVoiceQuestion,
        refreshEntitlements,
        purchasePackage,
        restorePurchases,
        verifyStudentEmail,
        simulateTier,
        resetQuotas,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
};

export const useEntitlements = (): EntitlementContextType => {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlements must be used within an EntitlementProvider');
  }
  return context;
};
