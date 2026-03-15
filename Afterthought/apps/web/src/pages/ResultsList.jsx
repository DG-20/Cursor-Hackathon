import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const priorityColors = {
  urgent: 'rgba(240, 150, 130, 0.95)',
  high: 'rgba(120, 190, 170, 0.9)',
  medium: 'rgba(160, 200, 185, 0.8)',
  low: 'rgba(140, 180, 165, 0.6)',
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
    color: 'rgba(140, 180, 165, 0.5)',
    bgColor: 'rgba(104, 178, 160, 0.08)',
  },
  'in-progress': {
    label: 'IN PROGRESS',
    color: 'rgba(120, 190, 170, 0.9)',
    bgColor: 'rgba(80, 160, 145, 0.15)',
  },
  done: {
    label: 'DONE',
    color: 'rgba(100, 200, 160, 0.95)',
    bgColor: 'rgba(80, 180, 140, 0.12)',
  },
};

function calculateTaskStatus(task) {
  if (!task.subtasks || task.subtasks.length === 0) return task.completed ? 'done' : 'todo';
  const completedCount = task.subtasks.filter(st => st.completed).length;
  const totalCount = task.subtasks.length;
  const percentage = (completedCount / totalCount) * 100;
  if (percentage === 0) return 'todo';
  if (percentage === 100) return 'done';
  return 'in-progress';
}

function calculateProgress(task) {
  if (!task.subtasks || task.subtasks.length === 0) return task.completed ? 100 : 0;
  const completedCount = task.subtasks.filter(st => st.completed).length;
  return Math.round((completedCount / task.subtasks.length) * 100);
}

export default function ResultsList() {
  const navigate = useNavigate();
  const { currentSession, toggleTaskComplete, toggleSubtaskComplete } = useSession();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    navigate('/', { replace: true });
    signOut();
    window.location.reload();
  };

  const handleAddSubtask = (taskId) => {
    const title = newSubtaskInputs[taskId]?.trim();
    if (!title) return;
    addSubtask(taskId, title);
    setNewSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const handleSubtaskTitleBlur = (taskId, subtaskId) => {
    if (editingSubtaskValue.trim()) {
      updateSubtaskTitle(taskId, subtaskId, editingSubtaskValue.trim());
    }
    setEditingSubtask(null);
    setEditingSubtaskValue('');
  };

  if (!currentSession || !currentSession.tasks) {
    navigate('/');
    return null;
  }

  const tasks = currentSession.tasks;

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{ background: '#0d1f1e' }}>
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            top: '-150px', left: '-150px',
            background: 'radial-gradient(circle, rgba(56, 178, 172, 0.1) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(104, 157, 140, 0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-6 py-4 mb-6 relative"
        style={{
          background: 'rgba(13, 31, 30, 0.85)',
          borderBottom: '1px solid rgba(104, 178, 160, 0.12)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/results/mindmap')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(104, 178, 160, 0.12)',
              color: 'rgba(160, 200, 185, 0.8)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to Map
          </button>
          <div
            className="flex items-center gap-3"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(160, 200, 185, 0.8)' }}
          >
            <span className="font-medium">
              {user?.first_name || user?.email?.split('@')[0] || 'You'}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            color: '#e8ede8',
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
            color: 'rgba(160, 200, 185, 0.6)',
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
      <div className="px-6 space-y-4 relative z-10">
        {tasks.map((task, index) => {
          const status = calculateTaskStatus(task);
          const progress = calculateProgress(task);
          const statusInfo = statusConfig[status];
          const isEditing = editingTaskId === task.id;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(104, 178, 160, 0.12)',
                backdropFilter: 'blur(10px)',
                transition: 'border-color 0.2s',
              }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox for tasks without subtasks */}
                {(!task.subtasks || task.subtasks.length === 0) && (
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="mt-1 transition-all duration-300"
                  >
                    {task.completed ? (
                      <CheckCircle2 size={20} style={{ color: 'rgba(120, 190, 170, 0.9)' }} />
                    ) : (
                      <Circle size={20} style={{ color: 'rgba(140, 180, 165, 0.5)' }} />
                    )}
                  </button>
                )}

                <div className="flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3
                      className={status === 'done' ? 'line-through' : ''}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '1.0625rem',
                        color: '#deeee6',
                        fontWeight: '500',
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap"
                        style={{ background: statusInfo.bgColor, color: statusInfo.color, fontFamily: 'var(--font-sans)', fontWeight: '600', letterSpacing: '0.025em' }}
                      >
                        {statusInfo.label}
                      </span>
                      {/* Edit toggle */}
                      <button
                        onClick={() => setEditingTaskId(isEditing ? null : task.id)}
                        className="p-1.5 rounded-lg transition-all duration-200"
                        style={{
                          background: isEditing ? 'rgba(104, 178, 160, 0.15)' : 'transparent',
                          color: isEditing ? 'rgba(120, 190, 170, 0.9)' : 'var(--clarity-text-muted)',
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            color: 'rgba(160, 200, 185, 0.6)',
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
                          background: 'rgba(104, 178, 160, 0.15)',
                        }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: statusInfo.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: 'rgba(104, 178, 160, 0.15)',
                        color: priorityColors[task.priority],
                        fontFamily: 'var(--font-sans)',
                        fontWeight: '500',
                      }}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(104, 178, 160, 0.12)',
                        color: 'rgba(160, 200, 185, 0.8)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {task.category}
                    </span>
                  </div>

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-2 pl-2 pt-2 border-t" style={{ borderColor: 'rgba(104, 178, 160, 0.12)' }}>
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSubtaskComplete(task.id, subtask.id)}
                            className="transition-all duration-300"
                          >
                            {subtask.completed ? (
                              <CheckCircle2 size={16} style={{ color: 'rgba(120, 190, 170, 0.9)' }} />
                            ) : (
                              <Circle size={16} style={{ color: 'rgba(140, 180, 165, 0.5)' }} />
                            )}

                            {/* Delete button — only in edit mode */}
                            {isEditing && (
                              <button
                                onClick={() => deleteSubtask(task.id, subtask.id)}
                                className="shrink-0 p-1 rounded transition-all duration-200"
                                style={{ color: 'rgba(240, 150, 130, 0.5)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'rgba(240, 150, 130, 0.9)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240, 150, 130, 0.5)'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                        </div>
                      );
                      })}

                      {/* Add subtask row — only in edit mode */}
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 pt-1"
                        >
                          <Plus size={16} style={{ color: 'rgba(120, 190, 170, 0.5)', flexShrink: 0 }} />
                          <input
                            value={newSubtaskInputs[task.id] || ''}
                            onChange={e => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddSubtask(task.id);
                            }}
                            placeholder="Add a subtask..."
                            className="flex-1 px-2 py-1 rounded-lg focus:outline-none text-sm"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(104, 178, 160, 0.15)',
                              color: 'var(--clarity-text-primary)',
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.875rem',
                              color: subtask.completed ? 'rgba(140, 180, 165, 0.5)' : 'rgba(200, 220, 210, 0.85)',
                              fontWeight: '300',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.35)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.15)'}
                          />
                          <button
                            onClick={() => handleAddSubtask(task.id)}
                            className="p-1.5 rounded-lg transition-all duration-200"
                            style={{ background: 'rgba(80, 160, 145, 0.2)', color: 'rgba(120, 190, 170, 0.9)' }}
                          >
                            <Check size={13} />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Add subtasks to a task that has none — only in edit mode */}
                  {isEditing && (!task.subtasks || task.subtasks.length === 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--clarity-glass-border)]"
                    >
                      <Plus size={16} style={{ color: 'rgba(120, 190, 170, 0.5)', flexShrink: 0 }} />
                      <input
                        value={newSubtaskInputs[task.id] || ''}
                        onChange={e => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(task.id); }}
                        placeholder="Add a subtask..."
                        className="flex-1 px-2 py-1 rounded-lg focus:outline-none text-sm"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(104, 178, 160, 0.15)',
                          color: 'var(--clarity-text-primary)',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: '300',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.35)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.15)'}
                      />
                      <button
                        onClick={() => handleAddSubtask(task.id)}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'rgba(80, 160, 145, 0.2)', color: 'rgba(120, 190, 170, 0.9)' }}
                      >
                        <Check size={13} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4 relative z-10" style={{ background: 'rgba(13, 31, 30, 0.95)', borderTop: '1px solid rgba(104, 178, 160, 0.12)' }}>
        <Link
          to="/journal"
          className="block w-full py-4 rounded-2xl text-center transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(80, 160, 145, 0.85) 0%, rgba(56, 130, 120, 0.9) 100%)',
            color: 'rgba(230, 245, 240, 0.95)',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            border: '1px solid rgba(104, 178, 160, 0.2)',
          }}
        >
          View Journal & Insights
        </Link>
      </div>
    </div>
  );
}