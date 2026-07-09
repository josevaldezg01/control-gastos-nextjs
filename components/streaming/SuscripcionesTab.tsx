'use client';

import { useState } from 'react';
import { useStreaming } from '@/hooks/useStreaming';
import { SuscripcionModal } from './modals/SuscripcionModal';

interface SuscripcionesTabProps {
  streaming: ReturnType<typeof useStreaming>;
}

export const SuscripcionesTab = ({ streaming }: SuscripcionesTabProps) => {
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('activas');
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [suscripcionEditando, setSuscripcionEditando] = useState<any>(null);

  const suscripcionesFiltradas = streaming.suscripciones.filter(s => {
    if (filtroEstado === 'activas' && !s.activa) return false;
    if (filtroEstado === 'inactivas' && s.activa) return false;
    if (filtroServicio !== 'todos' && s.cuenta?.servicio !== filtroServicio) return false;
    return true;
  });

  const formatoMoneda = (valor: number) => {
    return `$${valor.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">📝 Suscripciones</h2>
        <button
          onClick={() => setMostrandoModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
        >
          ➕ Nueva Suscripción
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filtroServicio}
          onChange={(e) => setFiltroServicio(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="todos">Todos los servicios</option>
          <option value="Netflix">Netflix</option>
          <option value="Prime Video">Prime Video</option>
          <option value="Disney+">Disney+</option>
          <option value="HBO Max">HBO Max</option>
          <option value="YouTube Premium">YouTube Premium</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="activas">Activas</option>
          <option value="todas">Todas</option>
          <option value="inactivas">Inactivas</option>
        </select>
      </div>

      {/* Tabla */}
      {suscripcionesFiltradas.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-white/60 text-lg">No hay suscripciones</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Cliente</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Servicio</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Acceso</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Correo</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Costo</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">
                  {filtroEstado === 'inactivas' ? 'Fecha fin' : 'Próximo cobro'}
                </th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Estado</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Recordatorio</th>
                <th className="text-left text-white/80 px-4 py-3 text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suscripcionesFiltradas.map((suscripcion, index) => {
                const diasAtraso = streaming.getDiasAtraso(suscripcion.proximo_cobro);
                const pendiente = suscripcion.activa && diasAtraso >= 0;

                return (
                  <tr
                    key={suscripcion.id}
                    className={`border-b border-white/10 ${
                      index % 2 === 0 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-white">{suscripcion.cliente?.nombre}</td>
                    <td className="px-4 py-3 text-white">{suscripcion.cuenta?.servicio}</td>
                    <td className="px-4 py-3 text-white/80 text-sm">{suscripcion.tipo_acceso}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {suscripcion.email_acceso ? (
                        <>
                          <div className="text-purple-300">{suscripcion.email_acceso}</div>
                          {suscripcion.cuenta?.email && (
                            <div className="text-white/40">👤 {suscripcion.cuenta.email}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-purple-300">{suscripcion.cuenta?.email || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">
                      {formatoMoneda(suscripcion.costo_mensual)}
                    </td>
                    <td className="px-4 py-3 text-white/80 text-sm">
                      {suscripcion.activa
                        ? new Date(suscripcion.proximo_cobro).toLocaleDateString()
                        : suscripcion.fecha_fin
                          ? new Date(suscripcion.fecha_fin).toLocaleDateString()
                          : '-'
                      }
                    </td>
                    <td className="px-4 py-3">
                      {suscripcion.activa ? (
                        pendiente ? (
                          <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">
                            ⏳ Pendiente ({diasAtraso}d)
                          </span>
                        ) : (
                          <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                            ✅ Al día
                          </span>
                        )
                      ) : (
                        <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">
                          ❌ Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {suscripcion.activa ? (
                        pendiente ? (
                          suscripcion.fecha_recordatorio ? (
                            <div className="text-center">
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs block mb-1">
                                📧 Enviado
                              </span>
                              <span className="text-white/40 text-xs">
                                {new Date(suscripcion.fecha_recordatorio).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await streaming.marcarRecordatorio(suscripcion.id);
                                } catch (error) {
                                  alert('Error al marcar recordatorio');
                                }
                              }}
                              className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded text-xs hover:bg-yellow-500/30 transition-all"
                              title="Marcar recordatorio como enviado"
                            >
                              ⚪ Enviar
                            </button>
                          )
                        ) : (
                          <span className="text-white/40 text-xs">-</span>
                        )
                      ) : (
                        <span className="text-white/40 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSuscripcionEditando(suscripcion);
                            setMostrandoModal(true);
                          }}
                          className="text-blue-300 hover:text-blue-200 text-sm"
                          title="Editar suscripción"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`¿Cancelar suscripción de ${suscripcion.cliente?.nombre} en ${suscripcion.cuenta?.servicio}?`)) {
                              try {
                                await streaming.cancelarSuscripcion(suscripcion.id);
                              } catch (error) {
                                alert('Error al cancelar la suscripción');
                              }
                            }
                          }}
                          className="text-red-300 hover:text-red-200 text-sm"
                          title="Cancelar suscripción"
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {mostrandoModal && (
        <SuscripcionModal
          streaming={streaming}
          suscripcion={suscripcionEditando}
          onClose={() => {
            setMostrandoModal(false);
            setSuscripcionEditando(null);
          }}
          onGuardar={async (datos, id) => {
            if (id) {
              await streaming.actualizarSuscripcion(id, datos);
            } else {
              await streaming.asignarSuscripcion(datos);
            }
          }}
        />
      )}
    </div>
  );
};
