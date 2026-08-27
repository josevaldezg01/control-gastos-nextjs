'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Suscripcion } from '@/hooks/useStreaming';

interface CobroOverride {
  monto: number;
  proximoCobro: string;
}

interface CobrarModalProps {
  suscripciones: Suscripcion[];
  bancos: string[];
  onClose: () => void;
  onCobrar: (banco: string, fecha: string, notas: string, overrides?: Record<number, CobroOverride>) => Promise<void>;
}

// Fecha de próximo cobro que quedaría por defecto (mes calendario siguiente al vencimiento actual)
const proximoMesDefault = (fechaBase: string): string => {
  const f = new Date(fechaBase);
  f.setMonth(f.getMonth() + 1);
  return f.toISOString().split('T')[0];
};

export const CobrarModal = ({ suscripciones, bancos, onClose, onCobrar }: CobrarModalProps) => {
  const primera = suscripciones[0];
  const esGrupo = suscripciones.length > 1;
  const [banco, setBanco] = useState(bancos[0] || 'Nequi');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [pagoAdelantado, setPagoAdelantado] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, { monto: string; proximoCobro: string }>>(() =>
    Object.fromEntries(
      suscripciones.map(s => [s.id, { monto: s.costo_mensual.toString(), proximoCobro: proximoMesDefault(s.proximo_cobro) }])
    )
  );

  const actualizarOverride = (id: number, campo: 'monto' | 'proximoCobro', valor: string) => {
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const montoTotal = pagoAdelantado
    ? suscripciones.reduce((sum, s) => sum + (parseFloat(overrides[s.id]?.monto) || 0), 0)
    : suscripciones.reduce((sum, s) => sum + s.costo_mensual, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!banco || !fecha) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (pagoAdelantado) {
      for (const s of suscripciones) {
        const o = overrides[s.id];
        if (!o?.monto || parseFloat(o.monto) < 0 || !o?.proximoCobro) {
          alert('Completa el monto y la próxima fecha de cobro de cada servicio');
          return;
        }
      }
    }

    setGuardando(true);
    try {
      const overridesFinal = pagoAdelantado
        ? Object.fromEntries(
            suscripciones.map(s => [s.id, { monto: parseFloat(overrides[s.id].monto), proximoCobro: overrides[s.id].proximoCobro }])
          )
        : undefined;
      await onCobrar(banco, fecha, notas, overridesFinal);
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

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-2xl font-bold mb-6">
          💰 {esGrupo ? `Registrar Cobro (${suscripciones.length} servicios)` : 'Registrar Cobro'}
        </h3>

        {/* Información del cobro */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Cliente:</span>
              <span className="text-white font-semibold">{primera.cliente?.nombre}</span>
            </div>

            {!esGrupo && !pagoAdelantado && (
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Servicio:</span>
                <span className="text-white">{primera.cuenta?.servicio} - {primera.tipo_acceso}</span>
              </div>
            )}

            {esGrupo && !pagoAdelantado && (
              <div className="space-y-1 py-1">
                {suscripciones.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-white/60">{s.cuenta?.servicio} - {s.tipo_acceso}</span>
                    <span className="text-white/80">{formatoMoneda(s.costo_mensual)}</span>
                  </div>
                ))}
              </div>
            )}

            {!pagoAdelantado && (
              <>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">{esGrupo ? 'Monto total:' : 'Monto:'}</span>
                  <span className="text-green-400 font-bold text-lg">
                    {formatoMoneda(montoTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Fecha vencimiento:</span>
                  <span className="text-white/80">
                    {new Date(primera.proximo_cobro).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pago adelantado: monto y próxima fecha de cobro editables por servicio */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={pagoAdelantado}
              onChange={(e) => setPagoAdelantado(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-white/80 text-sm font-medium">
              💡 Pagó un valor o número de meses distinto (adelantado)
            </span>
          </label>

          {pagoAdelantado && (
            <div className="space-y-3">
              {suscripciones.map((s) => (
                <div key={s.id} className="bg-white/5 rounded-lg p-3 space-y-2">
                  <div className="text-white/70 text-xs font-semibold">
                    {s.cuenta?.servicio} - {s.tipo_acceso}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-white/50 text-xs mb-1">Monto cobrado</label>
                      <input
                        type="number"
                        value={overrides[s.id]?.monto ?? ''}
                        onChange={(e) => actualizarOverride(s.id, 'monto', e.target.value)}
                        className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-green-500 focus:outline-none text-sm"
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs mb-1">Próximo cobro</label>
                      <input
                        type="date"
                        value={overrides[s.id]?.proximoCobro ?? ''}
                        onChange={(e) => actualizarOverride(s.id, 'proximoCobro', e.target.value)}
                        className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-green-500 focus:outline-none text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <span className="text-white/60 text-sm">{esGrupo ? 'Monto total:' : 'Monto:'}</span>
                <span className="text-green-400 font-bold text-lg">{formatoMoneda(montoTotal)}</span>
              </div>
            </div>
          )}
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
              ✓ Se {esGrupo ? `crearán ${suscripciones.length} ingresos (total ${formatoMoneda(montoTotal)})` : `creará un ingreso de ${formatoMoneda(montoTotal)}`} en {banco}
              <br />
              {pagoAdelantado
                ? `✓ El próximo cobro de ${esGrupo ? 'cada servicio' : 'este servicio'} quedará en la fecha que indicaste arriba`
                : `✓ El próximo cobro de ${esGrupo ? 'cada servicio' : 'este servicio'} se actualizará automáticamente al próximo mes`}
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
    </div>,
    document.body
  );
};
