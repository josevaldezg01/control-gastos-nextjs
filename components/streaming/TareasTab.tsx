'use client';

import { useState } from 'react';
import { useStreaming } from '@/hooks/useStreaming';
import { TareaModal } from './modals/TareaModal';

interface TareasTabProps {
  streaming: ReturnType<typeof useStreaming>;
}

export const TareasTab = ({ streaming }: TareasTabProps) => {
  const [vista, setVista] = useState<'pendientes' | 'completadas'>('pendientes');
  const [mostrandoModal, setMostrandoModal] = useState(false);

  const pendientes = streaming.tareas.filter(t => !t.completada);
  const completadas = streaming.tareas.filter(t => t.completada);
  const lista = vista === 'pendientes' ? pendientes : completadas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">📌 Tareas</h2>
        <button
          onClick={() => setMostrandoModal(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
        >
          ➕ Nueva Tarea
        </button>
      </div>

      {/* Tabs Vista */}
      <div className="flex gap-2">
        <button
          onClick={() => setVista('pendientes')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vista === 'pendientes'
              ? 'bg-yellow-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          ⏳ Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setVista('completadas')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vista === 'completadas'
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          ✅ Completadas ({completadas.length})
        </button>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📌</div>
          <p className="text-white/60 text-lg">
            {vista === 'pendientes' ? 'No hay tareas pendientes' : 'No hay tareas completadas'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((tarea) => (
            <div
              key={tarea.id}
              className={`bg-white/10 rounded-lg p-4 border-2 flex items-start justify-between gap-4 ${
                tarea.completada ? 'border-green-500/50 opacity-70' : 'border-yellow-500'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-white ${tarea.completada ? 'line-through' : ''}`}>
                  {tarea.descripcion}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/60">
                  {tarea.cliente && (
                    <span>👤 {tarea.cliente.nombre}</span>
                  )}
                  {tarea.cuenta && (
                    <span>
                      {tarea.cuenta.servicio}
                      {tarea.cuenta.email && ` — ✉️ ${tarea.cuenta.email}`}
                    </span>
                  )}
                  <span>
                    {tarea.completada && tarea.fecha_completada
                      ? `Completada: ${new Date(tarea.fecha_completada).toLocaleDateString()}`
                      : `Creada: ${new Date(tarea.fecha_creacion).toLocaleDateString()}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {tarea.completada ? (
                  <button
                    onClick={() => streaming.reabrirTarea(tarea.id)}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-2 rounded text-sm font-medium transition-all"
                    title="Reabrir tarea"
                  >
                    ↩️ Reabrir
                  </button>
                ) : (
                  <button
                    onClick={() => streaming.completarTarea(tarea.id)}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-2 rounded text-sm font-medium transition-all"
                    title="Marcar como completada"
                  >
                    ✅ Completar
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta tarea?')) {
                      streaming.eliminarTarea(tarea.id);
                    }
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded text-sm font-medium transition-all"
                  title="Eliminar tarea"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {mostrandoModal && (
        <TareaModal
          streaming={streaming}
          onClose={() => setMostrandoModal(false)}
        />
      )}
    </div>
  );
};
