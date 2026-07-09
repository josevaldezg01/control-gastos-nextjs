'use client';

import { createPortal } from 'react-dom';
import { CuentaStreaming } from '@/hooks/useStreaming';

interface DetalleCuentaModalProps {
  cuenta: CuentaStreaming;
  suscripcionesActivas: any[];
  onClose: () => void;
}

export const DetalleCuentaModal = ({ cuenta, suscripcionesActivas, onClose }: DetalleCuentaModalProps) => {
  const ingresos = suscripcionesActivas.reduce((sum, s) => sum + s.costo_mensual, 0);
  const ganancia = ingresos - cuenta.costo_mensual;
  const espaciosOcupados = suscripcionesActivas.length;
  let espaciosTotales = 1;
  const tipoCuenta = cuenta.tipo_cuenta.toLowerCase();

  if (tipoCuenta.includes('1 pantalla')) {
    espaciosTotales = 1;
  } else if (tipoCuenta.includes('2 pantallas')) {
    espaciosTotales = 2;
  } else if (tipoCuenta.includes('4 pantallas')) {
    espaciosTotales = 4;
  } else if (tipoCuenta.includes('5 perfiles')) {
    espaciosTotales = 5;
  } else if (tipoCuenta.includes('premium')) {
    espaciosTotales = 6;
  }

  const porcentajeOcupado = (espaciosOcupados / espaciosTotales) * 100;

  const formatoMoneda = (valor: number) => {
    return `$${valor.toLocaleString()}`;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-2xl font-bold">Detalles de Cuenta</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Servicio */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">
              {cuenta.servicio === 'Netflix' && '🎬'}
              {cuenta.servicio === 'Prime Video' && '📺'}
              {cuenta.servicio === 'Disney+' && '🏰'}
              {cuenta.servicio === 'HBO Max' && '🎭'}
              {cuenta.servicio === 'YouTube Premium' && '▶️'}
            </span>
            <div>
              <div className="text-white font-bold text-xl">{cuenta.servicio}</div>
              <div className="text-white/60 text-sm">{cuenta.tipo_cuenta}</div>
              {cuenta.email && (
                <div className="text-purple-300 text-xs font-mono mt-1">✉️ {cuenta.email}</div>
              )}
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="space-y-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white/60 text-sm mb-1">Costo mensual</div>
            <div className="text-white font-bold text-2xl">
              {formatoMoneda(cuenta.costo_mensual)}
            </div>
          </div>

          {cuenta.dia_pago && (
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Día de pago</div>
              <div className="text-white font-semibold">
                Día {cuenta.dia_pago} de cada mes
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm mb-1">Rentabilidad</div>
              <div className="text-white/60 text-xs">Cobrado {formatoMoneda(ingresos)} − Costo {formatoMoneda(cuenta.costo_mensual)}</div>
            </div>
            <div className={`font-bold text-xl ${ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {ganancia >= 0 ? '+' : ''}{formatoMoneda(ganancia)}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white/60 text-sm mb-2">Espacios ocupados</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    porcentajeOcupado === 100
                      ? 'bg-green-500'
                      : porcentajeOcupado === 0
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${porcentajeOcupado}%` }}
                />
              </div>
              <div className="text-white font-semibold">
                {espaciosOcupados}/{espaciosTotales}
              </div>
            </div>
          </div>
        </div>

        {/* Suscripciones activas */}
        {suscripcionesActivas.length > 0 && (
          <div className="mb-6">
            <div className="text-white/80 font-semibold mb-2">
              Clientes ({suscripcionesActivas.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suscripcionesActivas.map((suscripcion) => (
                <div
                  key={suscripcion.id}
                  className="bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">
                        {suscripcion.cliente?.nombre}
                      </div>
                      <div className="text-white/60 text-xs">
                        {suscripcion.tipo_acceso}
                      </div>
                      {suscripcion.email_acceso && (
                        <div className="text-purple-300 text-xs font-mono mt-0.5">
                          ✉️ {suscripcion.email_acceso}
                        </div>
                      )}
                    </div>
                    <div className="text-white/80 font-semibold">
                      {formatoMoneda(suscripcion.costo_mensual)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        {cuenta.notas && (
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="text-white/60 text-sm mb-1">Notas</div>
            <div className="text-white/80 text-sm">{cuenta.notas}</div>
          </div>
        )}

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
};
