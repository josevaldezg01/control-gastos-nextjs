'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ArrowLeftRight, 
  Handshake,
  DollarSign
} from 'lucide-react';
import { Card, Input, Select, Button } from '@/components/ui';
import { BANCOS, CATEGORIAS_INGRESO, CATEGORIAS_GASTO, type Banco } from '@/lib/types';

interface RegistrarMovimientoProps {
  registrarIngreso: (banco: Banco, valor: number, descripcion: string, categoria: string) => Promise<void>;
  registrarGasto: (banco: Banco, valor: number, descripcion: string, categoria: string) => Promise<void>;
  registrarTransferencia: (desde: Banco, hacia: Banco, valor: number, descripcion: string) => Promise<void>;
  registrarPrestamo: (banco: Banco, valor: number, persona: string, descripcion: string) => Promise<void>;
}

export const RegistrarMovimiento: React.FC<RegistrarMovimientoProps> = ({ 
  registrarIngreso, 
  registrarGasto, 
  registrarTransferencia, 
  registrarPrestamo 
}) => {
  
  // Estados para formularios
  const [ingresoForm, setIngresoForm] = useState({
    banco: '',
    valor: '',
    descripcion: '',
    categoria: ''
  });

  const [gastoForm, setGastoForm] = useState({
    banco: '',
    valor: '',
    descripcion: '',
    categoria: ''
  });

  const [transferenciaForm, setTransferenciaForm] = useState({
    desde: '',
    hacia: '',
    valor: '',
    descripcion: ''
  });

  const [prestamoForm, setPrestamoForm] = useState({
    banco: '',
    valor: '',
    persona: '',
    descripcion: ''
  });

  const [loading, setLoading] = useState({
    ingreso: false,
    gasto: false,
    transferencia: false,
    prestamo: false
  });

  // Opciones para selects (excluyendo Préstamos para transferencias normales)
  const bancosOptions = BANCOS.filter(b => b !== 'Préstamos').map(banco => ({
    value: banco,
    label: banco
  }));

  const bancosIngreso = BANCOS.map(banco => ({
    value: banco,
    label: banco
  }));

  const categoriasIngreso = CATEGORIAS_INGRESO.map(cat => ({
    value: cat,
    label: cat
  }));

  const categoriasGasto = CATEGORIAS_GASTO.map(cat => ({
    value: cat,
    label: cat
  }));

  // Handlers para ingreso
  const handleIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingresoForm.banco || !ingresoForm.valor || !ingresoForm.descripcion || !ingresoForm.categoria) {
      return;
    }

    setLoading(prev => ({ ...prev, ingreso: true }));
    try {
      await registrarIngreso(
        ingresoForm.banco as Banco,
        parseFloat(ingresoForm.valor),
        ingresoForm.descripcion,
        ingresoForm.categoria
      );
      
      setIngresoForm({ banco: '', valor: '', descripcion: '', categoria: '' });
    } catch (error) {
      console.error('Error al registrar ingreso:', error);
    } finally {
      setLoading(prev => ({ ...prev, ingreso: false }));
    }
  };

  // Handlers para gasto
  const handleGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoForm.banco || !gastoForm.valor || !gastoForm.categoria) {
      return;
    }

    setLoading(prev => ({ ...prev, gasto: true }));
    try {
      await registrarGasto(
        gastoForm.banco as Banco,
        parseFloat(gastoForm.valor),
        gastoForm.descripcion || gastoForm.categoria,
        gastoForm.categoria
      );
      
      setGastoForm({ banco: '', valor: '', descripcion: '', categoria: '' });
    } catch (error) {
      console.error('Error al registrar gasto:', error);
    } finally {
      setLoading(prev => ({ ...prev, gasto: false }));
    }
  };

  // Handlers para transferencia
  const handleTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferenciaForm.desde || !transferenciaForm.hacia || !transferenciaForm.valor) {
      return;
    }

    if (transferenciaForm.desde === transferenciaForm.hacia) {
      return;
    }

    setLoading(prev => ({ ...prev, transferencia: true }));
    try {
      await registrarTransferencia(
        transferenciaForm.desde as Banco,
        transferenciaForm.hacia as Banco,
        parseFloat(transferenciaForm.valor),
        transferenciaForm.descripcion || `Transferencia de ${transferenciaForm.desde} a ${transferenciaForm.hacia}`
      );
      
      setTransferenciaForm({ desde: '', hacia: '', valor: '', descripcion: '' });
    } catch (error) {
      console.error('Error al registrar transferencia:', error);
    } finally {
      setLoading(prev => ({ ...prev, transferencia: false }));
    }
  };

  // Handlers para préstamo
  const handlePrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestamoForm.banco || !prestamoForm.valor || !prestamoForm.persona || !prestamoForm.descripcion) {
      return;
    }

    setLoading(prev => ({ ...prev, prestamo: true }));
    try {
      await registrarPrestamo(
        prestamoForm.banco as Banco,
        parseFloat(prestamoForm.valor),
        prestamoForm.persona,
        prestamoForm.descripcion
      );
      
      setPrestamoForm({ banco: '', valor: '', persona: '', descripcion: '' });
    } catch (error) {
      console.error('Error al registrar préstamo:', error);
    } finally {
      setLoading(prev => ({ ...prev, prestamo: false }));
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
        <Plus className="w-6 h-6 mr-2 text-indigo-600" />
        Registrar Movimiento
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agregar Ingreso */}
        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="font-semibold text-green-700 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Ingreso
          </h3>
          
          <form onSubmit={handleIngreso} className="space-y-4">
            <Select
              label="Banco donde recibiste el dinero"
              options={bancosIngreso}
              placeholder="-- Selecciona el banco --"
              value={ingresoForm.banco}
              onChange={(e) => setIngresoForm(prev => ({ ...prev, banco: e.target.value }))}
              required
            />

            <Input
              label="Valor"
              type="number"
              placeholder="0"
              icon={<DollarSign className="w-4 h-4 text-gray-500" />}
              value={ingresoForm.valor}
              onChange={(e) => setIngresoForm(prev => ({ ...prev, valor: e.target.value }))}
              required
            />

            <Input
              label="Descripción"
              placeholder="Ej: Salario"
              value={ingresoForm.descripcion}
              onChange={(e) => setIngresoForm(prev => ({ ...prev, descripcion: e.target.value }))}
              required
            />

            <Select
              label="Categoría"
              options={categoriasIngreso}
              placeholder="-- Selecciona una categoría --"
              value={ingresoForm.categoria}
              onChange={(e) => setIngresoForm(prev => ({ ...prev, categoria: e.target.value }))}
              required
            />

            <Button 
              type="submit"
              variant="success"
              className="w-full"
              loading={loading.ingreso}
              icon={<Plus className="w-4 h-4" />}
            >
              Registrar Ingreso
            </Button>
          </form>
        </div>

        {/* Agregar Gasto */}
        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <h3 className="font-semibold text-red-700 mb-4 flex items-center">
            <Minus className="w-5 h-5 mr-2" />
            Nuevo Gasto
          </h3>
          
          <form onSubmit={handleGasto} className="space-y-4">
            <Select
              label="Banco Origen"
              options={bancosOptions}
              placeholder="-- Selecciona el banco --"
              value={gastoForm.banco}
              onChange={(e) => setGastoForm(prev => ({ ...prev, banco: e.target.value }))}
              required
            />

            <Input
              label="Valor"
              type="number"
              placeholder="0"
              icon={<DollarSign className="w-4 h-4 text-gray-500" />}
              value={gastoForm.valor}
              onChange={(e) => setGastoForm(prev => ({ ...prev, valor: e.target.value }))}
              required
            />

            <Input
              label="Descripción"
              placeholder="Ej: Supermercado"
              value={gastoForm.descripcion}
              onChange={(e) => setGastoForm(prev => ({ ...prev, descripcion: e.target.value }))}
            />

            <Select
              label="Categoría"
              options={categoriasGasto}
              placeholder="-- Selecciona una categoría --"
              value={gastoForm.categoria}
              onChange={(e) => setGastoForm(prev => ({ ...prev, categoria: e.target.value }))}
              required
            />

            <Button 
              type="submit"
              variant="danger"
              className="w-full"
              loading={loading.gasto}
              icon={<Minus className="w-4 h-4" />}
            >
              Registrar Gasto
            </Button>
          </form>
        </div>

        {/* Transferencia */}
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold text-blue-700 mb-4 flex items-center">
            <ArrowLeftRight className="w-5 h-5 mr-2" />
            Transferencia
          </h3>
          
          <form onSubmit={handleTransferencia} className="space-y-4">
            <Select
              label="Desde"
              options={bancosOptions}
              placeholder="-- Banco origen --"
              value={transferenciaForm.desde}
              onChange={(e) => setTransferenciaForm(prev => ({ ...prev, desde: e.target.value }))}
              required
            />

            <Select
              label="Hacia"
              options={bancosOptions.filter(b => b.value !== transferenciaForm.desde)}
              placeholder="-- Banco destino --"
              value={transferenciaForm.hacia}
              onChange={(e) => setTransferenciaForm(prev => ({ ...prev, hacia: e.target.value }))}
              required
            />

            <Input
              label="Valor"
              type="number"
              placeholder="0"
              icon={<DollarSign className="w-4 h-4 text-gray-500" />}
              value={transferenciaForm.valor}
              onChange={(e) => setTransferenciaForm(prev => ({ ...prev, valor: e.target.value }))}
              required
            />

            <Input
              label="Descripción"
              placeholder="Ej: Transferencia personal"
              value={transferenciaForm.descripcion}
              onChange={(e) => setTransferenciaForm(prev => ({ ...prev, descripcion: e.target.value }))}
            />

            <Button 
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading.transferencia}
              icon={<ArrowLeftRight className="w-4 h-4" />}
            >
              Realizar Transferencia
            </Button>
          </form>
        </div>

        {/* Préstamo Familiar */}
        <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
          <h3 className="font-semibold text-orange-700 mb-4 flex items-center">
            <Handshake className="w-5 h-5 mr-2" />
            Préstamo Familiar
          </h3>
          
          <form onSubmit={handlePrestamo} className="space-y-4">
            <Select
              label="Banco Origen"
              options={bancosOptions}
              placeholder="-- Selecciona el banco --"
              value={prestamoForm.banco}
              onChange={(e) => setPrestamoForm(prev => ({ ...prev, banco: e.target.value }))}
              required
            />

            <Input
              label="Valor"
              type="number"
              placeholder="0"
              icon={<DollarSign className="w-4 h-4 text-gray-500" />}
              value={prestamoForm.valor}
              onChange={(e) => setPrestamoForm(prev => ({ ...prev, valor: e.target.value }))}
              required
            />

            <Input
              label="Persona"
              placeholder="Ej: Juan Pérez"
              value={prestamoForm.persona}
              onChange={(e) => setPrestamoForm(prev => ({ ...prev, persona: e.target.value }))}
              required
            />

            <Input
              label="Descripción"
              placeholder="Ej: Préstamo para gastos médicos"
              value={prestamoForm.descripcion}
              onChange={(e) => setPrestamoForm(prev => ({ ...prev, descripcion: e.target.value }))}
              required
            />

            <Button 
              type="submit"
              variant="warning"
              className="w-full"
              loading={loading.prestamo}
              icon={<Handshake className="w-4 h-4" />}
            >
              Registrar Préstamo
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
};