import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mic, Type } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export default function Landing() {
  const [inputMode, setInputMode] = useState('voice');
  const [textInput, setTextInput] = useState('');
  const navigate = useNavigate();
  const { startSession } = useSession();

  const handleSubmit = () => {
    if (inputMode === 'text' && !textInput.trim()) return;
    
    startSession(inputMode === 'voice' ? 'voice recording' : textInput);
    navigate('/loading');
  };

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
            Clarity
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
            className="flex flex-col items-center mb-12"
          >
            <button
              onClick={handleSubmit}
              className="relative group"
            >
              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, var(--clarity-indigo-glow) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Sound wave rings */}
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 rounded-full border"
                  style={{
                    borderColor: 'var(--clarity-indigo)',
                    borderWidth: '1px',
                  }}
                  animate={{
                    scale: [1, 1.5 + index * 0.3],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.4,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Main mic button */}
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'var(--clarity-indigo)',
                  boxShadow: '0 0 40px var(--clarity-indigo-glow), 0 0 80px var(--clarity-indigo-glow)',
                }}
              >
                <Mic size={48} style={{ color: '#ffffff' }} />
              </div>
            </button>

            <p
              className="mt-8"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                color: 'var(--clarity-text-secondary)',
                fontWeight: '300',
              }}
            >
              Tap to start recording
            </p>
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
          onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
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
              <span className="group-hover:text-[var(--clarity-text-secondary)] transition-colors">
                or type instead
              </span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span className="group-hover:text-[var(--clarity-text-secondary)] transition-colors">
                or use voice
              </span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
