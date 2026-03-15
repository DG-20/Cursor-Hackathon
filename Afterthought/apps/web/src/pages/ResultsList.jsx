import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { useSession } from '../context/SessionContext';

const priorityColors = {
  urgent: 'var(--priority-urgent)',
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
};

const priorityLabels = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// API returns numeric priority (1 = most urgent). Map to display key.
function getPriorityKey(priority) {
  if (['urgent', 'high', 'medium', 'low'].includes(priority)) return priority;
  const n = Number(priority);
  if (n <= 1) return 'urgent';
  if (n === 2) return 'high';
  if (n === 3) return 'medium';
  return 'low';
}

export default function ResultsList() {
  const navigate = useNavigate();
  const { currentSession, endSession, toggleTaskComplete, toggleSubtaskComplete } = useSession();
  const [activeView, setActiveView] = useState('list');

  console.log('currentSession:', currentSession);

  const handleEndSession = () => {
    endSession();
    navigate('/');
  };

  if (!currentSession || !currentSession.tasks) {
    navigate('/');
    return null;
  }

  const tasks = currentSession.tasks;

  return (
    <div className="min-h-screen pb-8">
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-6 py-4 mb-6"
        style={{
          background: 'var(--clarity-bg-deep)',
          borderBottom: '1px solid var(--clarity-glass-border)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              color: 'var(--clarity-text-secondary)',
              fontWeight: '400',
            }}
          >
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
            style={{
              background: 'var(--clarity-glass-bg)',
              border: '1px solid var(--clarity-glass-border)',
              color: 'var(--clarity-text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
            }}
          >
            <X size={16} />
            End Session
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--clarity-glass-bg)' }}>
          {['list', 'kanban', 'mindmap'].map((view) => (
            <button
              key={view}
              onClick={() => {
                setActiveView(view);
                if (view !== 'list') {
                  navigate(`/results/${view}`);
                }
              }}
              className="flex-1 py-2 px-4 rounded-lg transition-all duration-300 capitalize"
              style={{
                background: activeView === view ? 'var(--clarity-indigo)' : 'transparent',
                color: activeView === view ? '#ffffff' : 'var(--clarity-text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                fontWeight: activeView === view ? '500' : '400',
              }}
            >
              {view === 'mindmap' ? 'Mind Map' : view}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="px-6 space-y-4">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-2xl p-5"
            style={{
              background: 'var(--clarity-glass-bg)',
              border: '1px solid var(--clarity-glass-border)',
              backdropFilter: 'blur(10px)',
              opacity: task.completed ? 0.6 : 1,
              overflow: 'auto',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <button
                onClick={() => toggleTaskComplete(task.id)}
                className="mt-1 transition-all duration-300"
              >
                {task.completed ? (
                  <CheckCircle2 size={20} style={{ color: 'var(--clarity-indigo)' }} />
                ) : (
                  <Circle size={20} style={{ color: 'var(--clarity-text-muted)' }} />
                )}
              </button>

              <div className="flex-1">
                {/* Title */}
                <h3
                  className={task.completed ? 'line-through' : ''}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    color: 'var(--clarity-text-primary)',
                    fontWeight: '500',
                    marginBottom: '0.75rem',
                  }}
                >
                  {task.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Priority badge (API may send number 1–4 or string) */}
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: `${priorityColors[getPriorityKey(task.priority)]}20`,
                      color: priorityColors[getPriorityKey(task.priority)],
                      fontFamily: 'var(--font-sans)',
                      fontWeight: '500',
                    }}
                  >
                    {priorityLabels[getPriorityKey(task.priority)]}
                  </span>

                  {/* Category pill */}
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: 'var(--clarity-glass-bg)',
                      border: '1px solid var(--clarity-glass-border)',
                      color: 'var(--clarity-text-secondary)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {task.category}
                  </span>
                </div>

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-2 pl-2">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSubtaskComplete(task.id, subtask.id)}
                          className="transition-all duration-300"
                        >
                          {subtask.completed ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--clarity-indigo)' }} />
                          ) : (
                            <Circle size={16} style={{ color: 'var(--clarity-text-muted)' }} />
                          )}
                        </button>
                        <span
                          className={subtask.completed ? 'line-through' : ''}
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                            color: 'var(--clarity-text-secondary)',
                            fontWeight: '300',
                          }}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: 'var(--clarity-bg-deep)' }}>
        <Link
          to="/journal"
          className="block w-full py-4 rounded-2xl text-center transition-all duration-300"
          style={{
            background: 'var(--clarity-indigo)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
          }}
        >
          View Journal & Insights
        </Link>
      </div>
    </div>
  );
}
