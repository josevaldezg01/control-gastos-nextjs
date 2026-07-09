'use client';

import { useState } from 'react';
import { useStreaming } from '@/hooks/useStreaming';
import { CuentaModal } from './modals/CuentaModal';

interface CuentasTabProps {
  streaming: ReturnType<typeof useStreaming>;
}

export const CuentasTab = ({ streaming }: CuentasTabProps) => {
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState<any>(null);

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const abrirModal = (cuenta?: any) => {
    setCuentaEditando(cuenta || null);
    setMostrandoModal(true);
  };

  const cerrarModal = () => {
    setCuentaEditando(null);
    setMostrandoModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🎬 Cuentas de Streaming</h2>
        <button
          onClick={() => abrirModal()}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
        >
          ➕ Agregar Cuenta
        </button>
      </div>

      {/* Lista de cuentas */}
      {streaming.cuentas.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-white/60 text-lg">No hay cuentas registradas</p>
          <p className="text-white/40 text-sm mt-2">Agrega tu primera cuenta de streaming</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streaming.cuentas.map((cuenta) => {
            const espacios = streaming.getEspaciosDisponibles(cuenta.id);
            const porcentajeOcupacion = espacios.total > 0 ? (espacios.ocupados / espacios.total) * 100 : 0;

            return (
              <div
                key={cuenta.id}
                className={`bg-white/10 rounded-lg p-6 border-2 transition-all hover:scale-105 ${
                  cuenta.activa ? 'border-blue-500' : 'border-gray-500 opacity-60'
                }`}
              >
                {/* Servicio */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {cuenta.servicio === 'Netflix' && '🎬'}
                      {cuenta.servicio === 'Prime Video' && '📺'}
                      {cuenta.servicio === 'Disney+' && '🏰'}
                      {cuenta.servicio === 'HBO Max' && '🎭'}
                      {cuenta.servicio === 'YouTube Premium' && '▶️'}
                    </span>
                    <span className="text-white font-semibold">{cuenta.servicio}</span>
                  </div>
                  {!cuenta.activa && (
                    <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded">
                      Inactiva
                    </span>
                  )}
                </div>

                {/* Tipo de cuenta */}
                <div className="text-white/80 text-sm mb-2">{cuenta.tipo_cuenta}</div>

                {/* Costo */}
                <div className="text-2xl font-bold text-white mb-3">
                  {formatoMoneda(cuenta.costo_mensual)}/mes
                </div>

                {/* Día de pago */}
                {cuenta.dia_pago && (
                  <div className="text-white/60 text-sm mb-3">
                    📅 Paga día {cuenta.dia_pago} de cada mes
                  </div>
                )}

                {/* Ocupación */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Espacios ocupados</span>
                    <span>{espacios.ocupados}/{espacios.total}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        porcentajeOcupacion === 100
                          ? 'bg-red-500'
                          : porcentajeOcupacion >= 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${porcentajeOcupacion}%` }}
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModal(cuenta)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded text-sm font-medium transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta cuenta?')) {
                        streaming.eliminarCuenta(cuenta.id);
                      }
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded text-sm font-medium transition-all"
                  >
                    🗑️
                  </button>
                </div>

                {/* Notas */}
                {cuenta.notas && (
                  <div className="mt-3 text-white/60 text-xs border-t border-white/10 pt-3">
                    💬 {cuenta.notas}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {mostrandoModal && (
        <CuentaModal
          cuenta={cuentaEditando}
          onClose={cerrarModal}
          onGuardar={async (datos) => {
            if (cuentaEditando) {
              await streaming.actualizarCuenta(cuentaEditando.id, datos);
            } else {
              await streaming.agregarCuenta(datos);
            }
          }}
        />
      )}
    </div>
  );
};
