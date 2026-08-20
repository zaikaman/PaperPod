/**
 * PaperPod Shared TypeScript Data Models & Contract Definitions
 */

export type PaperSourceType = 'pdf_upload' | 'arxiv_url' | 'web_url';

export type PaperStatus = 'pending' | 'parsing' | 'ready' | 'failed';

export type EpisodeDepthType = 'executive_brief' | 'deep_dive';

export type EpisodeStatus = 'generating' | 'ready' | 'failed';

export type SpeakerRole = 'alex' | 'taylor';

export type EntitlementTier = 'free' | 'pro_monthly' | 'pro_annual' | 'student_lifetime';

export type InterruptionStateType = 'IDLE' | 'RECORDING' | 'TRANSCRIBING' | 'CLARIFYING' | 'RESUMING';

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface PaperFigure {
  id: string;
  paper_id: string;
  figure_number: string;
  caption: string;
  storage_path: string;
  public_url: string;
  page_number: number;
  bounding_box: BoundingBox;
  aspect_ratio: number;
  created_at?: string;
}

export interface PaperSection {
  id: string;
  paper_id: string;
  section_index: number;
  heading: string;
  content_text: string;
  latex_equations: string[];
  created_at?: string;
}

export interface Paper {
  id: string;
  user_id?: string;
  title: string;
  authors: string[];
  publication_date?: string;
  arxiv_id?: string;
  source_type: PaperSourceType;
  source_url?: string;
  pdf_storage_path: string;
  pdf_public_url?: string;
  abstract?: string;
  total_pages: number;
  status: PaperStatus;
  error_message?: string;
  sections?: PaperSection[];
  figures?: PaperFigure[];
  created_at?: string;
  updated_at?: string;
}

export interface WordTiming {
  text: string;
  start_ms: number;
  end_ms: number;
}

export interface DialogueSegment {
  id?: string;
  episode_id?: string;
  sequence_index: number;
  speaker: SpeakerRole;
  dialogue_text: string;
  audio_start_ms: number;
  audio_end_ms: number;
  referenced_figure_number?: string | null;
  referenced_figure_id?: string | null;
  referenced_figure?: PaperFigure | null;
  words?: WordTiming[];
}

export interface Episode {
  id: string;
  paper_id: string;
  user_id: string;
  depth_type: EpisodeDepthType;
  duration_seconds: number;
  audio_storage_path: string;
  audio_url: string;
  status: EpisodeStatus;
  segments: DialogueSegment[];
  created_at?: string;
}

export interface EpisodeTimeline {
  episode_id: string;
  paper_id: string;
  total_duration_ms: number;
  segments: DialogueSegment[];
  figures: PaperFigure[];
}

export interface VoiceInterruption {
  id: string;
  episode_id: string;
  user_id: string;
  trigger_timestamp_ms: number;
  query_text: string;
  response_text: string;
  response_audio_url?: string;
  latency_ms: number;
  created_at: string;
}

export interface SummaryCard {
  id: string;
  paper_id: string;
  core_thesis: string;
  quantitative_results: Array<{
    metric: string;
    baseline: string;
    paper_result: string;
    improvement: string;
  }>;
  limitations: string[];
  future_work: string[];
  card_pdf_url?: string;
  created_at?: string;
}

export interface AudioBookmark {
  id: string;
  episode_id: string;
  user_id: string;
  timestamp_ms: number;
  note_text?: string;
  created_at: string;
}

export interface UserEntitlements {
  user_id: string;
  tier: EntitlementTier;
  revenuecat_customer_id?: string;
  weekly_conversions_used: number;
  weekly_conversions_limit: number;
  weekly_reset_at: string;
  is_student_verified: boolean;
  entitlement_expires_at?: string;
  can_convert_paper: boolean;
  can_interrupt_voice: boolean;
  can_access_deep_dives: boolean;
}

export interface IngestionProgress {
  paper_id: string;
  status: PaperStatus;
  progress_percentage: number;
  current_step: string;
  error_message?: string;
}

export interface ResearchTopic {
  id: string;
  title: string;
  category_code: string;
  description: string;
  icon: string;
  color: string;
  subscriber_count: string;
  featured_paper: string;
  featured_paper_id: string;
}

export type DigestFrequency = 'daily_morning' | 'evening_commute' | 'weekly_digest' | 'disabled';

export interface NotificationPreference {
  user_id: string;
  subscribed_topics: string[];
  digest_frequency: DigestFrequency;
  digest_time: string;
  reminder_time?: string;
  study_reminders_enabled: boolean;
  reminder_interval_hours: number;
  push_token?: string;
  onesignal_player_id?: string;
  updated_at?: string;
}

export interface DeepLinkPayload {
  type: 'topic_digest' | 'study_reminder' | 'paper_detail' | 'player';
  paper_id: string;
  episode_id?: string;
  timestamp_ms?: number;
  topic_id?: string;
  deep_link_url?: string;
  headings?: Record<string, string>;
  contents?: Record<string, string>;
}

export interface DeepLinkTarget {
  type: 'player' | 'detail' | 'settings' | 'home';
  paperId?: string;
  episodeId?: string;
  timestampMs?: number;
  topicId?: string;
  source: 'push' | 'link' | 'simulation';
}

