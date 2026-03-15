import { Request, Response } from 'express';
import { callGroq } from '../services/llm';
import { preprocessTranscript } from '../utils/transcriptPreprocess';
import { supabase } from '../lib/supabase';

function mapTasksToFrontend(tasks: any[]): any[] {
  return tasks.map((t: any) => ({
    ...t,
    completed: false,
    subtasks: Array.isArray(t?.subtasks)
      ? t.subtasks.map((s: any) => ({ ...s, completed: false }))
      : [],
  }));
}

export async function processSpeech(req: Request, res: Response) {
  try {
    const { user_id, transcript } = req.body ?? {};
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

    // Persist to Supabase
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        transcript: transcript.trim(),
        tasks,
        journal,
        user_id: user_id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      // Don't block the response if DB fails — still return to frontend
      res.json({ tasks, journal });
      return;
    }

    res.json({ id: data.id, tasks, journal });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process speech';
    console.error('processSpeech error:', message);
    res.status(500).json({ error: message });
  }
}

export async function getSessions(req: Request, res: Response) {
  try {
    const { userId } = req.body ?? {};

    const query = supabase
      .from('sessions')
      .select('id, created_at, tasks, journal')
      .order('created_at', { ascending: false });

    // Filter by user_id if provided, otherwise fall back to null (unauthenticated)
    const { data, error } = userId
      ? await query.eq('user_id', userId)
      : await query.is('user_id', null);

    if (error) {
      console.error('Supabase fetch error:', error.message);
      res.status(500).json({ error: 'Failed to fetch sessions' });
      return;
    }

    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
    console.error('getSessions error:', message);
    res.status(500).json({ error: message });
  }
}