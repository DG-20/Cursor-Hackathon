import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mic, MicOff, Type } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import processTranscript from '../api/session.js';

export default function Landing() {
  const [inputMode, setInputMode] = useState('voice');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { startSession, completeSession } = useSession();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Start recording
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // On result, update transcript
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript.trim()) setTranscript(finalTranscript.trim());
    };

    // On error, set error and stop recording
    recognition.onerror = (event) => {
      setError(`Microphone error: ${event.error}. Please check your permissions.`);
      setIsRecording(false);
    };

    // On end, stop recording
    recognition.onend = () => {
      setIsRecording(false);
    };

    // Start recording
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  // Handle mic click
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    const input = inputMode === 'voice' ? transcript : textInput;
    if (!input.trim()) return;
  
    startSession(input);
    navigate('/loading');
  
    try {
      const [data] = await Promise.all([
        processTranscript(input),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

      completeSession(data);
      navigate('/results/mindmap');
    } catch (err) {
      setError('Failed to process your input. Please try again.');
      navigate('/');
    }
  };

  const activeInput = inputMode === 'voice' ? transcript : textInput;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl tracking-wide" style={{ fontFamily: 'var(--font-serif)', color: 'var(--clarity-text-primary)' }}>
            AfterThought
          </h2>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            lineHeight: '1.3',
            color: 'var(--clarity-text-primary)',
            fontWeight: '400'
          }}
        >
          What's on your mind today?
        </motion.h1>

        {/* Voice Input */}
        {inputMode === 'voice' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center mb-8"
          >
            <button onClick={handleMicClick} className="relative group">

              {/* Pulsing ring — only when recording */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, var(--clarity-indigo-glow) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Sound wave rings — only when recording */}
              {isRecording && [0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: 'var(--clarity-indigo)', borderWidth: '1px' }}
                  animate={{ scale: [1, 1.5 + index * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.4, ease: 'easeOut' }}
                />
              ))}

              {/* Main mic button */}
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: isRecording ? '#ef4444' : 'var(--clarity-indigo)',
                  boxShadow: isRecording
                    ? '0 0 40px rgba(239,68,68,0.3), 0 0 80px rgba(239,68,68,0.15)'
                    : '0 0 40px var(--clarity-indigo-glow), 0 0 80px var(--clarity-indigo-glow)',
                }}
              >
                {isRecording
                  ? <MicOff size={48} style={{ color: '#ffffff' }} />
                  : <Mic size={48} style={{ color: '#ffffff' }} />
                }
              </div>
            </button>

            {/* Status text */}
            <p
              className="mt-8"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                color: 'var(--clarity-text-secondary)',
                fontWeight: '300',
              }}
            >
              {isRecording ? 'Recording... tap to stop' : transcript ? 'Tap to record again' : 'Tap to start recording'}
            </p>

            {/* Live transcript preview */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full px-5 py-4 rounded-2xl"
                style={{
                  background: 'var(--clarity-glass-bg)',
                  border: '1px solid var(--clarity-glass-border)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'var(--clarity-text-secondary)',
                  fontWeight: '300',
                  lineHeight: '1.6'
                }}>
                  {transcript}
                </p>
                <button
                  onClick={() => setTranscript('')}
                  className="mt-3 text-xs"
                  style={{ color: 'var(--clarity-text-muted)' }}
                >
                  Clear
                </button>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
            )}

            {/* Submit — shows once there's a transcript */}
            {transcript && !isRecording && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                className="w-full mt-6 py-4 rounded-2xl transition-all duration-300"
                style={{
                  background: 'var(--clarity-indigo)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '500',
                }}
              >
                Clear my head →
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Text Input */}
        {inputMode === 'text' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type what's on your mind..."
              className="w-full h-48 px-6 py-4 rounded-2xl resize-none focus:outline-none transition-all duration-300"
              style={{
                background: 'var(--clarity-glass-bg)',
                border: '1px solid var(--clarity-glass-border)',
                color: 'var(--clarity-text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '1rem',
                fontWeight: '300',
                backdropFilter: 'blur(10px)',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!textInput.trim()}
              className="w-full mt-4 py-4 rounded-2xl transition-all duration-300 disabled:opacity-40"
              style={{
                background: 'var(--clarity-indigo)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
              }}
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Toggle */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          onClick={() => {
            setInputMode(inputMode === 'voice' ? 'text' : 'voice');
            setTranscript('');
            setError(null);
            if (isRecording) stopRecording();
          }}
          className="flex items-center justify-center gap-2 mx-auto group"
          style={{
            color: 'var(--clarity-text-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: '300',
          }}
        >
          {inputMode === 'voice' ? (
            <>
              <Type size={16} />
              <span className="group-hover:text-[var(--clarity-text-secondary)] transition-colors">or type instead</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span className="group-hover:text-[var(--clarity-text-secondary)] transition-colors">or use voice</span>
            </>
          )}
        </motion.button>

      </div>
    </div>
  );
}