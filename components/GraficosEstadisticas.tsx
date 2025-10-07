'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Card } from '@/components/ui';
import { formatoMoneda, COLORES_GRAFICOS } from '@/lib/utils';
import { PieChart, BarChart3 } from 'lucide-react';
import type { SaldosBancos, Movimiento } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface GraficosEstadisticasProps {
  bancos: SaldosBancos;
  movimientos: Movimiento[];
  totales: {
    ingresos: number;
    gastos: number;
    balance: number;
    totalBancos: number;
    totalPrestado: number;
  };
}

export const GraficosEstadisticas: React.FC<GraficosEstadisticasProps> = ({ 
  bancos, 
  movimientos, 
  totales 
}) => {
  // Datos para gráfico de distribución de fondos - EXCLUIR PRÉSTAMOS
  const bancosConSaldo = Object.entries(bancos)
    .filter(([banco, saldo]) => saldo > 0 && banco !== 'Préstamos'); // ✅ Excluir préstamos
  
  const dataDistribucion = {
    labels: bancosConSaldo.map(([banco, _]) => banco),
    datasets: [{
      data: bancosConSaldo.map(([_, saldo]) => saldo),
      backgroundColor: COLORES_GRAFICOS,
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  };

  // Calcular total disponible real (sin préstamos)
  const totalDisponible = bancosConSaldo.reduce((sum, [_, saldo]) => sum + saldo, 0);

  // Datos para gráfico de movimientos mensuales
  const dataMovimientos = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{
      label: 'Monto',
      data: [totales.ingresos, totales.gastos],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  };

  const opcionesGraficos = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed || context.raw;
            return `${context.label}: ${formatoMoneda(value)}`;
          }
        }
      }
    }
  };

  const opcionesBarras = {
    ...opcionesGraficos,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatoMoneda(value);
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de distribución de fondos */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
          <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
          Distribución de Fondos
        </h2>
        
        <div className="relative h-64">
          {bancosConSaldo.length > 0 ? (
            <Doughnut 
              data={dataDistribucion} 
              options={opcionesGraficos}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay fondos para mostrar</p>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de distribución */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total disponible:</span>
            <span className="font-semibold text-green-600">
              {formatoMoneda(totalDisponible)}
            </span>
          </div>
          {bancos['Préstamos'] > 0 && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Préstamos activos:</span>
              <span className="font-semibold text-orange-600">
                {formatoMoneda(bancos['Préstamos'])}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Gráfico de movimientos del mes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
          <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
          Movimientos del Mes
        </h2>
        
        <div className="relative h-64">
          {totales.ingresos > 0 || totales.gastos > 0 ? (
            <Bar 
              data={dataMovimientos} 
              options={opcionesBarras}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay movimientos para mostrar</p>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas del mes */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {movimientos.filter(m => m.tipo === 'ingreso').length}
            </div>
            <div className="text-sm text-green-700">Ingresos</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {movimientos.filter(m => m.tipo === 'gasto').length}
            </div>
            <div className="text-sm text-red-700">Gastos</div>
          </div>
        </div>

        {/* Balance del mes */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Balance del mes:</span>
            <span className={`font-bold text-lg ${
              totales.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatoMoneda(totales.balance)}
            </span>
          </div>
          {totales.balance < 0 && (
            <p className="text-xs text-red-500 mt-1">
              Gastos superan a los ingresos
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};