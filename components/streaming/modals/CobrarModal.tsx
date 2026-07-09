'use client';

import { useState } from 'react';
import { Suscripcion } from '@/hooks/useStreaming';

interface CobrarModalProps {
  suscripcion: Suscripcion;
  bancos: string[];
  onClose: () => void;
  onCobrar: (banco: string, fecha: string, notas: string) => Promise<void>;
}

export const CobrarModal = ({ suscripcion, bancos, onClose, onCobrar }: CobrarModalProps) => {
  const [banco, setBanco] = useState(bancos[0] || 'Nequi');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!banco || !fecha) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setGuardando(true);
    try {
      await onCobrar(banco, fecha, notas);
      onClose();
    } catch (error) {
      console.error('Error cobrando:', error);
      alert('Error al registrar el cobro');
    } finally {
      setGuardando(false);
    }
  };

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-2xl font-bold mb-6">💰 Registrar Cobro</h3>

        {/* Información del cobro */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Cliente:</span>
              <span className="text-white font-semibold">{suscripcion.cliente?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Servicio:</span>
              <span className="text-white">{suscripcion.cuenta?.servicio} - {suscripcion.tipo_acceso}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Monto:</span>
              <span className="text-green-400 font-bold text-lg">
                {formatoMoneda(suscripcion.costo_mensual)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Fecha vencimiento:</span>
              <span className="text-white/80">
                {new Date(suscripcion.proximo_cobro).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Banco */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Banco donde se recibió *
            </label>
            <select
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
              required
            >
              {bancos.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Fecha de pago *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
              required
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
              rows={2}
            />
          </div>

          {/* Información */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              ✓ Se creará un ingreso de {formatoMoneda(suscripcion.costo_mensual)} en {banco}
              <br />
              ✓ El próximo cobro se actualizará automáticamente al próximo mes
            </p>
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
              {guardando ? 'Registrando...' : 'Confirmar Cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
