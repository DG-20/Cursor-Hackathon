import { Request, Response } from 'express';
import { callGroq } from '../services/llm';
import { preprocessTranscript } from '../utils/transcriptPreprocess';

/**
 * Normalize LLM tasks for initial response: all tasks/subtasks are TODO (completed: false).
 * Later: this object will be sent to the DB service for storage (not implemented yet).
 */
function mapTasksToFrontend(tasks: any[]): any[] {
  return tasks.map((t: any) => ({
    ...t,
    completed: false,
    subtasks: Array.isArray(t?.subtasks)
      ? t.subtasks.map((s: any) => ({ ...s, completed: false }))
      : [],
  }));
}

/**
 * POST /processSpeech — initial processing of voice/text dump.
 * Returns { tasks, journal } to the frontend. All tasks/subtasks are TODO.
 * TODO: persist this object to the database once DB service exists.
 */
export async function processSpeech(req: Request, res: Response) {
  try {
    const { transcript } = req.body ?? {};
    if (typeof transcript !== 'string' || !transcript.trim()) {
      res.status(400).json({ error: 'Missing or invalid transcript in body' });
      return;
    }

    const cleanedTranscript = preprocessTranscript(transcript.trim());
    const inputForLlm = cleanedTranscript.length > 0 ? cleanedTranscript : transcript.trim();
    const result = await callGroq(inputForLlm);
    const tasks = mapTasksToFrontend(result.tasks);
    const rawJournal =
      result.journal && typeof result.journal === 'object'
        ? (result.journal as Record<string, unknown>)
        : null;
    const journal = {
      entry: (rawJournal?.entry as string) ?? '',
      moods: Array.isArray(rawJournal?.moods) ? (rawJournal.moods as string[]) : [],
    };

    console.log(tasks, journal);

    res.json({ tasks, journal });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process speech';
    console.error('processSpeech error:', message);
    res.status(500).json({ error: message });
  }
}
