'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { dbHelpers } from '@/lib/supabase';
import { obtenerInfoMesActivo, formatoMoneda } from '@/lib/utils';
import type { 
  Banco, 
  Movimiento, 
  PrestamoFamiliar, 
  PagoPendiente, 
  HistorialMensual,
  SaldosBancos 
} from '@/lib/types';
import { BANCOS } from '@/lib/types';

export function useGastos() {
const [mesActivoActual, setMesActivoActual] = useState<string>(() => {
  // Calcular mes actual como fallback inicial
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${año}-${mes}`;
});

// Cargar mes activo desde la base de datos al iniciar
useEffect(() => {
  const cargarMesActivoGlobal = async () => {
    try {
      const mesGlobal = await dbHelpers.getMesActivoGlobal();
      if (mesGlobal && mesGlobal !== mesActivoActual) {
        setMesActivoActual(mesGlobal);
      }
    } catch (error) {
      console.error('Error cargando mes activo global:', error);
    }
  };

  cargarMesActivoGlobal();
}, []);
  const [bancos, setBancos] = useState<SaldosBancos>({
    'Banco de Bogotá': 0,
    'Nequi': 0,
    'Daviplata': 0,
    'Colpatria': 0,
    'Bolsillo': 0,
    'Efectivo': 0,
    'Préstamos': 0
  });

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [prestamosActivos, setPrestamosActivos] = useState<PrestamoFamiliar[]>([]);
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [historialMensual, setHistorialMensual] = useState<HistorialMensual[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const infoMesActivo = obtenerInfoMesActivo(mesActivoActual);

  const cargarSaldoPrestamos = useCallback(async () => {
    try {
      const prestamos = await dbHelpers.getPrestamosActivos();
      
      if (prestamos && prestamos.length > 0) {
        const totalPrestamos = prestamos.reduce((sum, prestamo) => {
          return sum + (prestamo.valor_pendiente || prestamo.valor || 0);
        }, 0);
        setBancos(prev => ({ ...prev, 'Préstamos': totalPrestamos }));
      } else {
        setBancos(prev => ({ ...prev, 'Préstamos': 0 }));
      }
    } catch (error) {
      console.error('Error al cargar préstamos:', error);
      toast.error('Error al cargar los préstamos');
    }
  }, []);

  const cargarMovimientos = useCallback(async (mesEspecifico?: string) => {
    try {
      setLoading(true);

      const mesACargar = mesEspecifico || mesActivoActual;
      console.log('📅 Cargando movimientos del mes:', mesACargar);

      const movimientosData = await dbHelpers.getMovimientos(mesACargar);
      
      console.log('📦 Movimientos cargados:', movimientosData?.length || 0);
      console.log('📋 Primeros 3 movimientos:', movimientosData?.slice(0, 3));

      const prestamos = await dbHelpers.getPrestamosActivos();
      const saldoPrestamos = prestamos && prestamos.length > 0
        ? prestamos.reduce((sum, p) => sum + (p.valor_pendiente || 0), 0)
        : 0;

      const nuevosBancos: SaldosBancos = {
        'Banco de Bogotá': 0,
        'Nequi': 0,
        'Daviplata': 0,
        'Colpatria': 0,
        'Bolsillo': 0,
        'Efectivo': 0,
        'Préstamos': saldoPrestamos
      };

      movimientosData?.forEach(mov => {
        if (mov.tipo === 'ingreso' && mov.banco_destino && mov.banco_destino !== 'Préstamos' && mov.banco_destino !== 'Por recibir') {
          nuevosBancos[mov.banco_destino] = (nuevosBancos[mov.banco_destino] || 0) + mov.valor;
        } else if (mov.tipo === 'gasto' && mov.banco_destino && mov.banco_destino !== 'Préstamos' && mov.banco_destino !== 'Por recibir') {
          nuevosBancos[mov.banco_destino] = (nuevosBancos[mov.banco_destino] || 0) - mov.valor;
        } else if (mov.tipo === 'transferencia' && mov.banco_origen && mov.banco_destino) {
          if (mov.banco_origen !== 'Préstamos' && mov.banco_origen !== 'Por recibir') {
            nuevosBancos[mov.banco_origen] = (nuevosBancos[mov.banco_origen] || 0) - mov.valor;
          }
          if (mov.banco_destino !== 'Préstamos' && mov.banco_destino !== 'Por recibir') {
            nuevosBancos[mov.banco_destino] = (nuevosBancos[mov.banco_destino] || 0) + mov.valor;
          }
        }
      });

      console.log('💰 Saldos calculados:', nuevosBancos);

      setBancos(nuevosBancos);
      setMovimientos(movimientosData || []);
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setError('Error al cargar los movimientos');
      toast.error('Error al cargar los movimientos');
    } finally {
      setLoading(false);
    }
  }, [mesActivoActual]);

  const cargarPrestamos = useCallback(async () => {
    try {
      const prestamos = await dbHelpers.getPrestamosActivos();
      setPrestamosActivos(prestamos || []);
      
      if (prestamos && prestamos.length > 0) {
        const totalPrestamos = prestamos.reduce((sum, prestamo) => {
          return sum + (prestamo.valor_pendiente || prestamo.valor || 0);
        }, 0);
        setBancos(prev => ({ ...prev, 'Préstamos': totalPrestamos }));
      } else {
        setBancos(prev => ({ ...prev, 'Préstamos': 0 }));
      }
    } catch (error) {
      console.error('Error al cargar préstamos:', error);
      toast.error('Error al cargar los préstamos');
    }
  }, []);

  const cargarPagos = useCallback(async (mesEspecifico?: string) => {
    try {
      const mesACargar = mesEspecifico || mesActivoActual;
      const pagos = await dbHelpers.getPagosPendientes(mesACargar);
      setPagosPendientes(pagos || []);
    } catch (error) {
      console.error('Error al cargar pagos pendientes:', error);
      toast.error('Error al cargar los pagos pendientes');
    }
  }, [mesActivoActual]);

  const cargarHistorial = useCallback(async () => {
    try {
      const historial = await dbHelpers.getHistorialMensual();
      setHistorialMensual(historial || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar el historial');
    }
  }, []);

  // ✅ ACTUALIZACIÓN OPTIMISTA: Igual que HTML/JS
  const registrarIngreso = useCallback(async (
    banco: Banco,
    valor: number,
    descripcion: string,
    categoria: string
  ) => {
    try {
      // Validar que no se use "Por recibir" para ingresos normales
      if (banco === 'Por recibir') {
        toast.error('No puedes registrar ingresos en "Por recibir". Usa los préstamos familiares.');
        return;
      }

      // 1. ACTUALIZAR INMEDIATAMENTE (como HTML/JS)
      const fecha = new Date().toISOString();
      const nuevoMovimiento: Movimiento = {
        id: Date.now(), // ID temporal
        tipo: 'ingreso',
        valor,
        descripcion,
        categoria,
        banco_destino: banco,
        fecha,
        mes_contable: mesActivoActual
      };

      // Actualizar estado local inmediatamente
      setBancos(prev => ({
        ...prev,
        [banco]: prev[banco] + valor
      }));

      setMovimientos(prev => [nuevoMovimiento, ...prev]);
      setRefreshKey(prev => prev + 1);

      // 2. Guardar en Supabase en segundo plano
      await dbHelpers.insertMovimiento({
        tipo: 'ingreso',
        valor,
        descripcion,
        categoria,
        banco_destino: banco,
        fecha,
        mes_contable: mesActivoActual
      });

      toast.success('Ingreso registrado correctamente');
      
    } catch (error) {
      // Si falla, revertir cambios
      console.error('Error al registrar ingreso:', error);
      toast.error('Error al registrar el ingreso');
      await cargarMovimientos(); // Solo recargar si hay error
      throw error;
    }
  }, [mesActivoActual, cargarMovimientos]);

  // ✅ ACTUALIZACIÓN OPTIMISTA para gastos
  const registrarGasto = useCallback(async (
    banco: Banco,
    valor: number,
    descripcion: string,
    categoria: string
  ) => {
    try {
      if (valor > bancos[banco]) {
        throw new Error(`Saldo insuficiente en ${banco}`);
      }

      // 1. Actualizar inmediatamente
      const fecha = new Date().toISOString();
      const nuevoMovimiento: Movimiento = {
        id: Date.now(),
        tipo: 'gasto',
        valor,
        descripcion,
        categoria,
        banco_destino: banco,
        fecha,
        mes_contable: mesActivoActual
      };

      setBancos(prev => ({
        ...prev,
        [banco]: prev[banco] - valor
      }));
      
      setMovimientos(prev => [nuevoMovimiento, ...prev]);
      setRefreshKey(prev => prev + 1);

      // 2. Guardar en Supabase
      await dbHelpers.insertMovimiento({
        tipo: 'gasto',
        valor,
        descripcion,
        categoria,
        banco_destino: banco,
        fecha,
        mes_contable: mesActivoActual
      });

      toast.success('Gasto registrado correctamente');
      
    } catch (error) {
      console.error('Error al registrar gasto:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar el gasto');
      await cargarMovimientos(); // Solo recargar si hay error
      throw error;
    }
  }, [mesActivoActual, cargarMovimientos, bancos]);

  // ✅ ACTUALIZACIÓN OPTIMISTA para transferencias
  const registrarTransferencia = useCallback(async (
    bancoOrigen: Banco,
    bancoDestino: Banco,
    valor: number,
    descripcion: string
  ) => {
    try {
      if (valor > bancos[bancoOrigen]) {
        throw new Error(`Saldo insuficiente en ${bancoOrigen}`);
      }

      // 1. Actualizar inmediatamente
      const fecha = new Date().toISOString();
      const nuevoMovimiento: Movimiento = {
        id: Date.now(),
        tipo: 'transferencia',
        valor,
        descripcion,
        banco_origen: bancoOrigen,
        banco_destino: bancoDestino,
        fecha,
        mes_contable: mesActivoActual
      };

      setBancos(prev => ({
        ...prev,
        [bancoOrigen]: prev[bancoOrigen] - valor,
        [bancoDestino]: prev[bancoDestino] + valor
      }));
      
      setMovimientos(prev => [nuevoMovimiento, ...prev]);
      setRefreshKey(prev => prev + 1);

      // 2. Guardar en Supabase
      await dbHelpers.insertMovimiento({
        tipo: 'transferencia',
        valor,
        descripcion,
        banco_origen: bancoOrigen,
        banco_destino: bancoDestino,
        fecha,
        mes_contable: mesActivoActual
      });

      toast.success('Transferencia realizada correctamente');
      
    } catch (error) {
      console.error('Error al registrar transferencia:', error);
      toast.error(error instanceof Error ? error.message : 'Error al realizar la transferencia');
      await cargarMovimientos(); // Solo recargar si hay error
      throw error;
    }
  }, [mesActivoActual, cargarMovimientos, bancos]);

const registrarPrestamo = useCallback(async (
  bancoOrigen: Banco,
  valor: number,
  persona: string,
  descripcion: string
) => {
  try {
    // Si es "Por recibir", NO validar saldo ni descontar de ningún banco
    const esPorRecibir = bancoOrigen === 'Por recibir';

    if (!esPorRecibir) {
      // Validar saldo suficiente solo si NO es "Por recibir"
      if (valor > bancos[bancoOrigen]) {
        toast.error(`Saldo insuficiente en ${bancoOrigen}. Tiene: ${formatoMoneda(bancos[bancoOrigen])}, Necesita: ${formatoMoneda(valor)}`);
        return; // ← Salir sin hacer nada, no lanzar error
      }
    }

      const fecha = new Date().toISOString();

      const nuevoPrestamo: PrestamoFamiliar = {
        id: Date.now(),
        persona,
        valor,
        valor_pendiente: valor,
        descripcion,
        banco_origen: bancoOrigen,
        fecha_prestamo: fecha,
        activo: true
      };

      if (esPorRecibir) {
        // Si es "Por recibir", solo actualizar préstamos, NO crear movimiento ni descontar saldo
        setPrestamosActivos(prev => [nuevoPrestamo, ...prev]);
        setBancos(prev => ({
          ...prev,
          'Préstamos': prev['Préstamos'] + valor
        }));
        setRefreshKey(prev => prev + 1);

        // Guardar solo el préstamo en Supabase (NO el movimiento)
        await dbHelpers.insertPrestamo({
          persona,
          valor,
          valor_pendiente: valor,
          descripcion,
          banco_origen: bancoOrigen,
          fecha_prestamo: fecha,
          activo: true
        });

        toast.success(`Préstamo de ${persona} registrado (por recibir)`);
        await cargarPrestamos();

      } else {
        // Si es un banco real, hacer el flujo normal (descontar saldo y crear movimiento)
        const nuevoMovimiento: Movimiento = {
          id: Date.now(),
          tipo: 'transferencia',
          valor,
          descripcion: `Préstamo a ${persona} - ${descripcion}`,
          categoria: 'Préstamos',
          banco_origen: bancoOrigen,
          banco_destino: 'Por recibir',
          fecha,
          mes_contable: mesActivoActual
        };

        // Actualizar estados locales
        setBancos(prev => ({
          ...prev,
          [bancoOrigen]: prev[bancoOrigen] - valor,
          'Préstamos': prev['Préstamos'] + valor
        }));

        setMovimientos(prev => [nuevoMovimiento, ...prev]);
        setPrestamosActivos(prev => [nuevoPrestamo, ...prev]);
        setRefreshKey(prev => prev + 1);

        // Guardar en Supabase
        await dbHelpers.insertPrestamo({
          persona,
          valor,
          valor_pendiente: valor,
          descripcion,
          banco_origen: bancoOrigen,
          fecha_prestamo: fecha,
          activo: true
        });

        await dbHelpers.insertMovimiento({
          tipo: 'transferencia',
          valor,
          descripcion: `Préstamo a ${persona} - ${descripcion}`,
          categoria: 'Préstamos',
          banco_origen: bancoOrigen,
          banco_destino: 'Por recibir',
          fecha,
          mes_contable: mesActivoActual
        });

        toast.success(`Préstamo de ${persona} registrado correctamente`);
        await cargarPrestamos();
      }

    } catch (error) {
      console.error('Error al registrar préstamo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar el préstamo');
      // Solo recargar si hay error
      await Promise.all([cargarMovimientos(), cargarPrestamos()]);
      throw error;
    }
  }, [mesActivoActual, cargarMovimientos, cargarPrestamos, bancos]);

  const registrarAbonoPrestamo = useCallback(async (
    idPrestamo: number,
    valorAbono: number,
    bancoDestino: Banco,
    valorPendiente: number
  ) => {
    try {
      const nuevoValorPendiente = valorPendiente - valorAbono;
      const fecha = new Date().toISOString();
      const prestamo = prestamosActivos.find(p => p.id === idPrestamo);

      // 1. Actualizar estados locales inmediatamente
      const nuevoMovimiento: Movimiento = {
        id: Date.now(),
        tipo: 'transferencia',
        valor: valorAbono,
        descripcion: `Abono préstamo de ${prestamo?.persona} (${nuevoValorPendiente > 0 ? `${nuevoValorPendiente} pendiente` : 'completamente pagado'})`,
        categoria: 'Reembolso préstamos',
        banco_origen: 'Por recibir',
        banco_destino: bancoDestino,
        fecha,
        mes_contable: mesActivoActual
      };

      // Actualizar saldos
      setBancos(prev => ({
        ...prev,
        [bancoDestino]: prev[bancoDestino] + valorAbono,
        'Préstamos': prev['Préstamos'] - valorAbono
      }));

      // Actualizar movimientos
      setMovimientos(prev => [nuevoMovimiento, ...prev]);

      // Actualizar préstamo en la lista
      setPrestamosActivos(prev => prev.map(p => 
        p.id === idPrestamo 
          ? { ...p, valor_pendiente: nuevoValorPendiente, activo: nuevoValorPendiente > 0, fecha_ultimo_abono: fecha }
          : p
      ).filter(p => p.activo || p.valor_pendiente > 0)); // Filtrar préstamos pagados

      setRefreshKey(prev => prev + 1);

      // 2. Guardar en Supabase en segundo plano
      await dbHelpers.updatePrestamo(idPrestamo, {
        valor_pendiente: nuevoValorPendiente,
        activo: nuevoValorPendiente > 0,
        fecha_ultimo_abono: fecha
      });

      await dbHelpers.insertMovimiento({
        tipo: 'transferencia',
        valor: valorAbono,
        descripcion: `Abono préstamo de ${prestamo?.persona} (${nuevoValorPendiente > 0 ? `${nuevoValorPendiente} pendiente` : 'completamente pagado'})`,
        categoria: 'Reembolso préstamos',
        banco_origen: 'Por recibir',
        banco_destino: bancoDestino,
        fecha,
        mes_contable: mesActivoActual
      });

      toast.success(nuevoValorPendiente > 0 
        ? `Abono registrado correctamente. Pendiente: ${nuevoValorPendiente}`
        : 'Préstamo completamente pagado'
      );
      
    } catch (error) {
      console.error('Error al registrar abono:', error);
      toast.error('Error al registrar el abono');
      // Solo recargar si hay error
      await Promise.all([cargarMovimientos(), cargarPrestamos()]);
      throw error;
    }
  }, [mesActivoActual, cargarMovimientos, cargarPrestamos, prestamosActivos]);

  const eliminarPrestamo = useCallback(async (idPrestamo: number) => {
    try {
      await dbHelpers.deletePrestamo(idPrestamo);
      await cargarPrestamos();
      toast.success('Préstamo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar préstamo:', error);
      toast.error('Error al eliminar el préstamo');
      throw error;
    }
  }, [cargarPrestamos]);

  const agregarPagoPendiente = useCallback(async (
    descripcion: string,
    valor: number,
    categoria: string,
    bancoDestino?: Banco,
    fechaVencimiento?: string
  ) => {
    try {
      await dbHelpers.insertPagoPendiente({
        descripcion,
        valor,
        categoria,
        banco_destino: bancoDestino || null,
        fecha_vencimiento: fechaVencimiento || null,
        completado: false,
        mes_contable: mesActivoActual // ✅ Agregar mes de creación
      });

      await cargarPagos();
      toast.success('Pago pendiente agregado correctamente');
    } catch (error) {
      console.error('Error al agregar pago pendiente:', error);
      toast.error('Error al agregar el pago pendiente');
      throw error;
    }
  }, [cargarPagos, mesActivoActual]);

 // ============================================
// ✅ FUNCIÓN COMPLETARPAGO - NUEVA VERSIÓN CON ACTUALIZACIÓN OPTIMISTA
// ============================================
const completarPago = useCallback(async (
  idPago: number,
  bancoDestino: Banco,
  valor?: number
) => {
  console.log('🟦 Estado de bancos AL INICIAR completarPago:', bancos);
  try {
    const pago = pagosPendientes.find(p => p.id === idPago);
    if (!pago) throw new Error('Pago no encontrado');

    const valorPago = valor || pago.valor;
    
// 🔍 DEBUG TEMPORAL
console.log('🔵 Intentando pagar:', {
  pago: pago.descripcion,
  valor: valorPago,
  banco: bancoDestino,
  saldoActual: bancos[bancoDestino],
  todosLosBancos: bancos
});

    // Validar saldo suficiente
    if (valorPago > bancos[bancoDestino]) {
      throw new Error(`Saldo insuficiente en ${bancoDestino}`);
    }

    const fecha = new Date().toISOString();

    // 1️⃣ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE

    console.log('🔵 ANTES - Saldos:', bancos);
    console.log('🔵 ANTES - Movimientos:', movimientos.length);
    console.log('🔵 ANTES - Pagos pendientes:', pagosPendientes.length);
    
    // Actualizar saldos de bancos
    setBancos(prev => ({
      ...prev,
      [bancoDestino]: prev[bancoDestino] - valorPago
    }));
    console.log('🟢 setBancos ejecutado - restó', valorPago);
    
    // Crear el movimiento de gasto
    const nuevoMovimiento: Movimiento = {
      id: Date.now(),
      tipo: 'gasto',
      valor: valorPago,
      descripcion: `Pago: ${pago.descripcion}`,
      categoria: pago.categoria || 'Pago pendiente',
      banco_destino: bancoDestino,
      fecha,
      mes_contable: mesActivoActual
    };

    console.log('🟢 Nuevo movimiento creado:', nuevoMovimiento);

    // Agregar movimiento a la lista
    setMovimientos(prev => [nuevoMovimiento, ...prev]);

    console.log('🟢 setMovimientos ejecutado');

    // Marcar pago como completado en el estado local
    setPagosPendientes(prev =>
      prev.map(p =>
        p.id === idPago
          ? {
              ...p,
              completado: true,
              fecha_completado: fecha,
              banco_destino: bancoDestino,
              valor_pagado: valorPago
            }
          : p
      )
    );

    console.log('🟢 setPagosPendientes ejecutado');

    // 2️⃣ FORZAR RE-RENDER INMEDIATO
    console.log('🟡 Ejecutando setRefreshKey...');
    setRefreshKey(prev => {
  console.log('🟡 RefreshKey cambió de', prev, 'a', prev + 1);
  return prev + 1;
});
console.log('🔵 RefreshKey actual en el hook:', refreshKey);
    // 3️⃣ GUARDAR EN SUPABASE EN SEGUNDO PLANO

    // Registrar el movimiento de gasto
    await dbHelpers.insertMovimiento({
      tipo: 'gasto',
      valor: valorPago,
      descripcion: `Pago: ${pago.descripcion}`,
      categoria: pago.categoria || 'Pago pendiente',
      banco_destino: bancoDestino,
      fecha,
      mes_contable: mesActivoActual
    });

    // Marcar como completado en Supabase
    await dbHelpers.updatePagoPendiente(idPago, {
      completado: true,
      fecha_completado: fecha,
      banco_destino: bancoDestino,
      valor_pagado: valorPago
    });

    // 4️⃣ LÓGICA DE REGENERACIÓN (si es de mes anterior)
    const pagoMesContable = pago.mes_contable || mesActivoActual;
    const esMesAnterior = pagoMesContable < mesActivoActual;
    
    if (esMesAnterior) {
      // Calcular nueva fecha de vencimiento si existe
      let nuevaFechaVencimiento = null;
      if (pago.fecha_vencimiento) {
        const fechaOriginal = new Date(pago.fecha_vencimiento);
        const [anioActual, mesActual] = mesActivoActual.split('-').map(Number);
        const diaDelMes = fechaOriginal.getDate();
        nuevaFechaVencimiento = new Date(anioActual, mesActual - 1, diaDelMes).toISOString();
      }

      // Crear nuevo pago para el mes actual
      const nuevoPago = {
        descripcion: pago.descripcion,
        valor: pago.valor,
        categoria: pago.categoria,
        banco_destino: null,
        fecha_vencimiento: nuevaFechaVencimiento,
        completado: false,
        mes_contable: mesActivoActual
      };

      // Agregar a estado local
      setPagosPendientes(prev => [{
        id: Date.now() + 1, // ID temporal
        ...nuevoPago
      } as PagoPendiente, ...prev]);

      // Guardar en Supabase
      await dbHelpers.insertPagoPendiente(nuevoPago);

      toast.success('Pago registrado y creado nuevo para este mes');
    } else {
      toast.success('Pago registrado correctamente');
    }

    console.log('✅ COMPLETADO - Todo ejecutado correctamente');
    console.log('✅ NO se llama a cargarMovimientos ni cargarPagos');

    // NO llamar a cargarMovimientos() ni cargarPagos() aquí
    // Ya actualizamos todo localmente
    
  } catch (error) {
    console.error('Error al completar pago:', error);
    toast.error(error instanceof Error ? error.message : 'Error al registrar el pago');
    
    // Si hay error, recargar todo para revertir
    await Promise.all([cargarMovimientos(), cargarPagos()]);
    throw error;
  }
}, [mesActivoActual, pagosPendientes, bancos, cargarMovimientos, cargarPagos]);

const eliminarPagoPendiente = useCallback(async (idPago: number) => {
  try {
    await dbHelpers.deletePagoPendiente(idPago);
    await cargarPagos();
    toast.success('Pago pendiente eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar pago pendiente:', error);
    toast.error('Error al eliminar el pago pendiente');
    throw error;
  }
}, [cargarPagos]);

const editarPagoPendiente = useCallback(async (
  id: number,
  descripcion: string,
  valor: number,
  fechaVencimiento?: string,
  categoria?: string
) => {
  try {
    setPagosPendientes(prev => 
      prev.map(pago => {
        if (pago.id === id) {
          const updated = {
            ...pago,
            descripcion,
            valor,
            fecha_vencimiento: fechaVencimiento || pago.fecha_vencimiento,
            categoria: categoria || pago.categoria
          };
          return updated;
        }
        return pago;
      })
    );

    setRefreshKey(prev => {
      return prev + 1;
    });

    await dbHelpers.updatePagoPendiente(id, {
      descripcion,
      valor,
      fecha_vencimiento: fechaVencimiento || null,
      categoria: categoria || null
    });

    toast.success('Pago actualizado correctamente');
    
  } catch (error) {
    console.error('❌ Error al editar pago pendiente:', error);
    toast.error('Error al actualizar el pago');
    await cargarPagos();
    throw error;
  }
}, [cargarPagos, pagosPendientes]);

const cambiarMesActivo = useCallback(async () => {
  try {
    const nuevoMes = infoMesActivo.proximoFormato;
    setMesActivoActual(nuevoMes);
    // NO actualizar la BD aquí - solo estamos navegando al mes siguiente
    // Pasar el nuevoMes directamente para evitar problemas de sincronización de estado
    await Promise.all([
      cargarMovimientos(nuevoMes),
      cargarPagos(nuevoMes)
    ]);
    toast.success(`Visualizando ${infoMesActivo.proximoNombre}`);
  } catch (error) {
    console.error('Error al cambiar mes activo:', error);
    toast.error('Error al cambiar el mes activo');
  }
}, [infoMesActivo, cargarMovimientos, cargarPagos]);

const navegarMes = useCallback(async (nuevoMes: string) => {
  try {
    setMesActivoActual(nuevoMes);
    // NO actualizar la BD aquí - solo estamos navegando/consultando
    // Pasar el nuevoMes directamente para evitar problemas de sincronización de estado
    await Promise.all([
      cargarMovimientos(nuevoMes),
      cargarPagos(nuevoMes)
    ]);
    toast.success(`Visualizando ${obtenerInfoMesActivo(nuevoMes).nombreCompleto}`);
  } catch (error) {
    console.error('Error al cambiar mes:', error);
    toast.error('Error al cambiar el mes');
  }
}, [cargarMovimientos, cargarPagos]);

const cerrarMes = useCallback(async () => {
  try {
    const fechaActual = new Date();
    const [anio, mes] = mesActivoActual.split('-').map(Number);

    const ingresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.valor, 0);
    
    const gastos = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + m.valor, 0);

    // Guardar historial mensual
    await dbHelpers.insertHistorialMensual({
      mes,
      año: anio,
      nombre_mes: infoMesActivo.nombreCompleto.split(' ')[0].toLowerCase(),
      fecha_cierre: fechaActual.toISOString(),
      ingresos,
      gastos,
      balance: ingresos - gastos,
      saldos: bancos,
      movimientos,
      mes_contable: mesActivoActual
    });

    // Eliminar movimientos del mes cerrado
    await dbHelpers.deleteMovimientosByMes(mesActivoActual);

    // ✅ LÓGICA: Gestión de pagos pendientes al cerrar mes
    // Obtener TODOS los pagos del mes que se está cerrando (completados y pendientes)
    const pagosActuales = await dbHelpers.getPagosPendientes(mesActivoActual);

    console.log(`📋 Cerrando mes ${mesActivoActual}: ${pagosActuales?.length || 0} pagos encontrados para regenerar`);

    if (pagosActuales && pagosActuales.length > 0) {
      // Regenerar TODOS los pagos (completados y no completados) para el nuevo mes
      for (const pago of pagosActuales) {
        // Calcular nueva fecha de vencimiento (mismo día del próximo mes)
        let nuevaFechaVencimiento = null;
        if (pago.fecha_vencimiento) {
          const fechaOriginal = new Date(pago.fecha_vencimiento);
          const [anioProx, mesProx] = infoMesActivo.proximoFormato.split('-').map(Number);
          const diaDelMes = fechaOriginal.getDate();
          nuevaFechaVencimiento = new Date(anioProx, mesProx - 1, diaDelMes).toISOString();
        }

        // Crear nuevo pago para el siguiente mes (siempre pendiente)
        await dbHelpers.insertPagoPendiente({
          descripcion: pago.descripcion,
          valor: pago.valor,
          categoria: pago.categoria,
          banco_destino: null,
          fecha_vencimiento: nuevaFechaVencimiento,
          completado: false,
          mes_contable: infoMesActivo.proximoFormato
        });
      }

      // Eliminar TODOS los pagos del mes que se está cerrando
      for (const pago of pagosActuales) {
        await dbHelpers.deletePagoPendiente(pago.id);
      }
    }

    // Cambiar al siguiente mes
    const nuevoMes = infoMesActivo.proximoFormato;
    setMesActivoActual(nuevoMes);
    await dbHelpers.setMesActivoGlobal(nuevoMes);

    // Reiniciar saldos (mantener préstamos)
    setBancos(prev => ({
      ...Object.fromEntries(BANCOS.map(banco => [banco, banco === 'Préstamos' ? prev['Préstamos'] : 0])) as SaldosBancos
    }));
    
    setMovimientos([]);

    // Recargar datos (pasar nuevoMes explícitamente porque el estado aún no se actualizó)
    await Promise.all([
      cargarSaldoPrestamos(),
      cargarHistorial(),
      cargarPagos(nuevoMes)
    ]);

    toast.success(`Mes ${infoMesActivo.nombreCompleto} cerrado correctamente. Ahora activo: ${infoMesActivo.proximoNombre}`);
  } catch (error) {
    console.error('Error al cerrar mes:', error);
    toast.error('Error al cerrar el mes');
    throw error;
  }
}, [mesActivoActual, movimientos, bancos, infoMesActivo, cargarSaldoPrestamos, cargarHistorial, cargarPagos]);

  const totales = {
    // Excluir movimientos de streaming (identificados por categoría)
    ingresos: movimientos
      .filter(m =>
        m.tipo === 'ingreso' &&
        !m.categoria?.startsWith('Venta de cuentas')
      )
      .reduce((sum, m) => sum + m.valor, 0),

    gastos: movimientos
      .filter(m =>
        m.tipo === 'gasto' &&
        !m.categoria?.startsWith('Pago de cuentas')
      )
      .reduce((sum, m) => sum + m.valor, 0),

    prestamos: movimientos
      .filter(m => m.tipo === 'transferencia' && m.categoria === 'Préstamos')
      .reduce((sum, m) => sum + m.valor, 0),

    reembolsos: movimientos
      .filter(m => m.tipo === 'transferencia' && m.categoria === 'Reembolso préstamos')
      .reduce((sum, m) => sum + m.valor, 0),

    get balance() {
      return this.ingresos - this.gastos - this.prestamos + this.reembolsos;
    },

    totalBancos: Object.entries(bancos)
      .filter(([banco]) => banco !== 'Préstamos')
      .reduce((sum, [, valor]) => sum + valor, 0),

    totalPrestado: prestamosActivos.reduce((sum, p) => sum + (p.valor_pendiente || 0), 0)
  };

  // Este useEffect ya no es necesario porque cargamos desde la BD al inicio
  // useEffect(() => {
  //   const mesGuardado = localStorage.getItem('mesActivoActual');
  //   if (mesGuardado) {
  //     setMesActivoActual(mesGuardado);
  //   }
  // }, []);

  useEffect(() => {
    const inicializar = async () => {
      try {
        setLoading(true);
        await Promise.all([
          cargarPrestamos(),
          cargarMovimientos(),
          cargarPagos(),
          cargarHistorial()
        ]);
      } catch (error) {
        console.error('Error al inicializar:', error);
        setError('Error al cargar la aplicación');
      } finally {
        setLoading(false);
      }
    };

    inicializar();
  }, [cargarMovimientos, cargarPrestamos, cargarPagos, cargarHistorial]);

  return {
    mesActivo: mesActivoActual,
    mesActivoActual, // Mantener por compatibilidad temporal
    infoMesActivo,
    bancos,
    movimientos,
    prestamosActivos,
    pagosPendientes,
    historialMensual,
    totales,
    loading,
    error,
    refreshKey,
    registrarIngreso,
    registrarGasto,
    registrarTransferencia,
    registrarPrestamo,
    registrarAbonoPrestamo,
    eliminarPrestamo,
    navegarMes,
    agregarPagoPendiente,
    editarPagoPendiente,
    completarPago,
    eliminarPagoPendiente,
    cambiarMesActivo,
    cerrarMes,
    cargarMovimientos,
    cargarPrestamos,
    cargarPagos,
    cargarHistorial
  };
}