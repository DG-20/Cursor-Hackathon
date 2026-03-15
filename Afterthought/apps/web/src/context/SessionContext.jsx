import { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);

  const startSession = (input) => {
    setCurrentSession({ input, tasks: [], isLoading: true });
  };

  const completeSession = (data) => {
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
    const journal = data?.journal && typeof data.journal === 'object' ? data.journal : null;
    setCurrentSession(prev => ({
      ...prev,
      id: data?.id ?? null, // ← store the session id
      tasks,
      journal: journal ?? prev?.journal ?? null,
      isLoading: false,
    }));
  };

  const endSession = () => setCurrentSession(null);

  const toggleTaskComplete = (taskId) => {
    if (!currentSession) return;
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const toggleSubtaskComplete = (taskId, subtaskId) => {
    if (!currentSession) return;
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId
              ? { ...subtask, completed: !subtask.completed }
              : subtask
          ),
        } : task
      ),
    }));
  };

  const updateSubtaskTitle = (taskId, subtaskId, newTitle) => {
    if (!currentSession) return;
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, title: newTitle } : subtask
          ),
        } : task
      ),
    }));
  };

  const deleteSubtask = (taskId, subtaskId) => {
    if (!currentSession) return;
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.filter(s => s.id !== subtaskId),
        } : task
      ),
    }));
  };

  const addSubtask = (taskId, title) => {
    if (!currentSession) return;
    const newSubtask = {
      id: `${taskId}-${Date.now()}`,
      title,
      completed: false,
    };
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtask],
        } : task
      ),
    }));
  };

  const moveTask = (taskId, newStatus) => {
    if (!currentSession) return;
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    }));
  };

  return (
    <SessionContext.Provider value={{
      currentSession,
      startSession,
      completeSession,
      endSession,
      toggleTaskComplete,
      toggleSubtaskComplete,
      updateSubtaskTitle,
      deleteSubtask,
      addSubtask,
      moveTask,
    }}>
      {children}
    </SessionContext.Provider>
  );
};