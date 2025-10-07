'use client';

import React from 'react';
import { 
  Building2, 
  Smartphone, 
  CreditCard, 
  Coins, 
  DollarSign,
  Handshake,
  Wallet
} from 'lucide-react';
import { Card } from '@/components/ui';
import { formatoMoneda } from '@/lib/utils';
import type { SaldosBancos as TSaldosBancos } from '@/lib/types';

interface SaldosBancosComponentProps {
  bancos: TSaldosBancos;
}

export const SaldosBancos: React.FC<SaldosBancosComponentProps> = ({ bancos }) => {
  const bancosConfig = [
    {
      nombre: 'Banco de Bogotá',
      key: 'Banco de Bogotá',
      icon: Building2,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700'
    },
    {
      nombre: 'Nequi',
      key: 'Nequi',
      icon: Smartphone,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700'
    },
    {
      nombre: 'Daviplata',
      key: 'Daviplata',
      icon: Wallet,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700'
    },
    {
      nombre: 'Colpatria',
      key: 'Colpatria',
      icon: CreditCard,
      color: 'red',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-700'
    },
    {
      nombre: 'Bolsillo',
      key: 'Bolsillo',
      icon: Coins,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700'
    },
    {
      nombre: 'Efectivo',
      key: 'Efectivo',
      icon: DollarSign,
      color: 'gray',
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700'
    },
    {
      nombre: 'Préstamos',
      key: 'Préstamos',
      icon: Handshake,
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700'
    }
  ];

  // CAMBIO: Excluir préstamos del cálculo del total
  const totalSaldos = Object.entries(bancos)
    .filter(([banco]) => banco !== 'Préstamos')
    .reduce((sum, [, saldo]) => sum + saldo, 0);

  // Valor de préstamos por separado (solo informativo)
  const valorPrestamos = bancos['Préstamos'] || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Wallet className="w-6 h-6 mr-2" />
          Saldos por Banco
        </h2>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
          <span className="text-white font-semibold">
            Total: {formatoMoneda(totalSaldos)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {bancosConfig.map((banco) => {
          const saldo = bancos[banco.key] || 0;
          const IconComponent = banco.icon;
          
          return (
            <Card 
              key={banco.key}
              className={`p-4 hover:shadow-lg transition-all duration-200 hover:scale-105 ${
                saldo < 0 ? 'ring-2 ring-red-200 bg-red-50' : ''
              } ${
                banco.key === 'Préstamos' ? 'ring-2 ring-orange-200 bg-orange-50' : ''
              }`}
              hover
            >
              <div className="flex items-center mb-3">
                <div className={`w-10 h-10 rounded-full ${banco.bgColor} flex items-center justify-center mr-3`}>
                  <IconComponent className={`w-5 h-5 ${banco.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {banco.nombre}
                </h3>
              </div>
              
              <div className="text-right">
                <p className={`font-bold text-lg ${
                  banco.key === 'Préstamos' 
                    ? 'text-orange-600' 
                    : saldo >= 0 ? banco.textColor : 'text-red-600'
                }`}>
                  {formatoMoneda(saldo)}
                </p>
                
                {saldo < 0 && banco.key !== 'Préstamos' && (
                  <p className="text-xs text-red-500 mt-1">
                    Saldo negativo
                  </p>
                )}
                
                {banco.key === 'Préstamos' && saldo > 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    Solo informativo
                  </p>
                )}

                {banco.key === 'Préstamos' && saldo === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sin préstamos activos
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Resumen rápido */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Bancos Digitales</p>
              <p className="text-lg font-bold text-indigo-600">
                {formatoMoneda(
                  (bancos['Nequi'] || 0) + 
                  (bancos['Daviplata'] || 0) + 
                  (bancos['Bolsillo'] || 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Bancos Tradicionales</p>
              <p className="text-lg font-bold text-blue-600">
                {formatoMoneda(
                  (bancos['Banco de Bogotá'] || 0) + 
                  (bancos['Colpatria'] || 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Físico</p>
              <p className="text-lg font-bold text-gray-600">
                {formatoMoneda(bancos['Efectivo'] || 0)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Liquidez Total</p>
            <p className="text-xl font-bold text-green-600">
              {formatoMoneda(totalSaldos)}
            </p>
            {valorPrestamos > 0 && (
              <p className="text-xs text-orange-600">
                + {formatoMoneda(valorPrestamos)} por cobrar (informativo)
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};