'use client';

import { useState } from 'react';
import { useStreaming } from '@/hooks/useStreaming';
import { CuentaModal } from './modals/CuentaModal';
import { TareaModal } from './modals/TareaModal';

interface CuentasTabProps {
  streaming: ReturnType<typeof useStreaming>;
}

const SERVICIOS = ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'YouTube Premium'] as const;

const ICONOS_SERVICIO: Record<string, string> = {
  'Netflix': '🎬',
  'Prime Video': '📺',
  'Disney+': '🏰',
  'HBO Max': '🎭',
  'YouTube Premium': '▶️'
};

export const CuentasTab = ({ streaming }: CuentasTabProps) => {
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState<any>(null);
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'activas' | 'inactivas' | 'todas'>('activas');
  const [cuentaParaTarea, setCuentaParaTarea] = useState<number | null>(null);

  const cuentasFiltradas = streaming.cuentas
    .filter(c => filtroServicio === 'todos' || c.servicio === filtroServicio)
    .filter(c => filtroEstado === 'todas' || (filtroEstado === 'activas' ? c.activa : !c.activa));

  const cuentasActivasCount = streaming.cuentas.filter(c => c.activa).length;
  const cuentasInactivasCount = streaming.cuentas.filter(c => !c.activa).length;

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

      {/* Filtro por servicio */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroServicio('todos')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filtroServicio === 'todos'
              ? 'bg-purple-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Todos ({streaming.cuentas.length})
        </button>
        {SERVICIOS.map((servicio) => {
          const cantidad = streaming.cuentas.filter(c => c.servicio === servicio).length;
          if (cantidad === 0) return null;
          return (
            <button
              key={servicio}
              onClick={() => setFiltroServicio(servicio)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filtroServicio === servicio
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {ICONOS_SERVICIO[servicio]} {servicio} ({cantidad})
            </button>
          );
        })}
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroEstado('activas')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filtroEstado === 'activas'
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Activas ({cuentasActivasCount})
        </button>
        <button
          onClick={() => setFiltroEstado('inactivas')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filtroEstado === 'inactivas'
              ? 'bg-gray-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Inactivas ({cuentasInactivasCount})
        </button>
        <button
          onClick={() => setFiltroEstado('todas')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filtroEstado === 'todas'
              ? 'bg-purple-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Todas ({streaming.cuentas.length})
        </button>
      </div>

      {/* Lista de cuentas */}
      {cuentasFiltradas.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-white/60 text-lg">
            {streaming.cuentas.length === 0 ? 'No hay cuentas registradas' : 'No hay cuentas en este filtro'}
          </p>
          {streaming.cuentas.length === 0 && (
            <p className="text-white/40 text-sm mt-2">Agrega tu primera cuenta de streaming</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentasFiltradas.map((cuenta) => {
            const espacios = streaming.getEspaciosDisponibles(cuenta.id);
            const porcentajeOcupacion = espacios.total > 0 ? (espacios.ocupados / espacios.total) * 100 : 0;
            const clientesDeCuenta = streaming.getClientesDeCuenta(cuenta.id);
            const rentabilidad = streaming.getRentabilidadCuenta(cuenta.id);
            const pagadaEsteMes = streaming.estaCuentaPagadaEsteMes(cuenta.id);
            const tareasPendientes = streaming.getTareasPendientesDeCuenta(cuenta.id);

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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCuentaParaTarea(cuenta.id)}
                      className="text-orange-300 hover:text-orange-200 text-sm px-1 hover:bg-orange-500/10 rounded transition-all"
                      title="Agregar tarea/pendiente"
                    >
                      📌
                    </button>
                    {cuenta.activa && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        pagadaEsteMes
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {pagadaEsteMes ? '✅ Pagada' : '⏳ Pendiente'}
                      </span>
                    )}
                    {!cuenta.activa && (
                      <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>

                {/* Email / identificador */}
                {cuenta.email && (
                  <div className="text-purple-300 text-xs font-mono mb-2 truncate" title={cuenta.email}>
                    ✉️ {cuenta.email}
                  </div>
                )}

                {/* Tipo de cuenta */}
                <div className="text-white/80 text-sm mb-2">{cuenta.tipo_cuenta}</div>

                {/* Costo */}
                <div className="text-2xl font-bold text-white mb-3">
                  {formatoMoneda(cuenta.costo_mensual)}/mes
                </div>

                {/* Día de pago / próxima recarga (Netflix) */}
                {cuenta.servicio === 'Netflix' && cuenta.proxima_recarga ? (
                  <div className="text-orange-300 text-sm mb-3">
                    📅 Próxima recarga: {new Date(cuenta.proxima_recarga).toLocaleDateString()}
                  </div>
                ) : cuenta.dia_pago ? (
                  <div className="text-white/60 text-sm mb-3">
                    📅 {cuenta.servicio === 'Netflix' ? 'Paga (estimado) día' : 'Paga día'} {cuenta.dia_pago} de cada mes
                  </div>
                ) : null}

                {/* Tarjeta vinculada (no-Netflix) */}
                {cuenta.servicio !== 'Netflix' && cuenta.tarjeta_vinculada && (
                  <div className="text-white/60 text-sm mb-3 font-mono">
                    💳 {cuenta.tarjeta_vinculada}
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
                          ? 'bg-green-500'
                          : porcentajeOcupacion === 0
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${porcentajeOcupacion}%` }}
                    />
                  </div>
                </div>

                {/* Clientes actuales */}
                {clientesDeCuenta.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <div className="text-white/60 text-xs mb-1">Clientes</div>
                    {clientesDeCuenta.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs bg-white/5 px-2 py-1 rounded">
                        <span className="text-white/80 truncate">
                          {s.cliente?.nombre}
                          {s.email_acceso && (
                            <span className="text-purple-300 font-mono block text-[10px] truncate">
                              ✉️ {s.email_acceso}
                            </span>
                          )}
                        </span>
                        <span className="text-white/60 ml-2 whitespace-nowrap">${s.costo_mensual.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rentabilidad */}
                <div className="mb-3 flex items-center justify-between bg-white/5 rounded px-3 py-2">
                  <span className="text-white/60 text-xs">
                    Cobrado {formatoMoneda(rentabilidad.ingresos)} − Costo {formatoMoneda(rentabilidad.costo)}
                  </span>
                  <span className={`font-bold text-sm ${rentabilidad.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {rentabilidad.ganancia >= 0 ? '+' : ''}{formatoMoneda(rentabilidad.ganancia)}
                  </span>
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
                      const accion = cuenta.activa ? 'desactivar' : 'activar';
                      if (confirm(`¿Seguro que quieres ${accion} esta cuenta?`)) {
                        streaming.actualizarCuenta(cuenta.id, { activa: !cuenta.activa });
                      }
                    }}
                    className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                      cuenta.activa
                        ? 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                    }`}
                    title={cuenta.activa ? 'Desactivar cuenta' : 'Activar cuenta'}
                  >
                    {cuenta.activa ? '🔌 Desactivar' : '🔋 Activar'}
                  </button>
                </div>

                {tareasPendientes.length > 0 && (
                  <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg px-3 py-2 mt-3 space-y-1">
                    {tareasPendientes.map((tarea) => (
                      <div key={tarea.id} className="text-orange-200 text-xs flex items-start gap-1">
                        <span>📌</span>
                        <span>{tarea.descripcion}</span>
                      </div>
                    ))}
                  </div>
                )}

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

      {/* Modal de Tarea rápida */}
      {cuentaParaTarea !== null && (
        <TareaModal
          streaming={streaming}
          cuentaIdPreset={cuentaParaTarea}
          onClose={() => setCuentaParaTarea(null)}
        />
      )}
    </div>
  );
};
