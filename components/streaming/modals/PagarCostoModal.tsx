'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CuentaStreaming } from '@/hooks/useStreaming';

interface PagarCostoModalProps {
  cuenta: CuentaStreaming;
  bancos: string[];
  onClose: () => void;
  onPagar: (banco: string, fecha: string, notas: string) => Promise<void>;
}

export const PagarCostoModal = ({ cuenta, bancos, onClose, onPagar }: PagarCostoModalProps) => {
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
      await onPagar(banco, fecha, notas);
      onClose();
    } catch (error) {
      console.error('Error pagando costo:', error);
      alert('Error al registrar el pago');
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

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-2xl font-bold mb-6">💸 Registrar Pago a Servicio</h3>

        {/* Información del pago */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Servicio:</span>
              <span className="text-white font-semibold">{cuenta.servicio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Tipo de cuenta:</span>
              <span className="text-white">{cuenta.tipo_cuenta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Monto:</span>
              <span className="text-red-400 font-bold text-lg">
                {formatoMoneda(cuenta.costo_mensual)}
              </span>
            </div>
            {cuenta.dia_pago && (
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Día de pago:</span>
                <span className="text-white/80">
                  Día {cuenta.dia_pago} de cada mes
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Banco */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Banco desde donde se pagó *
            </label>
            <select
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
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
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
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
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none resize-none"
              rows={2}
            />
          </div>

          {/* Información */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-sm">
              ✓ Se creará un gasto de {formatoMoneda(cuenta.costo_mensual)} en {banco}
              <br />
              ✓ Este pago se registrará en el mes contable actual
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
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Registrando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
