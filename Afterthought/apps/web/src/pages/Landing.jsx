import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mic, MicOff, Type } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import {processTranscript} from '../api/session.js';

export default function Landing() {
  const [inputMode, setInputMode] = useState('voice');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { startSession, completeSession } = useSession();
  const { user } = useAuth();

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
    navigate('/loading', { state: { user_id: user.id, transcript: input } });

    try {
      const [data] = await Promise.all([
        processTranscript(user.id, input),
        new Promise(resolve => setTimeout(resolve, 500)) // just enough to not block
      ]);

      completeSession(data); // store in context — don't navigate yet
    } catch (err) {
      setError('Failed to process your input. Please try again.');
      navigate('/');
    }
  };

  const activeInput = inputMode === 'voice' ? transcript : textInput;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: '#0d1f1e' }}
    >
      {/* Background orbs — same as SignUp/Hero */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            top: '-150px', left: '-150px',
            background: 'radial-gradient(circle, rgba(56, 178, 172, 0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            bottom: '-150px', right: '-150px',
            background: 'radial-gradient(circle, rgba(104, 157, 140, 0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl tracking-wide" style={{ fontFamily: 'var(--font-serif)', color: '#e8ede8' }}>
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
            color: '#e8ede8',
            fontWeight: '400'
          }}
        >
          {user
            ? `Hey ${user.first_name || user.email?.split('@')[0] || 'you'}, what's on your mind?`
            : "What's on your mind today?"}
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
                  style={{ background: 'radial-gradient(circle, rgba(80, 160, 145, 0.4) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Sound wave rings — only when recording */}
              {isRecording && [0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: 'rgba(104, 178, 160, 0.5)', borderWidth: '1px' }}
                  animate={{ scale: [1, 1.5 + index * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.4, ease: 'easeOut' }}
                />
              ))}

              {/* Main mic button */}
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: isRecording ? '#ef4444' : 'linear-gradient(135deg, rgba(80, 160, 145, 0.9) 0%, rgba(56, 130, 120, 0.95) 100%)',
                  boxShadow: isRecording
                    ? '0 0 40px rgba(239,68,68,0.3), 0 0 80px rgba(239,68,68,0.15)'
                    : '0 0 50px rgba(80, 160, 145, 0.2), 0 0 100px rgba(56, 130, 120, 0.1)',
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
                color: 'rgba(160, 200, 185, 0.6)',
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
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(104, 178, 160, 0.12)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'rgba(200, 220, 210, 0.85)',
                  fontWeight: '300',
                  lineHeight: '1.6'
                }}>
                  {transcript}
                </p>
                <button
                  onClick={() => setTranscript('')}
                  className="mt-3 text-xs"
                  style={{ color: 'rgba(140, 180, 165, 0.5)' }}
                >
                  Clear
                </button>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-center" style={{ color: 'rgba(240, 150, 130, 0.85)' }}>{error}</p>
            )}

            {/* Submit — shows once there's a transcript */}
            {transcript && !isRecording && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                className="w-full mt-6 py-4 rounded-2xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(80, 160, 145, 0.85) 0%, rgba(56, 130, 120, 0.9) 100%)',
                  color: 'rgba(230, 245, 240, 0.95)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '500',
                  border: '1px solid rgba(104, 178, 160, 0.2)',
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
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(104, 178, 160, 0.12)',
                color: '#deeee6',
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
                background: 'linear-gradient(135deg, rgba(80, 160, 145, 0.85) 0%, rgba(56, 130, 120, 0.9) 100%)',
                color: 'rgba(230, 245, 240, 0.95)',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                border: '1px solid rgba(104, 178, 160, 0.2)',
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
            color: 'rgba(140, 180, 165, 0.5)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: '300',
          }}
        >
          {inputMode === 'voice' ? (
            <>
              <Type size={16} />
              <span className="group-hover:opacity-100 opacity-80 transition-opacity" style={{ color: 'rgba(160, 200, 185, 0.7)' }}>or type instead</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span className="group-hover:opacity-100 opacity-80 transition-opacity" style={{ color: 'rgba(160, 200, 185, 0.7)' }}>or use voice</span>
            </>
          )}
        </motion.button>

      </div>
    </div>
  );
}