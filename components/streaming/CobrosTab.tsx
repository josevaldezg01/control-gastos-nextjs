'use client';

import { useState } from 'react';
import { useStreaming, Suscripcion } from '@/hooks/useStreaming';
import { BANCOS } from '@/lib/types';
import { CobrarModal } from './modals/CobrarModal';

interface CobrosTabProps {
  streaming: ReturnType<typeof useStreaming>;
  mesActivo: string;
}

export const CobrosTab = ({ streaming, mesActivo }: CobrosTabProps) => {
  const [vista, setVista] = useState<'pendientes' | 'cobrados'>('pendientes');
  const [suscripcionACobrar, setSuscripcionACobrar] = useState<Suscripcion | null>(null);

  const cobrosPendientes = streaming.getSuscripcionesPendientes();
  const cobrosCobrados = streaming.pagos;

  const formatoMoneda = (valor: number) => {
    return `$${valor.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">💰 Cobros del Mes</h2>
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
          ⏳ Pendientes ({cobrosPendientes.length})
        </button>
        <button
          onClick={() => setVista('cobrados')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vista === 'cobrados'
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          ✅ Cobrados ({cobrosCobrados.length})
        </button>
      </div>

      {/* Lista Pendientes */}
      {vista === 'pendientes' && (
        <div className="space-y-4">
          {cobrosPendientes.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white/60 text-lg">No hay cobros pendientes</p>
            </div>
          ) : (
            cobrosPendientes.map((suscripcion) => {
              const diasAtraso = streaming.getDiasAtraso(suscripcion.proximo_cobro);

              return (
                <div
                  key={suscripcion.id}
                  className={`bg-white/10 rounded-lg p-6 border-2 ${
                    diasAtraso >= 7 ? 'border-red-500' : 'border-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">👤</span>
                        <div>
                          <div className="text-white font-semibold text-lg">
                            {suscripcion.cliente?.nombre}
                          </div>
                          <div className="text-white/60 text-sm">
                            {suscripcion.cuenta?.servicio} - {suscripcion.tipo_acceso}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-6 mt-4">
                        <div>
                          <div className="text-white/60 text-sm">Monto</div>
                          <div className="text-white font-bold text-xl">
                            {formatoMoneda(suscripcion.costo_mensual)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60 text-sm">Próximo cobro</div>
                          <div className="text-white">
                            {new Date(suscripcion.proximo_cobro).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60 text-sm">Atraso</div>
                          <div className={`font-semibold ${
                            diasAtraso >= 7 ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {diasAtraso} días
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSuscripcionACobrar(suscripcion)}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
                    >
                      💰 Cobrar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Lista Cobrados */}
      {vista === 'cobrados' && (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          {cobrosCobrados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-white/60 text-lg">No hay cobros registrados este mes</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Cliente</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Servicio</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Monto</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Fecha</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Banco</th>
                </tr>
              </thead>
              <tbody>
                {cobrosCobrados.map((pago, index) => (
                  <tr
                    key={pago.id}
                    className={`border-b border-white/10 ${
                      index % 2 === 0 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-white">{pago.cliente?.nombre}</td>
                    <td className="px-4 py-3 text-white/80">{pago.servicio}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">
                      {formatoMoneda(pago.monto)}
                    </td>
                    <td className="px-4 py-3 text-white/80 text-sm">
                      {new Date(pago.fecha_pago).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-white/80">{pago.banco_destino}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de Cobrar */}
      {suscripcionACobrar && (
        <CobrarModal
          suscripcion={suscripcionACobrar}
          bancos={BANCOS}
          onClose={() => setSuscripcionACobrar(null)}
          onCobrar={async (banco, fecha, notas) => {
            await streaming.cobrarPago(suscripcionACobrar, banco, fecha, notas);
          }}
        />
      )}
    </div>
  );
};
