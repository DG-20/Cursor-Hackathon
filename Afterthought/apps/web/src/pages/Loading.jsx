import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const loadingMessages = [
  "Reading your thoughts...",
  "Finding what matters most...",
  "Organizing your priorities...",
  "Creating clarity...",
];

export default function Loading() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="flex flex-col items-center">

        {/* Glowing orb */}
        <div className="relative mb-12">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, var(--clarity-indigo-glow) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative rounded-full"
            style={{
              width: '120px',
              height: '120px',
              background: `radial-gradient(circle at 30% 30%, #8b87f1, var(--clarity-indigo))`,
              boxShadow: '0 0 60px var(--clarity-indigo-glow)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Rotating messages */}
        <div className="h-8 relative overflow-hidden">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              color: 'var(--clarity-text-secondary)',
              fontWeight: '300',
              textAlign: 'center',
            }}
          >
            {loadingMessages[messageIndex]}
          </motion.p>
        </div>

      </div>
    </div>
  );
}