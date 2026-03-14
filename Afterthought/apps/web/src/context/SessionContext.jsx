import { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([
    {
      id: 1,
      date: '2026-03-14',
      journalEntry: "Today was about finding balance between ambition and rest. I realized that pushing too hard doesn't always mean progress—sometimes the most productive thing is to pause and reflect. The tasks that felt overwhelming this morning now seem manageable after organizing them properly.",
      mood: 7,
      tasks: [
        {
          id: '1',
          title: 'Finish quarterly report',
          priority: 'urgent',
          category: 'Work',
          completed: false,
          subtasks: [
            { id: '1-1', title: 'Gather data from last quarter', completed: true },
            { id: '1-2', title: 'Create visualizations', completed: false },
            { id: '1-3', title: 'Write executive summary', completed: false },
          ]
        },
        {
          id: '2',
          title: 'Call mom',
          priority: 'high',
          category: 'Personal',
          completed: true,
          subtasks: []
        },
        {
          id: '3',
          title: 'Review design mockups',
          priority: 'medium',
          category: 'Work',
          completed: false,
          subtasks: [
            { id: '3-1', title: 'Check mobile layouts', completed: false },
            { id: '3-2', title: 'Provide feedback to designer', completed: false },
          ]
        },
        {
          id: '4',
          title: 'Meditate for 20 minutes',
          priority: 'low',
          category: 'Wellness',
          completed: false,
          subtasks: []
        },
        {
          id: '5',
          title: 'Prepare presentation slides',
          priority: 'high',
          category: 'Work',
          completed: false,
          subtasks: [
            { id: '5-1', title: 'Outline key points', completed: true },
            { id: '5-2', title: 'Add visuals', completed: false },
            { id: '5-3', title: 'Practice delivery', completed: false },
          ]
        },
      ],
      moodTags: ['focused', 'hopeful', 'balanced']
    },
    {
      id: 2,
      date: '2026-03-13',
      mood: 6,
      moodTags: ['calm', 'productive']
    },
    {
      id: 3,
      date: '2026-03-12',
      mood: 8,
      moodTags: ['energized', 'creative']
    },
    {
      id: 4,
      date: '2026-03-11',
      mood: 5,
      moodTags: ['tired', 'overwhelmed']
    },
    {
      id: 5,
      date: '2026-03-10',
      mood: 7,
      moodTags: ['balanced', 'grateful']
    },
    {
      id: 6,
      date: '2026-03-09',
      mood: 9,
      moodTags: ['joyful', 'accomplished']
    },
    {
      id: 7,
      date: '2026-03-08',
      mood: 6,
      moodTags: ['reflective', 'steady']
    },
  ]);

  const startSession = (input) => {
    setCurrentSession({
      input,
      tasks: [],
      isLoading: true,
    });
  };

  const completeSession = (tasks) => {
    setCurrentSession(prev => ({
      ...prev,
      tasks,
      isLoading: false,
    }));
  };

  const endSession = () => {
    setCurrentSession(null);
  };

  const toggleTaskComplete = (taskId) => {
    if (!currentSession) return;
    
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      ),
    }));
  };

  const toggleSubtaskComplete = (taskId, subtaskId) => {
    if (!currentSession) return;
    
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      ),
    }));
  };

  const moveTask = (taskId, newStatus) => {
    if (!currentSession) return;
    
    setCurrentSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      ),
    }));
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        sessionHistory,
        startSession,
        completeSession,
        endSession,
        toggleTaskComplete,
        toggleSubtaskComplete,
        moveTask,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
