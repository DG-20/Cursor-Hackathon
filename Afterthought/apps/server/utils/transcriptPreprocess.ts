/**
 * Filler words/phrases to remove from transcripts before sending to the LLM.
 * Matched as whole words (case-insensitive). Kept conservative to avoid stripping meaningful words.
 */
const FILLER_PATTERNS = [
  /\bum\b/gi,
  /\buh\b/gi,
  /\buhm\b/gi,
  /\berm\b/gi,
  /\bah\b/gi,
  /\bbasically\b/gi,
  /\banyway\b/gi,
  /\banyways\b/gi,
  /\bhmm\b/gi,
  /\bhm\b/gi,
];

/**
 * Preprocess transcript before sending to LLM: remove filler words and normalize whitespace.
 */
export function preprocessTranscript(transcript: string): string {
  if (!transcript || typeof transcript !== 'string') return transcript;
  let cleaned = transcript.trim();
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}
