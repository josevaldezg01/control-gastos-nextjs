'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { dbHelpers } from '@/lib/supabase';
import { obtenerInfoMesActivo } from '@/lib/utils';
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
  const [mesActivoActual, setMesActivoActual] = useState<string>('2025-09');
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

  const cargarMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const movimientosData = await dbHelpers.getMovimientos(mesActivoActual);
      
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
        if (mov.tipo === 'ingreso' && mov.banco_destino && mov.banco_destino !== 'Préstamos') {
          nuevosBancos[mov.banco_destino] = (nuevosBancos[mov.banco_destino] || 0) + mov.valor;
        } else if (mov.tipo === 'gasto' && mov.banco_destino && mov.banco_destino !== 'Préstamos') {
          nuevosBancos[mov.banco_destino] = (nuevosBancos[mov.banco_destino] || 0) - mov.valor;
        } else if (mov.tipo === 'transferencia' && mov.banco_origen && mov.banco_destino) {
          if (mov.banco_origen !== 'Préstamos') {
            nuevosBancos[mov.banco_origen] = (nuevosBancos[mov.banco_origen] || 0) - mov.valor;
          }
          if (mov.banco_destino !== 'Préstamos') {
            nuevosBancos[mov.banco_destino] = (nuevosBancos[mov.banco_destino] || 0) + mov.valor;
          }
        }
      });

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

  const cargarPagos = useCallback(async () => {
    try {
      const pagos = await dbHelpers.getPagosPendientes();
      setPagosPendientes(pagos || []);
    } catch (error) {
      console.error('Error al cargar pagos pendientes:', error);
      toast.error('Error al cargar los pagos pendientes');
    }
  }, []);

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
      if (valor > bancos[bancoOrigen]) {
        throw new Error(`Saldo insuficiente en ${bancoOrigen}`);
      }

      const fecha = new Date().toISOString();

      // 1. Actualizar estado local inmediatamente
      const nuevoMovimiento: Movimiento = {
        id: Date.now(),
        tipo: 'gasto',
        valor,
        descripcion: `Préstamo a ${persona} - ${descripcion}`,
        categoria: 'Préstamos',
        banco_destino: bancoOrigen,
        fecha,
        mes_contable: mesActivoActual
      };

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

      // Actualizar estados locales
      setBancos(prev => ({
        ...prev,
        [bancoOrigen]: prev[bancoOrigen] - valor,
        'Préstamos': prev['Préstamos'] + valor
      }));
      
      setMovimientos(prev => [nuevoMovimiento, ...prev]);
      setPrestamosActivos(prev => [nuevoPrestamo, ...prev]);
      setRefreshKey(prev => prev + 1);

      // 2. Guardar en Supabase en segundo plano
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
        tipo: 'gasto',
        valor,
        descripcion: `Préstamo a ${persona} - ${descripcion}`,
        categoria: 'Préstamos',
        banco_destino: bancoOrigen,
        fecha,
        mes_contable: mesActivoActual
      });

      toast.success(`Préstamo de ${persona} registrado correctamente`);
      
      // 3. Recargar solo préstamos para obtener ID real de Supabase
      await cargarPrestamos();
      
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
        tipo: 'ingreso',
        valor: valorAbono,
        descripcion: `Abono préstamo de ${prestamo?.persona} (${nuevoValorPendiente > 0 ? `${nuevoValorPendiente} pendiente` : 'completamente pagado'})`,
        categoria: 'Reembolso préstamos',
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
        tipo: 'ingreso',
        valor: valorAbono,
        descripcion: `Abono préstamo de ${prestamo?.persona} (${nuevoValorPendiente > 0 ? `${nuevoValorPendiente} pendiente` : 'completamente pagado'})`,
        categoria: 'Reembolso préstamos',
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

  const completarPago = useCallback(async (
    idPago: number,
    bancoDestino: Banco,
    valor?: number
  ) => {
    try {
      const pago = pagosPendientes.find(p => p.id === idPago);
      if (!pago) throw new Error('Pago no encontrado');

      const valorPago = valor || pago.valor;
      const fecha = new Date().toISOString();

      // Registrar el gasto
      await dbHelpers.insertMovimiento({
        tipo: 'gasto',
        valor: valorPago,
        descripcion: `Pago completado: ${pago.descripcion}`,
        categoria: pago.categoria || 'Pago pendiente',
        banco_destino: bancoDestino,
        fecha,
        mes_contable: mesActivoActual
      });

      // Marcar como completado
      await dbHelpers.updatePagoPendiente(idPago, {
        completado: true,
        fecha_completado: fecha,
        banco_destino: bancoDestino,
        valor_pagado: valorPago
      });

      // ✅ NUEVA LÓGICA: Si el pago era de un mes anterior, crear uno nuevo para el mes actual
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
        await dbHelpers.insertPagoPendiente({
          descripcion: pago.descripcion,
          valor: pago.valor,
          categoria: pago.categoria,
          banco_destino: null,
          fecha_vencimiento: nuevaFechaVencimiento,
          completado: false,
          mes_contable: mesActivoActual
        });

        toast.success('Pago registrado y creado nuevo para este mes');
      } else {
        toast.success('Pago registrado correctamente');
      }

      await Promise.all([cargarMovimientos(), cargarPagos()]);
    } catch (error) {
      console.error('Error al completar pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar el pago');
      throw error;
    }
  }, [mesActivoActual, cargarMovimientos, cargarPagos, pagosPendientes]);

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

  const cambiarMesActivo = useCallback(async () => {
    try {
      const nuevoMes = infoMesActivo.proximoFormato;
      setMesActivoActual(nuevoMes);
      localStorage.setItem('mesActivoActual', nuevoMes);
      await cargarMovimientos();
      toast.success(`Mes activo cambiado a ${infoMesActivo.proximoNombre}`);
    } catch (error) {
      console.error('Error al cambiar mes activo:', error);
      toast.error('Error al cambiar el mes activo');
    }
  }, [infoMesActivo, cargarMovimientos]);

  const navegarMes = useCallback(async (nuevoMes: string) => {
    try {
      setMesActivoActual(nuevoMes);
      localStorage.setItem('mesActivoActual', nuevoMes);
      await cargarMovimientos();
      toast.success(`Cambiado a ${obtenerInfoMesActivo(nuevoMes).nombreCompleto}`);
    } catch (error) {
      console.error('Error al cambiar mes:', error);
      toast.error('Error al cambiar el mes');
    }
  }, [cargarMovimientos]);

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

      // ✅ NUEVA LÓGICA: Gestión de pagos pendientes al cerrar mes
      const pagosActuales = await dbHelpers.getPagosPendientes();
      
      if (pagosActuales && pagosActuales.length > 0) {
        // 1. Crear nuevos pagos para el siguiente mes basados en los COMPLETADOS
        const pagosCompletados = pagosActuales.filter(p => p.completado);
        
        for (const pago of pagosCompletados) {
          // Calcular nueva fecha de vencimiento (mismo día del próximo mes)
          let nuevaFechaVencimiento = null;
          if (pago.fecha_vencimiento) {
            const fechaOriginal = new Date(pago.fecha_vencimiento);
            const [anioProx, mesProx] = infoMesActivo.proximoFormato.split('-').map(Number);
            const diaDelMes = fechaOriginal.getDate();
            nuevaFechaVencimiento = new Date(anioProx, mesProx - 1, diaDelMes).toISOString();
          }

          // Crear nuevo pago para el siguiente mes
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

        // 2. Eliminar SOLO los pagos COMPLETADOS
        for (const pago of pagosCompletados) {
          await dbHelpers.deletePagoPendiente(pago.id);
        }

        // 3. Los pagos SIN PAGAR se quedan automáticamente (no se tocan)
      }

      // Cambiar al siguiente mes
      const nuevoMes = infoMesActivo.proximoFormato;
      setMesActivoActual(nuevoMes);
      localStorage.setItem('mesActivoActual', nuevoMes);

      // Reiniciar saldos (mantener préstamos)
      setBancos(prev => ({
        ...Object.fromEntries(BANCOS.map(banco => [banco, banco === 'Préstamos' ? prev['Préstamos'] : 0])) as SaldosBancos
      }));
      
      setMovimientos([]);

      // Recargar datos
      await Promise.all([
        cargarSaldoPrestamos(),
        cargarHistorial(),
        cargarPagos()
      ]);

      toast.success(`Mes ${infoMesActivo.nombreCompleto} cerrado correctamente. Ahora activo: ${infoMesActivo.proximoNombre}`);
    } catch (error) {
      console.error('Error al cerrar mes:', error);
      toast.error('Error al cerrar el mes');
      throw error;
    }
  }, [mesActivoActual, movimientos, bancos, infoMesActivo, cargarSaldoPrestamos, cargarHistorial, cargarPagos]);

  const totales = {
    ingresos: movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.valor, 0),
    gastos: movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0),
    get balance() { return this.ingresos - this.gastos; },
    totalBancos: Object.entries(bancos)
      .filter(([banco]) => banco !== 'Préstamos')
      .reduce((sum, [, valor]) => sum + valor, 0),
    totalPrestado: prestamosActivos.reduce((sum, p) => sum + (p.valor_pendiente || 0), 0)
  };

  useEffect(() => {
    const mesGuardado = localStorage.getItem('mesActivoActual');
    if (mesGuardado) {
      setMesActivoActual(mesGuardado);
    }
  }, []);

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
    mesActivoActual,
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