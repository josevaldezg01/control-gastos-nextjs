'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrip, Etapa, Tarjeta, TarjetaTipo } from '@/hooks/useTrip';

// ─── Constantes visuales ──────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TarjetaTipo, { icon: string; bg: string; border: string; badge: string }> = {
  vuelo:      { icon: '✈️', bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700'   },
  hotel:      { icon: '🏨', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  actividad:  { icon: '🎯', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700'  },
  documento:  { icon: '📄', bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700'  },
  nota:       { icon: '📝', bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600'    },
};

function formatFecha(fecha: string | null) {
  if (!fecha) return null;
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

// ─── Tarjeta Card ─────────────────────────────────────────────────────────────

function TarjetaCard({ tarjeta, isFirst, isLast, onMove, onDelete, onToggle }: {
  tarjeta: Tarjeta;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: 'prev' | 'next') => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIPO_CONFIG[tarjeta.tipo];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} ${tarjeta.completado ? 'opacity-50' : ''} transition-all`}>
      <div className="p-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">{cfg.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-snug ${tarjeta.completado ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {tarjeta.titulo}
            </p>
            {tarjeta.fecha && (
              <p className="text-xs text-gray-500 mt-0.5">
                📅 {formatFecha(tarjeta.fecha)}{tarjeta.hora ? ` · ${tarjeta.hora}` : ''}
              </p>
            )}
            {tarjeta.confirmacion && (
              <p className="text-xs text-gray-500 mt-0.5">🔖 {tarjeta.confirmacion}</p>
            )}
          </div>
          <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>

        {expanded && (
          <div className="mt-2 space-y-1 pl-6">
            {tarjeta.lugar && <p className="text-xs text-gray-600">📍 {tarjeta.lugar}</p>}
            {tarjeta.descripcion && (
              <p className="text-xs text-gray-600 whitespace-pre-line">{tarjeta.descripcion}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 px-3 pb-2 border-t border-current/10">
        <button onClick={() => onMove('prev')} disabled={isFirst}
          className="px-2 py-1 rounded text-xs text-gray-500 disabled:opacity-20 hover:bg-white/60 active:scale-95">◀</button>
        <button onClick={() => onMove('next')} disabled={isLast}
          className="px-2 py-1 rounded text-xs text-gray-500 disabled:opacity-20 hover:bg-white/60 active:scale-95">▶</button>
        <div className="flex-1" />
        <button onClick={onToggle}
          className={`px-2 py-1 rounded text-xs font-medium active:scale-95 ${tarjeta.completado ? 'text-gray-400 hover:bg-white/60' : 'text-green-600 hover:bg-green-100'}`}>
          {tarjeta.completado ? '↩' : '✓'}
        </button>
        <button onClick={onDelete}
          className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-50 active:scale-95">🗑</button>
      </div>
    </div>
  );
}

// ─── Modal Tarjeta ────────────────────────────────────────────────────────────

function ModalTarjeta({ onSave, onClose }: {
  onSave: (data: Omit<Tarjeta, 'id' | 'etapa_id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Tarjeta, 'id' | 'etapa_id'>>({
    tipo: 'actividad', titulo: '', descripcion: null, fecha: null,
    hora: null, lugar: null, confirmacion: null, completado: false, orden: 0,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v || null }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Nueva tarjeta</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Tipo</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {(Object.keys(TIPO_CONFIG) as TarjetaTipo[]).map(t => (
              <button key={t} onClick={() => set('tipo', t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.tipo === t ? TIPO_CONFIG[t].badge + ' border-current' : 'border-gray-200 text-gray-500'}`}>
                {TIPO_CONFIG[t].icon} {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Título *</label>
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ej: Visita al Coliseo" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 font-medium">Fecha</label>
            <input type="date" onChange={e => set('fecha', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Hora</label>
            <input type="text" placeholder="14:00" onChange={e => set('hora', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Lugar / Dirección</label>
          <input onChange={e => set('lugar', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ej: Aeropuerto El Dorado" />
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">N° Reserva / Teléfono</label>
          <input onChange={e => set('confirmacion', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ej: ABC123" />
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Notas</label>
          <textarea rows={2} onChange={e => set('descripcion', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            placeholder="Detalles adicionales..." />
        </div>

        <button onClick={() => { if (form.titulo.trim()) { onSave(form); onClose(); } }}
          disabled={!form.titulo.trim()}
          className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all">
          Agregar
        </button>
      </div>
    </div>
  );
}

// ─── Modal Etapa ──────────────────────────────────────────────────────────────

function ModalEtapa({ onSave, onClose }: {
  onSave: (data: Omit<Etapa, 'id' | 'tarjetas'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ nombre: '', emoji: '📍', ciudad: '', fecha_inicio: '', fecha_fin: '', activa: false, orden: 0 });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Nueva etapa</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>
        <div className="flex gap-2">
          <div className="w-16">
            <label className="text-xs text-gray-500 font-medium">Emoji</label>
            <input value={form.emoji} onChange={e => set('emoji', e.target.value)}
              className="w-full mt-1 px-2 py-2 border border-gray-200 rounded-lg text-center text-lg focus:outline-none" maxLength={2} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="ej: Lisboa" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Ciudad</label>
          <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 font-medium">Desde</label>
            <input type="date" onChange={e => set('fecha_inicio', e.target.value)}
              className="w-full mt-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Hasta</label>
            <input type="date" onChange={e => set('fecha_fin', e.target.value)}
              className="w-full mt-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <button onClick={() => { if (form.nombre.trim()) { onSave({ ...form, ciudad: form.ciudad || null, fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null }); onClose(); } }}
          disabled={!form.nombre.trim()}
          className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all">
          Crear etapa
        </button>
      </div>
    </div>
  );
}

// ─── Columna Kanban ───────────────────────────────────────────────────────────

function KanbanColumna({ etapa, isFirst, isLast, onActivar, onAddTarjeta, onMoveTarjeta, onDeleteTarjeta, onToggleTarjeta, onDeleteEtapa }: {
  etapa: Etapa;
  isFirst: boolean;
  isLast: boolean;
  onActivar: () => void;
  onAddTarjeta: (data: Omit<Tarjeta, 'id' | 'etapa_id'>) => void;
  onMoveTarjeta: (t: Tarjeta, d: 'prev' | 'next') => void;
  onDeleteTarjeta: (id: number) => void;
  onToggleTarjeta: (t: Tarjeta) => void;
  onDeleteEtapa: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const completadas = etapa.tarjetas.filter(t => t.completado).length;
  const total = etapa.tarjetas.length;

  return (
    <>
      <div className={`flex-shrink-0 w-64 flex flex-col rounded-2xl border-2 transition-all duration-300 ${
        etapa.activa
          ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100'
          : 'border-gray-200 bg-white/80'
      }`}>
        {/* Header columna */}
        <div className="p-3 border-b border-current/10">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-lg">{etapa.emoji}</span>
                <span className="font-bold text-sm text-gray-800 truncate">{etapa.nombre}</span>
                {etapa.activa && <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-medium">📍</span>}
              </div>
              {(etapa.fecha_inicio || etapa.fecha_fin) && (
                <p className="text-xs text-gray-400 mt-0.5 pl-6">
                  {formatFecha(etapa.fecha_inicio)}{etapa.fecha_fin && etapa.fecha_fin !== etapa.fecha_inicio ? ` → ${formatFecha(etapa.fecha_fin)}` : ''}
                </p>
              )}
              {total > 0 && (
                <p className="text-xs text-gray-400 pl-6">{completadas}/{total} listas</p>
              )}
            </div>
            <button onClick={onDeleteEtapa} className="text-gray-300 hover:text-red-400 text-xs p-1 active:scale-95">🗑</button>
          </div>

          <button onClick={onActivar}
            className={`mt-2 w-full py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              etapa.activa
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
            }`}>
            {etapa.activa ? '📍 Estoy aquí' : 'Marcar como actual'}
          </button>
        </div>

        {/* Tarjetas */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[55vh]">
          {etapa.tarjetas.map(t => (
            <TarjetaCard
              key={t.id}
              tarjeta={t}
              isFirst={isFirst}
              isLast={isLast}
              onMove={dir => onMoveTarjeta(t, dir)}
              onDelete={() => onDeleteTarjeta(t.id)}
              onToggle={() => onToggleTarjeta(t)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-current/10">
          <button onClick={() => setShowModal(true)}
            className="w-full py-2 rounded-xl bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 text-sm font-medium transition-all active:scale-95">
            + Agregar
          </button>
        </div>
      </div>

      {showModal && <ModalTarjeta onSave={onAddTarjeta} onClose={() => setShowModal(false)} />}
    </>
  );
}

// ─── Board principal ──────────────────────────────────────────────────────────

export default function TripBoard() {
  const router = useRouter();
  const { etapas, loading, setEtapaActiva, addEtapa, deleteEtapa, addTarjeta, deleteTarjeta, moveTarjeta, toggleCompletado } = useTrip();
  const [showModalEtapa, setShowModalEtapa] = useState(false);

  const etapaActiva = etapas.find(e => e.activa);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">✈️</div>
          <p className="text-gray-500 font-medium">Cargando tu viaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 text-base leading-tight">🗺️ Europa 2026</h1>
            <p className="text-xs text-gray-500 truncate">
              {etapaActiva
                ? `📍 Ahora en: ${etapaActiva.emoji} ${etapaActiva.nombre}`
                : '7 Jun – 21 Jun · Toca "Marcar como actual" para ubicarte'}
            </p>
          </div>
          <button onClick={() => setShowModalEtapa(true)}
            className="px-3 py-2 bg-indigo-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all whitespace-nowrap">
            + Etapa
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: 'max-content' }}>
          {etapas.map((etapa, idx) => (
            <KanbanColumna
              key={etapa.id}
              etapa={etapa}
              isFirst={idx === 0}
              isLast={idx === etapas.length - 1}
              onActivar={() => setEtapaActiva(etapa.id)}
              onAddTarjeta={data => addTarjeta(etapa.id, data)}
              onMoveTarjeta={(t, d) => moveTarjeta(t, d)}
              onDeleteTarjeta={id => deleteTarjeta(id)}
              onToggleTarjeta={t => toggleCompletado(t)}
              onDeleteEtapa={() => deleteEtapa(etapa.id)}
            />
          ))}
        </div>
      </div>

      {showModalEtapa && (
        <ModalEtapa
          onSave={data => addEtapa(data)}
          onClose={() => setShowModalEtapa(false)}
        />
      )}
    </div>
  );
}
