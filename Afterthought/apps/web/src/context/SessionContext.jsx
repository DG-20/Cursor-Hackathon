import { createContext, useContext, useState } from 'react';
import { updateSessionTasks } from '../api/session';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};

function persistTasks(sessionId, tasks) {
  if (!sessionId) return;
  updateSessionTasks(sessionId, tasks).catch(err =>
    console.error('Failed to persist tasks:', err)
  );
}

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
      id: data?.id ?? null,
      tasks,
      journal: journal ?? prev?.journal ?? null,
      isLoading: false,
    }));
  };

  const setRestoredSession = (session) => {
    setCurrentSession({
      id: session.id,
      tasks: Array.isArray(session.tasks) ? session.tasks : [],
      journal: session.journal ?? null,
      isLoading: false,
    });
  };

  const endSession = () => setCurrentSession(null);

  const toggleTaskComplete = (taskId) => {
    if (!currentSession) return;
    setCurrentSession(prev => {
      const tasks = prev.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      persistTasks(prev.id, tasks);
      return { ...prev, tasks };
    });
  };

  const toggleSubtaskComplete = (taskId, subtaskId) => {
    if (!currentSession) return;
    setCurrentSession(prev => {
      const tasks = prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId
              ? { ...subtask, completed: !subtask.completed }
              : subtask
          ),
        } : task
      );
      persistTasks(prev.id, tasks);
      return { ...prev, tasks };
    });
  };

  const updateSubtaskTitle = (taskId, subtaskId, newTitle) => {
    if (!currentSession) return;
    setCurrentSession(prev => {
      const tasks = prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, title: newTitle } : subtask
          ),
        } : task
      );
      persistTasks(prev.id, tasks);
      return { ...prev, tasks };
    });
  };

  const deleteSubtask = (taskId, subtaskId) => {
    if (!currentSession) return;
    setCurrentSession(prev => {
      const tasks = prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.filter(s => s.id !== subtaskId),
        } : task
      );
      persistTasks(prev.id, tasks);
      return { ...prev, tasks };
    });
  };

  const addSubtask = (taskId, title) => {
    if (!currentSession) return;
    const newSubtask = {
      id: `${taskId}-${Date.now()}`,
      title,
      completed: false,
    };
    setCurrentSession(prev => {
      const tasks = prev.tasks.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtask],
        } : task
      );
      persistTasks(prev.id, tasks);
      return { ...prev, tasks };
    });
  };

  const moveTask = (taskId, newStatus) => {
    if (!currentSession) return;
    setCurrentSession(prev => {
      const tasks = prev.tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      persistTasks(prev.id, tasks);
      return { ...prev, tasks };
    });
  };

  return (
    <SessionContext.Provider value={{
      currentSession,
      startSession,
      completeSession,
      setRestoredSession,
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