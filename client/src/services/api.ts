/**
 * PaperPod Client API Service for Backend Ingestion & Playback Synchronization
 */
import { Paper, Episode, EpisodeTimeline, SummaryCard, AudioBookmark } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface IngestResponse {
  status: string;
  message: string;
  paper_id: string;
  episode_id: string;
  paper: Paper;
  episode: Episode;
}

export const api = {
  /**
   * Ingest an arXiv paper by URL or arXiv ID (e.g. 1706.03762)
   */
  async ingestArxiv(arxivUrlOrId: string, userId: string = '00000000-0000-0000-0000-000000000001'): Promise<IngestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/papers/arxiv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        arxiv_url_or_id: arxivUrlOrId,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to ingest arXiv paper (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  /**
   * Upload a local PDF file and synthesize 2-host briefing
   */
  async uploadPdf(fileUri: string, fileName: string, userId: string = '00000000-0000-0000-0000-000000000001'): Promise<IngestResponse> {
    const formData = new FormData();
    formData.append('user_id', userId);
    
    // For React Native / Web FormData file handling
    const fileObj: any = {
      uri: fileUri,
      type: 'application/pdf',
      name: fileName || 'paper.pdf',
    };
    formData.append('file', fileObj);

    const response = await fetch(`${API_BASE_URL}/api/v1/papers/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload PDF (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  /**
   * Fetch list of all ingested papers in library
   */
  async listPapers(): Promise<Paper[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/papers`);
      if (!response.ok) return [];
      return response.json();
    } catch (e) {
      console.warn('[API] Error listing papers:', e);
      return [];
    }
  },

  /**
   * Fetch specific paper details and episodes
   */
  async getPaper(paperId: string): Promise<{ paper: Paper; episodes: Episode[] }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/papers/${paperId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch paper ${paperId}`);
    }
    return response.json();
  },

  /**
   * Fetch specific episode details with timed transcript segments
   */
  async getEpisode(episodeId: string): Promise<Episode> {
    const response = await fetch(`${API_BASE_URL}/api/v1/papers/episodes/${episodeId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch episode ${episodeId}`);
    }
    return response.json();
  },

  /**
   * Fetch synchronized episode timeline with figure triggers and offsets
   */
  async getEpisodeTimeline(episodeId: string): Promise<EpisodeTimeline> {
    const response = await fetch(`${API_BASE_URL}/api/v1/episodes/${episodeId}/timeline`);
    if (!response.ok) {
      throw new Error(`Failed to fetch timeline for episode ${episodeId}`);
    }
    return response.json();
  },

  /**
   * Submit live voice or text interruption question during audio playback
   */
  async submitVoiceInterruption(
    episodeId: string,
    playbackTimestampMs: number,
    queryText: string,
    userId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<{
    interruption_id: string;
    clarification_text: string;
    audio_url: string;
    duration_ms: number;
    resume_timestamp_ms: number;
    relevant_section_heading?: string;
    latency_ms: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/episodes/${episodeId}/interrupt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_timestamp_ms: playbackTimestampMs,
        query_text: queryText,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process voice interruption (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  /**
   * Fetch high-density 1-page summary card for a paper
   */
  async getSummaryCard(paperId: string): Promise<SummaryCard> {
    const response = await fetch(`${API_BASE_URL}/api/v1/papers/${paperId}/summary`);
    if (!response.ok) {
      throw new Error(`Failed to fetch summary card (${response.status})`);
    }
    return response.json();
  },

  /**
   * Force regenerate summary card using Gemini 3.1 Flash Lite
   */
  async generateSummaryCard(paperId: string): Promise<SummaryCard> {
    const response = await fetch(`${API_BASE_URL}/api/v1/papers/${paperId}/summary`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to generate summary card (${response.status})`);
    }
    return response.json();
  },

  /**
   * Save audio bookmark at current playback timestamp
   */
  async createAudioBookmark(
    episodeId: string,
    timestampMs: number,
    noteText?: string,
    userId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<{ status: string; message: string; bookmark: AudioBookmark }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/episodes/${episodeId}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        timestamp_ms: timestampMs,
        note_text: noteText,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create bookmark (${response.status})`);
    }
    return response.json();
  },

  /**
   * List all saved bookmarks for an episode
   */
  async listAudioBookmarks(
    episodeId: string,
    userId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<AudioBookmark[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/episodes/${episodeId}/bookmarks?user_id=${userId}`
      );
      if (!response.ok) {
        return [];
      }
      return response.json();
    } catch (e) {
      console.warn('[API] Error listing bookmarks:', e);
      return [];
    }
  },

  /**
   * Delete an audio bookmark by ID
   */
  async deleteAudioBookmark(bookmarkId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete bookmark (${response.status})`);
    }
    return response.json();
  },
};

