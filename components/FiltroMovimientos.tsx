'use client';

import React, { useState, useMemo } from 'react';
import { Filter, History, Download, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import { Card, Select, Button } from '@/components/ui';
import { formatoMoneda, formatearFechaCompleta, generarCSV } from '@/lib/utils';
import { BANCOS, CATEGORIAS_INGRESO, CATEGORIAS_GASTO } from '@/lib/types';
import type { Movimiento } from '@/lib/types';

interface FiltroMovimientosProps {
  movimientos: Movimiento[];
}

export const FiltroMovimientos: React.FC<FiltroMovimientosProps> = ({ movimientos }) => {
  const [filtros, setFiltros] = useState({
    banco: '',
    tipo: '',
    categoria: ''
  });

  // Opciones para los selects
  const bancosOptions = BANCOS.map(banco => ({ value: banco, label: banco }));
  const tiposOptions = [
    { value: 'ingreso', label: 'Ingresos' },
    { value: 'gasto', label: 'Gastos' },
    { value: 'transferencia', label: 'Transferencias' }
  ];

  // Combinar todas las categorías disponibles
  const todasCategorias = [...new Set([
    ...CATEGORIAS_INGRESO,
    ...CATEGORIAS_GASTO,
    ...movimientos
      .map(m => m.categoria)
      .filter((cat): cat is string => typeof cat === 'string' && cat.length > 0)
  ])].sort();

  const categoriasOptions = todasCategorias.map(cat => ({ value: cat, label: cat }));

  // Filtrar movimientos (IGUAL QUE HTML/JS)
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(movimiento => {
      const cumpleBanco = !filtros.banco || 
        movimiento.banco_destino === filtros.banco || 
        movimiento.banco_origen === filtros.banco;
      
      const cumpleTipo = !filtros.tipo || movimiento.tipo === filtros.tipo;
      
      const cumpleCategoria = !filtros.categoria || movimiento.categoria === filtros.categoria;

      return cumpleBanco && cumpleTipo && cumpleCategoria;
    });
  }, [movimientos, filtros]);

  // Calcular total filtrado (IGUAL QUE HTML/JS)
  const totalFiltrado = useMemo(() => {
    return movimientosFiltrados.reduce((sum, mov) => sum + mov.valor, 0);
  }, [movimientosFiltrados]);

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({ banco: '', tipo: '', categoria: '' });
  };

  const handleExportarCSV = () => {
    if (movimientosFiltrados.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }

    const datosCSV = movimientosFiltrados.map(mov => ({
      Fecha: formatearFechaCompleta(mov.fecha),
      Tipo: mov.tipo,
      Valor: mov.valor,
      Descripción: mov.descripcion,
      Categoría: mov.categoria || '',
      'Banco Origen': mov.banco_origen || '',
      'Banco Destino': mov.banco_destino || '',
      'Mes Contable': mov.mes_contable
    }));

    generarCSV(datosCSV, `movimientos_${new Date().toISOString().split('T')[0]}`);
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'gasto':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'transferencia':
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTextoMovimiento = (mov: Movimiento) => {
    switch (mov.tipo) {
      case 'ingreso':
        return `+ ${formatoMoneda(mov.valor)} en ${mov.banco_destino} - ${mov.descripcion}`;
      case 'gasto':
        return `- ${formatoMoneda(mov.valor)} en ${mov.banco_destino} - ${mov.descripcion}`;
      case 'transferencia':
        // Ocultar "de Por recibir" en reembolsos de préstamos
        if (mov.banco_origen === 'Por recibir' && mov.categoria === 'Reembolso préstamos') {
          return `↔ ${formatoMoneda(mov.valor)} a ${mov.banco_destino} - ${mov.descripcion}`;
        }
        // Ocultar "a Por recibir" en préstamos
        if (mov.banco_destino === 'Por recibir' && mov.categoria === 'Préstamos') {
          return `↔ ${formatoMoneda(mov.valor)} de ${mov.banco_origen} - ${mov.descripcion}`;
        }
        return `↔ ${formatoMoneda(mov.valor)} de ${mov.banco_origen} a ${mov.banco_destino} - ${mov.descripcion}`;
      default:
        return mov.descripcion;
    }
  };

  const getClaseMovimiento = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'gasto':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      case 'transferencia':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  const hayFiltrosActivos = filtros.banco || filtros.tipo || filtros.categoria;

  return (
    <div className="space-y-6">
      {/* Sección de Filtros */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-900">
            <Filter className="w-5 h-5 mr-2 text-indigo-600" />
            Filtrar Movimientos
          </h2>
          
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Select
            label="Por Banco"
            options={bancosOptions}
            placeholder="-- Todos los Bancos --"
            value={filtros.banco}
            onChange={(e) => handleFiltroChange('banco', e.target.value)}
          />

          <Select
            label="Por Tipo"
            options={tiposOptions}
            placeholder="-- Todos los Tipos --"
            value={filtros.tipo}
            onChange={(e) => handleFiltroChange('tipo', e.target.value)}
          />

          <Select
            label="Por Categoría"
            options={categoriasOptions}
            placeholder="-- Todas las Categorías --"
            value={filtros.categoria}
            onChange={(e) => handleFiltroChange('categoria', e.target.value)}
          />
        </div>

        {/* Total filtrado */}
        <div className="mt-4 text-right">
          <span className="text-lg font-semibold text-indigo-700">
            Total filtrado: {formatoMoneda(totalFiltrado)}
          </span>
        </div>
      </Card>

      {/* Historial de Movimientos Filtrados */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center text-gray-900">
            <History className="w-5 h-5 mr-2 text-indigo-600" />
            Historial de Movimientos
          </h2>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportarCSV}
            icon={<Download className="w-4 h-4" />}
            disabled={movimientosFiltrados.length === 0}
          >
            Exportar CSV
          </Button>
        </div>

        {movimientosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hayFiltrosActivos ? 'No hay movimientos con estos filtros' : 'No hay movimientos'}
            </h3>
            <p className="text-gray-500">
              {hayFiltrosActivos 
                ? 'Intenta cambiar los filtros para ver más resultados' 
                : 'Los movimientos que registres aparecerán aquí'}
            </p>
          </div>
        ) : (
          <>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {movimientosFiltrados.filter(m => m.tipo === 'ingreso').length}
                </div>
                <div className="text-sm text-gray-600">Ingresos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {movimientosFiltrados.filter(m => m.tipo === 'gasto').length}
                </div>
                <div className="text-sm text-gray-600">Gastos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {movimientosFiltrados.filter(m => m.tipo === 'transferencia').length}
                </div>
                <div className="text-sm text-gray-600">Transferencias</div>
              </div>
            </div>

            {/* Lista de movimientos filtrados */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {movimientosFiltrados.map((movimiento, index) => (
                <div
                  key={movimiento.id || index}
                  className={`
                    p-4 border-l-4 rounded-lg transition-colors duration-200
                    ${getClaseMovimiento(movimiento.tipo)}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getIconoTipo(movimiento.tipo)}
                        <span className="ml-2 font-medium text-gray-900">
                          {getTextoMovimiento(movimiento)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="font-medium">Fecha:</span>
                          <span className="ml-1">
                            {formatearFechaCompleta(movimiento.fecha)}
                          </span>
                        </span>
                        
                        {movimiento.categoria && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                            {movimiento.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};