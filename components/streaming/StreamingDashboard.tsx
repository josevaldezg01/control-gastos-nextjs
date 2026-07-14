'use client';

import { useState } from 'react';
import { useGastos } from '@/hooks/useGastos';
import { useStreaming } from '@/hooks/useStreaming';
import { ResumenTab } from './ResumenTab';
import { CuentasTab } from './CuentasTab';
import { ClientesTab } from './ClientesTab';
import { SuscripcionesTab } from './SuscripcionesTab';
import { CobrosTab } from './CobrosTab';
import { CostosTab } from './CostosTab';
import { TareasTab } from './TareasTab';

type TabId = 'resumen' | 'cuentas' | 'clientes' | 'suscripciones' | 'cobros' | 'costos' | 'tareas';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'resumen', label: 'Resumen', icon: '📊' },
  { id: 'cuentas', label: 'Cuentas', icon: '🎬' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'suscripciones', label: 'Suscripciones', icon: '📝' },
  { id: 'cobros', label: 'Cobros', icon: '💰' },
  { id: 'costos', label: 'Costos', icon: '💸' },
  { id: 'tareas', label: 'Tareas', icon: '📌' }
];

export const StreamingDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const { mesActivo } = useGastos();
  const streaming = useStreaming(mesActivo);

  if (streaming.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando módulo de streaming...</div>
      </div>
    );
  }

  if (streaming.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {streaming.error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            🎬 Gestión de Streaming
          </h1>
          <p className="text-white/60 text-sm">by Jose Valdez</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all
                  ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-900 shadow-lg scale-105'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          {activeTab === 'resumen' && <ResumenTab streaming={streaming} />}
          {activeTab === 'cuentas' && <CuentasTab streaming={streaming} />}
          {activeTab === 'clientes' && <ClientesTab streaming={streaming} />}
          {activeTab === 'suscripciones' && <SuscripcionesTab streaming={streaming} />}
          {activeTab === 'cobros' && <CobrosTab streaming={streaming} mesActivo={mesActivo} />}
          {activeTab === 'costos' && <CostosTab streaming={streaming} mesActivo={mesActivo} />}
          {activeTab === 'tareas' && <TareasTab streaming={streaming} />}
        </div>
      </div>
    </div>
  );
};
