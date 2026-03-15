import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Sparkles, LayoutGrid, BookHeart, ArrowRight, X } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Brain Dump',
    description: 'Say everything. No structure needed.',
  },
  {
    icon: Sparkles,
    title: 'AI Clarity',
    description: 'Sorted into tasks, priorities, subtasks.',
  },
  {
    icon: LayoutGrid,
    title: 'Your Way',
    description: 'List, kanban, or mind map.',
  },
  {
    icon: BookHeart,
    title: 'Reflect',
    description: 'Journal entry and mood, auto-generated.',
  },
];

export default function Landing() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-16 relative overflow-hidden"
      style={{ background: '#141e16' }}
    >

      {/* Drifting background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            top: '-100px',
            left: '-150px',
            background: 'radial-gradient(circle, rgba(75, 120, 65, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            bottom: '-200px',
            right: '-200px',
            background: 'radial-gradient(circle, rgba(110, 90, 60, 0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, -25, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '400px',
            height: '400px',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(130, 110, 80, 0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(3.25rem, 12vw, 5rem)',
              color: '#dce8d8',
              fontWeight: '400',
              lineHeight: '1.05',
              letterSpacing: '-0.02em',
            }}
          >
            After<br />Thought
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9375rem',
              color: 'rgba(190, 210, 180, 0.55)',
              fontWeight: '300',
              marginTop: '0.75rem',
              letterSpacing: '0.02em',
            }}
          >
            For the thoughts that pile up.
          </motion.p>
        </motion.div>

        {/* Mic orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-col items-center mb-5"
        >
          <button
            onClick={() => setShowModal(true)}
            className="relative group"
            style={{ outline: 'none' }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: '-20px',
                border: '1px solid rgba(95, 120, 80, 0.15)',
                borderRadius: '50%',
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: '-38px',
                border: '1px solid rgba(95, 120, 80, 0.07)',
                borderRadius: '50%',
              }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />

            <motion.div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                background: 'linear-gradient(135deg, rgba(75, 115, 65, 0.9) 0%, rgba(55, 90, 50, 0.95) 100%)',
                boxShadow: '0 0 50px rgba(75, 115, 65, 0.2), 0 0 100px rgba(55, 90, 50, 0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <Mic size={36} style={{ color: 'rgba(220, 235, 210, 0.95)' }} />
            </motion.div>
          </button>
        </motion.div>

        {/* Tagline under mic */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-center mb-14"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.125rem',
            color: 'rgba(170, 195, 160, 0.6)',
            fontWeight: '400',
            fontStyle: 'italic',
            letterSpacing: '0.01em',
          }}
        >
          Dump it. Sort it. Move on.
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-full max-w-md mb-10"
          style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(95, 120, 80, 0.2), transparent)',
          }}
        />

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full grid grid-cols-4 gap-3.5 mb-12"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85 + i * 0.07 }}
              className="flex flex-col gap-3.5 px-5 py-5 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(95, 120, 80, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(75, 115, 65, 0.15)' }}
              >
                <feature.icon size={18} style={{ color: 'rgba(95, 145, 85, 0.9)' }} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.0625rem', color: 'rgba(210, 225, 200, 0.85)', fontWeight: '500', marginBottom: '0.3rem' }}>
                  {feature.title}
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', color: 'rgba(150, 170, 135, 0.5)', fontWeight: '300', lineHeight: '1.5' }}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Auth buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="w-full max-w-md flex gap-4"
        >
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 rounded-2xl transition-all duration-300"
            style={{
              padding: '1.1rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(75, 115, 65, 0.85) 0%, rgba(55, 90, 50, 0.9) 100%)',
              color: 'rgba(220, 235, 210, 0.95)',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '1.125rem',
              border: '1px solid rgba(95, 120, 80, 0.2)',
              boxShadow: '0 4px 20px rgba(55, 90, 50, 0.15)',
            }}
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/sign-in')}
            className="flex-1 rounded-2xl transition-all duration-300"
            style={{
              padding: '1.1rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(95, 120, 80, 0.12)',
              color: 'rgba(190, 210, 180, 0.7)',
              fontFamily: 'var(--font-sans)',
              fontWeight: '400',
              fontSize: '1.125rem',
            }}
          >
            Sign In
          </button>
        </motion.div>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-20"
              style={{ background: 'rgba(14, 22, 16, 0.88)', backdropFilter: 'blur(12px)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-x-5 bottom-8 z-30 max-w-sm mx-auto rounded-3xl p-7"
              style={{
                background: '#1a2a1c',
                border: '1px solid rgba(95, 120, 80, 0.15)',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
              }}
            >
              <button onClick={() => setShowModal(false)} className="absolute top-5 right-5">
                <X size={17} style={{ color: 'rgba(150, 170, 135, 0.4)' }} />
              </button>

              <h2
                className="mb-2"
                style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#dce8d8', fontWeight: '400', lineHeight: '1.2' }}
              >
                Ready to clear<br />your head?
              </h2>
              <p
                className="mb-7"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(150, 170, 135, 0.55)', fontWeight: '300', lineHeight: '1.6' }}
              >
                Create a free account to start your first session and track your clarity over time.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, rgba(75, 115, 65, 0.85), rgba(55, 90, 50, 0.9))',
                    color: 'rgba(220, 235, 210, 0.95)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: '500',
                    fontSize: '0.9375rem',
                    border: '1px solid rgba(95, 120, 80, 0.2)',
                  }}
                >
                  <span>Create an account</span>
                  <ArrowRight size={17} />
                </button>
                <button
                  onClick={() => navigate('/sign-in')}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(95, 120, 80, 0.1)',
                    color: 'rgba(150, 170, 135, 0.65)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: '400',
                    fontSize: '0.9375rem',
                  }}
                >
                  <span>I already have an account</span>
                  <ArrowRight size={17} style={{ opacity: 0.4 }} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
