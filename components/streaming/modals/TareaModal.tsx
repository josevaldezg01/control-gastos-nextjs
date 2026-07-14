'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStreaming, TareaStreaming } from '@/hooks/useStreaming';

interface TareaModalProps {
  streaming: ReturnType<typeof useStreaming>;
  tarea?: TareaStreaming | null;
  clienteIdPreset?: number;
  cuentaIdPreset?: number;
  onClose: () => void;
}

export const TareaModal = ({ streaming, tarea, clienteIdPreset, cuentaIdPreset, onClose }: TareaModalProps) => {
  const [descripcion, setDescripcion] = useState(tarea?.descripcion || '');
  const [clienteId, setClienteId] = useState<number>(tarea?.cliente_id || clienteIdPreset || 0);
  const [cuentaId, setCuentaId] = useState<number>(tarea?.cuenta_id || cuentaIdPreset || 0);
  const [guardando, setGuardando] = useState(false);

  const clientesActivos = streaming.clientes.filter(c => c.activo);
  const cuentasActivas = streaming.cuentas.filter(c => c.activa);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim()) {
      alert('Por favor describe la tarea');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        descripcion: descripcion.trim(),
        cliente_id: clienteId || null,
        cuenta_id: cuentaId || null
      };
      if (tarea) {
        await streaming.actualizarTarea(tarea.id, datos);
      } else {
        await streaming.agregarTarea(datos);
      }
      onClose();
    } catch (error) {
      console.error('Error guardando tarea:', error);
      alert('Error al guardar la tarea');
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-2xl font-bold mb-6">📌 {tarea ? 'Editar Tarea' : 'Nueva Tarea'}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Descripción *
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cambiar a Marianna de 2 a 1 pantalla"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
              required
              autoFocus
            />
          </div>

          {/* Cliente (opcional) */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Cliente (opcional)
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              <option value={0}>Sin cliente</option>
              {clientesActivos.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cuenta (opcional) */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Cuenta (opcional)
            </label>
            <select
              value={cuentaId}
              onChange={(e) => setCuentaId(parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              <option value={0}>Sin cuenta</option>
              {cuentasActivas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.servicio} - {cuenta.tipo_cuenta} — {cuenta.email || 'sin correo'}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
