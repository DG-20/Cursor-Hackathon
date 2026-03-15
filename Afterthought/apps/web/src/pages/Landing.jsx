import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mic, MicOff, Type } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

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

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript.trim()) setTranscript(finalTranscript.trim());
    };

    recognition.onerror = (event) => {
      setError(`Microphone error: ${event.error}. Please check your permissions.`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async () => {
    const input = inputMode === 'voice' ? transcript : textInput;
    if (!input.trim()) return;

    startSession(input);
    navigate('/loading', { state: { transcript: input } });

    try {
      const [data] = await Promise.all([
        processTranscript(input),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);

      completeSession(data);
    } catch (err) {
      setError('Failed to process your input. Please try again.');
      navigate('/');
    }
  };

  const activeInput = inputMode === 'voice' ? transcript : textInput;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: '#141e16' }}
    >
      {/* Background orbs — forest green + warm brown */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            top: '-150px', left: '-150px',
            background: 'radial-gradient(circle, rgba(75, 120, 65, 0.1) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(110, 90, 60, 0.07) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Warm brown center orb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '350px', height: '350px',
            top: '40%', left: '55%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(130, 100, 65, 0.06) 0%, transparent 70%)',
            filter: 'blur(55px)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
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
          <h2 className="text-2xl tracking-wide" style={{ fontFamily: 'var(--font-serif)', color: '#dce8d8' }}>
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
            color: '#dce8d8',
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

              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(75, 115, 65, 0.4) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {isRecording && [0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: 'rgba(95, 120, 80, 0.5)', borderWidth: '1px' }}
                  animate={{ scale: [1, 1.5 + index * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.4, ease: 'easeOut' }}
                />
              ))}

              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: isRecording ? '#ef4444' : 'linear-gradient(135deg, rgba(75, 115, 65, 0.9) 0%, rgba(55, 90, 50, 0.95) 100%)',
                  boxShadow: isRecording
                    ? '0 0 40px rgba(239,68,68,0.3), 0 0 80px rgba(239,68,68,0.15)'
                    : '0 0 50px rgba(75, 115, 65, 0.2), 0 0 100px rgba(55, 90, 50, 0.1)',
                }}
              >
                {isRecording
                  ? <MicOff size={48} style={{ color: '#ffffff' }} />
                  : <Mic size={48} style={{ color: '#ffffff' }} />
                }
              </div>
            </button>

            <p
              className="mt-8"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                color: 'rgba(150, 170, 135, 0.6)',
                fontWeight: '300',
              }}
            >
              {isRecording ? 'Recording... tap to stop' : transcript ? 'Tap to record again' : 'Tap to start recording'}
            </p>

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full px-5 py-4 rounded-2xl"
                style={{
                  background: 'rgba(22, 32, 24, 0.9)',
                  border: '1px solid rgba(95, 120, 80, 0.12)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'rgba(190, 210, 180, 0.85)',
                  fontWeight: '300',
                  lineHeight: '1.6'
                }}>
                  {transcript}
                </p>
                <button
                  onClick={() => setTranscript('')}
                  className="mt-3 text-xs"
                  style={{ color: 'rgba(150, 170, 135, 0.5)' }}
                >
                  Clear
                </button>
              </motion.div>
            )}

            {error && (
              <p className="mt-4 text-sm text-center" style={{ color: 'rgba(180, 100, 70, 0.85)' }}>{error}</p>
            )}

            {transcript && !isRecording && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                className="w-full mt-6 py-4 rounded-2xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(75, 115, 65, 0.85) 0%, rgba(55, 90, 50, 0.9) 100%)',
                  color: 'rgba(220, 235, 210, 0.95)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '500',
                  border: '1px solid rgba(95, 120, 80, 0.2)',
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
                background: 'rgba(22, 32, 24, 0.9)',
                border: '1px solid rgba(95, 120, 80, 0.12)',
                color: '#dce8d8',
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
                background: 'linear-gradient(135deg, rgba(75, 115, 65, 0.85) 0%, rgba(55, 90, 50, 0.9) 100%)',
                color: 'rgba(220, 235, 210, 0.95)',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                border: '1px solid rgba(95, 120, 80, 0.2)',
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
            color: 'rgba(150, 170, 135, 0.5)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: '300',
          }}
        >
          {inputMode === 'voice' ? (
            <>
              <Type size={16} />
              <span className="group-hover:opacity-100 opacity-80 transition-opacity" style={{ color: 'rgba(190, 210, 180, 0.7)' }}>or type instead</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span className="group-hover:opacity-100 opacity-80 transition-opacity" style={{ color: 'rgba(190, 210, 180, 0.7)' }}>or use voice</span>
            </>
          )}
        </motion.button>

      </div>
    </div>
  );
}
