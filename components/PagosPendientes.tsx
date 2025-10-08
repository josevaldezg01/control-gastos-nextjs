'use client';

import React, { useState } from 'react';
import { Clock, Plus, Check, Trash2, Edit2, DollarSign, Calendar, AlertCircle, X } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { formatoMoneda, formatearFecha } from '@/lib/utils';
import { BANCOS, CATEGORIAS_PAGOS_PENDIENTES, type Banco } from '@/lib/types';
import type { PagoPendiente } from '@/lib/types';

// ============================================
// INTERFACE ACTUALIZADA - AHORA RECIBE TODO POR PROPS
// ============================================
interface PagosPendientesProps {
  pagosPendientes: PagoPendiente[];
  mesActivoActual: string;
  agregarPagoPendiente: (
    descripcion: string,
    valor: number,
    categoria: string,
    bancoDestino?: Banco,
    fechaVencimiento?: string
  ) => Promise<void>;
  completarPago: (idPago: number, bancoDestino: Banco, valor?: number) => Promise<void>;
  eliminarPagoPendiente: (idPago: number) => Promise<void>;
  editarPagoPendiente: (
    id: number,
    descripcion: string,
    valor: number,
    fechaVencimiento?: string,
    categoria?: string
  ) => Promise<void>;
}

export const PagosPendientes: React.FC<PagosPendientesProps> = ({ 
  pagosPendientes,
  mesActivoActual,
  agregarPagoPendiente,
  completarPago,
  eliminarPagoPendiente,
  editarPagoPendiente
}) => {
  const [showAgregar, setShowAgregar] = useState(false);
  const [editandoPago, setEditandoPago] = useState<PagoPendiente | null>(null);
  const [editForm, setEditForm] = useState<{
    descripcion: string;
    valor: string;
    categoria: string;
    fechaVencimiento: string;
  }>({
    descripcion: '',
    valor: '',
    categoria: '',
    fechaVencimiento: ''
  });
  
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

  const bancosOptions = BANCOS.filter(b => b !== 'Préstamos').map(banco => ({ 
    value: banco, 
    label: banco 
  }));
  
  const categoriasOptions = CATEGORIAS_PAGOS_PENDIENTES.map(cat => ({ 
    value: cat, 
    label: cat 
  }));

  const iniciarEdicion = (pago: PagoPendiente) => {
    setEditandoPago(pago);
    setEditForm({
      descripcion: pago.descripcion,
      valor: pago.valor.toString(),
      categoria: pago.categoria || '',
      fechaVencimiento: pago.fecha_vencimiento || ''
    });
  };

  const cancelarEdicion = () => {
    setEditandoPago(null);
    setEditForm({
      descripcion: '',
      valor: '',
      categoria: '',
      fechaVencimiento: ''
    });
  };

  const handleEditarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editandoPago || !editForm.descripcion || !editForm.valor) {
      alert('Por favor completa descripción y valor');
      return;
    }

    setLoading(true);
    try {
      await editarPagoPendiente(
        editandoPago.id,
        editForm.descripcion,
        parseFloat(editForm.valor),
        editForm.fechaVencimiento || undefined,
        editForm.categoria || undefined
      );
      
      cancelarEdicion();
    } catch (error) {
      console.error('Error al editar pago:', error);
    } finally {
      setLoading(false);
    }
  };

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
              {pagosPendientesActivos.length} pendiente{pagosPendientesActivos.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Button 
          onClick={() => setShowAgregar(!showAgregar)} 
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Agregar Pago
        </Button>
      </div>

      {/* Resumen de Totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-700">Total Pendiente</span>
            <span className="text-2xl font-bold text-amber-700">{formatoMoneda(totalPendiente)}</span>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Total Pagado</span>
            <span className="text-2xl font-bold text-green-700">{formatoMoneda(totalPagado)}</span>
          </div>
        </div>
      </div>

      {/* Formulario Agregar Pago */}
      {showAgregar && (
        <Card className="bg-gray-50 p-4 mb-6 border-2 border-indigo-200">
          <form onSubmit={handleAgregarPago} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Descripción"
                placeholder="Ej: Master Banco de Occidente"
                value={pagoForm.descripcion}
                onChange={(e) => setPagoForm({ ...pagoForm, descripcion: e.target.value })}
                required
              />
              
              <Input
                label="Valor"
                type="number"
                placeholder="0"
                value={pagoForm.valor}
                onChange={(e) => setPagoForm({ ...pagoForm, valor: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Categoría"
                options={categoriasOptions}
                placeholder="Selecciona categoría"
                value={pagoForm.categoria}
                onChange={(e) => setPagoForm({ ...pagoForm, categoria: e.target.value })}
                required
              />

              <Select
                label="Banco (opcional)"
                options={bancosOptions}
                placeholder="Sin asignar"
                value={pagoForm.banco}
                onChange={(e) => setPagoForm({ ...pagoForm, banco: e.target.value as Banco })}
              />

              <Input
                label="Fecha Vencimiento (opcional)"
                type="date"
                value={pagoForm.fechaVencimiento}
                onChange={(e) => setPagoForm({ ...pagoForm, fechaVencimiento: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowAgregar(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Pago'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal de Edición */}
      {editandoPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center">
                <Edit2 className="w-5 h-5 mr-2" />
                Editar Pago Pendiente
              </h3>
              <button 
                onClick={cancelarEdicion}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditarPago} className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Descripción del pago"
                value={editForm.descripcion}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Valor"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={editForm.valor}
                  onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })}
                  required
                />
                
                <Input
                  label="Fecha Vencimiento"
                  type="date"
                  value={editForm.fechaVencimiento}
                  onChange={(e) => setEditForm({ ...editForm, fechaVencimiento: e.target.value })}
                />
              </div>

              <Select
                label="Categoría"
                options={categoriasOptions}
                placeholder="Selecciona categoría"
                value={editForm.categoria}
                onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={cancelarEdicion}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Lista de Pagos por Categoría */}
      <div className="space-y-6">
        {Object.entries(pagosPorCategoria).length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No hay pagos pendientes para este mes
          </p>
        ) : (
          Object.entries(pagosPorCategoria).map(([categoria, pagos]) => (
            <div key={categoria} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                {categoria} ({pagos.length})
              </h3>
              
              {pagos.map((pago) => {
                const fechaVencimiento = pago.fecha_vencimiento ? new Date(pago.fecha_vencimiento) : null;
                const fechaPago = pago.fecha_completado ? new Date(pago.fecha_completado) : null;
                const estaVencido = fechaVencimiento && fechaVencimiento < hoy && !pago.completado;

                return (
                  <div 
                    key={pago.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      pago.completado 
                        ? 'bg-green-50 border-green-200 opacity-75' 
                        : estaVencido 
                          ? 'bg-red-50 border-red-300 shadow-md'
                          : 'bg-white border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg text-gray-900">
                            {pago.descripcion}
                          </h4>
                          {pago.completado && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              Pagado
                            </span>
                          )}
                          {estaVencido && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Vencido
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {pago.banco_destino && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span>{pago.banco_destino}</span>
                            </div>
                          )}
                          
                          {fechaVencimiento && !pago.completado && (
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
                              onChange={(e) => setCompletarForm({ pagoId: pago.id, banco: e.target.value as Banco })}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => iniciarEdicion(pago)}
                              icon={<Edit2 className="w-4 h-4" />}
                              className="flex-1"
                            >
                              Editar
                            </Button>
                            
                            <Button
                              variant="primary"
                              onClick={() => handleCompletarPago(pago)}
                              disabled={completarForm.pagoId !== pago.id || !completarForm.banco || loading}
                              icon={<Check className="w-4 h-4" />}
                              className="flex-1"
                            >
                              Pagar
                            </Button>
                            
                            <Button
                              variant="danger"
                              onClick={() => handleEliminarPago(pago.id)}
                              icon={<Trash2 className="w-4 h-4" />}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default PagosPendientes;