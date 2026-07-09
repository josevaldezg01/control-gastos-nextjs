'use client';

import { useState } from 'react';
import { useStreaming, CuentaStreaming } from '@/hooks/useStreaming';
import { BANCOS } from '@/lib/types';
import { PagarCostoModal } from './modals/PagarCostoModal';

interface CostosTabProps {
  streaming: ReturnType<typeof useStreaming>;
  mesActivo: string;
}

export const CostosTab = ({ streaming, mesActivo }: CostosTabProps) => {
  const [vista, setVista] = useState<'pendientes' | 'pagados'>('pendientes');
  const [cuentaAPagar, setCuentaAPagar] = useState<CuentaStreaming | null>(null);

  const costosPendientes = streaming.getCostosPendientes();
  const costosPagados = streaming.costos;

  const formatoMoneda = (valor: number) => {
    return `$${valor.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">💸 Pagos a Servicios</h2>
      </div>

      {/* Tabs Vista */}
      <div className="flex gap-2">
        <button
          onClick={() => setVista('pendientes')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vista === 'pendientes'
              ? 'bg-purple-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          ⏳ Pendientes ({costosPendientes.length})
        </button>
        <button
          onClick={() => setVista('pagados')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vista === 'pagados'
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          ✅ Pagados ({costosPagados.length})
        </button>
      </div>

      {/* Lista Pendientes */}
      {vista === 'pendientes' && (
        <div className="space-y-4">
          {costosPendientes.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white/60 text-lg">Todos los costos están pagados</p>
            </div>
          ) : (
            costosPendientes.map((cuenta) => (
              <div
                key={cuenta.id}
                className="bg-white/10 rounded-lg p-6 border-2 border-purple-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {cuenta.servicio === 'Netflix' && '🎬'}
                        {cuenta.servicio === 'Prime Video' && '📺'}
                        {cuenta.servicio === 'Disney+' && '🏰'}
                        {cuenta.servicio === 'HBO Max' && '🎭'}
                        {cuenta.servicio === 'YouTube Premium' && '▶️'}
                      </span>
                      <div>
                        <div className="text-white font-semibold text-lg">
                          {cuenta.servicio}
                        </div>
                        <div className="text-white/60 text-sm">
                          {cuenta.tipo_cuenta}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 mt-4">
                      <div>
                        <div className="text-white/60 text-sm">Monto</div>
                        <div className="text-white font-bold text-xl">
                          {formatoMoneda(cuenta.costo_mensual)}
                        </div>
                      </div>
                      {cuenta.dia_pago && (
                        <div>
                          <div className="text-white/60 text-sm">Día de pago</div>
                          <div className="text-white">
                            Día {cuenta.dia_pago} de cada mes
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setCuentaAPagar(cuenta)}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
                  >
                    💸 Pagar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lista Pagados */}
      {vista === 'pagados' && (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          {costosPagados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💸</div>
              <p className="text-white/60 text-lg">No hay pagos registrados este mes</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Servicio</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Tipo Cuenta</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Monto</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Fecha</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Banco</th>
                </tr>
              </thead>
              <tbody>
                {costosPagados.map((costo, index) => (
                  <tr
                    key={costo.id}
                    className={`border-b border-white/10 ${
                      index % 2 === 0 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-white">{costo.servicio}</td>
                    <td className="px-4 py-3 text-white/80">{costo.tipo_cuenta}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold">
                      {formatoMoneda(costo.monto)}
                    </td>
                    <td className="px-4 py-3 text-white/80 text-sm">
                      {new Date(costo.fecha_pago).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-white/80">{costo.banco_origen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de Pagar */}
      {cuentaAPagar && (
        <PagarCostoModal
          cuenta={cuentaAPagar}
          bancos={BANCOS}
          onClose={() => setCuentaAPagar(null)}
          onPagar={async (banco, fecha, notas) => {
            await streaming.pagarCosto(cuentaAPagar, banco, fecha, notas);
          }}
        />
      )}
    </div>
  );
};
