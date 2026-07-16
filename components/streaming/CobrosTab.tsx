'use client';

import { useState, useMemo } from 'react';
import { useStreaming, Suscripcion } from '@/hooks/useStreaming';
import { BANCOS } from '@/lib/types';
import { CobrarModal } from './modals/CobrarModal';

interface CobrosTabProps {
  streaming: ReturnType<typeof useStreaming>;
  mesActivo: string;
}

export const CobrosTab = ({ streaming, mesActivo }: CobrosTabProps) => {
  const [vista, setVista] = useState<'pendientes' | 'cobrados'>('pendientes');
  const [grupoACobrar, setGrupoACobrar] = useState<Suscripcion[] | null>(null);

  const cobrosPendientes = streaming.getSuscripcionesPendientes();
  const cobrosCobrados = streaming.pagos;

  // Agrupa por cliente + próxima fecha de cobro: si todas sus pantallas
  // vencen el mismo día, se muestran unificadas con el total a cobrar.
  const gruposPendientes = useMemo(() => {
    const grupos = new Map<string, Suscripcion[]>();
    for (const s of cobrosPendientes) {
      const key = `${s.cliente_id}-${s.proximo_cobro}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(s);
    }
    return Array.from(grupos.values());
  }, [cobrosPendientes]);

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
            gruposPendientes.map((grupo) => {
              const primera = grupo[0];
              const esGrupo = grupo.length > 1;
              const diasAtraso = streaming.getDiasAtraso(primera.proximo_cobro);
              const montoTotal = grupo.reduce((sum, s) => sum + s.costo_mensual, 0);
              const tareasCliente = streaming.getTareasPendientesDeCliente(primera.cliente_id);

              return (
                <div
                  key={`${primera.cliente_id}-${primera.proximo_cobro}`}
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
                            {primera.cliente?.nombre}
                          </div>
                          {primera.cliente?.telefono && (
                            <div className="text-green-300 text-sm font-mono">
                              📱 {primera.cliente.telefono}
                            </div>
                          )}
                          {!esGrupo && (
                            <>
                              <div className="text-white/60 text-sm">
                                {primera.cuenta?.servicio} - {primera.tipo_acceso}
                              </div>
                              {primera.email_acceso && (
                                <div className="text-purple-300 text-xs font-mono mt-0.5">
                                  ✉️ {primera.email_acceso}
                                </div>
                              )}
                              {primera.cuenta?.email && (
                                <div className="text-white/40 text-xs font-mono mt-0.5">
                                  {primera.email_acceso ? '👤 cuenta madre: ' : '✉️ '}{primera.cuenta.email}
                                </div>
                              )}
                            </>
                          )}
                          {esGrupo && (
                            <div className="text-white/60 text-sm">{grupo.length} servicios</div>
                          )}
                        </div>
                      </div>

                      {esGrupo && (
                        <div className="space-y-1 mb-3 ml-11">
                          {grupo.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-xs bg-white/5 px-2 py-1 rounded">
                              <span className="text-white/70">
                                {s.cuenta?.servicio} - {s.tipo_acceso}
                                {(s.email_acceso || s.cuenta?.email) && (
                                  <span className="text-purple-300 font-mono ml-2">
                                    ✉️ {s.email_acceso || s.cuenta?.email}
                                  </span>
                                )}
                              </span>
                              <span className="text-white/60 whitespace-nowrap ml-2">
                                ${s.costo_mensual.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {tareasCliente.length > 0 && (
                        <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg px-3 py-2 mb-3 space-y-1">
                          {tareasCliente.map((tarea) => (
                            <div key={tarea.id} className="text-orange-200 text-sm flex items-start gap-2">
                              <span>📌</span>
                              <span>{tarea.descripcion}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-6 mt-4">
                        <div>
                          <div className="text-white/60 text-sm">{esGrupo ? 'Monto total' : 'Monto'}</div>
                          <div className="text-white font-bold text-xl">
                            {formatoMoneda(montoTotal)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60 text-sm">Próximo cobro</div>
                          <div className="text-white">
                            {new Date(primera.proximo_cobro).toLocaleDateString()}
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
                      onClick={() => setGrupoACobrar(grupo)}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
                    >
                      💰 {esGrupo ? 'Cobrar todo' : 'Cobrar'}
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
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Teléfono</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Servicio</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Cuenta (email)</th>
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
                    <td className="px-4 py-3 text-green-300 font-mono text-xs">{pago.cliente?.telefono || '—'}</td>
                    <td className="px-4 py-3 text-white/80">{pago.servicio}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {pago.suscripcion?.email_acceso ? (
                        <>
                          <div className="text-purple-300">{pago.suscripcion.email_acceso}</div>
                          {pago.suscripcion.cuenta?.email && (
                            <div className="text-white/40">👤 {pago.suscripcion.cuenta.email}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-purple-300">{pago.suscripcion?.cuenta?.email || '—'}</span>
                      )}
                    </td>
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
      {grupoACobrar && (
        <CobrarModal
          suscripciones={grupoACobrar}
          bancos={BANCOS}
          onClose={() => setGrupoACobrar(null)}
          onCobrar={async (banco, fecha, notas) => {
            for (const s of grupoACobrar) {
              await streaming.cobrarPago(s, banco, fecha, notas);
            }
          }}
        />
      )}
    </div>
  );
};
