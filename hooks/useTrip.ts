'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type TarjetaTipo = 'vuelo' | 'hotel' | 'actividad' | 'documento' | 'nota';

export interface Tarjeta {
  id: number;
  etapa_id: number;
  tipo: TarjetaTipo;
  titulo: string;
  descripcion: string | null;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  confirmacion: string | null;
  completado: boolean;
  orden: number;
}

export interface Etapa {
  id: number;
  nombre: string;
  emoji: string;
  ciudad: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  orden: number;
  tarjetas: Tarjeta[];
}

// ─── Datos iniciales del viaje ────────────────────────────────────────────────

const ETAPAS_SEED = [
  { nombre: 'Preparación',     emoji: '📋', ciudad: null,      fecha_inicio: null,         fecha_fin: null,         activa: false, orden: 1  },
  { nombre: 'Cali → Madrid',   emoji: '✈️', ciudad: 'Cali',    fecha_inicio: '2026-06-07', fecha_fin: '2026-06-07', activa: false, orden: 2  },
  { nombre: 'Madrid I',        emoji: '🏙️', ciudad: 'Madrid',  fecha_inicio: '2026-06-08', fecha_fin: '2026-06-09', activa: false, orden: 3  },
  { nombre: 'Madrid → París',  emoji: '✈️', ciudad: 'Madrid',  fecha_inicio: '2026-06-09', fecha_fin: '2026-06-09', activa: false, orden: 4  },
  { nombre: 'París',           emoji: '🗼', ciudad: 'París',   fecha_inicio: '2026-06-09', fecha_fin: '2026-06-11', activa: false, orden: 5  },
  { nombre: 'París → Roma',    emoji: '✈️', ciudad: 'París',   fecha_inicio: '2026-06-11', fecha_fin: '2026-06-11', activa: false, orden: 6  },
  { nombre: 'Roma',            emoji: '🏛️', ciudad: 'Roma',    fecha_inicio: '2026-06-11', fecha_fin: '2026-06-20', activa: false, orden: 7  },
  { nombre: 'Roma → Madrid',   emoji: '✈️', ciudad: 'Roma',    fecha_inicio: '2026-06-20', fecha_fin: '2026-06-20', activa: false, orden: 8  },
  { nombre: 'Madrid II',       emoji: '🏙️', ciudad: 'Madrid',  fecha_inicio: '2026-06-20', fecha_fin: '2026-06-21', activa: false, orden: 9  },
  { nombre: 'Madrid → Cali',   emoji: '✈️', ciudad: 'Madrid',  fecha_inicio: '2026-06-21', fecha_fin: '2026-06-21', activa: false, orden: 10 },
  { nombre: 'En Casa 🏠',       emoji: '🏠', ciudad: 'Cali',    fecha_inicio: null,         fecha_fin: null,         activa: false, orden: 11 },
];

const TARJETAS_SEED: Record<number, Omit<Tarjeta, 'id' | 'etapa_id'>[]> = {
  1: [ // Preparación
    { tipo: 'documento', titulo: 'Pasaporte vigente', descripcion: null, fecha: null, hora: null, lugar: null, confirmacion: null, completado: false, orden: 1 },
    { tipo: 'documento', titulo: 'Seguro de viaje', descripcion: null, fecha: null, hora: null, lugar: null, confirmacion: null, completado: false, orden: 2 },
    { tipo: 'actividad', titulo: 'Empacar maleta', descripcion: null, fecha: null, hora: null, lugar: null, confirmacion: null, completado: false, orden: 3 },
    { tipo: 'actividad', titulo: 'Confirmar todas las reservas', descripcion: null, fecha: null, hora: null, lugar: null, confirmacion: null, completado: false, orden: 4 },
    { tipo: 'actividad', titulo: 'Descargar mapas offline', descripcion: 'Google Maps: Madrid, París, Roma', fecha: null, hora: null, lugar: null, confirmacion: null, completado: false, orden: 5 },
  ],
  2: [ // Cali → Madrid
    { tipo: 'vuelo', titulo: 'Avianca · Cali → Madrid', descripcion: 'Llegar al aeropuerto 3h antes', fecha: '2026-06-07', hora: '16:30', lugar: 'Aeropuerto Alfonso Bonilla Aragón, Cali', confirmacion: null, completado: false, orden: 1 },
  ],
  3: [ // Madrid I
    { tipo: 'hotel', titulo: 'Pensión DANIEL', descripcion: '13 Calle del Mesón de Paredes, Madrid 28012', fecha: '2026-06-08', hora: 'Check-in', lugar: 'Madrid Centro', confirmacion: '5016127094', completado: false, orden: 1 },
  ],
  4: [ // Madrid → París
    { tipo: 'vuelo', titulo: 'Transavia TO4633 · Madrid → París Orly', descripcion: 'Salir al aeropuerto con 2h de anticipación', fecha: '2026-06-09', hora: '13:00 → 15:05 (2h05)', lugar: 'Aeropuerto Madrid-Barajas', confirmacion: null, completado: false, orden: 1 },
  ],
  5: [ // París
    { tipo: 'hotel', titulo: 'Chez Mia Paris', descripcion: '167 Rue de la Roquette, Bastilla - 11º distrito, 75011 París\nGPS: N 048° 51.581, E 02° 23.253', fecha: '2026-06-09', hora: 'Check-in 14:00 - 23:00', lugar: 'Bastilla, París', confirmacion: '+33 7 81 84 97 16', completado: false, orden: 1 },
    { tipo: 'actividad', titulo: 'Check-out Chez Mia', descripcion: null, fecha: '2026-06-11', hora: '06:00 - 11:30', lugar: null, confirmacion: null, completado: false, orden: 2 },
  ],
  6: [ // París → Roma
    { tipo: 'vuelo', titulo: 'Volotea V7 3803 · París Orly → Asturias', descripcion: 'Terminal T3 París Orly', fecha: '2026-06-11', hora: '14:10 → 16:00', lugar: 'París Orly (T3)', confirmacion: 'Y3T3NB', completado: false, orden: 1 },
    { tipo: 'vuelo', titulo: 'Volotea V7 3518 · Asturias → Roma Fiumicino', descripcion: 'Roma Fiumicino Terminal 1', fecha: '2026-06-11', hora: '19:15 → 21:40', lugar: 'Aeropuerto de Asturias', confirmacion: 'MFEK6U', completado: false, orden: 2 },
  ],
  7: [ // Roma
    { tipo: 'hotel', titulo: 'Casa de amigo en Roma', descripcion: 'Hospedaje con amigo local · Roma Fiumicino llegada ~21:40', fecha: '2026-06-11', hora: 'Llegada ~21:40', lugar: 'Roma', confirmacion: null, completado: false, orden: 1 },
  ],
  8: [ // Roma → Madrid
    { tipo: 'vuelo', titulo: 'FCO → MAD · 2 pasajeros', descripcion: 'Roma Fiumicino → Madrid Barajas', fecha: '2026-06-20', hora: '10:30 → 13:05', lugar: 'Roma Fiumicino (FCO)', confirmacion: '76EHNW', completado: false, orden: 1 },
  ],
  9: [ // Madrid II
    { tipo: 'hotel', titulo: 'BELLADURMIENTE', descripcion: 'Calle Los Geranios 2 - 2 Bajo, Tetuán, 28029 Madrid\nGPS: N 040° 28.231, W 03° 41.668', fecha: '2026-06-20', hora: 'Check-in 14:00 - 23:30', lugar: 'Tetuán, Madrid', confirmacion: '+34 676 69 86 99', completado: false, orden: 1 },
    { tipo: 'actividad', titulo: 'Check-out BELLADURMIENTE', descripcion: null, fecha: '2026-06-21', hora: '10:30 - 11:00', lugar: null, confirmacion: null, completado: false, orden: 2 },
  ],
  10: [ // Madrid → Cali
    { tipo: 'vuelo', titulo: 'Avianca · Madrid → Cali', descripcion: 'Vuelo de regreso a casa', fecha: '2026-06-21', hora: '11:05', lugar: 'Aeropuerto Madrid-Barajas', confirmacion: null, completado: false, orden: 1 },
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

let _seeding = false; // guard a nivel de módulo para evitar doble seed en StrictMode

export function useTrip() {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { count } = await supabase
      .from('trip_etapas')
      .select('*', { count: 'exact', head: true });

    if (!count || count === 0) {
      if (_seeding) return;
      _seeding = true;
      await seedData();
      _seeding = false;
      return;
    }

    const { data } = await supabase
      .from('trip_etapas')
      .select('*, trip_tarjetas(*)')
      .order('orden');

    if (!data) { setLoading(false); return; }

    setEtapas(data.map((e: Etapa & { trip_tarjetas?: Tarjeta[] }) => ({
      ...e,
      tarjetas: [...(e.trip_tarjetas || [])].sort((a, b) => a.orden - b.orden),
    })));
    setLoading(false);
  }, []);

  async function seedData() {
    const { data: inserted } = await supabase
      .from('trip_etapas')
      .insert(ETAPAS_SEED)
      .select('id, orden');

    if (!inserted) { setLoading(false); return; }

    const tarjetas = inserted.flatMap(e => {
      const cards = TARJETAS_SEED[e.orden as keyof typeof TARJETAS_SEED] ?? [];
      return cards.map(c => ({ ...c, etapa_id: e.id }));
    });

    if (tarjetas.length > 0) await supabase.from('trip_tarjetas').insert(tarjetas);
    await fetchData();
  }

  useEffect(() => { fetchData(); }, [fetchData]);

  const setEtapaActiva = async (id: number) => {
    await supabase.from('trip_etapas').update({ activa: false }).neq('id', 0);
    await supabase.from('trip_etapas').update({ activa: true }).eq('id', id);
    await fetchData();
  };

  const addEtapa = async (data: Omit<Etapa, 'id' | 'tarjetas'>) => {
    const maxOrden = Math.max(...etapas.map(e => e.orden), 0);
    await supabase.from('trip_etapas').insert({ ...data, orden: maxOrden + 1 });
    await fetchData();
  };

  const deleteEtapa = async (id: number) => {
    await supabase.from('trip_etapas').delete().eq('id', id);
    await fetchData();
  };

  const addTarjeta = async (etapa_id: number, data: Omit<Tarjeta, 'id' | 'etapa_id'>) => {
    const etapa = etapas.find(e => e.id === etapa_id);
    const maxOrden = Math.max(...(etapa?.tarjetas.map(t => t.orden) ?? [0]), 0);
    await supabase.from('trip_tarjetas').insert({ ...data, etapa_id, orden: maxOrden + 1 });
    await fetchData();
  };

  const deleteTarjeta = async (id: number) => {
    await supabase.from('trip_tarjetas').delete().eq('id', id);
    await fetchData();
  };

  const moveTarjeta = async (tarjeta: Tarjeta, direction: 'prev' | 'next') => {
    const idx = etapas.findIndex(e => e.id === tarjeta.etapa_id);
    const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= etapas.length) return;
    await supabase.from('trip_tarjetas').update({ etapa_id: etapas[targetIdx].id }).eq('id', tarjeta.id);
    await fetchData();
  };

  const toggleCompletado = async (tarjeta: Tarjeta) => {
    await supabase.from('trip_tarjetas').update({ completado: !tarjeta.completado }).eq('id', tarjeta.id);
    await fetchData();
  };

  return { etapas, loading, setEtapaActiva, addEtapa, deleteEtapa, addTarjeta, deleteTarjeta, moveTarjeta, toggleCompletado, refresh: fetchData };
}
