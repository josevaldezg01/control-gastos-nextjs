'use client';

import React from 'react';
import { History, Download, Trash2, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { formatoMoneda, formatearFechaCompleta, generarCSV } from '@/lib/utils';
import type { Movimiento } from '@/lib/types';

interface HistorialMovimientosProps {
  movimientos: Movimiento[];
}

export const HistorialMovimientos: React.FC<HistorialMovimientosProps> = ({ movimientos }) => {
  const handleExportarCSV = () => {
    if (movimientos.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }

    const datosCSV = movimientos.map(mov => ({
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

  return (
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
          disabled={movimientos.length === 0}
        >
          Exportar CSV
        </Button>
      </div>

      {movimientos.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos</h3>
          <p className="text-gray-500">
            Los movimientos que registres aparecerán aquí
          </p>
        </div>
      ) : (
        <>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {movimientos.filter(m => m.tipo === 'ingreso').length}
              </div>
              <div className="text-sm text-gray-600">Ingresos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {movimientos.filter(m => m.tipo === 'gasto').length}
              </div>
              <div className="text-sm text-gray-600">Gastos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {movimientos.filter(m => m.tipo === 'transferencia').length}
              </div>
              <div className="text-sm text-gray-600">Transferencias</div>
            </div>
          </div>

          {/* Lista de movimientos */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {movimientos.map((movimiento, index) => (
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

                  {/* Botón eliminar (opcional - descomenta si necesitas) */}
                  {/*
                  <button
                    className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                    title="Eliminar movimiento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  */}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación simple si hay muchos movimientos */}
          {movimientos.length > 50 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Mostrando los últimos {Math.min(50, movimientos.length)} movimientos
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
};