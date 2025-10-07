'use client';

import React, { useState } from 'react';
import { Clock, Plus, Check, Trash2, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { formatoMoneda, formatearFecha } from '@/lib/utils';
import { useGastos } from '@/hooks/useGastos';
import { BANCOS, CATEGORIAS_PAGOS_PENDIENTES, type Banco } from '@/lib/types';
import type { PagoPendiente } from '@/lib/types';

interface PagosPendientesProps {
  pagosPendientes: PagoPendiente[];
}

export const PagosPendientes: React.FC<PagosPendientesProps> = ({ pagosPendientes }) => {
  const { agregarPagoPendiente, completarPago, eliminarPagoPendiente, mesActivoActual } = useGastos();
  
  const [showAgregar, setShowAgregar] = useState(false);
  const [pagoForm, setPagoForm] = useState<{
    descripcion: string;
    valor: string;
    categoria: string;
    banco: Banco | '';
    fechaVencimiento: string;
  }>({
    descripcion: '',
    valor: '',
    categoria: '',
    banco: '',
    fechaVencimiento: ''
  });
  
  const [completarForm, setCompletarForm] = useState<{
    pagoId: number | null;
    banco: Banco | '';
  }>({
    pagoId: null,
    banco: ''
  });

  const [loading, setLoading] = useState(false);

  const bancosOptions = BANCOS.filter(b => b !== 'Préstamos').map(banco => ({ value: banco, label: banco }));
  const categoriasOptions = CATEGORIAS_PAGOS_PENDIENTES.map(cat => ({ value: cat, label: cat }));

  const handleAgregarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoForm.descripcion || !pagoForm.valor || !pagoForm.categoria) {
      alert('Por favor completa descripción, valor y categoría');
      return;
    }

    setLoading(true);
    try {
      await agregarPagoPendiente(
        pagoForm.descripcion,
        parseFloat(pagoForm.valor),
        pagoForm.categoria,
        pagoForm.banco || undefined,
        pagoForm.fechaVencimiento || undefined
      );
      
      setPagoForm({
        descripcion: '',
        valor: '',
        categoria: '',
        banco: '',
        fechaVencimiento: ''
      });
      setShowAgregar(false);
    } catch (error) {
      console.error('Error al agregar pago:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarPago = async (pago: PagoPendiente) => {
    if (!completarForm.banco) {
      alert('Selecciona el banco de pago');
      return;
    }

    setLoading(true);
    try {
      await completarPago(pago.id, completarForm.banco as Banco);
      setCompletarForm({ pagoId: null, banco: '' });
    } catch (error) {
      console.error('Error al completar pago:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPago = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este pago pendiente? Esta acción no se puede deshacer.')) {
      try {
        await eliminarPagoPendiente(id);
      } catch (error) {
        console.error('Error al eliminar pago:', error);
      }
    }
  };

  // Agrupar pagos por categoría
  const pagosPorCategoria = pagosPendientes.reduce((acc, pago) => {
    const categoria = pago.categoria || 'Sin categoría';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(pago);
    return acc;
  }, {} as Record<string, PagoPendiente[]>);

  // Calcular estadísticas
  const hoy = new Date();
  const pagosPendientesActivos = pagosPendientes.filter(p => !p.completado);
  const pagosCompletados = pagosPendientes.filter(p => p.completado);
  const pagosVencidos = pagosPendientes.filter(p => 
    !p.completado && 
    p.fecha_vencimiento && 
    new Date(p.fecha_vencimiento) < hoy
  );
  
  const totalPendiente = pagosPendientesActivos.reduce((sum, p) => sum + p.valor, 0);
  const totalPagado = pagosCompletados.reduce((sum, p) => sum + (p.valor_pagado || p.valor), 0);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center text-indigo-700">
            <Clock className="w-6 h-6 mr-2" />
            Pagos Pendientes
          </h2>
          <div className="flex gap-4 mt-2 text-sm">
            {pagosVencidos.length > 0 && (
              <span className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {pagosVencidos.length} vencido{pagosVencidos.length > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-gray-600">
              {pagosPendientesActivos.length} pendiente{pagosPendientesActivos.length !== 1 ? 's' : ''} · {pagosCompletados.length} pagado{pagosCompletados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <Button
          onClick={() => setShowAgregar(!showAgregar)}
          icon={<Plus className="w-4 h-4" />}
        >
          Agregar Pago
        </Button>
      </div>

      {/* Resumen de totales */}
      {pagosPendientes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">Total Pendiente</div>
            <div className="text-2xl font-bold text-orange-700">
              {formatoMoneda(totalPendiente)}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Total Pagado</div>
            <div className="text-2xl font-bold text-green-700">
              {formatoMoneda(totalPagado)}
            </div>
          </div>
        </div>
      )}

      {/* Formulario para agregar pago */}
      {showAgregar && (
        <Card className="p-4 mb-6 bg-indigo-50 border border-indigo-200">
          <h3 className="font-semibold mb-4 text-indigo-900">Nuevo Pago Pendiente</h3>
          <form onSubmit={handleAgregarPago} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Descripción"
              placeholder="Ej: Servicio de energía"
              value={pagoForm.descripcion}
              onChange={(e) => setPagoForm(prev => ({ ...prev, descripcion: e.target.value }))}
              required
            />

            <Input
              label="Valor"
              type="number"
              placeholder="0"
              icon={<DollarSign className="w-4 h-4" />}
              value={pagoForm.valor}
              onChange={(e) => setPagoForm(prev => ({ ...prev, valor: e.target.value }))}
              required
            />

            <Select
              label="Categoría"
              options={categoriasOptions}
              placeholder="-- Selecciona una categoría --"
              value={pagoForm.categoria}
              onChange={(e) => setPagoForm(prev => ({ ...prev, categoria: e.target.value }))}
              required
            />

            <Select
              label="Banco Destino (opcional)"
              options={bancosOptions}
              placeholder="-- Elegir al pagar --"
              value={pagoForm.banco}
              onChange={(e) => setPagoForm(prev => ({ ...prev, banco: e.target.value as Banco | '' }))}
            />

            <Input
              label="Fecha de Vencimiento"
              type="date"
              icon={<Calendar className="w-4 h-4" />}
              value={pagoForm.fechaVencimiento}
              onChange={(e) => setPagoForm(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
            />

            <div className="flex gap-2 items-end">
              <Button type="submit" loading={loading} className="flex-1">
                Guardar Pago
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowAgregar(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de pagos */}
      {pagosPendientes.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos pendientes</h3>
          <p className="text-gray-500">
            Los pagos que programes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(pagosPorCategoria).map(([categoria, pagos]) => (
            <div key={categoria}>
              <h3 className="font-semibold text-lg mb-3 text-indigo-600 border-b border-indigo-200 pb-1">
                {categoria}
              </h3>
              
              <div className="space-y-3">
                {pagos.map(pago => {
                  const fechaVenc = pago.fecha_vencimiento ? new Date(pago.fecha_vencimiento) : null;
                  const estaVencido = fechaVenc && fechaVenc < hoy && !pago.completado;
                  const fechaPago = pago.fecha_completado ? new Date(pago.fecha_completado) : null;

                  return (
                    <div
                      key={pago.id}
                      className={`border-2 p-4 rounded-lg shadow-sm transition-all ${
                        pago.completado ? 'bg-green-50 border-green-300' : 
                        estaVencido ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-semibold text-lg ${
                              pago.completado ? 'text-green-700' :
                              estaVencido ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {pago.descripcion}
                            </span>
                            {pago.completado && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                ✓ Pagado
                              </span>
                            )}
                            {estaVencido && (
                              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                ⚠ Vencido
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span className="font-semibold">{formatoMoneda(pago.valor)}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="font-medium mr-1">Banco:</span>
                              <span>{pago.banco_destino || 'Sin asignar'}</span>
                            </div>
                            
                            {fechaVenc && (
                              <div className={`flex items-center ${estaVencido ? 'text-red-600 font-semibold' : ''}`}>
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Vence: {formatearFecha(pago.fecha_vencimiento!)}</span>
                              </div>
                            )}
                            
                            {fechaPago && (
                              <div className="flex items-center text-green-600">
                                <Check className="w-4 h-4 mr-1" />
                                <span>Pagado: {formatearFecha(pago.fecha_completado!)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className={`font-bold text-2xl ${
                            pago.completado ? 'text-green-600' :
                            estaVencido ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {formatoMoneda(pago.completado ? (pago.valor_pagado || pago.valor) : pago.valor)}
                          </div>
                        </div>
                      </div>

                      {!pago.completado && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <Select
                                options={bancosOptions}
                                placeholder="Selecciona banco de pago"
                                value={completarForm.pagoId === pago.id ? completarForm.banco : ''}
                                onChange={(e) => setCompletarForm({ pagoId: pago.id, banco: e.target.value as Banco | '' })}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleCompletarPago(pago)}
                                disabled={!completarForm.banco || completarForm.pagoId !== pago.id}
                                loading={loading && completarForm.pagoId === pago.id}
                                icon={<Check className="w-4 h-4" />}
                                className="flex-1"
                              >
                                Pagar
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleEliminarPago(pago.id)}
                                icon={<Trash2 className="w-4 h-4" />}
                              >
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};