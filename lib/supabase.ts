// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funciones helper para la base de datos
export const dbHelpers = {
  // Movimientos
  async getMovimientos(mesContable: string) {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .eq('mes_contable', mesContable)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async insertMovimiento(movimiento: any) {
    const { data, error } = await supabase
      .from('movimientos')
      .insert([movimiento])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Préstamos familiares
  async getPrestamosActivos() {
    const { data, error } = await supabase
      .from('prestamos_familiares')
      .select('*')
      .eq('activo', true)
      .order('fecha_prestamo', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async insertPrestamo(prestamo: any) {
    const { data, error } = await supabase
      .from('prestamos_familiares')
      .insert([prestamo])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePrestamo(id: number, updates: any) {
    const { data, error } = await supabase
      .from('prestamos_familiares')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePrestamo(id: number) {
    const { error } = await supabase
      .from('prestamos_familiares')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Pagos pendientes
  async getPagosPendientes() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const { data, error } = await supabase
      .from('pagos_pendientes')
      .select('*')
      .or(`completado.eq.false,fecha_completado.gte.${primerDiaMes.toISOString()}`)
      .order('fecha_vencimiento', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async insertPagoPendiente(pago: any) {
    const { data, error } = await supabase
      .from('pagos_pendientes')
      .insert([pago])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePagoPendiente(id: number, updates: any) {
    const { data, error } = await supabase
      .from('pagos_pendientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePagoPendiente(id: number) {
    const { error } = await supabase
      .from('pagos_pendientes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Historial mensual
  async getHistorialMensual() {
    const { data, error } = await supabase
      .from('historial_mensual')
      .select('*')
      .order('fecha_cierre', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async insertHistorialMensual(historial: any) {
    const { data, error } = await supabase
      .from('historial_mensual')
      .insert([historial])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMovimientosByMes(mesContable: string) {
    const { error } = await supabase
      .from('movimientos')
      .delete()
      .eq('mes_contable', mesContable);

    if (error) throw error;
  }
};

// NotesFlow helpers
export const notesFlowHelpers = {
  // Sticky Notes
  async getNotes() {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addNote(content: string, color: string) {
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert([{ content, color }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(id: string, content: string, color: string) {
    const { data, error } = await supabase
      .from('sticky_notes')
      .update({ content, color })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(id: string) {
    const { error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addTask(content: string) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ content, completed: false }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: { completed?: boolean; content?: string }) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};