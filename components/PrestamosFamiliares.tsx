'use client';

import React, { useState } from 'react';
import { Handshake, DollarSign, User, Trash2, Plus } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { formatoMoneda, formatearFecha } from '@/lib/utils';
import { BANCOS, type Banco } from '@/lib/types';
import type { PrestamoFamiliar } from '@/lib/types';

interface PrestamosFamiliaresProps {
  prestamosActivos: PrestamoFamiliar[];
  totales: {
    totalPrestado: number;
  };
  registrarAbonoPrestamo: (idPrestamo: number, valorAbono: number, bancoDestino: Banco, valorPendiente: number) => Promise<void>;
  eliminarPrestamo: (idPrestamo: number) => Promise<void>;
}

export const PrestamosFamiliares: React.FC<PrestamosFamiliaresProps> = ({ 
  prestamosActivos, 
  totales,
  registrarAbonoPrestamo,
  eliminarPrestamo
}) => {
  const [abonoForm, setAbonoForm] = useState<{
    prestamoId: number | null;
    valor: string;
    banco: string;
  }>({
    prestamoId: null,
    valor: '',
    banco: ''
  });

  const [loading, setLoading] = useState(false);

  const bancosOptions = BANCOS.filter(b => b !== 'Préstamos').map(banco => ({
    value: banco,
    label: banco
  }));

  const handleRegistrarAbono = async (prestamo: PrestamoFamiliar) => {
    if (!abonoForm.valor || !abonoForm.banco) {
      alert('Por favor completa todos los campos');
      return;
    }

    const valorAbono = parseFloat(abonoForm.valor);
    if (valorAbono <= 0 || valorAbono > prestamo.valor_pendiente) {
      alert(`El abono debe ser mayor a 0 y no puede exceder ${formatoMoneda(prestamo.valor_pendiente)}`);
      return;
    }

    setLoading(true);
    try {
      await registrarAbonoPrestamo(
        prestamo.id,
        valorAbono,
        abonoForm.banco as Banco,
        prestamo.valor_pendiente
      );
      
      setAbonoForm({ prestamoId: null, valor: '', banco: '' });
    } catch (error) {
      console.error('Error al registrar abono:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPrestamo = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este préstamo? Esta acción no se puede deshacer.')) {
      try {
        await eliminarPrestamo(id);
      } catch (error) {
        console.error('Error al eliminar préstamo:', error);
      }
    }
  };

  const marcarComoPagado = async (prestamo: PrestamoFamiliar) => {
    if (!abonoForm.banco) {
      alert('Selecciona el banco donde recibiste el pago');
      return;
    }

    if (confirm(`¿Confirmas que ${prestamo.persona} pagó completamente los ${formatoMoneda(prestamo.valor_pendiente)} restantes?`)) {
      setLoading(true);
      try {
        await registrarAbonoPrestamo(
          prestamo.id,
          prestamo.valor_pendiente,
          abonoForm.banco as Banco,
          prestamo.valor_pendiente
        );
        
        setAbonoForm({ prestamoId: null, valor: '', banco: '' });
      } catch (error) {
        console.error('Error al marcar como pagado:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Agrupar préstamos por persona
  const prestamosPorPersona = prestamosActivos.reduce((acc, prestamo) => {
    const persona = prestamo.persona || 'Sin nombre';
    if (!acc[persona]) {
      acc[persona] = [];
    }
    acc[persona].push(prestamo);
    return acc;
  }, {} as Record<string, PrestamoFamiliar[]>);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center text-orange-700">
          <Handshake className="w-6 h-6 mr-2" />
          Préstamos Familiares Activos
        </h2>
        <div className="bg-orange-100 px-4 py-2 rounded-lg">
          <span className="text-orange-900 font-bold">
            Total: {formatoMoneda(totales.totalPrestado)}
          </span>
        </div>
      </div>

      {prestamosActivos.length === 0 ? (
        <div className="text-center py-12">
          <Handshake className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay préstamos activos</h3>
          <p className="text-gray-500">
            Los préstamos familiares que registres aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(prestamosPorPersona).map(([persona, prestamos]) => {
            const totalPersona = prestamos.reduce((sum, p) => sum + p.valor_pendiente, 0);
            
            return (
              <div key={persona} className="border-l-4 border-orange-400 bg-orange-50 rounded-lg">
                <div className="bg-orange-100 px-4 py-3 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-orange-800 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      {persona}
                    </h3>
                    <span className="font-bold text-orange-900">
                      {formatoMoneda(totalPersona)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {prestamos.map(prestamo => {
                    const porcentajePagado = prestamo.valor > 0 
                      ? ((prestamo.valor - prestamo.valor_pendiente) / prestamo.valor * 100).toFixed(1)
                      : 0;

                    return (
                      <div key={prestamo.id} className="bg-white border border-orange-200 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="font-medium text-gray-900">
                                Préstamo: {formatoMoneda(prestamo.valor)}
                              </span>
                              {prestamo.valor_pendiente < prestamo.valor && (
                                <span className="ml-2 text-sm text-green-600">
                                  ({porcentajePagado}% pagado)
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              <div>Prestado el {formatearFecha(prestamo.fecha_prestamo)}</div>
                              <div>Desde: {prestamo.banco_origen}</div>
                              <div>Motivo: {prestamo.descripcion}</div>
                            </div>
                            
                            <div className="font-semibold text-orange-600">
                              Pendiente: {formatoMoneda(prestamo.valor_pendiente)}
                            </div>
                          </div>
                        </div>

                        {/* Formulario de abono */}
                        <div className="border-t pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              type="number"
                              placeholder="Valor abono"
                              value={abonoForm.prestamoId === prestamo.id ? abonoForm.valor : ''}
                              onChange={(e) => setAbonoForm(prev => ({ 
                                ...prev, 
                                prestamoId: prestamo.id, 
                                valor: e.target.value 
                              }))}
                              icon={<DollarSign className="w-4 h-4" />}
                            />
                            
                            <Select
                              options={bancosOptions}
                              placeholder="Banco destino"
                              value={abonoForm.prestamoId === prestamo.id ? abonoForm.banco : ''}
                              onChange={(e) => setAbonoForm(prev => ({ 
                                ...prev, 
                                prestamoId: prestamo.id, 
                                banco: e.target.value 
                              }))}
                            />
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleRegistrarAbono(prestamo)}
                                loading={loading && abonoForm.prestamoId === prestamo.id}
                                disabled={!abonoForm.valor || !abonoForm.banco || abonoForm.prestamoId !== prestamo.id}
                                icon={<Plus className="w-4 h-4" />}
                              >
                                Abono
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => marcarComoPagado(prestamo)}
                                loading={loading && abonoForm.prestamoId === prestamo.id}
                                disabled={!abonoForm.banco || abonoForm.prestamoId !== prestamo.id}
                              >
                                Pagado
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleEliminarPrestamo(prestamo.id)}
                                icon={<Trash2 className="w-4 h-4" />}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};