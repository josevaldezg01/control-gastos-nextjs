// lib/types.ts
export type Banco = 'Banco de Bogotá' | 'Nequi' | 'Daviplata' | 'Colpatria' | 'Bolsillo' | 'Efectivo' | 'Préstamos';

export type TipoMovimiento = 'ingreso' | 'gasto' | 'transferencia';

export interface Movimiento {
  id?: number;
  tipo: TipoMovimiento;
  valor: number;
  descripcion: string;
  categoria?: string;
  banco_origen?: Banco;
  banco_destino?: Banco;
  fecha: string;
  mes_contable: string;
}

export interface PrestamoFamiliar {
  id: number;
  persona: string;
  valor: number;
  valor_pendiente: number;
  descripcion: string;
  banco_origen: Banco;
  fecha_prestamo: string;
  fecha_ultimo_abono?: string;
  activo: boolean;
}

export interface PagoPendiente {
  id: number;
  descripcion: string;
  valor: number;
  categoria: string;
  banco_destino: string | null;
  fecha_vencimiento: string | null;
  completado: boolean;
  fecha_completado?: string | null;
  valor_pagado?: number | null;
  mes_contable?: string;
}

export interface HistorialMensual {
  id: number;
  mes: number;
  año: number;
  nombre_mes: string;
  fecha_cierre: string;
  ingresos: number;
  gastos: number;
  balance: number;
  saldos: Record<Banco, number>;
  movimientos: Movimiento[];
  mes_contable: string;
}

export interface SaldosBancos {
  [key: string]: number;
}

export const BANCOS: Banco[] = [
  'Banco de Bogotá',
  'Nequi', 
  'Daviplata',
  'Colpatria',
  'Bolsillo',
  'Efectivo',
  'Préstamos'
];

export const CATEGORIAS_INGRESO = [
  'Salario',
  'Venta de cuentas Netflix/Prime/Max',
  'Reembolso préstamos',
  'Driver',
  'Honorarios Servicios tec',
  'Otros Ingresos'
];

export const CATEGORIAS_GASTO = [
  'Préstamos',
  'Tarjetas de crédito',
  'Arriendo',
  'Almuerzo',
  'Reparaciones moto',
  'Pago de cuentas Netflix/Prime/Max',
  'Comida',
  'Gasolina',
  'Vivienda',
  'Impuestos',
  'Consumibles moto',
  'Mecato',
  'Ropa',
  'Cadena',
  'Taliana',
  'Servicios publicos',
  'Otros gastos'
];

export const CATEGORIAS_PAGOS_PENDIENTES = [
  'Servicios públicos',
  'Arriendo',
  'Préstamos',
  'Créditos',
  'Vivienda',
  'Tarjetas de crédito',
  'Impuestos',
  'Ahorros',
  'Taliana',
  'Otros'
];