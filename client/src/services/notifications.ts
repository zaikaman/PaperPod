/**
 * PaperPod OneSignal Notification Service (T065)
 * Handles OneSignal v5 Mobile SDK initialization, push permission handling,
 * topic segmentation tags, external user ID binding, and notification click listeners.
 */
import { Platform } from 'react-native';
import { DeepLinkPayload } from '../types';

let OneSignal: any = null;
let LogLevel: any = null;

if (Platform.OS !== 'web') {
  try {
    const oneSignalModule = require('react-native-onesignal');
    OneSignal = oneSignalModule.OneSignal;
    LogLevel = oneSignalModule.LogLevel;
  } catch (err) {
    console.warn('[OneSignal] Native module load error:', err);
  }
}

const ONESIGNAL_APP_ID =
  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '00000000-0000-0000-0000-000000000000';

type NotificationListener = (payload: DeepLinkPayload) => void;

class NotificationService {
  private isInitialized = false;
  private listeners: Set<NotificationListener> = new Set();
  private lastReceivedPayload: DeepLinkPayload | null = null;

  /**
   * Initialize OneSignal Mobile SDK with safe platform detection
   */
  public init(appId: string = ONESIGNAL_APP_ID): void {
    if (this.isInitialized) return;

    if (Platform.OS === 'web') {
      console.log('[OneSignal] Running in Web environment. Using simulated notification pipeline.');
      this.isInitialized = true;
      return;
    }

    try {
      if (__DEV__) {
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      }

      // Initialize OneSignal with App ID
      OneSignal.initialize(appId);

      // Setup Notification Click Listener
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.log('[OneSignal] Notification clicked event:', event);
        const additionalData = event.notification.additionalData as any;
        if (additionalData) {
          const payload: DeepLinkPayload = {
            type: additionalData.type || 'topic_digest',
            paper_id: additionalData.paper_id || 'paper-attention-1706',
            episode_id: additionalData.episode_id,
            timestamp_ms: additionalData.timestamp_ms ? Number(additionalData.timestamp_ms) : 0,
            topic_id: additionalData.topic_id,
            deep_link_url: additionalData.deep_link_url || event.notification.launchURL,
            headings: { en: event.notification.title || '' },
            contents: { en: event.notification.body || '' },
          };
          this.notifyListeners(payload);
        }
      });

      // Foreground Notification will show in notification bar
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
        console.log('[OneSignal] Notification received in foreground:', event.getNotification());
      });

      this.isInitialized = true;
      console.log('[OneSignal] Successfully initialized Mobile Push SDK.');
    } catch (error) {
      console.warn('[OneSignal] Native initialization error (using simulation fallback):', error);
      this.isInitialized = true;
    }
  }

  /**
   * Request push notification permissions from operating system
   */
  public async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await window.Notification.requestPermission();
          return perm === 'granted';
        } catch (e) {
          return true;
        }
      }
      return true;
    }

    try {
      const response = await OneSignal.Notifications.requestPermission(true);
      console.log('[OneSignal] Permission request result:', response);
      return !!response;
    } catch (error) {
      console.warn('[OneSignal] Request permission error:', error);
      return false;
    }
  }

  /**
   * Bind user ID to OneSignal player profile for personalized study reminders
   */
  public async setUserId(userId: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log(`[OneSignal] Web user login set to: ${userId}`);
      return;
    }

    try {
      OneSignal.login(userId);
      console.log(`[OneSignal] Logged in user: ${userId}`);
    } catch (error) {
      console.warn('[OneSignal] Set user ID error:', error);
    }
  }

  /**
   * Update user topic tags in OneSignal for targeted category push digests
   */
  public async setTopicTags(subscribedTopicIds: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('[OneSignal] Subscribed topics on Web:', subscribedTopicIds);
      return;
    }

    try {
      const tags: Record<string, string> = {};
      const allTopicCodes = ['cs_AI', 'cs_CL', 'cs_CV', 'cs_RO', 'q_bio', 'quant_ph', 'q_bio_NC', 'cs_CR'];

      allTopicCodes.forEach((code) => {
        tags[`topic_${code}`] = '0';
      });

      subscribedTopicIds.forEach((tId) => {
        const sanitized = tId.replace('.', '_');
        tags[`topic_${sanitized}`] = '1';
      });

      OneSignal.User.addTags(tags);
      console.log('[OneSignal] Updated topic tags successfully:', tags);
    } catch (error) {
      console.warn('[OneSignal] Set topic tags error:', error);
    }
  }

  /**
   * Register a callback listener when a notification is clicked/tapped
   */
  public addClickListener(listener: NotificationListener): () => void {
    this.listeners.add(listener);

    // If there was a pending payload from cold boot, notify immediately
    if (this.lastReceivedPayload) {
      const payload = this.lastReceivedPayload;
      this.lastReceivedPayload = null;
      setTimeout(() => listener(payload), 100);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all registered listeners
   */
  private notifyListeners(payload: DeepLinkPayload): void {
    this.lastReceivedPayload = payload;
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[OneSignal] Error in listener execution:', err);
      }
    });
  }

  /**
   * Simulate receiving an incoming Topic Digest push alert
   */
  public simulateIncomingDigest(
    topicId: string = 'cs.AI',
    paperId: string = 'paper-attention-1706',
    paperTitle: string = 'Attention Is All You Need'
  ): DeepLinkPayload {
    const payload: DeepLinkPayload = {
      type: 'topic_digest',
      paper_id: paperId,
      episode_id: 'demo-episode-1706',
      timestamp_ms: 0,
      topic_id: topicId,
      deep_link_url: `paperpod://paper/${paperId}?episode=demo-episode-1706&t=0`,
      headings: { en: `Daily Digest: ${topicId}` },
      contents: {
        en: `Today's top paper: ${paperTitle}. Tap to listen to the 2-host audio briefing.`,
      },
    };

    console.log('[OneSignal Simulation] Firing Simulated Topic Digest:', payload);
    this.notifyListeners(payload);
    return payload;
  }

  /**
   * Simulate receiving a Spaced Study Reminder push alert
   */
  public simulateIncomingReminder(
    paperId: string = 'paper-attention-1706',
    paperTitle: string = 'Attention Is All You Need',
    timestampMs: number = 105000 // 01:45
  ): DeepLinkPayload {
    const mins = Math.floor(timestampMs / 60000);
    const secs = Math.floor((timestampMs % 60000) / 1000);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const payload: DeepLinkPayload = {
      type: 'study_reminder',
      paper_id: paperId,
      episode_id: 'demo-episode-1706',
      timestamp_ms: timestampMs,
      deep_link_url: `paperpod://paper/${paperId}?episode=demo-episode-1706&t=${timestampMs}`,
      headings: { en: 'Resume Your Research Briefing' },
      contents: {
        en: `Continue '${paperTitle}' where you left off at ${timeStr}. Alex & Dr. Taylor are ready.`,
      },
    };

    console.log('[OneSignal Simulation] Firing Simulated Study Reminder:', payload);
    this.notifyListeners(payload);
    return payload;
  }
}

export const notificationService = new NotificationService();
