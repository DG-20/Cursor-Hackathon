import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, ChevronRight, Calendar } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSessions } from '../api/session';

export default function Journal() {
    const navigate = useNavigate();
    const { currentSession } = useSession();
    const [pastSessions, setPastSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch last 7 sessions from backend
    useEffect(() => {
        async function fetchSessions() {
          try {
            const data = await getSessions();
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
        if (!moods || moods.length === 0) return 'rgba(120, 190, 170, 0.6)';
        const positiveWords = ['hopeful', 'grateful', 'calm', 'motivated', 'excited', 'accomplished', 'joyful'];
        const negativeWords = ['anxious', 'overwhelmed', 'stressed', 'tired', 'frustrated', 'sad', 'angry'];
        const hasPositive = moods.some(m => positiveWords.includes(m));
        const hasNegative = moods.some(m => negativeWords.includes(m));
        if (hasPositive && !hasNegative) return 'rgba(100, 200, 160, 0.8)';
        if (hasNegative && !hasPositive) return 'rgba(200, 130, 110, 0.7)';
        return 'rgba(160, 190, 200, 0.7)';
    };

    return (
        <div className="min-h-screen px-6 py-8 pb-32">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/results/list')}
                        className="flex items-center gap-2 transition-all duration-300"
                        style={{
                            color: 'var(--clarity-text-secondary)',
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
                        color: 'var(--clarity-text-primary)',
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
                    className="mb-6 rounded-2xl p-6"
                    style={{
                        background: 'rgba(80, 160, 145, 0.06)',
                        border: '1px solid rgba(104, 178, 160, 0.15)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} style={{ color: 'rgba(120, 190, 170, 0.8)' }} />
                        <span
                            style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.75rem',
                                color: 'rgba(120, 190, 170, 0.7)',
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
                            color: 'var(--clarity-text-primary)',
                            fontWeight: '300',
                            lineHeight: '1.85',
                            marginBottom: '1rem',
                        }}
                    >
                        {journalEntry}
                    </p>

                    {/* Mood tags */}
                    {moodTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {moodTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full text-xs capitalize"
                                    style={{
                                        background: 'rgba(80, 160, 145, 0.12)',
                                        border: '1px solid rgba(104, 178, 160, 0.15)',
                                        color: 'rgba(140, 200, 178, 0.85)',
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
            >
                <h2
                    className="mb-4"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.75rem',
                        color: 'rgba(140, 180, 165, 0.5)',
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
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(104, 178, 160, 0.08)',
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
                            color: 'rgba(140, 180, 165, 0.4)',
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
                                        background: 'rgba(255, 255, 255, 0.025)',
                                        border: '1px solid rgba(104, 178, 160, 0.08)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(104, 178, 160, 0.18)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(104, 178, 160, 0.08)'}
                                >
                                    {/* Mood dot */}
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

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                style={{
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.875rem',
                                                    color: 'rgba(210, 235, 222, 0.8)',
                                                    fontWeight: '400',
                                                }}
                                            >
                                                {formatDate(session.created_at)}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.75rem',
                                                    color: 'rgba(120, 170, 150, 0.4)',
                                                    fontWeight: '300',
                                                }}
                                            >
                                                · {completedCount}/{taskCount} tasks
                                            </span>
                                        </div>

                                        {/* Journal preview */}
                                        {entry && (
                                            <p
                                                style={{
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.8125rem',
                                                    color: 'rgba(150, 190, 173, 0.45)',
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

                                        {/* Mood tags — max 3 */}
                                        {moods.length > 0 && (
                                            <div className="flex gap-1.5 mt-1.5">
                                                {moods.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 rounded-full text-xs capitalize"
                                                        style={{
                                                            background: 'rgba(80, 160, 145, 0.1)',
                                                            color: 'rgba(120, 185, 165, 0.6)',
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

                                    {/* Arrow */}
                                    <ChevronRight
                                        size={15}
                                        style={{ color: 'rgba(120, 170, 150, 0.25)', flexShrink: 0 }}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Full history button */}
                {!isLoading && pastSessions.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        onClick={() => navigate('/history')}
                        className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(104, 178, 160, 0.12)',
                            color: 'rgba(140, 190, 170, 0.6)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                            fontWeight: '300',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(104, 178, 160, 0.25)';
                            e.currentTarget.style.color = 'rgba(160, 210, 190, 0.8)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(104, 178, 160, 0.12)';
                            e.currentTarget.style.color = 'rgba(140, 190, 170, 0.6)';
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
                style={{ background: 'var(--clarity-bg-deep)', borderTop: '1px solid rgba(104, 178, 160, 0.08)' }}
            >
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-2xl transition-all duration-300"
                    style={{
                        background: 'linear-gradient(135deg, rgba(80, 160, 145, 0.8) 0%, rgba(52, 120, 110, 0.9) 100%)',
                        border: '1px solid rgba(104, 178, 160, 0.2)',
                        color: 'rgba(225, 245, 238, 0.95)',
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