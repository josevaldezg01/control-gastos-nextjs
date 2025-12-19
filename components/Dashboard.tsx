'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  ArrowRight,
  Clock,
  FileText,
  Plus,
  Sparkles,
  Target,
  Activity
} from 'lucide-react';
import { Card, Button, Loading } from '@/components/ui';
import { useGastos } from '@/hooks/useGastos';
import { formatoMoneda } from '@/lib/utils';
import { SaldosBancos } from './SaldosBancos';
import { GraficosEstadisticas } from './GraficosEstadisticas';
import { RegistrarMovimiento } from './RegistrarMovimiento';
import { FiltroMovimientos } from './FiltroMovimientos';
import { HistorialMovimientos } from './HistorialMovimientos';
import { PrestamosFamiliares } from './PrestamosFamiliares';
import { PagosPendientes } from './PagosPendientes';
import { MesesAnteriores } from './MesesAnteriores';

export const Dashboard: React.FC = () => {
  const router = useRouter();
  const {
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
    agregarPagoPendiente,
    completarPago,
    eliminarPagoPendiente,
    editarPagoPendiente,
    registrarAbonoPrestamo,
    eliminarPrestamo,
    navegarMes,
    cambiarMesActivo,
    cerrarMes
  } = useGastos();

  useEffect(() => {
  console.log('🔷 Dashboard detectó cambio de refreshKey:', refreshKey);
}, [refreshKey]);

  const [showMesesAnteriores, setShowMesesAnteriores] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full animate-ping"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
        </div>
        <div className="relative text-center text-white">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <PiggyBank className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-white/20 rounded animate-pulse w-48 mx-auto"></div>
            <div className="h-2 bg-white/20 rounded animate-pulse w-32 mx-auto"></div>
          </div>
          <p className="mt-4 text-lg font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Cargando control de gastos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-6xl mb-4 animate-bounce">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Error al cargar</h1>
          <p className="mb-4 text-red-200">{error}</p>
          <Button onClick={() => window.location.reload()} variant="danger">
            Recargar página
          </Button>
        </div>
      </div>
    );
  }

  const handleCerrarMes = async () => {
    if (window.confirm(`¿Estás seguro de cerrar ${infoMesActivo.nombreCompleto}? Esta acción no se puede deshacer.`)) {
      try {
        await cerrarMes();
      } catch (error) {
        console.error('Error al cerrar mes:', error);
      }
    }
  };

  const handleCambiarMes = async () => {
    if (window.confirm(`¿Cambiar a ${infoMesActivo.proximoNombre}? Todos los movimientos nuevos se registrarán en ${infoMesActivo.proximoNombre}`)) {
      try {
        await cambiarMesActivo();
      } catch (error) {
        console.error('Error al cambiar mes:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 relative">
      {/* Efectos de fondo dinámicos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-500/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-violet-400/10 to-purple-500/10 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header glassmorphism */}
      <header className="relative backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  Control de Gastos
                </h1>
                <p className="text-white/70 text-sm">Sistema avanzado de finanzas personales</p>
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => router.push('/notesflow')}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300"
              icon={<FileText className="w-4 h-4" />}
            >
              NotesFlow
            </Button>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Selector de Mes Activo con diseño futurista */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Mes Activo</h2>
                <div className="flex items-center space-x-3">
                  {/* Botón Mes Anterior */}
                  <Button
                    onClick={() => {
                      const [año, mes] = mesActivoActual.split('-').map(Number);
                      const nuevoMes = mes === 1 ? 12 : mes - 1;
                      const nuevoAño = mes === 1 ? año - 1 : año;
                      navegarMes(`${nuevoAño}-${String(nuevoMes).padStart(2, '0')}`);
                    }}
                    variant="secondary"
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                  >
                    ←
                  </Button>

                  {/* Mes Actual */}
                  <div className="bg-gradient-to-r from-indigo-500/30 to-purple-600/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
                    <span className="font-bold text-xl text-white">
                      {infoMesActivo.nombreCompleto}
                    </span>
                  </div>

                  {/* Botón Mes Siguiente */}
                  <Button
                    onClick={() => navegarMes(infoMesActivo.proximoFormato)}
                    variant="secondary"
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                  >
                    →
                  </Button>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleCambiarMes}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Cambiar a {infoMesActivo.proximoNombre}
            </Button>
          </div>
        </div>

        {/* Controles del Mes con efectos modernos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Button
            variant="secondary"
            onClick={() => setShowMesesAnteriores(true)}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 h-16 text-lg"
            icon={<Calendar className="w-5 h-5" />}
          >
            Ver Meses Anteriores
          </Button>

          <Button
            variant="warning"
            onClick={() => {
              const section = document.getElementById('pagos-pendientes');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 h-16 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            icon={<Clock className="w-5 h-5" />}
          >
            Pagos Pendientes
          </Button>

          <Button
            variant="danger"
            onClick={handleCerrarMes}
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 border-0 h-16 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            icon={<Target className="w-5 h-5" />}
          >
            Cerrar Mes Actual
          </Button>
        </div>

        {/* Saldos por Banco con diseño moderno */}
        <SaldosBancos key={`bancos-${refreshKey}`} bancos={bancos} />

        {/* Totales con diseño de tarjetas premium */}
        <div key={`totales-${refreshKey}`} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 border border-green-400/30 rounded-3xl p-8 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="w-6 h-6 text-green-300 opacity-60" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-green-200 text-lg mb-2">Ingresos Totales</h3>
              <p className="text-3xl font-black bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                {formatoMoneda(totales.ingresos)}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-red-400/20 to-pink-600/20 border border-red-400/30 rounded-3xl p-8 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="w-6 h-6 text-red-300 opacity-60" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-red-200 text-lg mb-2">Gastos Totales</h3>
              <p className="text-3xl font-black bg-gradient-to-r from-red-300 to-pink-300 bg-clip-text text-transparent">
                {formatoMoneda(totales.gastos)}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-cyan-600/20 border border-blue-400/30 rounded-3xl p-8 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="w-6 h-6 text-blue-300 opacity-60" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-blue-200 text-lg mb-2">Balance Total</h3>
              <p className={`text-3xl font-black bg-gradient-to-r ${
                totales.balance >= 0 
                  ? 'from-green-300 to-emerald-300' 
                  : 'from-red-300 to-pink-300'
              } bg-clip-text text-transparent`}>
                {formatoMoneda(totales.balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Gráficos y Estadísticas */}
        <GraficosEstadisticas 
          bancos={bancos}
          movimientos={movimientos}
          totales={totales}
        />

        {/* Registrar Movimiento */}
        <RegistrarMovimiento 
          registrarIngreso={registrarIngreso}
          registrarGasto={registrarGasto}
          registrarTransferencia={registrarTransferencia}
          registrarPrestamo={registrarPrestamo}
        />

        {/* Filtro y Historial de Movimientos (combinados) */}
        <FiltroMovimientos key={`filtro-${refreshKey}`} movimientos={movimientos} />

        {/* Préstamos Familiares Activos */}
        <PrestamosFamiliares 
          prestamosActivos={prestamosActivos}
          totales={totales}
          registrarAbonoPrestamo={registrarAbonoPrestamo}
          eliminarPrestamo={eliminarPrestamo}
        />

       {/* Pagos Pendientes */}
<section id="pagos-pendientes" className="mb-8">
  <PagosPendientes 
  key={`pagos-${refreshKey}`}
  pagosPendientes={pagosPendientes}
  mesActivoActual={mesActivoActual}
  agregarPagoPendiente={agregarPagoPendiente}
  completarPago={completarPago}
  eliminarPagoPendiente={eliminarPagoPendiente}
  editarPagoPendiente={editarPagoPendiente}
/>
</section>
        </div>

      {/* Modal Meses Anteriores */}
      <MesesAnteriores 
        isOpen={showMesesAnteriores}
        onClose={() => setShowMesesAnteriores(false)}
        historialMensual={historialMensual}
      />
    </div>
  );
};