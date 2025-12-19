'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, StickyNote, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotesFlow } from '@/hooks/useNotesFlow';
import { Button } from '@/components/ui';

type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';
type TaskTab = 'pending' | 'completed';

export const NotesFlow: React.FC = () => {
  const router = useRouter();
  const {
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
  } = useNotesFlow();

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');
  const [currentTaskTab, setCurrentTaskTab] = useState<TaskTab>('pending');
  const [taskInput, setTaskInput] = useState('');

  const colors: { name: NoteColor; class: string; bg: string }[] = [
    { name: 'yellow', class: 'bg-yellow-200', bg: '#ffd54f' },
    { name: 'pink', class: 'bg-pink-200', bg: '#f48fb1' },
    { name: 'blue', class: 'bg-blue-200', bg: '#81d4fa' },
    { name: 'green', class: 'bg-green-200', bg: '#a5d6a7' },
    { name: 'orange', class: 'bg-orange-200', bg: '#ffb74d' },
    { name: 'purple', class: 'bg-purple-200', bg: '#ce93d8' },
  ];

  const openNoteModal = (noteId?: string) => {
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setEditingNoteId(noteId);
        setNoteContent(note.content);
        setSelectedColor(note.color as NoteColor);
      }
    } else {
      setEditingNoteId(null);
      setNoteContent('');
      setSelectedColor('yellow');
    }
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setEditingNoteId(null);
    setNoteContent('');
    setSelectedColor('yellow');
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    if (editingNoteId) {
      await updateNote(editingNoteId, noteContent, selectedColor);
    } else {
      await addNote(noteContent, selectedColor);
    }
    closeNoteModal();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      await deleteNote(noteId);
    }
  };

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;
    await addTask(taskInput);
    setTaskInput('');
  };

  const handleTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const filteredTasks = tasks.filter(task =>
    currentTaskTab === 'pending' ? !task.completed : task.completed
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <StickyNote className="w-10 h-10" />
          </div>
          <p className="text-lg font-medium">Cargando NotesFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              📝 Mis Notas y Tareas
            </h1>
            <p className="text-white/60 text-sm mt-1">by Jose Valdez</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-white text-sm">
              {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Sticky Notes Section */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <StickyNote className="w-6 h-6" />
              Notas Adhesivas
            </h2>
            <Button
              onClick={() => openNoteModal()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Nota
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className={`p-5 rounded-xl shadow-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-0 min-h-[150px] relative ${
                  index % 2 === 0 ? '-rotate-1' : 'rotate-1'
                }`}
                style={{ backgroundColor: colors.find(c => c.name === note.color)?.bg || '#ffd54f' }}
                onClick={() => openNoteModal(note.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-all opacity-80 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-800">
                  {note.content}
                </p>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center py-16 text-white/70">
              <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No hay notas aún. ¡Crea tu primera nota!</p>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckSquare className="w-6 h-6" />
              Mis Tareas
            </h2>
            <Button
              onClick={() => document.getElementById('task-input')?.focus()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-gray-200 mb-6">
            <button
              onClick={() => setCurrentTaskTab('pending')}
              className={`px-6 py-3 font-semibold transition-all ${
                currentTaskTab === 'pending'
                  ? 'text-purple-600 border-b-3 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setCurrentTaskTab('completed')}
              className={`px-6 py-3 font-semibold transition-all ${
                currentTaskTab === 'completed'
                  ? 'text-purple-600 border-b-3 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completadas
            </button>
          </div>

          {/* Task Input */}
          <div className="flex gap-3 mb-6">
            <input
              id="task-input"
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={handleTaskKeyPress}
              placeholder="Escribe una nueva tarea..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
            />
            <Button
              onClick={handleAddTask}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg"
            >
              Agregar
            </Button>
          </div>

          {/* Tasks List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {currentTaskTab === 'pending' ? (
                  <>
                    <p className="text-4xl mb-4">🎉</p>
                    <p className="text-lg">¡No tienes tareas pendientes!</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl mb-4">📝</p>
                    <p className="text-lg">No hay tareas completadas aún</p>
                  </>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow-md transition-all hover:shadow-lg hover:translate-x-2 ${
                    task.completed ? 'opacity-70' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 cursor-pointer accent-green-500"
                  />
                  <span className={`flex-1 text-base ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {task.content}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                        deleteTask(task.id);
                      }
                    }}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeNoteModal}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">✏️ Nota</h3>
              <button
                onClick={closeNoteModal}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                &times;
              </button>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg resize-y focus:outline-none focus:border-purple-600 transition-all text-gray-800"
              autoFocus
            />

            <div className="flex gap-3 my-6">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-12 h-12 rounded-full transition-all hover:scale-110 ${
                    selectedColor === color.name ? 'ring-4 ring-gray-800 scale-110' : 'ring-2 ring-transparent'
                  }`}
                  style={{ backgroundColor: color.bg }}
                />
              ))}
            </div>

            <Button
              onClick={handleSaveNote}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold text-lg"
            >
              Guardar Nota
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
