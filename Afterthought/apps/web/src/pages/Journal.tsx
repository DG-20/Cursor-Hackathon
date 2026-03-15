import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, ChevronRight, Calendar } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSessions } from '../api/session.js';
import { useAuth } from '@/context/AuthContext';

export default function Journal() {
    const navigate = useNavigate();
    const { currentSession } = useSession();
    const [pastSessions, setPastSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        async function fetchSessions() {
          try {
            console.log(user.id);
            const data = await getSessions(user.id);
            setPastSessions(data.slice(0, 7));
          } catch (err) {
            console.error('Failed to fetch sessions:', err);
          } finally {
            setIsLoading(false);
          }
        }
        fetchSessions();
      }, []);

    const journalEntry = currentSession?.journal?.entry;
    const moodTags = currentSession?.journal?.moods ?? [];

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getMoodColor = (moods) => {
        if (!moods || moods.length === 0) return 'rgba(95, 145, 85, 0.6)';
        const positiveWords = ['hopeful', 'grateful', 'calm', 'motivated', 'excited', 'accomplished', 'joyful'];
        const negativeWords = ['anxious', 'overwhelmed', 'stressed', 'tired', 'frustrated', 'sad', 'angry'];
        const hasPositive = moods.some(m => positiveWords.includes(m));
        const hasNegative = moods.some(m => negativeWords.includes(m));
        if (hasPositive && !hasNegative) return 'rgba(95, 145, 85, 0.8)';
        if (hasNegative && !hasPositive) return 'rgba(180, 100, 70, 0.7)';
        return 'rgba(155, 140, 100, 0.7)';
    };

    return (
        <div
            className="min-h-screen px-6 py-8 pb-32 relative overflow-hidden"
            style={{ background: '#141e16' }}
        >
            {/* Background orbs */}
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
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: '300px', height: '300px',
                        top: '40%', right: '-60px',
                        background: 'radial-gradient(circle, rgba(130, 100, 65, 0.06) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                    animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Header */}
            <div className="mb-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/results/list')}
                        className="flex items-center gap-2 transition-all duration-300"
                        style={{
                            color: 'rgba(190, 210, 180, 0.8)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Tasks
                    </button>
                </div>

                <h1
                    style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2rem',
                        color: '#dce8d8',
                        fontWeight: '400',
                    }}
                >
                    Journal
                </h1>
            </div>

            {/* Current session journal entry */}
            {journalEntry && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6 rounded-2xl p-6 relative z-10"
                    style={{
                        background: 'rgba(75, 115, 65, 0.06)',
                        border: '1px solid rgba(95, 120, 80, 0.15)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} style={{ color: 'rgba(95, 145, 85, 0.8)' }} />
                        <span
                            style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.75rem',
                                color: 'rgba(95, 145, 85, 0.7)',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            }}
                        >
                            Today's Entry
                        </span>
                    </div>

                    <p
                        style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.9375rem',
                            color: '#dce8d8',
                            fontWeight: '300',
                            lineHeight: '1.85',
                            marginBottom: '1rem',
                        }}
                    >
                        {journalEntry}
                    </p>

                    {moodTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {moodTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full text-xs capitalize"
                                    style={{
                                        background: 'rgba(75, 115, 65, 0.12)',
                                        border: '1px solid rgba(95, 120, 80, 0.15)',
                                        color: 'rgba(130, 175, 120, 0.85)',
                                        fontFamily: 'var(--font-sans)',
                                        fontWeight: '300',
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Past 7 sessions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative z-10"
            >
                <h2
                    className="mb-4"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.75rem',
                        color: 'rgba(150, 170, 135, 0.5)',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                    }}
                >
                    Recent Sessions
                </h2>

                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl p-4 animate-pulse"
                                style={{
                                    background: 'rgba(22, 32, 24, 0.6)',
                                    border: '1px solid rgba(95, 120, 80, 0.08)',
                                    height: '72px',
                                }}
                            />
                        ))}
                    </div>
                ) : pastSessions.length === 0 ? (
                    <p
                        style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                            color: 'rgba(150, 170, 135, 0.4)',
                            fontWeight: '300',
                            textAlign: 'center',
                            padding: '2rem 0',
                        }}
                    >
                        No past sessions yet.
                    </p>
                ) : (
                    <div className="space-y-2.5">
                        {pastSessions.map((session, i) => {
                            const moods = session.journal?.moods ?? [];
                            const entry = session.journal?.entry ?? '';
                            const taskCount = session.tasks?.length ?? 0;
                            const completedCount = session.tasks?.filter(t => t.completed).length ?? 0;
                            const dotColor = getMoodColor(moods);

                            return (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
                                    className="flex items-center gap-4 px-4 py-4 rounded-2xl cursor-pointer group transition-all duration-200"
                                    style={{
                                        background: 'rgba(22, 32, 24, 0.7)',
                                        border: '1px solid rgba(95, 120, 80, 0.08)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(95, 120, 80, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(95, 120, 80, 0.08)'}
                                >
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: dotColor,
                                            boxShadow: `0 0 8px ${dotColor}`,
                                            flexShrink: 0,
                                        }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                style={{
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.875rem',
                                                    color: 'rgba(210, 230, 200, 0.8)',
                                                    fontWeight: '400',
                                                }}
                                            >
                                                {formatDate(session.created_at)}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.75rem',
                                                    color: 'rgba(150, 170, 135, 0.4)',
                                                    fontWeight: '300',
                                                }}
                                            >
                                                · {completedCount}/{taskCount} tasks
                                            </span>
                                        </div>

                                        {entry && (
                                            <p
                                                style={{
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.8125rem',
                                                    color: 'rgba(150, 170, 135, 0.45)',
                                                    fontWeight: '300',
                                                    lineHeight: '1.5',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {entry}
                                            </p>
                                        )}

                                        {moods.length > 0 && (
                                            <div className="flex gap-1.5 mt-1.5">
                                                {moods.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 rounded-full text-xs capitalize"
                                                        style={{
                                                            background: 'rgba(75, 115, 65, 0.1)',
                                                            color: 'rgba(130, 175, 120, 0.6)',
                                                            fontFamily: 'var(--font-sans)',
                                                            fontWeight: '300',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <ChevronRight
                                        size={15}
                                        style={{ color: 'rgba(150, 170, 135, 0.25)', flexShrink: 0 }}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!isLoading && pastSessions.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        onClick={() => navigate('/history')}
                        className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(95, 120, 80, 0.12)',
                            color: 'rgba(150, 170, 135, 0.6)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                            fontWeight: '300',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(95, 120, 80, 0.25)';
                            e.currentTarget.style.color = 'rgba(190, 210, 180, 0.8)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(95, 120, 80, 0.12)';
                            e.currentTarget.style.color = 'rgba(150, 170, 135, 0.6)';
                        }}
                    >
                        <Calendar size={15} />
                        View full history
                    </motion.button>
                )}
            </motion.div>

            {/* Bottom CTA */}
            <div
                className="fixed bottom-0 left-0 right-0 px-6 py-4"
                style={{ background: 'rgba(20, 30, 22, 0.95)', borderTop: '1px solid rgba(95, 120, 80, 0.08)' }}
            >
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-2xl transition-all duration-300"
                    style={{
                        background: 'linear-gradient(135deg, rgba(75, 115, 65, 0.85) 0%, rgba(55, 90, 50, 0.9) 100%)',
                        border: '1px solid rgba(95, 120, 80, 0.2)',
                        color: 'rgba(220, 235, 210, 0.95)',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: '500',
                        fontSize: '0.9375rem',
                    }}
                >
                    Start New Session
                </button>
            </div>

        </div>
    );
}
