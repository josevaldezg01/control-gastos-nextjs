'use client';

import React, { useState } from 'react';
import { Calendar, FileText, X, ChevronRight, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { formatoMoneda, formatearFechaCompleta } from '@/lib/utils';
import type { HistorialMensual, Movimiento } from '@/lib/types';

interface MesesAnterioresProps {
  isOpen: boolean;
  onClose: () => void;
  historialMensual: HistorialMensual[];
}

export const MesesAnteriores: React.FC<MesesAnterioresProps> = ({ 
  isOpen, 
  onClose, 
  historialMensual 
}) => {
  const [mesSeleccionado, setMesSeleccionado] = useState<HistorialMensual | null>(null);

  if (!isOpen) return null;

  const handleVerDetalle = (mes: HistorialMensual) => {
    setMesSeleccionado(mes);
  };

  const handleVolverLista = () => {
    setMesSeleccionado(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] m-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
            {mesSeleccionado ? `Detalle: ${mesSeleccionado.nombre_mes} ${mesSeleccionado.año}` : 'Meses Anteriores'}
          </h2>
          <div className="flex items-center gap-2">
            {mesSeleccionado && (
              <Button variant="secondary" size="sm" onClick={handleVolverLista}>
                Volver a la lista
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!mesSeleccionado ? (
            // Lista de meses
            <div>
              {historialMensual.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay meses cerrados</h3>
                  <p className="text-gray-500">
                    Los meses que cierres aparecerán aquí para consulta
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historialMensual.map(mes => (
                    <Card
                      key={mes.id}
                      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleVerDetalle(mes)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {mes.nombre_mes.charAt(0).toUpperCase() + mes.nombre_mes.slice(1)} {mes.año}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Cerrado el {formatearFechaCompleta(mes.fecha_cierre)}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="text-green-600">
                              Ingresos: {formatoMoneda(mes.ingresos)}
                            </span>
                            <span className="text-red-600">
                              Gastos: {formatoMoneda(mes.gastos)}
                            </span>
                            <span className={mes.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Balance: {formatoMoneda(mes.balance)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Detalle del mes seleccionado
            <div className="space-y-6">
              {/* Resumen de totales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="font-semibold">Ingresos Totales</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatoMoneda(mesSeleccionado.ingresos)}
                  </p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600 mr-2" />
                    <h3 className="font-semibold">Gastos Totales</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatoMoneda(mesSeleccionado.gastos)}
                  </p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Scale className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="font-semibold">Balance Total</h3>
                  </div>
                  <p className={`text-2xl font-bold ${
                    mesSeleccionado.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatoMoneda(mesSeleccionado.balance)}
                  </p>
                </Card>
              </div>

              {/* Saldos finales */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Saldos Finales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(mesSeleccionado.saldos).map(([banco, saldo]) => (
                    <div key={banco} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium text-gray-700">{banco}</p>
                      <p className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatoMoneda(saldo)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Movimientos */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Movimientos ({mesSeleccionado.movimientos.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mesSeleccionado.movimientos.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hay movimientos registrados</p>
                  ) : (
                    mesSeleccionado.movimientos.map((mov: Movimiento, index: number) => {
                      const getTextoMovimiento = () => {
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

                      const getClaseMovimiento = () => {
                        switch (mov.tipo) {
                          case 'ingreso':
                            return 'border-l-green-500 bg-green-50';
                          case 'gasto':
                            return 'border-l-red-500 bg-red-50';
                          case 'transferencia':
                            return 'border-l-blue-500 bg-blue-50';
                          default:
                            return 'border-l-gray-500 bg-gray-50';
                        }
                      };

                      return (
                        <div
                          key={mov.id || index}
                          className={`p-3 border-l-4 rounded ${getClaseMovimiento()}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {getTextoMovimiento()}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <span>{formatearFechaCompleta(mov.fecha)}</span>
                                {mov.categoria && (
                                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                    {mov.categoria}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};