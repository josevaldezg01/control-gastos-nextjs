'use client';

import { useStreaming } from '@/hooks/useStreaming';

interface ResumenTabProps {
  streaming: ReturnType<typeof useStreaming>;
}

export const ResumenTab = ({ streaming }: ResumenTabProps) => {
  const metricas = streaming.calcularMetricas();

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Cobrado */}
        <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-300 text-sm font-medium">Total Cobrado</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatoMoneda(metricas.totalCobrado)}
          </div>
        </div>

        {/* Total Gastado */}
        <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-300 text-sm font-medium">Total Gastado</span>
            <span className="text-2xl">💸</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatoMoneda(metricas.totalGastado)}
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className={`border-2 rounded-lg p-6 ${
          metricas.ganancia >= 0
            ? 'bg-blue-500/20 border-blue-500'
            : 'bg-orange-500/20 border-orange-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              metricas.ganancia >= 0 ? 'text-blue-300' : 'text-orange-300'
            }`}>
              Ganancia Neta
            </span>
            <span className="text-2xl">{metricas.ganancia >= 0 ? '📊' : '⚠️'}</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatoMoneda(metricas.ganancia)}
          </div>
          <div className="text-xs text-white/60 mt-1">
            {metricas.ganancia >= 0 ? 'Ganancia' : 'Pérdida'}
          </div>
        </div>
      </div>

      {/* Pendientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cobros Pendientes */}
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-300 text-sm font-medium">Cobros Pendientes</span>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold text-white">
              {metricas.cobrosPendientes}
            </div>
            <div className="text-lg text-white/80">
              ({formatoMoneda(metricas.montoPendiente)})
            </div>
          </div>
          <div className="text-xs text-white/60 mt-1">
            Clientes por cobrar
          </div>
        </div>

        {/* Pagos Pendientes */}
        <div className="bg-purple-500/20 border-2 border-purple-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm font-medium">Pagos Pendientes</span>
            <span className="text-2xl">📌</span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold text-white">
              {metricas.costosPendientes}
            </div>
            <div className="text-lg text-white/80">
              ({formatoMoneda(metricas.montoCostosPendiente)})
            </div>
          </div>
          <div className="text-xs text-white/60 mt-1">
            Servicios por pagar
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-white font-semibold text-lg mb-4">📈 Análisis del Mes</h3>
        <div className="space-y-3 text-white/80">
          <div className="flex justify-between items-center">
            <span>Cuentas activas:</span>
            <span className="font-semibold text-white">
              {streaming.cuentas.filter(c => c.activa).length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Clientes activos:</span>
            <span className="font-semibold text-white">
              {streaming.clientes.filter(c => c.activo).length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Suscripciones activas:</span>
            <span className="font-semibold text-white">
              {streaming.suscripciones.filter(s => s.activa).length}
            </span>
          </div>
          <div className="border-t border-white/20 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span>Tasa de cobro:</span>
              <span className="font-semibold text-white">
                {streaming.suscripciones.filter(s => s.activa).length > 0
                  ? Math.round(
                      ((streaming.suscripciones.filter(s => s.activa).length - metricas.cobrosPendientes) /
                        streaming.suscripciones.filter(s => s.activa).length) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
