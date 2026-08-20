/**
 * Transcript Word Timing Utilities
 */
import { DialogueSegment, WordTiming } from '../types';

export function getSegmentWords(seg: DialogueSegment): WordTiming[] {
  if (seg.words && seg.words.length > 0) {
    return seg.words;
  }
  const wordTokens = seg.dialogue_text.split(/\s+/).filter(Boolean);
  if (wordTokens.length === 0) return [];
  const duration = Math.max(1000, seg.audio_end_ms - seg.audio_start_ms);
  const timePerWord = duration / wordTokens.length;
  return wordTokens.map((word, idx) => ({
    text: word,
    start_ms: Math.floor(seg.audio_start_ms + idx * timePerWord),
    end_ms: Math.floor(seg.audio_start_ms + (idx + 1) * timePerWord),
  }));
}
