'use client';

import { useState } from 'react';
import { useStreaming, CuentaStreaming, PINES_NETFLIX, diasCubiertosPorPin, calcularProximaRecarga } from '@/hooks/useStreaming';
import { BANCOS } from '@/lib/types';
import { PagarCostoModal } from './modals/PagarCostoModal';

const SERVICIOS = ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'YouTube Premium'] as const;

const ICONOS_SERVICIO: Record<string, string> = {
  'Netflix': '🎬',
  'Prime Video': '📺',
  'Disney+': '🏰',
  'HBO Max': '🎭',
  'YouTube Premium': '▶️'
};

// Días que faltan para el próximo día de pago (de hoy en adelante, cíclico por mes)
const diasHastaProximoPago = (diaPago: number): number => {
  const hoy = new Date();
  const diaActual = hoy.getDate();
  if (diaPago >= diaActual) return diaPago - diaActual;
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return diasEnMes - diaActual + diaPago;
};

// Para Netflix, usa la fecha real de próxima recarga (calculada según el pin aplicado)
// en vez de asumir un día fijo de cada mes
const diasHastaProxima = (cuenta: CuentaStreaming): number => {
  if (cuenta.servicio === 'Netflix' && cuenta.proxima_recarga) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(cuenta.proxima_recarga);
    return Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }
  return diasHastaProximoPago(cuenta.dia_pago || 32);
};

interface CostosTabProps {
  streaming: ReturnType<typeof useStreaming>;
  mesActivo: string;
}

export const CostosTab = ({ streaming, mesActivo }: CostosTabProps) => {
  const [vista, setVista] = useState<'pendientes' | 'pagados'>('pendientes');
  const [cuentaAPagar, setCuentaAPagar] = useState<CuentaStreaming | null>(null);
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [pinDrafts, setPinDrafts] = useState<Record<number, { pin: number; codigo: string }>>({});
  const [guardandoPin, setGuardandoPin] = useState<number | null>(null);

  const getDraft = (cuenta: CuentaStreaming) =>
    pinDrafts[cuenta.id] || {
      pin: cuenta.pin_pendiente_valor || PINES_NETFLIX[0],
      codigo: cuenta.pin_pendiente_codigo || ''
    };

  const setDraftPin = (cuenta: CuentaStreaming, pin: number) => {
    setPinDrafts(prev => ({ ...prev, [cuenta.id]: { ...getDraft(cuenta), pin } }));
  };

  const setDraftCodigo = (cuenta: CuentaStreaming, codigo: string) => {
    setPinDrafts(prev => ({ ...prev, [cuenta.id]: { ...getDraft(cuenta), codigo } }));
  };

  const guardarPinPendiente = async (cuenta: CuentaStreaming) => {
    const draft = getDraft(cuenta);
    setGuardandoPin(cuenta.id);
    try {
      await streaming.actualizarCuenta(cuenta.id, {
        pin_pendiente_codigo: draft.codigo.trim() || null,
        pin_pendiente_valor: draft.pin
      });
    } catch (error) {
      console.error('Error guardando pin pendiente:', error);
      alert('Error al guardar el pin');
    } finally {
      setGuardandoPin(null);
    }
  };

  const costosPendientesTodos = streaming.getCostosPendientes();
  const costosPagadosTodos = streaming.costos;

  const costosPendientes = costosPendientesTodos
    .filter(c => filtroServicio === 'todos' || c.servicio === filtroServicio)
    .sort((a, b) => diasHastaProxima(a) - diasHastaProxima(b));

  const costosPagados = costosPagadosTodos
    .filter(c => filtroServicio === 'todos' || c.servicio === filtroServicio);

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
          Todos
        </button>
        {SERVICIOS.map((servicio) => {
          const tieneAlguna = streaming.cuentas.some(c => c.servicio === servicio);
          if (!tieneAlguna) return null;
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
              {ICONOS_SERVICIO[servicio]} {servicio}
            </button>
          );
        })}
      </div>

      {/* Lista Pendientes */}
      {vista === 'pendientes' && (
        <div className="space-y-4">
          {costosPendientes.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white/60 text-lg">
                {filtroServicio === 'todos' ? 'Todos los costos están pagados' : 'No hay pendientes de este servicio'}
              </p>
            </div>
          ) : (
            costosPendientes.map((cuenta) => {
              const esNetflix = cuenta.servicio === 'Netflix';
              const draft = getDraft(cuenta);
              const hoy = new Date().toISOString().split('T')[0];
              const pinGuardado =
                cuenta.pin_pendiente_valor === draft.pin &&
                (cuenta.pin_pendiente_codigo || '') === draft.codigo;

              return (
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
                        {cuenta.email && (
                          <div className="text-purple-300 text-xs font-mono mt-1">
                            ✉️ {cuenta.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-6 mt-4">
                      <div>
                        <div className="text-white/60 text-sm">Monto</div>
                        <div className="text-white font-bold text-xl">
                          {formatoMoneda(cuenta.costo_mensual)}
                        </div>
                      </div>
                      {esNetflix && cuenta.proxima_recarga ? (
                        <div>
                          <div className="text-white/60 text-sm">Próxima recarga</div>
                          <div className="text-white">
                            {new Date(cuenta.proxima_recarga).toLocaleDateString()}
                          </div>
                        </div>
                      ) : cuenta.dia_pago ? (
                        <div>
                          <div className="text-white/60 text-sm">
                            {esNetflix ? 'Día de pago (estimado)' : 'Día de pago'}
                          </div>
                          <div className="text-white">
                            Día {cuenta.dia_pago} de cada mes
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {esNetflix && (
                      <div className="bg-white/5 rounded-lg p-3 mt-4 space-y-2 max-w-sm">
                        <div className="text-white/60 text-xs font-medium">Pin de recarga</div>
                        <div className="grid grid-cols-3 gap-2">
                          {PINES_NETFLIX.map((pin) => (
                            <button
                              key={pin}
                              type="button"
                              onClick={() => setDraftPin(cuenta, pin)}
                              className={`px-2 py-1.5 rounded font-semibold text-xs transition-all ${
                                draft.pin === pin
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-800 text-white/70 hover:bg-gray-700 border border-gray-700'
                              }`}
                            >
                              {formatoMoneda(pin)}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={draft.codigo}
                            onChange={(e) => setDraftCodigo(cuenta, e.target.value)}
                            placeholder="Código del pin"
                            className="flex-1 min-w-0 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => guardarPinPendiente(cuenta)}
                            disabled={guardandoPin === cuenta.id}
                            className={`px-3 py-2 rounded text-sm font-semibold transition-all whitespace-nowrap ${
                              pinGuardado
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            }`}
                          >
                            {guardandoPin === cuenta.id ? '...' : pinGuardado ? '✓ Guardado' : '💾 Guardar'}
                          </button>
                        </div>
                        <p className="text-orange-300 text-xs">
                          📅 Próxima recarga estimada: {new Date(calcularProximaRecarga(hoy, draft.pin, cuenta.costo_mensual)).toLocaleDateString()}
                          {' '}({diasCubiertosPorPin(draft.pin, cuenta.costo_mensual)} días)
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setCuentaAPagar(cuenta)}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105"
                  >
                    💸 Pagar
                  </button>
                </div>
              </div>
              );
            })
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
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Cuenta (email)</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Tipo Cuenta</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Monto</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Código pin</th>
                  <th className="text-left text-white/80 px-4 py-3 text-sm">Próxima recarga</th>
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
                    <td className="px-4 py-3 text-purple-300 font-mono text-xs">{costo.cuenta?.email || '—'}</td>
                    <td className="px-4 py-3 text-white/80">{costo.tipo_cuenta}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold">
                      {formatoMoneda(costo.monto)}
                    </td>
                    <td className="px-4 py-3 text-white/80 font-mono text-xs">{costo.codigo_pin || '—'}</td>
                    <td className="px-4 py-3 text-orange-300 text-sm">
                      {costo.servicio === 'Netflix' && costo.cuenta?.costo_mensual
                        ? new Date(calcularProximaRecarga(costo.fecha_pago, costo.monto, costo.cuenta.costo_mensual)).toLocaleDateString()
                        : '—'}
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
          pinInicial={getDraft(cuentaAPagar).pin}
          codigoInicial={getDraft(cuentaAPagar).codigo}
          onClose={() => setCuentaAPagar(null)}
          onPagar={async (banco, fecha, notas, monto, codigoPin) => {
            await streaming.pagarCosto(cuentaAPagar, banco, fecha, notas, monto, codigoPin);
            // El hook ya limpió el pin pendiente guardado; limpiamos también el borrador local
            setPinDrafts(prev => {
              const next = { ...prev };
              delete next[cuentaAPagar.id];
              return next;
            });
          }}
        />
      )}
    </div>
  );
};
