export default async function processTranscript(transcript) {
  const response = await fetch('http://localhost:8080/processSpeech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

export async function getSessions() {
  const response = await fetch('http://localhost:8080/getSessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

export async function updateSessionTasks(sessionId, tasks) {
  const response = await fetch(`http://localhost:8080/session/${sessionId}/tasks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks })
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}