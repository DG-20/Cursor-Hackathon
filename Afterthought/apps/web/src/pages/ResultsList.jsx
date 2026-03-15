import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { X, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
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

const statusConfig = {
  todo: {
    label: 'TODO',
    color: 'var(--clarity-text-muted)',
    bgColor: 'rgba(100, 116, 139, 0.1)',
  },
  'in-progress': {
    label: 'IN PROGRESS',
    color: 'var(--clarity-indigo)',
    bgColor: 'rgba(99, 102, 241, 0.1)',
  },
  done: {
    label: 'DONE',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
};

// Calculate status based on subtask completion
function calculateTaskStatus(task) {
  if (!task.subtasks || task.subtasks.length === 0) {
    // Tasks without subtasks use their completed flag
    return task.completed ? 'done' : 'todo';
  }

  const completedCount = task.subtasks.filter(st => st.completed).length;
  const totalCount = task.subtasks.length;
  const percentage = (completedCount / totalCount) * 100;

  if (percentage === 0) return 'todo';
  if (percentage === 100) return 'done';
  return 'in-progress';
}

// Calculate completion percentage
function calculateProgress(task) {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.completed ? 100 : 0;
  }

  const completedCount = task.subtasks.filter(st => st.completed).length;
  const totalCount = task.subtasks.length;
  return Math.round((completedCount / totalCount) * 100);
}

export default function ResultsList() {
  const navigate = useNavigate();
  const { currentSession, endSession, toggleTaskComplete, toggleSubtaskComplete } = useSession();

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
    <div className="min-h-screen pb-24">
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
          <button
            onClick={() => navigate('/results/mindmap')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
            style={{
              background: 'var(--clarity-glass-bg)',
              border: '1px solid var(--clarity-glass-border)',
              color: 'var(--clarity-text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to Map
          </button>
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

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            color: 'var(--clarity-text-primary)',
            fontWeight: '500',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          Manage Your Tasks
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            color: 'var(--clarity-text-secondary)',
            fontWeight: '400',
            textAlign: 'center',
          }}
        >
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Task list */}
      <div className="px-6 space-y-4">
        {tasks.map((task, index) => {
          const status = calculateTaskStatus(task);
          const progress = calculateProgress(task);
          const statusInfo = statusConfig[status];

          return (
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
              }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox (only for tasks without subtasks) */}
                {(!task.subtasks || task.subtasks.length === 0) && (
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
                )}

                <div className="flex-1">
                  {/* Title and Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3
                      className={status === 'done' ? 'line-through' : ''}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '1.0625rem',
                        color: 'var(--clarity-text-primary)',
                        fontWeight: '500',
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </h3>
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap"
                      style={{
                        background: statusInfo.bgColor,
                        color: statusInfo.color,
                        fontFamily: 'var(--font-sans)',
                        fontWeight: '600',
                        letterSpacing: '0.025em',
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            color: 'var(--clarity-text-secondary)',
                            fontWeight: '400',
                          }}
                        >
                          Progress
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            color: statusInfo.color,
                            fontWeight: '600',
                          }}
                        >
                          {progress}%
                        </span>
                      </div>
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{
                          background: 'rgba(100, 116, 139, 0.2)',
                        }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: statusInfo.color,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Priority badge */}
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: `${priorityColors[task.priority]}20`,
                        color: priorityColors[task.priority],
                        fontFamily: 'var(--font-sans)',
                        fontWeight: '500',
                      }}
                    >
                      {priorityLabels[task.priority]}
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
                    <div className="space-y-2 pl-2 pt-2 border-t border-[var(--clarity-glass-border)]">
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
                              color: subtask.completed ? 'var(--clarity-text-muted)' : 'var(--clarity-text-secondary)',
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
          );
        })}
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
