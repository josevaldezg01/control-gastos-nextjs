import { useState, useEffect } from 'react';
import { notesFlowHelpers } from '@/lib/supabase';

export interface Note {
  id: string;
  content: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  created_at: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export const useNotesFlow = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  // Check connection and load data
  const loadData = async () => {
    try {
      setConnectionStatus('checking');
      const [notesData, tasksData] = await Promise.all([
        notesFlowHelpers.getNotes(),
        notesFlowHelpers.getTasks()
      ]);

      setNotes(notesData);
      setTasks(tasksData);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error loading data:', error);
      setConnectionStatus('disconnected');

      // Fallback to localStorage
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // LocalStorage fallback functions
  const loadFromLocalStorage = () => {
    try {
      const localNotes = localStorage.getItem('notesflow_notes');
      const localTasks = localStorage.getItem('notesflow_tasks');

      if (localNotes) setNotes(JSON.parse(localNotes));
      if (localTasks) setTasks(JSON.parse(localTasks));
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const saveToLocalStorage = (notes: Note[], tasks: Task[]) => {
    try {
      localStorage.setItem('notesflow_notes', JSON.stringify(notes));
      localStorage.setItem('notesflow_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Notes functions
  const addNote = async (content: string, color: string) => {
    try {
      if (connectionStatus === 'connected') {
        const newNote = await notesFlowHelpers.addNote(content, color);
        setNotes(prev => [newNote, ...prev]);
        saveToLocalStorage([newNote, ...notes], tasks);
      } else {
        // Local only
        const newNote: Note = {
          id: Date.now().toString(),
          content,
          color,
          created_at: new Date().toISOString()
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        saveToLocalStorage(updatedNotes, tasks);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      // Fallback to local
      const newNote: Note = {
        id: Date.now().toString(),
        content,
        color,
        created_at: new Date().toISOString()
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes, tasks);
    }
  };

  const updateNote = async (id: string, content: string, color: string) => {
    try {
      if (connectionStatus === 'connected') {
        await notesFlowHelpers.updateNote(id, content, color);
      }

      const updatedNotes = notes.map(note =>
        note.id === id ? { ...note, content, color } : note
      );
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes, tasks);
    } catch (error) {
      console.error('Error updating note:', error);
      // Still update locally
      const updatedNotes = notes.map(note =>
        note.id === id ? { ...note, content, color } : note
      );
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes, tasks);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      if (connectionStatus === 'connected') {
        await notesFlowHelpers.deleteNote(id);
      }

      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes, tasks);
    } catch (error) {
      console.error('Error deleting note:', error);
      // Still delete locally
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes, tasks);
    }
  };

  // Tasks functions
  const addTask = async (content: string) => {
    try {
      if (connectionStatus === 'connected') {
        const newTask = await notesFlowHelpers.addTask(content);
        setTasks(prev => [newTask, ...prev]);
        saveToLocalStorage(notes, [newTask, ...tasks]);
      } else {
        // Local only
        const newTask: Task = {
          id: Date.now().toString(),
          content,
          completed: false,
          created_at: new Date().toISOString()
        };
        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);
        saveToLocalStorage(notes, updatedTasks);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      // Fallback to local
      const newTask: Task = {
        id: Date.now().toString(),
        content,
        completed: false,
        created_at: new Date().toISOString()
      };
      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      saveToLocalStorage(notes, updatedTasks);
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const newCompleted = !task.completed;

      if (connectionStatus === 'connected') {
        await notesFlowHelpers.updateTask(id, { completed: newCompleted });
      }

      const updatedTasks = tasks.map(t =>
        t.id === id ? { ...t, completed: newCompleted } : t
      );
      setTasks(updatedTasks);
      saveToLocalStorage(notes, updatedTasks);
    } catch (error) {
      console.error('Error toggling task:', error);
      // Still update locally
      const updatedTasks = tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);
      saveToLocalStorage(notes, updatedTasks);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (connectionStatus === 'connected') {
        await notesFlowHelpers.deleteTask(id);
      }

      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      saveToLocalStorage(notes, updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Still delete locally
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      saveToLocalStorage(notes, updatedTasks);
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Initial load
  useEffect(() => {
    loadData();

    // Retry connection every 30 seconds if disconnected
    const intervalId = setInterval(() => {
      if (connectionStatus === 'disconnected') {
        loadData();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return {
    notes,
    tasks,
    loading,
    connectionStatus,
    addNote,
    updateNote,
    deleteNote,
    addTask,
    toggleTask,
    deleteTask,
    refreshData
  };
};
