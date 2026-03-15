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

  export default async function signUp(form) {
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