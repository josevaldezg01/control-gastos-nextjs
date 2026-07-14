import { useState, useEffect, useCallback } from 'react';
import { streamingHelpers } from '@/lib/supabase';

// Tipos
export interface CuentaStreaming {
  id: number;
  servicio: string;
  tipo_cuenta: string;
  extras: any;
  costo_mensual: number;
  dia_pago: number | null;
  email: string | null;
  activa: boolean;
  notas: string | null;
  created_at: string;
}

export interface ClienteStreaming {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
}

export interface Suscripcion {
  id: number;
  cuenta_id: number;
  cliente_id: number;
  tipo_acceso: string;
  costo_mensual: number;
  proximo_cobro: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  activa: boolean;
  notas: string | null;
  email_acceso: string | null;
  fecha_recordatorio: string | null;
  created_at: string;
  cuenta?: CuentaStreaming;
  cliente?: ClienteStreaming;
}

export interface PagoStreaming {
  id: number;
  suscripcion_id: number;
  cliente_id: number;
  servicio: string;
  monto: number;
  fecha_pago: string;
  banco_destino: string;
  mes_contable: string;
  notas: string | null;
  created_at: string;
  suscripcion?: Suscripcion;
  cliente?: ClienteStreaming;
}

export interface CostoStreaming {
  id: number;
  cuenta_id: number;
  servicio: string;
  tipo_cuenta: string;
  monto: number;
  fecha_pago: string;
  banco_origen: string;
  mes_contable: string;
  notas: string | null;
  created_at: string;
  cuenta?: CuentaStreaming;
}

export interface TareaStreaming {
  id: number;
  descripcion: string;
  cliente_id: number | null;
  cuenta_id: number | null;
  completada: boolean;
  fecha_creacion: string;
  fecha_completada: string | null;
  created_at: string;
  cliente?: ClienteStreaming;
  cuenta?: CuentaStreaming;
}

export interface MetricasStreaming {
  totalCobrado: number;
  totalGastado: number;
  ganancia: number;
  cobrosPendientes: number;
  montoPendiente: number;
  costosPendientes: number;
  montoCostosPendiente: number;
}

export interface EspaciosDisponibles {
  total: number;
  ocupados: number;
  disponibles: number;
}

export const useStreaming = (mesActivo: string) => {
  const [cuentas, setCuentas] = useState<CuentaStreaming[]>([]);
  const [clientes, setClientes] = useState<ClienteStreaming[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [pagos, setPagos] = useState<PagoStreaming[]>([]);
  const [costos, setCostos] = useState<CostoStreaming[]>([]);
  const [tareas, setTareas] = useState<TareaStreaming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // CARGAR DATOS
  // ============================================

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [cuentasData, clientesData, suscripcionesData, pagosData, costosData, tareasData] = await Promise.all([
        streamingHelpers.getCuentas(),
        streamingHelpers.getClientes(),
        streamingHelpers.getSuscripciones(),
        streamingHelpers.getPagos(mesActivo),
        streamingHelpers.getCostos(mesActivo),
        streamingHelpers.getTareas()
      ]);

      setCuentas(cuentasData);
      setClientes(clientesData);
      setSuscripciones(suscripcionesData);
      setPagos(pagosData);
      setCostos(costosData);
      setTareas(tareasData);
    } catch (err) {
      console.error('Error loading streaming data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [mesActivo]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ============================================
  // FUNCIONES DE CUENTAS
  // ============================================

  const agregarCuenta = async (cuenta: {
    servicio: string;
    tipo_cuenta: string;
    costo_mensual: number;
    dia_pago?: number;
    extras?: any;
    email?: string;
    notas?: string;
  }) => {
    try {
      const nueva = await streamingHelpers.addCuenta(cuenta);
      setCuentas(prev => [nueva, ...prev]);
      return nueva;
    } catch (err) {
      console.error('Error agregando cuenta:', err);
      throw err;
    }
  };

  const actualizarCuenta = async (id: number, updates: Partial<CuentaStreaming>) => {
    try {
      const actualizada = await streamingHelpers.updateCuenta(id, updates);
      setCuentas(prev => prev.map(c => c.id === id ? actualizada : c));
      return actualizada;
    } catch (err) {
      console.error('Error actualizando cuenta:', err);
      throw err;
    }
  };

  const eliminarCuenta = async (id: number) => {
    try {
      await streamingHelpers.deleteCuenta(id);
      setCuentas(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error eliminando cuenta:', err);
      throw err;
    }
  };

  // ============================================
  // FUNCIONES DE CLIENTES
  // ============================================

  const agregarCliente = async (cliente: {
    nombre: string;
    telefono?: string;
    email?: string;
    notas?: string;
  }) => {
    try {
      const nuevo = await streamingHelpers.addCliente(cliente);
      setClientes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return nuevo;
    } catch (err) {
      console.error('Error agregando cliente:', err);
      throw err;
    }
  };

  const actualizarCliente = async (id: number, updates: Partial<ClienteStreaming>) => {
    try {
      const actualizado = await streamingHelpers.updateCliente(id, updates);
      setClientes(prev => prev.map(c => c.id === id ? actualizado : c).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return actualizado;
    } catch (err) {
      console.error('Error actualizando cliente:', err);
      throw err;
    }
  };

  const eliminarCliente = async (id: number) => {
    try {
      await streamingHelpers.deleteCliente(id);
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error eliminando cliente:', err);
      throw err;
    }
  };

  // ============================================
  // FUNCIONES DE SUSCRIPCIONES
  // ============================================

  const asignarSuscripcion = async (suscripcion: {
    cuenta_id: number;
    cliente_id: number;
    tipo_acceso: string;
    costo_mensual: number;
    proximo_cobro: string;
    email_acceso?: string;
    notas?: string;
  }) => {
    try {
      const nueva = await streamingHelpers.addSuscripcion(suscripcion);
      setSuscripciones(prev => [nueva, ...prev]);
      return nueva;
    } catch (err) {
      console.error('Error asignando suscripción:', err);
      throw err;
    }
  };

  const actualizarSuscripcion = async (id: number, updates: Partial<Suscripcion>) => {
    try {
      const actualizada = await streamingHelpers.updateSuscripcion(id, updates);
      setSuscripciones(prev => prev.map(s => s.id === id ? actualizada : s));
      return actualizada;
    } catch (err) {
      console.error('Error actualizando suscripción:', err);
      throw err;
    }
  };

  const cancelarSuscripcion = async (id: number) => {
    try {
      const cancelada = await streamingHelpers.cancelarSuscripcion(id);
      setSuscripciones(prev => prev.map(s => s.id === id ? cancelada : s));
      return cancelada;
    } catch (err) {
      console.error('Error cancelando suscripción:', err);
      throw err;
    }
  };

  // ============================================
  // FUNCIONES DE COBROS
  // ============================================

  const cobrarPago = async (
    suscripcion: Suscripcion,
    banco: string,
    fecha: string,
    notas: string = ''
  ) => {
    try {
      if (!mesActivo) {
        throw new Error('No hay mes activo seleccionado');
      }

      // 1. Crear pago
      const pago = await streamingHelpers.addPago({
        suscripcion_id: suscripcion.id,
        cliente_id: suscripcion.cliente_id,
        servicio: suscripcion.cuenta?.servicio || '',
        monto: suscripcion.costo_mensual,
        fecha_pago: fecha,
        banco_destino: banco,
        mes_contable: mesActivo,
        notas: notas || suscripcion.cliente?.nombre || ''
      });

      // 2. Actualizar próximo cobro (+1 mes) y limpiar recordatorio
      await streamingHelpers.updateProximoCobro(suscripcion.id);
      await streamingHelpers.limpiarRecordatorio(suscripcion.id);

      // 3. Recargar datos
      await loadAllData();

      return pago;
    } catch (err) {
      console.error('Error cobrando pago:', err);
      throw err;
    }
  };

  const marcarRecordatorio = async (suscripcionId: number) => {
    try {
      const actualizada = await streamingHelpers.marcarRecordatorio(suscripcionId);
      setSuscripciones(prev => prev.map(s => s.id === suscripcionId ? actualizada : s));
      return actualizada;
    } catch (err) {
      console.error('Error marcando recordatorio:', err);
      throw err;
    }
  };

  // ============================================
  // FUNCIONES DE COSTOS
  // ============================================

  const pagarCosto = async (
    cuenta: CuentaStreaming,
    banco: string,
    fecha: string,
    notas: string = '',
    monto?: number
  ) => {
    try {
      if (!mesActivo) {
        throw new Error('No hay mes activo seleccionado');
      }

      // 1. Crear costo
      const costo = await streamingHelpers.addCosto({
        cuenta_id: cuenta.id,
        servicio: cuenta.servicio,
        tipo_cuenta: cuenta.tipo_cuenta,
        monto: monto ?? cuenta.costo_mensual,
        fecha_pago: fecha,
        banco_origen: banco,
        mes_contable: mesActivo,
        notas
      });

      // 2. Recargar datos
      await loadAllData();

      return costo;
    } catch (err) {
      console.error('Error pagando costo:', err);
      throw err;
    }
  };

  // ============================================
  // FUNCIONES DE TAREAS (pendientes/recordatorios)
  // ============================================

  const agregarTarea = async (tarea: {
    descripcion: string;
    cliente_id?: number | null;
    cuenta_id?: number | null;
  }) => {
    try {
      const nueva = await streamingHelpers.addTarea(tarea);
      setTareas(prev => [nueva, ...prev]);
      return nueva;
    } catch (err) {
      console.error('Error agregando tarea:', err);
      throw err;
    }
  };

  const completarTarea = async (id: number) => {
    try {
      const actualizada = await streamingHelpers.completarTarea(id);
      setTareas(prev => prev.map(t => t.id === id ? actualizada : t));
      return actualizada;
    } catch (err) {
      console.error('Error completando tarea:', err);
      throw err;
    }
  };

  const reabrirTarea = async (id: number) => {
    try {
      const actualizada = await streamingHelpers.reabrirTarea(id);
      setTareas(prev => prev.map(t => t.id === id ? actualizada : t));
      return actualizada;
    } catch (err) {
      console.error('Error reabriendo tarea:', err);
      throw err;
    }
  };

  const eliminarTarea = async (id: number) => {
    try {
      await streamingHelpers.eliminarTarea(id);
      setTareas(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      throw err;
    }
  };

  const getTareasPendientesDeCliente = useCallback((clienteId: number): TareaStreaming[] => {
    return tareas.filter(t => t.cliente_id === clienteId && !t.completada);
  }, [tareas]);

  // ============================================
  // MÉTRICAS Y CÁLCULOS
  // ============================================

  const calcularMetricas = useCallback((): MetricasStreaming => {
    const totalCobrado = pagos.reduce((sum, p) => sum + p.monto, 0);
    const totalGastado = costos.reduce((sum, c) => sum + c.monto, 0);
    const ganancia = totalCobrado - totalGastado;

    const hoy = new Date().toISOString().split('T')[0];
    const cobrosPendientesList = suscripciones.filter(s =>
      s.activa && s.proximo_cobro <= hoy
    );
    const montoPendiente = cobrosPendientesList.reduce((sum, s) => sum + s.costo_mensual, 0);

    const costosPendientesList = cuentas.filter(c =>
      c.activa && !costos.some(costo => costo.cuenta_id === c.id)
    );
    const montoCostosPendiente = costosPendientesList.reduce((sum, c) => sum + c.costo_mensual, 0);

    return {
      totalCobrado,
      totalGastado,
      ganancia,
      cobrosPendientes: cobrosPendientesList.length,
      montoPendiente,
      costosPendientes: costosPendientesList.length,
      montoCostosPendiente
    };
  }, [pagos, costos, suscripciones, cuentas]);

  const getEspaciosDisponibles = useCallback((cuentaId: number): EspaciosDisponibles => {
    const cuenta = cuentas.find(c => c.id === cuentaId);
    if (!cuenta) return { total: 0, ocupados: 0, disponibles: 0 };

    let total = 0;
    const tipoCuenta = cuenta.tipo_cuenta.toLowerCase();

    if (tipoCuenta.includes('1 pantalla')) total = 1;
    else if (tipoCuenta.includes('2 pantallas')) total = 2;
    else if (tipoCuenta.includes('4 pantallas')) total = 4;
    else if (tipoCuenta.includes('5 perfiles')) total = 5;
    else if (tipoCuenta.includes('premium')) total = 6; // YouTube: 1 principal + 5 vinculadas

    const ocupados = suscripciones.filter(s =>
      s.cuenta_id === cuentaId && s.activa
    ).length;

    return { total, ocupados, disponibles: total - ocupados };
  }, [cuentas, suscripciones]);

  const getSuscripcionesPendientes = useCallback((): Suscripcion[] => {
    const hoy = new Date().toISOString().split('T')[0];
    return suscripciones.filter(s => s.activa && s.proximo_cobro <= hoy);
  }, [suscripciones]);

  const getCostosPendientes = useCallback((): CuentaStreaming[] => {
    return cuentas.filter(c =>
      c.activa && !costos.some(costo => costo.cuenta_id === c.id)
    );
  }, [cuentas, costos]);

  const getClientesDeCuenta = useCallback((cuentaId: number): Suscripcion[] => {
    return suscripciones.filter(s => s.cuenta_id === cuentaId && s.activa);
  }, [suscripciones]);

  const getRentabilidadCuenta = useCallback((cuentaId: number) => {
    const cuenta = cuentas.find(c => c.id === cuentaId);
    const ingresos = suscripciones
      .filter(s => s.cuenta_id === cuentaId && s.activa)
      .reduce((sum, s) => sum + s.costo_mensual, 0);
    const costo = cuenta?.costo_mensual || 0;

    return { ingresos, costo, ganancia: ingresos - costo };
  }, [suscripciones, cuentas]);

  const estaCuentaPagadaEsteMes = useCallback((cuentaId: number): boolean => {
    return costos.some(c => c.cuenta_id === cuentaId);
  }, [costos]);

  const getDiasAtraso = useCallback((proximoCobro: string): number => {
    const hoy = new Date();
    const fechaCobro = new Date(proximoCobro);
    const diff = hoy.getTime() - fechaCobro.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, []);

  // ============================================
  // RETORNO DEL HOOK
  // ============================================

  return {
    // Estado
    cuentas,
    clientes,
    suscripciones,
    pagos,
    costos,
    tareas,
    loading,
    error,

    // Funciones de cuentas
    agregarCuenta,
    actualizarCuenta,
    eliminarCuenta,

    // Funciones de clientes
    agregarCliente,
    actualizarCliente,
    eliminarCliente,

    // Funciones de suscripciones
    asignarSuscripcion,
    actualizarSuscripcion,
    cancelarSuscripcion,
    marcarRecordatorio,

    // Funciones de cobros y costos
    cobrarPago,
    pagarCosto,

    // Funciones de tareas
    agregarTarea,
    completarTarea,
    reabrirTarea,
    eliminarTarea,
    getTareasPendientesDeCliente,

    // Utilidades y cálculos
    calcularMetricas,
    getEspaciosDisponibles,
    getSuscripcionesPendientes,
    getCostosPendientes,
    getClientesDeCuenta,
    getRentabilidadCuenta,
    estaCuentaPagadaEsteMes,
    getDiasAtraso,
    recargarDatos: loadAllData
  };
};
