import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Circle, ArrowLeft, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { updateSessionTasks } from '../api/session';

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
  todo: { label: 'TODO', color: 'var(--clarity-text-muted)', bgColor: 'rgba(100, 116, 139, 0.1)' },
  'in-progress': { label: 'IN PROGRESS', color: 'var(--clarity-indigo)', bgColor: 'rgba(99, 102, 241, 0.1)' },
  done: { label: 'DONE', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
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
  const {
    currentSession,
    endSession,
    toggleTaskComplete,
    toggleSubtaskComplete,
    updateSubtaskTitle,
    deleteSubtask,
    addSubtask,
  } = useSession();

  // Which task is in edit mode
  const [editingTaskId, setEditingTaskId] = useState(null);
  // New subtask input value per task
  const [newSubtaskInputs, setNewSubtaskInputs] = useState({});
  // Editing subtask title inline
  const [editingSubtask, setEditingSubtask] = useState(null); // { taskId, subtaskId }
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('');
  // Save status indicator
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const debounceRef = useRef(null);

  // Auto-save whenever tasks change
  useEffect(() => {
    if (!currentSession?.id || !currentSession?.tasks) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');

    debounceRef.current = setTimeout(async () => {
      try {
        await updateSessionTasks(currentSession.id, currentSession.tasks);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [currentSession?.tasks]);

  const handleEndSession = () => {
    endSession();
    navigate('/');
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

          <div className="flex items-center gap-3">
            {/* Save status */}
            <AnimatePresence mode="wait">
              {saveStatus === 'saving' && (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.5)' }}
                >
                  Saving...
                </motion.span>
              )}
              {saveStatus === 'saved' && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(100, 190, 160, 0.7)' }}
                >
                  Saved ✓
                </motion.span>
              )}
              {saveStatus === 'error' && (
                <motion.span
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(240, 150, 130, 0.7)' }}
                >
                  Save failed
                </motion.span>
              )}
            </AnimatePresence>

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
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--clarity-text-primary)', fontWeight: '500', textAlign: 'center', marginBottom: '0.5rem' }}>
          Manage Your Tasks
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--clarity-text-secondary)', fontWeight: '400', textAlign: 'center' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Task list */}
      <div className="px-6 space-y-4">
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
                background: 'var(--clarity-glass-bg)',
                border: `1px solid ${isEditing ? 'rgba(104, 178, 160, 0.3)' : 'var(--clarity-glass-border)'}`,
                backdropFilter: 'blur(10px)',
                transition: 'border-color 0.2s',
              }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox for tasks without subtasks */}
                {(!task.subtasks || task.subtasks.length === 0) && (
                  <button onClick={() => toggleTaskComplete(task.id)} className="mt-1 transition-all duration-300">
                    {task.completed
                      ? <CheckCircle2 size={20} style={{ color: 'var(--clarity-indigo)' }} />
                      : <Circle size={20} style={{ color: 'var(--clarity-text-muted)' }} />
                    }
                  </button>
                )}

                <div className="flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3
                      className={status === 'done' ? 'line-through' : ''}
                      style={{ fontFamily: 'var(--font-sans)', fontSize: '1.0625rem', color: 'var(--clarity-text-primary)', fontWeight: '500', flex: 1 }}
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
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--clarity-text-secondary)', fontWeight: '400' }}>Progress</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: statusInfo.color, fontWeight: '600' }}>{progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(100, 116, 139, 0.2)' }}>
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
                      style={{ background: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority], fontFamily: 'var(--font-sans)', fontWeight: '500' }}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ background: 'var(--clarity-glass-bg)', border: '1px solid var(--clarity-glass-border)', color: 'var(--clarity-text-secondary)', fontFamily: 'var(--font-sans)' }}
                    >
                      {task.category}
                    </span>
                  </div>

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-2 pl-2 pt-2 border-t border-[var(--clarity-glass-border)]">
                      {task.subtasks.map((subtask) => {
                        const isEditingThisSubtask = editingSubtask?.taskId === task.id && editingSubtask?.subtaskId === subtask.id;

                        return (
                          <div key={subtask.id} className="flex items-center gap-3 group">
                            <button
                              onClick={() => toggleSubtaskComplete(task.id, subtask.id)}
                              className="transition-all duration-300 shrink-0"
                            >
                              {subtask.completed
                                ? <CheckCircle2 size={16} style={{ color: 'var(--clarity-indigo)' }} />
                                : <Circle size={16} style={{ color: 'var(--clarity-text-muted)' }} />
                              }
                            </button>

                            {/* Subtask title — editable when in edit mode */}
                            {isEditing && isEditingThisSubtask ? (
                              <input
                                autoFocus
                                value={editingSubtaskValue}
                                onChange={e => setEditingSubtaskValue(e.target.value)}
                                onBlur={() => handleSubtaskTitleBlur(task.id, subtask.id)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSubtaskTitleBlur(task.id, subtask.id);
                                  if (e.key === 'Escape') { setEditingSubtask(null); setEditingSubtaskValue(''); }
                                }}
                                className="flex-1 px-2 py-1 rounded-lg focus:outline-none text-sm"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(104, 178, 160, 0.3)',
                                  color: 'var(--clarity-text-primary)',
                                  fontFamily: 'var(--font-sans)',
                                  fontWeight: '300',
                                }}
                              />
                            ) : (
                              <span
                                className={`flex-1 ${subtask.completed ? 'line-through' : ''}`}
                                style={{
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '0.875rem',
                                  color: subtask.completed ? 'var(--clarity-text-muted)' : 'var(--clarity-text-secondary)',
                                  fontWeight: '300',
                                  cursor: isEditing ? 'pointer' : 'default',
                                }}
                                onClick={() => {
                                  if (!isEditing) return;
                                  setEditingSubtask({ taskId: task.id, subtaskId: subtask.id });
                                  setEditingSubtaskValue(subtask.title);
                                }}
                              >
                                {subtask.title}
                              </span>
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

      {/* Bottom nav */}
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