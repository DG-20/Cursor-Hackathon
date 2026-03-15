import { SESSION_SYSTEM_PROMPT } from '../prompts/sessionPrompt';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(text: string): Promise<{ tasks: unknown[]; journal?: unknown }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SESSION_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty response from Groq');
  }

  // Strip possible markdown code fence
  const rawJson = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(rawJson) as { tasks: unknown[]; journal?: unknown };

  if (!Array.isArray(parsed.tasks)) {
    throw new Error('Invalid response: missing or invalid tasks array');
  }

  return parsed;
}
