import { useState, useEffect, useCallback } from 'react';
import { raterHelpers } from '@/lib/supabase';

export interface RaterConfig {
  tarifa_hora_usd: number;
  tasa_cambio: number;
}

export interface TareaRater {
  id: number;
  fecha: string;
  titulo: string;
  minutos: number;
  tarifa_hora_usd: number;
  tasa_cambio: number;
  ganancia_usd: number;
  ganancia_cop: number;
  created_at: string;
}

export interface HistoricoAnualRater {
  id: number;
  anio: number;
  total_minutos: number;
  total_tareas: number;
  total_ganancia_usd: number;
  total_ganancia_cop: number;
  fecha_cierre: string;
}

export interface TotalesPeriodo {
  minutos: number;
  ganancia_usd: number;
  ganancia_cop: number;
}

export interface DiaAgrupado extends TotalesPeriodo {
  fecha: string;
  cantidadTareas: number;
}

const hoyISO = () => new Date().toISOString().split('T')[0];

const sumarTotales = (tareas: { minutos: number; ganancia_usd: number; ganancia_cop: number }[]): TotalesPeriodo => {
  return tareas.reduce(
    (acc, t) => ({
      minutos: acc.minutos + t.minutos,
      ganancia_usd: acc.ganancia_usd + t.ganancia_usd,
      ganancia_cop: acc.ganancia_cop + t.ganancia_cop
    }),
    { minutos: 0, ganancia_usd: 0, ganancia_cop: 0 }
  );
};

const agruparPorFecha = (
  tareas: { fecha: string; minutos: number; ganancia_usd: number; ganancia_cop: number }[]
): DiaAgrupado[] => {
  const mapa = new Map<string, DiaAgrupado>();
  for (const t of tareas) {
    const actual = mapa.get(t.fecha) || { fecha: t.fecha, minutos: 0, ganancia_usd: 0, ganancia_cop: 0, cantidadTareas: 0 };
    actual.minutos += t.minutos;
    actual.ganancia_usd += t.ganancia_usd;
    actual.ganancia_cop += t.ganancia_cop;
    actual.cantidadTareas += 1;
    mapa.set(t.fecha, actual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.fecha.localeCompare(a.fecha));
};

export const useRater = () => {
  const [config, setConfig] = useState<RaterConfig>({ tarifa_hora_usd: 0, tasa_cambio: 0 });
  const [fechaActiva, setFechaActiva] = useState<string>(hoyISO());
  const [tareasDia, setTareasDia] = useState<TareaRater[]>([]);
  const [totalMes, setTotalMes] = useState<TotalesPeriodo>({ minutos: 0, ganancia_usd: 0, ganancia_cop: 0 });
  const [totalAnio, setTotalAnio] = useState<TotalesPeriodo>({ minutos: 0, ganancia_usd: 0, ganancia_cop: 0 });
  const [diasDelMes, setDiasDelMes] = useState<DiaAgrupado[]>([]);
  const [historico, setHistorico] = useState<HistoricoAnualRater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarTotales = useCallback(async (fecha: string) => {
    const [anio, mes] = fecha.split('-');
    const desdeMes = `${anio}-${mes}-01`;
    const ultimoDiaMes = new Date(parseInt(anio), parseInt(mes), 0).getDate();
    const hastaMes = `${anio}-${mes}-${String(ultimoDiaMes).padStart(2, '0')}`;

    const [tareasMes, tareasAnio] = await Promise.all([
      raterHelpers.getTareasPorRango(desdeMes, hastaMes),
      raterHelpers.getTareasPorRango(`${anio}-01-01`, `${anio}-12-31`)
    ]);

    setTotalMes(sumarTotales(tareasMes));
    setTotalAnio(sumarTotales(tareasAnio));
    setDiasDelMes(agruparPorFecha(tareasMes));
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [configData, tareasData, historicoData] = await Promise.all([
        raterHelpers.getConfig(),
        raterHelpers.getTareasPorFecha(fechaActiva),
        raterHelpers.getHistoricoAnual()
      ]);

      setConfig(configData);
      setTareasDia(tareasData);
      setHistorico(historicoData);
      await cargarTotales(fechaActiva);
    } catch (err) {
      console.error('Error loading rater data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [fechaActiva, cargarTotales]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const actualizarConfig = async (updates: { tarifa_hora_usd?: number; tasa_cambio?: number }) => {
    try {
      const actualizada = await raterHelpers.updateConfig(updates);
      setConfig(actualizada);
      return actualizada;
    } catch (err) {
      console.error('Error actualizando config:', err);
      throw err;
    }
  };

  const agregarTarea = async (titulo: string, minutos: number) => {
    try {
      const nueva = await raterHelpers.addTarea({
        fecha: fechaActiva,
        titulo,
        minutos,
        tarifa_hora_usd: config.tarifa_hora_usd,
        tasa_cambio: config.tasa_cambio
      });
      setTareasDia(prev => [nueva, ...prev]);
      await cargarTotales(fechaActiva);
      return nueva;
    } catch (err) {
      console.error('Error agregando tarea:', err);
      throw err;
    }
  };

  const actualizarTarea = async (id: number, updates: { titulo?: string; minutos?: number }) => {
    try {
      const actualizada = await raterHelpers.updateTarea(id, updates);
      setTareasDia(prev => prev.map(t => t.id === id ? actualizada : t));
      await cargarTotales(fechaActiva);
      return actualizada;
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      throw err;
    }
  };

  const eliminarTarea = async (id: number) => {
    try {
      await raterHelpers.deleteTarea(id);
      setTareasDia(prev => prev.filter(t => t.id !== id));
      await cargarTotales(fechaActiva);
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      throw err;
    }
  };

  const cerrarAnio = async (anio: number) => {
    try {
      const resultado = await raterHelpers.cerrarAnio(anio);
      await loadAllData();
      return resultado;
    } catch (err) {
      console.error('Error cerrando año:', err);
      throw err;
    }
  };

  return {
    config,
    fechaActiva,
    setFechaActiva,
    tareasDia,
    totalMes,
    totalAnio,
    diasDelMes,
    historico,
    loading,
    error,
    actualizarConfig,
    agregarTarea,
    actualizarTarea,
    eliminarTarea,
    cerrarAnio,
    recargarDatos: loadAllData
  };
};
