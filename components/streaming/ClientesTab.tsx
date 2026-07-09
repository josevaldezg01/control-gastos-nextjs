'use client';

import { useState } from 'react';
import { useStreaming, CuentaStreaming } from '@/hooks/useStreaming';
import { ClienteModal } from './modals/ClienteModal';
import { DetalleCuentaModal } from './modals/DetalleCuentaModal';

interface ClientesTabProps {
  streaming: ReturnType<typeof useStreaming>;
}

export const ClientesTab = ({ streaming }: ClientesTabProps) => {
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<any>(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaStreaming | null>(null);

  const abrirModal = (cliente?: any) => {
    setClienteEditando(cliente || null);
    setMostrandoModal(true);
  };

  const cerrarModal = () => {
    setClienteEditando(null);
    setMostrandoModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">👥 Clientes</h2>
        <button
          onClick={() => abrirModal()}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
        >
          ➕ Agregar Cliente
        </button>
      </div>

      {/* Lista de clientes */}
      {streaming.clientes.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-white/60 text-lg">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streaming.clientes.map((cliente) => {
            const suscripciones = streaming.suscripciones.filter(
              s => s.cliente_id === cliente.id && s.activa
            );
            const totalMensual = suscripciones.reduce((sum, s) => sum + s.costo_mensual, 0);

            return (
              <div
                key={cliente.id}
                className={`bg-white/10 rounded-lg p-6 border-2 transition-all ${
                  cliente.activo ? 'border-green-500' : 'border-gray-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">👤</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirModal(cliente)}
                      className="text-blue-300 hover:text-blue-200 text-sm px-2 py-1 hover:bg-blue-500/10 rounded transition-all"
                      title="Editar cliente"
                    >
                      ✏️
                    </button>
                    {!cliente.activo && (
                      <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-white font-semibold text-lg mb-2">{cliente.nombre}</div>

                {cliente.telefono && (
                  <div className="text-white/60 text-sm mb-1">📱 {cliente.telefono}</div>
                )}
                {cliente.email && (
                  <div className="text-white/60 text-sm mb-3">📧 {cliente.email}</div>
                )}

                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="text-white/80 text-sm mb-2">
                    {suscripciones.length} servicio{suscripciones.length !== 1 ? 's' : ''} activo{suscripciones.length !== 1 ? 's' : ''}
                  </div>

                  {suscripciones.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {suscripciones.map((suscripcion) => (
                        <button
                          key={suscripcion.id}
                          onClick={() => setCuentaSeleccionada(suscripcion.cuenta || null)}
                          className="w-full flex items-center justify-between text-xs bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-all cursor-pointer"
                          title="Ver detalles de la cuenta"
                        >
                          <span className="text-white/70">
                            {suscripcion.cuenta?.servicio === 'Netflix' && '🎬'}
                            {suscripcion.cuenta?.servicio === 'Prime Video' && '📺'}
                            {suscripcion.cuenta?.servicio === 'Disney+' && '🏰'}
                            {suscripcion.cuenta?.servicio === 'HBO Max' && '🎭'}
                            {suscripcion.cuenta?.servicio === 'YouTube Premium' && '▶️'}
                            {' '}{suscripcion.cuenta?.servicio}
                          </span>
                          <span className="text-white/60">
                            ${suscripcion.costo_mensual.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-white font-bold text-xl">
                    ${totalMensual.toLocaleString()}/mes
                  </div>
                </div>

                {cliente.notas && (
                  <div className="mt-3 text-white/60 text-xs border-t border-white/10 pt-3">
                    💬 {cliente.notas}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cliente */}
      {mostrandoModal && (
        <ClienteModal
          cliente={clienteEditando}
          onClose={cerrarModal}
          onGuardar={async (datos) => {
            if (clienteEditando) {
              await streaming.actualizarCliente(clienteEditando.id, datos);
            } else {
              await streaming.agregarCliente(datos);
            }
          }}
        />
      )}

      {/* Modal de Detalle de Cuenta */}
      {cuentaSeleccionada && (
        <DetalleCuentaModal
          cuenta={cuentaSeleccionada}
          suscripcionesActivas={streaming.suscripciones.filter(
            s => s.cuenta_id === cuentaSeleccionada.id && s.activa
          )}
          onClose={() => setCuentaSeleccionada(null)}
        />
      )}
    </div>
  );
};
