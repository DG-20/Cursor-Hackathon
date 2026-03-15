import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, BookOpen, CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSessions } from '../api/session';
import { EARTH } from '@/styles/EARTH';

const priorityColors = {
    urgent: 'rgba(239, 100, 100, 0.9)',
    high: 'rgba(239, 160, 80, 0.9)',
    medium: 'rgba(234, 210, 80, 0.9)',
    low: 'rgba(100, 200, 160, 0.9)',
};

const priorityLabels = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

function calculateTaskStatus(task) {
    if (!task.subtasks || task.subtasks.length === 0) return task.completed ? 'done' : 'incomplete';
    const completedCount = task.subtasks.filter(st => st.completed).length;
    const pct = (completedCount / task.subtasks.length) * 100;
    if (pct === 0) return 'not-started';
    if (pct === 100) return 'done';
    return 'in-progress';
}

function calculateProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) return task.completed ? 100 : 0;
    return Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100);
}

const statusConfig = {
    done: { label: 'Done', color: 'rgba(100, 200, 160, 0.9)' },
    'in-progress': { label: 'In Progress', color: 'rgba(120, 190, 170, 0.8)' },
    'not-started': { label: 'Not Started', color: 'rgba(140, 170, 160, 0.5)' },
    incomplete: { label: 'Incomplete', color: 'rgba(140, 170, 160, 0.5)' },
};

function getPriorityKey(priority) {
    if (['urgent', 'high', 'medium', 'low'].includes(priority)) return priority;
    const n = Number(priority);
    if (n <= 1) return 'urgent';
    if (n === 2) return 'high';
    if (n === 3) return 'medium';
    return 'low';
}

function SessionCard({ session, index, sessionRef }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const tasks = session.tasks ?? [];
    const journal = session.journal ?? {};
    const moods = journal.moods ?? [];
    const journalEntry = journal.entry ?? '';
    const hasTasks = tasks.length > 0;

    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => calculateTaskStatus(t) === 'done').length,
        inProgress: tasks.filter(t => calculateTaskStatus(t) === 'in-progress').length,
    };

    const getMoodDotColor = () => {
        const positive = ['hopeful', 'grateful', 'calm', 'motivated', 'excited', 'accomplished', 'joyful'];
        const negative = ['anxious', 'overwhelmed', 'stressed', 'tired', 'frustrated', 'sad', 'angry'];
        const hasPos = moods.some(m => positive.includes(m));
        const hasNeg = moods.some(m => negative.includes(m));
        if (hasPos && !hasNeg) return 'rgba(100, 200, 160, 0.9)';
        if (hasNeg && !hasPos) return 'rgba(220, 130, 110, 0.8)';
        return 'rgba(140, 190, 200, 0.7)';
    };

    return (
        <motion.div
            ref={sessionRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
            className="rounded-2xl overflow-hidden scroll-mt-32"
            style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(104, 178, 160, 0.1)',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div className="p-5">

                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        {/* Mood dot */}
                        <div
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: getMoodDotColor(),
                                boxShadow: `0 0 8px ${getMoodDotColor()}`,
                                flexShrink: 0,
                                marginTop: '4px',
                            }}
                        />
                        <div>
                            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'rgba(220, 235, 225, 0.9)', fontWeight: '400' }}>
                                {formatDate(session.created_at)}
                            </h3>
                            {/* Mood tags */}
                            {moods.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {moods.slice(0, 4).map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-full text-xs capitalize"
                                            style={{
                                                background: 'rgba(80, 160, 145, 0.1)',
                                                border: '1px solid rgba(104, 178, 160, 0.12)',
                                                color: 'rgba(140, 200, 178, 0.8)',
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
                    </div>

                    {/* Task stats */}
                    {hasTasks && (
                        <div className="text-right shrink-0">
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', color: 'rgba(100, 200, 160, 0.9)', fontWeight: '500', lineHeight: 1 }}>
                                {taskStats.completed}
                                <span style={{ fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.4)', fontWeight: '300' }}>/{taskStats.total}</span>
                            </p>
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(140, 180, 165, 0.4)', fontWeight: '300', marginTop: '2px' }}>
                                tasks done
                            </p>
                        </div>
                    )}
                </div>

                {/* Journal entry preview */}
                {journalEntry && (
                    <div
                        className="p-4 rounded-xl mb-4"
                        style={{
                            background: 'rgba(80, 160, 145, 0.05)',
                            border: '1px solid rgba(104, 178, 160, 0.1)',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={13} style={{ color: 'rgba(120, 190, 170, 0.6)' }} />
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(120, 190, 170, 0.6)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Journal Entry
                            </span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(160, 200, 182, 0.6)', fontWeight: '300', lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {journalEntry}
                        </p>
                    </div>
                )}

                {/* Expand/collapse tasks */}
                {hasTasks && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex cursor-pointer items-center justify-center gap-2 w-full py-2.5 rounded-xl transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(104, 178, 160, 0.08)',
                            color: 'rgba(140, 185, 168, 0.5)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.8125rem',
                            fontWeight: '300',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(104, 178, 160, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(104, 178, 160, 0.08)'}
                    >
                        {isExpanded ? <><span>Hide tasks</span><ChevronUp size={14} /></> : <><span>View {taskStats.total} tasks</span><ChevronDown size={14} /></>}
                    </button>
                )}
            </div>

            {/* Expanded tasks */}
            <AnimatePresence>
                {isExpanded && hasTasks && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-5"
                        style={{ borderTop: '1px solid rgba(104, 178, 160, 0.08)' }}
                    >
                        <div className="space-y-2.5 pt-4">
                            {tasks.map((task) => {
                                const status = calculateTaskStatus(task);
                                const progress = calculateProgress(task);
                                const statusInfo = statusConfig[status];
                                const priorityKey = getPriorityKey(task.priority);

                                return (
                                    <div
                                        key={task.id}
                                        className="p-4 rounded-xl"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid rgba(104, 178, 160, 0.07)',
                                        }}
                                    >
                                        {/* Task header */}
                                        <div className="flex items-start gap-3 mb-2">
                                            {status === 'done'
                                                ? <CheckCircle2 size={16} style={{ color: 'rgba(100, 200, 160, 0.8)', marginTop: '2px', flexShrink: 0 }} />
                                                : <Circle size={16} style={{ color: 'rgba(140, 170, 160, 0.4)', marginTop: '2px', flexShrink: 0 }} />
                                            }
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <h4
                                                        className={status === 'done' ? 'line-through' : ''}
                                                        style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: status === 'done' ? 'rgba(140, 170, 160, 0.5)' : 'rgba(210, 235, 222, 0.85)', fontWeight: '400' }}
                                                    >
                                                        {task.title}
                                                    </h4>
                                                    <span
                                                        className="px-2 py-0.5 rounded text-xs whitespace-nowrap"
                                                        style={{ background: `${statusInfo.color}18`, color: statusInfo.color, fontFamily: 'var(--font-sans)', fontWeight: '400', fontSize: '0.7rem' }}
                                                    >
                                                        {statusInfo.label}
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(100, 130, 120, 0.2)' }}>
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${progress}%`, background: statusInfo.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-xs"
                                                        style={{ background: `${priorityColors[priorityKey]}15`, color: priorityColors[priorityKey], fontFamily: 'var(--font-sans)', fontWeight: '400' }}
                                                    >
                                                        {priorityLabels[priorityKey]}
                                                    </span>
                                                    {task.category && (
                                                        <span
                                                            className="px-2 py-0.5 rounded-full text-xs"
                                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(104, 178, 160, 0.1)', color: 'rgba(140, 185, 168, 0.55)', fontFamily: 'var(--font-sans)', fontWeight: '300' }}
                                                        >
                                                            {task.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Subtasks */}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mt-2.5 space-y-1.5 pl-1 border-t pt-2" style={{ borderColor: 'rgba(104, 178, 160, 0.07)' }}>
                                                        {task.subtasks.map(subtask => (
                                                            <div key={subtask.id} className="flex items-center gap-2">
                                                                {subtask.completed
                                                                    ? <CheckCircle2 size={13} style={{ color: 'rgba(100, 200, 160, 0.7)', flexShrink: 0 }} />
                                                                    : <Circle size={13} style={{ color: 'rgba(140, 170, 160, 0.35)', flexShrink: 0 }} />
                                                                }
                                                                <span
                                                                    className={subtask.completed ? 'line-through' : ''}
                                                                    style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: subtask.completed ? 'rgba(130, 160, 150, 0.4)' : 'rgba(160, 195, 178, 0.55)', fontWeight: '300' }}
                                                                >
                                                                    {subtask.title}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function History() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const sessionRefs = useRef({});

    useEffect(() => {
        async function fetchSessions() {
            try {
                const data = await getSessions(user?.id);
                setSessions(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSessions();
    }, [user?.id]);

    const sortedSessions = [...sessions].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className="min-h-screen pb-12" style={{ background: '#0d1f1e' }}>

            {/* Background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <motion.div
                    className="absolute rounded-full"
                    style={{ width: '500px', height: '500px', top: '-150px', left: '-150px', background: 'radial-gradient(circle, rgba(56, 178, 172, 0.08) 0%, transparent 70%)', filter: 'blur(50px)' }}
                    animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute rounded-full"
                    style={{ width: '600px', height: '600px', bottom: '-200px', right: '-200px', background: 'radial-gradient(circle, rgba(104, 157, 140, 0.06) 0%, transparent 70%)', filter: 'blur(60px)' }}
                    animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Header */}
            <div
                className="sticky top-0 z-1000 px-6 py-4 mb-6"
                style={{ background: 'rgba(13, 31, 30, 0.92)', borderBottom: '1px solid rgba(104, 178, 160, 0.08)', backdropFilter: 'blur(16px)' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
                        style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(104, 178, 160, 0.1)',
                            color: 'rgba(140, 180, 165, 0.7)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                        }}
                    >
                        <ArrowLeft size={15} />
                        Back
                    </button>
                    <div className="flex items-center gap-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(140, 180, 165, 0.7)' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/app')}
                            className="px-3 py-2 rounded-lg transition-all cursor-pointer duration-200"
                            style={{
                                background: 'rgba(80, 160, 145, 0.12)',
                                border: '1px solid rgba(104, 178, 160, 0.15)',
                                color: 'rgba(120, 190, 170, 0.8)',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.8125rem',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(80, 160, 145, 0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(80, 160, 145, 0.12)'}
                        >
                            + New Session
                        </button>
                        <button
                            type="button"
                            onClick={() => { navigate('/', { replace: true }); signOut(); window.location.reload(); }}
                            className="hover:underline cursor-pointer"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', color: 'rgba(220, 235, 225, 0.9)', fontWeight: '400', textAlign: 'center' }}>
                    Your History
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(140, 185, 168, 0.45)', fontWeight: '300', textAlign: 'center', marginTop: '0.4rem' }}>
                    Reflecting on your journey towards clarity
                </p>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 space-y-3">

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
                                className="rounded-2xl"
                                style={{ height: '100px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(104, 178, 160, 0.07)' }}
                            />
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-12">
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'rgba(220, 130, 110, 0.7)', fontWeight: '300' }}>
                            Failed to load sessions.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'rgba(120, 190, 170, 0.6)', fontWeight: '300', marginTop: '0.75rem' }}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && !error && sortedSessions.length === 0 && (
                    <div className="text-center py-16">
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'rgba(160, 200, 182, 0.4)', fontWeight: '400', fontStyle: 'italic' }}>
                            No sessions yet.
                        </p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(140, 180, 165, 0.3)', fontWeight: '300', marginTop: '0.5rem' }}>
                            Start your first session to begin your journey.
                        </p>
                        <button
                            onClick={() => navigate('/app')}
                            className="mt-6 px-6 py-3 rounded-2xl transition-all duration-200"
                            style={{ background: 'rgba(80, 160, 145, 0.15)', border: '1px solid rgba(104, 178, 160, 0.2)', color: 'rgba(140, 200, 178, 0.8)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '400' }}
                        >
                            Start a session
                        </button>
                    </div>
                )}

                {/* Sessions */}
                {!isLoading && !error && sortedSessions.map((session, index) => (
                    <SessionCard
                        key={session.id}
                        session={session}
                        index={index}
                        sessionRef={(el) => { if (el) sessionRefs.current[session.id] = el; }}
                    />
                ))}
            </div>
        </div>
    );
}