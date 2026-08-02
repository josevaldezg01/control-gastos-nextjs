'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRater } from '@/hooks/useRater';

const formatoUSD = (valor: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
};

const formatoCOP = (valor: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

const formatoMinutos = (minutos: number) => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
};

export const RaterDashboard = () => {
  const router = useRouter();
  const rater = useRater();

  const [editandoConfig, setEditandoConfig] = useState(false);
  const [tarifaInput, setTarifaInput] = useState('');
  const [tasaInput, setTasaInput] = useState('');

  const [tituloNuevo, setTituloNuevo] = useState('');
  const [minutosNuevo, setMinutosNuevo] = useState('');
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  const [editandoTareaId, setEditandoTareaId] = useState<number | null>(null);
  const [tituloEdit, setTituloEdit] = useState('');
  const [minutosEdit, setMinutosEdit] = useState('');

  const [vista, setVista] = useState<'jornada' | 'historial' | 'historico'>('jornada');

  if (rater.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando Rater...</div>
      </div>
    );
  }

  if (rater.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {rater.error}</div>
      </div>
    );
  }

  const totalDia = rater.tareasDia.reduce(
    (acc, t) => ({ minutos: acc.minutos + t.minutos, usd: acc.usd + t.ganancia_usd, cop: acc.cop + t.ganancia_cop }),
    { minutos: 0, usd: 0, cop: 0 }
  );

  const anioActivo = parseInt(rater.fechaActiva.split('-')[0]);

  const abrirEdicionConfig = () => {
    setTarifaInput(rater.config.tarifa_hora_usd.toString());
    setTasaInput(rater.config.tasa_cambio.toString());
    setEditandoConfig(true);
  };

  const guardarConfig = async () => {
    const tarifa = parseFloat(tarifaInput);
    const tasa = parseFloat(tasaInput);
    if (isNaN(tarifa) || tarifa < 0 || isNaN(tasa) || tasa < 0) {
      alert('Ingresa valores válidos');
      return;
    }
    try {
      await rater.actualizarConfig({ tarifa_hora_usd: tarifa, tasa_cambio: tasa });
      setEditandoConfig(false);
    } catch {
      alert('Error al guardar la configuración');
    }
  };

  const handleAgregarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutos = parseInt(minutosNuevo);
    if (!tituloNuevo.trim() || !minutos || minutos <= 0) {
      alert('Completa el título y los minutos');
      return;
    }
    if (rater.config.tarifa_hora_usd <= 0) {
      alert('Primero configura la tarifa por hora');
      return;
    }
    setGuardandoTarea(true);
    try {
      await rater.agregarTarea(tituloNuevo.trim(), minutos);
      setTituloNuevo('');
      setMinutosNuevo('');
    } catch {
      alert('Error al agregar la tarea');
    } finally {
      setGuardandoTarea(false);
    }
  };

  const abrirEdicionTarea = (id: number, titulo: string, minutos: number) => {
    setEditandoTareaId(id);
    setTituloEdit(titulo);
    setMinutosEdit(minutos.toString());
  };

  const guardarEdicionTarea = async () => {
    const minutos = parseInt(minutosEdit);
    if (!tituloEdit.trim() || !minutos || minutos <= 0) {
      alert('Completa el título y los minutos');
      return;
    }
    try {
      await rater.actualizarTarea(editandoTareaId!, { titulo: tituloEdit.trim(), minutos });
      setEditandoTareaId(null);
    } catch {
      alert('Error al actualizar la tarea');
    }
  };

  const handleCerrarAnio = async () => {
    const confirmado = confirm(
      `¿Cerrar el año ${anioActivo}?\n\n` +
      `Total: ${formatoMinutos(rater.totalAnio.minutos)} · ${formatoUSD(rater.totalAnio.ganancia_usd)} · ${formatoCOP(rater.totalAnio.ganancia_cop)}\n\n` +
      `Esto guarda el resumen en el histórico y BORRA las tareas detalladas de ${anioActivo}. No se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await rater.cerrarAnio(anioActivo);
      alert(`Año ${anioActivo} cerrado correctamente`);
    } catch {
      alert('Error al cerrar el año');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="relative text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            ← Control de Gastos
          </button>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">🎯 Rater</h1>
          <p className="text-white/60 text-sm">Evaluador de resultados de búsqueda</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-2 bg-white/10 backdrop-blur-md rounded-lg p-3">
              <button
                onClick={() => setVista('jornada')}
                className={`flex-1 md:flex-none text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  vista === 'jornada'
                    ? 'bg-emerald-500/30 border border-emerald-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                📅 Jornada
              </button>
              <button
                onClick={() => setVista('historial')}
                className={`flex-1 md:flex-none text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  vista === 'historial'
                    ? 'bg-emerald-500/30 border border-emerald-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                📋 Historial de jornadas
              </button>
              <button
                onClick={() => setVista('historico')}
                className={`flex-1 md:flex-none text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  vista === 'historico'
                    ? 'bg-emerald-500/30 border border-emerald-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                🗂️ Histórico anual
              </button>
            </nav>
          </aside>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0 space-y-4">
          {vista === 'jornada' && (
          <>
          {/* Configuración */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold text-base">⚙️ Configuración</h2>
              {!editandoConfig && (
                <button
                  onClick={abrirEdicionConfig}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded text-sm font-medium transition-all"
                >
                  ✏️ Editar
                </button>
              )}
            </div>

            {editandoConfig ? (
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-white/60 text-xs mb-1">Tarifa por hora (USD)</label>
                  <input
                    type="number"
                    value={tarifaInput}
                    onChange={(e) => setTarifaInput(e.target.value)}
                    step="0.01"
                    min="0"
                    className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none w-40"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Tasa de cambio (COP por USD)</label>
                  <input
                    type="number"
                    value={tasaInput}
                    onChange={(e) => setTasaInput(e.target.value)}
                    step="1"
                    min="0"
                    className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none w-40"
                  />
                </div>
                <button
                  onClick={guardarConfig}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditandoConfig(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex gap-8">
                <div>
                  <div className="text-white/60 text-xs">Tarifa por hora</div>
                  <div className="text-white text-lg font-bold">{formatoUSD(rater.config.tarifa_hora_usd)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs">Tasa de cambio</div>
                  <div className="text-white text-lg font-bold">{formatoCOP(rater.config.tasa_cambio)} / USD</div>
                </div>
              </div>
            )}
          </div>

          {/* Totales mes / año */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300 text-sm font-medium">Ganado este mes</span>
                <span className="text-lg">📆</span>
              </div>
              <div className="text-white text-lg font-bold">{formatoUSD(rater.totalMes.ganancia_usd)}</div>
              <div className="text-white/60 text-xs">{formatoCOP(rater.totalMes.ganancia_cop)} · {formatoMinutos(rater.totalMes.minutos)}</div>
            </div>

            <div className="bg-purple-500/20 border-2 border-purple-500 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-300 text-sm font-medium">Ganado este año ({anioActivo})</span>
                <span className="text-lg">📊</span>
              </div>
              <div className="text-white text-lg font-bold">{formatoUSD(rater.totalAnio.ganancia_usd)}</div>
              <div className="text-white/60 text-xs">{formatoCOP(rater.totalAnio.ganancia_cop)} · {formatoMinutos(rater.totalAnio.minutos)}</div>
            </div>
          </div>

          {/* Jornada + agregar tarea */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-white font-semibold text-lg">📅 Jornada</h2>
              <input
                type="date"
                value={rater.fechaActiva}
                onChange={(e) => rater.setFechaActiva(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Total del día */}
            <div className="bg-emerald-500/20 border-2 border-emerald-500 rounded-lg p-4 flex items-center justify-between mb-6">
              <div>
                <div className="text-emerald-300 text-sm font-medium">Ganado este día</div>
                <div className="text-white/60 text-xs">{formatoMinutos(totalDia.minutos)}</div>
              </div>
              <div className="text-right">
                <div className="text-white text-2xl font-bold">{formatoUSD(totalDia.usd)}</div>
                <div className="text-white/60 text-sm">{formatoCOP(totalDia.cop)}</div>
              </div>
            </div>

            <form onSubmit={handleAgregarTarea} className="flex flex-wrap gap-3 mb-6">
              <input
                type="text"
                value={tituloNuevo}
                onChange={(e) => setTituloNuevo(e.target.value)}
                placeholder="Título de la tarea"
                className="flex-1 min-w-[200px] bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                value={minutosNuevo}
                onChange={(e) => setMinutosNuevo(e.target.value)}
                placeholder="Minutos"
                min="1"
                className="w-28 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={guardandoTarea}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                ➕ Agregar
              </button>
            </form>

            {/* Lista de tareas del día */}
            {rater.tareasDia.length === 0 ? (
              <div className="text-white/40 text-center py-8">No hay tareas registradas este día</div>
            ) : (
              <div className="space-y-2 mb-4">
                {rater.tareasDia.map((tarea) => (
                  <div key={tarea.id} className="bg-white/5 rounded-lg p-3">
                    {editandoTareaId === tarea.id ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          value={tituloEdit}
                          onChange={(e) => setTituloEdit(e.target.value)}
                          className="flex-1 min-w-[150px] bg-gray-800 text-white px-3 py-1.5 rounded border border-gray-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          value={minutosEdit}
                          onChange={(e) => setMinutosEdit(e.target.value)}
                          min="1"
                          className="w-24 bg-gray-800 text-white px-3 py-1.5 rounded border border-gray-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          onClick={guardarEdicionTarea}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-all"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoTareaId(null)}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-white truncate">{tarea.titulo}</div>
                          <div className="text-white/50 text-xs">{formatoMinutos(tarea.minutos)}</div>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div className="text-emerald-300 font-semibold">{formatoUSD(tarea.ganancia_usd)}</div>
                          <div className="text-white/40 text-xs">{formatoCOP(tarea.ganancia_cop)}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => abrirEdicionTarea(tarea.id, tarea.titulo, tarea.minutos)}
                            className="text-blue-300 hover:text-blue-200 px-2 py-1"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta tarea?')) rater.eliminarTarea(tarea.id);
                            }}
                            className="text-red-300 hover:text-red-200 px-2 py-1"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}

          {vista === 'historial' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-white font-semibold text-lg mb-4">
              📋 Historial de jornadas — {new Date(rater.fechaActiva + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
            </h2>

            {rater.diasDelMes.length === 0 ? (
              <div className="text-white/40 text-center py-6">No hay jornadas registradas este mes</div>
            ) : (
              <div className="space-y-2">
                {rater.diasDelMes.map((dia) => (
                  <button
                    key={dia.fecha}
                    onClick={() => rater.setFechaActiva(dia.fecha)}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg p-3 transition-all text-left ${
                      dia.fecha === rater.fechaActiva
                        ? 'bg-emerald-500/30 border border-emerald-500'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">
                        {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-white/40 text-xs">
                        {dia.cantidadTareas} tarea{dia.cantidadTareas !== 1 ? 's' : ''} · {formatoMinutos(dia.minutos)}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-emerald-300 font-semibold">{formatoUSD(dia.ganancia_usd)}</div>
                      <div className="text-white/40 text-xs">{formatoCOP(dia.ganancia_cop)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {vista === 'historico' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">🗂️ Histórico anual</h2>
              <button
                onClick={handleCerrarAnio}
                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                🔒 Cerrar año {anioActivo}
              </button>
            </div>

            {rater.historico.length === 0 ? (
              <div className="text-white/40 text-sm">Aún no has cerrado ningún año</div>
            ) : (
              <div className="space-y-2">
                {rater.historico.map((h) => (
                  <div key={h.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{h.anio}</div>
                      <div className="text-white/40 text-xs">
                        {h.total_tareas} tareas · {formatoMinutos(h.total_minutos)} · cerrado {new Date(h.fecha_cierre).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{formatoUSD(h.total_ganancia_usd)}</div>
                      <div className="text-white/60 text-xs">{formatoCOP(h.total_ganancia_cop)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
