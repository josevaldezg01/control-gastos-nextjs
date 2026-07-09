'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ClienteStreaming } from '@/hooks/useStreaming';

interface ClienteModalProps {
  cliente?: ClienteStreaming | null;
  onClose: () => void;
  onGuardar: (cliente: any) => Promise<void>;
}

export const ClienteModal = ({ cliente, onClose, onGuardar }: ClienteModalProps) => {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [email, setEmail] = useState(cliente?.email || '');
  const [notas, setNotas] = useState(cliente?.notas || '');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    setGuardando(true);
    try {
      const datosCliente = {
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        notas: notas.trim() || null
      };

      await onGuardar(datosCliente);
      onClose();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      alert('Error al guardar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-2xl font-bold mb-6">
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@example.com"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Información adicional..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none resize-none"
              rows={3}
            />
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
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
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
