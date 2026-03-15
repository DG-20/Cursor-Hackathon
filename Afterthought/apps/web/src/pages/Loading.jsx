import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '../context/SessionContext';

const loadingMessages = [
  "Arranging your thoughts...",
  "Finding what matters most...",
  "Untangling the noise...",
  "Almost there...",
];

const stopWords = new Set([
  'i', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'my', 'me', 'we', 'it', 'is', 'am', 'are', 'was', 'be', 'do',
  'so', 'if', 'up', 'as', 'by', 'that', 'this', 'have', 'has', 'had', 'not',
  'no', 'just', 'also', 'about', 'need', 'want', 'get', 'got', 'can', 'will',
  'its', 'very', 'too', 'from', 'into', 'then', 'than', 'some', 'there',
  'their', 'they', 'been', 'him', 'her', 'his', 'you', 'your', 'our', 'all',
  'when', 'what', 'how', 'who', 'out', 'more', 'still', 'like', 'feel',
]);

function extractWords(transcript) {
  if (!transcript) return [];
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  const unique = [...new Set(words)];
  const padded = [...unique];
  while (padded.length < 40) {
    padded.push(...unique.slice(0, Math.min(unique.length, 40 - padded.length)));
  }
  return padded.slice(0, 40);
}

function generateWordData(words) {
  return words.map((word, i) => {
    const a = i * 137.508;
    const col = i % 8;
    const row = Math.floor(i / 8);
    const baseX = (col / 7) * 85 + 5;
    const baseY = (row / 4) * 80 + 5;
    const jitterX = (Math.sin(a) * 8);
    const jitterY = (Math.cos(a * 0.7) * 8);
    const travelX = (Math.sin(a * 0.4) > 0 ? 1 : -1) * (25 + Math.abs(Math.sin(a)) * 45);
    const travelY = (Math.cos(a * 0.3) > 0 ? 1 : -1) * (20 + Math.abs(Math.cos(a)) * 40);

    return {
      word,
      x: Math.max(2, Math.min(88, baseX + jitterX)),
      y: Math.max(2, Math.min(88, baseY + jitterY)),
      travelX,
      travelY,
      rotate: (Math.sin(a) * 45),
      duration: 3 + Math.abs(Math.sin(a * 0.5)) * 3,
      delay: (i * 0.1) % 2.5,
      fontSize: 0.75 + Math.abs(Math.sin(a * 0.4)) * 0.9,
      opacity: 0.35 + Math.abs(Math.sin(a * 0.6)) * 0.5,
      color: i % 4 === 0
        ? 'rgba(180, 230, 210, 0.95)'
        : i % 4 === 1
          ? 'rgba(120, 190, 170, 0.85)'
          : i % 4 === 2
            ? 'rgba(80, 160, 145, 0.75)'
            : 'rgba(210, 240, 225, 0.65)',
    };
  });
}

// Phases:
// 'storm'    — words flying, messages showing
// 'fading'   — overlay fades in over words
// 'farewell' — phrase appears in center
// 'done'     — navigate away
const PHASE_TIMINGS = {
  fading: 3400,     // start fade after 3.4s
  farewell: 4400,   // show phrase after fade completes (1s fade)
  navigate: 6800,   // navigate after phrase has been visible for ~2.4s
};

export default function Loading() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSession } = useSession();
  const transcript = location.state?.transcript ||
    'thoughts work stress deadline sleep tired overwhelmed anxious focus energy time pressure meeting family health money goals';

  const [phase, setPhase] = useState('storm');
  const [messageIndex, setMessageIndex] = useState(0);
  const [dataReady, setDataReady] = useState(false);

  const words = useMemo(() => extractWords(transcript), [transcript]);
  const wordData = useMemo(() => generateWordData(words), [words]);

  // Watch for data arriving in context
  useEffect(() => {
    if (currentSession && !currentSession.isLoading && currentSession.tasks?.length > 0) {
      setDataReady(true);
    }
  }, [currentSession]);

  // Cycle messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Phase transitions — only start fading when BOTH timer AND data are ready
  useEffect(() => {
    if (!dataReady) return;

    const fadeTimer = setTimeout(() => setPhase('fading'), 400); // short buffer after data arrives
    return () => clearTimeout(fadeTimer);
  }, [dataReady]);

  // Once fading starts, chain the rest
  useEffect(() => {
    if (phase !== 'fading') return;

    const farewellTimer = setTimeout(() => setPhase('farewell'), 1000);
    const navigateTimer = setTimeout(() => navigate('/results/list'), 2800);

    return () => {
      clearTimeout(farewellTimer);
      clearTimeout(navigateTimer);
    };
  }, [phase, navigate]);

  // Fallback — if data never arrives (error), navigate after 12s
  useEffect(() => {
    const fallback = setTimeout(() => navigate('/results/list'), 12000);
    return () => clearTimeout(fallback);
  }, [navigate]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d1f1e',
        overflow: 'hidden',
      }}
    >

      {/* Background orbs */}
      <motion.div
        style={{
          position: 'absolute',
          width: '600px', height: '600px',
          top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, rgba(56, 178, 172, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          borderRadius: '50%',
        }}
        animate={{ x: [0, 30, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          width: '700px', height: '700px',
          bottom: '-250px', right: '-250px',
          background: 'radial-gradient(circle, rgba(104, 157, 140, 0.1) 0%, transparent 70%)',
          filter: 'blur(70px)',
          borderRadius: '50%',
        }}
        animate={{ x: [0, -25, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* STORM — words flying */}
      <AnimatePresence>
        {phase === 'storm' && wordData.map(({ word, x, y, travelX, travelY, rotate, duration, delay, fontSize, opacity, color }, i) => (
          <motion.span
            key={`${word}-${i}`}
            style={{
              position: 'fixed',
              left: `${x}%`,
              top: `${y}%`,
              fontFamily: 'var(--font-sans)',
              fontSize: `${fontSize}rem`,
              color,
              fontWeight: i % 3 === 0 ? '400' : '300',
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 10,
            }}
            initial={{
              opacity: 0,
              scale: 0.5,
              rotate: rotate * 2,
              filter: 'blur(4px)',
            }}
            animate={{
              opacity: [0, opacity, opacity, opacity * 0.7],
              scale: [0.5, 1, 1, 0.8],
              x: ['0vw', `${travelX * 0.5}vw`, `${travelX}vw`, `${travelX * 1.3}vw`],
              y: ['0vh', `${travelY * 0.4}vh`, `${travelY}vh`, `${travelY * 1.2}vh`],
              rotate: [0, rotate * 0.5, rotate, rotate * 1.2],
              filter: ['blur(3px)', 'blur(0px)', 'blur(0px)', 'blur(2px)'],
            }}
            exit={{
              opacity: 0,
              scale: 0.3,
              filter: 'blur(16px)',
              transition: {
                duration: 0.8,
                delay: i * 0.02,
                ease: 'easeIn',
              }
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: [0.25, 0.1, 0.25, 1],
              times: [0, 0.3, 0.7, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* FADE OVERLAY — slow radial wash */}
      <AnimatePresence>
        {(phase === 'fading' || phase === 'farewell') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 20,
              background: 'radial-gradient(ellipse at center, rgba(13,31,30,0.5) 0%, rgba(13,31,30,0.98) 75%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* FAREWELL */}
      <AnimatePresence>
        {phase === 'farewell' && (
          <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.6 } }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,                    // ← takes full viewport
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',   // ← centers vertically
            gap: '16px',
            padding: '0 32px',          // ← safe horizontal padding
            boxSizing: 'border-box',
          }}
        >
            {/* Orb */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(140, 215, 190, 0.95), rgba(52, 120, 110, 0.98))',
                boxShadow: '0 0 40px rgba(80, 160, 145, 0.35), 0 0 80px rgba(56, 130, 120, 0.15)',
                marginBottom: '4px',
              }}
            >
              <motion.div
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 6vw, 2rem)',
                color: '#deeee6',
                fontWeight: '400',
                lineHeight: '1.3',
                letterSpacing: '-0.01em',
                whiteSpace: 'normal',      // ← was 'nowrap'
                maxWidth: '280px',
                textAlign: 'center',
              }}
            >
              Clarity incoming.
            </motion.h2>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                color: 'rgba(150, 205, 182, 0.45)',
                fontWeight: '300',
                letterSpacing: '0.03em',
                textAlign: 'center',
              }}
            >
              your thoughts are sorted
            </motion.p>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem',
                color: 'rgba(150, 205, 182, 0.45)',
                fontWeight: '300',
                letterSpacing: '0.03em',
              }}
            >
              your clarity is ready
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MESSAGES — only during storm */}
      <AnimatePresence>
        {phase === 'storm' && (
          <motion.div
            exit={{ opacity: 0, y: 8, transition: { duration: 0.6 } }}
            style={{
              position: 'fixed',
              bottom: '60px',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              zIndex: 30,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  color: 'rgba(160, 210, 190, 0.55)',
                  fontWeight: '400',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                }}
              >
                {loadingMessages[messageIndex]}
              </motion.p>
            </AnimatePresence>

            <div style={{ display: 'flex', gap: '6px' }}>
              {loadingMessages.map((_, i) => (
                <motion.div
                  key={i}
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: i === messageIndex
                      ? 'rgba(120, 190, 170, 0.8)'
                      : 'rgba(120, 190, 170, 0.2)',
                  }}
                  animate={{ scale: i === messageIndex ? 1.4 : 1 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}