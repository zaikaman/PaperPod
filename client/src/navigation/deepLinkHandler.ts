/**
 * PaperPod Deep Link Navigation Handler (T067)
 * Resolves OneSignal push notification payloads and custom URL schemes (paperpod://...)
 * into active player, detail, and digest screen transitions.
 */
import { Linking } from 'react-native';
import { DeepLinkPayload, DeepLinkTarget, Paper } from '../types';
import { notificationService } from '../services/notifications';

type NavigationHandler = (target: DeepLinkTarget) => void;

class DeepLinkHandler {
  private navHandler: NavigationHandler | null = null;
  private pendingTarget: DeepLinkTarget | null = null;
  private isListening = false;

  /**
   * Parse URI string into structured DeepLinkTarget
   * Examples:
   *  - paperpod://paper/paper-attention-1706?episode=demo-episode-1706&t=105000
   *  - paperpod://digest/cs.AI
   *  - https://paperpod.ai/paper/paper-attention-1706
   */
  public parseUrl(url: string): DeepLinkTarget | null {
    if (!url) return null;

    try {
      // Normalize scheme
      const cleanUrl = url.replace('paperpod://', 'https://paperpod.ai/');
      const parsed = new URL(cleanUrl);

      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const searchParams = parsed.searchParams;

      const episodeId = searchParams.get('episode') || undefined;
      const timeParam = searchParams.get('t') || searchParams.get('timestamp') || '0';
      const timestampMs = parseInt(timeParam, 10) || 0;
      const topicId = searchParams.get('topic') || undefined;

      if (pathSegments[0] === 'paper' && pathSegments[1]) {
        return {
          type: 'player',
          paperId: pathSegments[1],
          episodeId,
          timestampMs,
          source: 'link',
        };
      }

      if (pathSegments[0] === 'digest') {
        return {
          type: 'settings',
          topicId: pathSegments[1] || topicId || 'cs.AI',
          source: 'link',
        };
      }

      if (pathSegments[0] === 'settings') {
        return {
          type: 'settings',
          source: 'link',
        };
      }
    } catch (e) {
      console.warn('[DeepLink] Failed to parse URL:', url, e);
    }

    return null;
  }

  /**
   * Parse OneSignal or in-app push notification payload into DeepLinkTarget
   */
  public parsePayload(payload: DeepLinkPayload): DeepLinkTarget {
    const timestampMs = payload.timestamp_ms || 0;

    if (payload.type === 'topic_digest') {
      return {
        type: 'player',
        paperId: payload.paper_id,
        episodeId: payload.episode_id,
        timestampMs: 0,
        topicId: payload.topic_id,
        source: 'push',
      };
    }

    if (payload.type === 'study_reminder') {
      return {
        type: 'player',
        paperId: payload.paper_id,
        episodeId: payload.episode_id,
        timestampMs,
        source: 'push',
      };
    }

    return {
      type: 'player',
      paperId: payload.paper_id,
      episodeId: payload.episode_id,
      timestampMs,
      source: 'push',
    };
  }

  /**
   * Initialize deep link listener for URL schemes and push notification clicks
   */
  public init(onNavigate: NavigationHandler): () => void {
    this.navHandler = onNavigate;

    // Handle any target that fired before init was registered
    if (this.pendingTarget) {
      const target = this.pendingTarget;
      this.pendingTarget = null;
      setTimeout(() => onNavigate(target), 150);
    }

    if (!this.isListening) {
      // 1. Listen for OneSignal Notification clicks
      notificationService.addClickListener((payload) => {
        console.log('[DeepLink] Handling notification click payload:', payload);
        const target = this.parsePayload(payload);
        this.dispatchTarget(target);
      });

      // 2. Listen for URL scheme changes (foreground / background)
      const linkingSub = Linking.addEventListener('url', ({ url }) => {
        console.log('[DeepLink] Incoming deep link URL:', url);
        const target = this.parseUrl(url);
        if (target) {
          this.dispatchTarget(target);
        }
      });

      // 3. Check initial cold start URL
      Linking.getInitialURL().then((initialUrl) => {
        if (initialUrl) {
          console.log('[DeepLink] Cold start initial URL:', initialUrl);
          const target = this.parseUrl(initialUrl);
          if (target) {
            this.dispatchTarget(target);
          }
        }
      });

      this.isListening = true;

      return () => {
        linkingSub.remove();
        this.navHandler = null;
      };
    }

    return () => {
      this.navHandler = null;
    };
  }

  /**
   * Trigger simulated deep-link navigation directly from UI test buttons
   */
  public triggerSimulation(target: DeepLinkTarget): void {
    console.log('[DeepLink] Dispatching simulated navigation target:', target);
    this.dispatchTarget(target);
  }

  private dispatchTarget(target: DeepLinkTarget): void {
    if (this.navHandler) {
      this.navHandler(target);
    } else {
      this.pendingTarget = target;
    }
  }
}

export const deepLinkHandler = new DeepLinkHandler();
