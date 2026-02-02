// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funciones helper para la base de datos
export const dbHelpers = {
  // Mes Activo Global
  async getMesActivoGlobal() {
    const { data, error } = await supabase
      .from('mes_activo_global')
      .select('mes_activo')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data?.mes_activo || null;
  },

  async setMesActivoGlobal(mesActivo: string) {
    const { data, error } = await supabase
      .from('mes_activo_global')
      .update({
        mes_activo: mesActivo,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

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
  async getPagosPendientes(mesContable?: string) {
    let query = supabase
      .from('pagos_pendientes')
      .select('*');

    if (mesContable) {
      // Filtrar por mes específico
      query = query.eq('mes_contable', mesContable);
    }

    const { data, error } = await query.order('fecha_vencimiento', { ascending: true });

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

// Streaming helpers
export const streamingHelpers = {
  // ============================================
  // CUENTAS DE STREAMING
  // ============================================

  async getCuentas() {
    const { data, error } = await supabase
      .from('cuentas_streaming')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCuentasActivas() {
    const { data, error } = await supabase
      .from('cuentas_streaming')
      .select('*')
      .eq('activa', true)
      .order('servicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addCuenta(cuenta: {
    servicio: string;
    tipo_cuenta: string;
    costo_mensual: number;
    dia_pago?: number;
    extras?: any;
    notas?: string;
  }) {
    const { data, error } = await supabase
      .from('cuentas_streaming')
      .insert([cuenta])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCuenta(id: number, updates: any) {
    const { data, error } = await supabase
      .from('cuentas_streaming')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCuenta(id: number) {
    const { error } = await supabase
      .from('cuentas_streaming')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // CLIENTES DE STREAMING
  // ============================================

  async getClientes() {
    const { data, error } = await supabase
      .from('clientes_streaming')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getClientesActivos() {
    const { data, error } = await supabase
      .from('clientes_streaming')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addCliente(cliente: {
    nombre: string;
    telefono?: string;
    email?: string;
    notas?: string;
  }) {
    const { data, error } = await supabase
      .from('clientes_streaming')
      .insert([cliente])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCliente(id: number, updates: any) {
    const { data, error } = await supabase
      .from('clientes_streaming')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCliente(id: number) {
    const { error } = await supabase
      .from('clientes_streaming')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // SUSCRIPCIONES
  // ============================================

  async getSuscripciones() {
    const { data, error } = await supabase
      .from('suscripciones')
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSuscripcionesActivas() {
    const { data, error } = await supabase
      .from('suscripciones')
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .eq('activa', true)
      .order('proximo_cobro', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getSuscripcionesPendientes() {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('suscripciones')
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .eq('activa', true)
      .lte('proximo_cobro', hoy)
      .order('proximo_cobro', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getSuscripcionesPorCuenta(cuentaId: number) {
    const { data, error } = await supabase
      .from('suscripciones')
      .select(`
        *,
        cliente:clientes_streaming(*)
      `)
      .eq('cuenta_id', cuentaId)
      .eq('activa', true);

    if (error) throw error;
    return data || [];
  },

  async getSuscripcionesPorCliente(clienteId: number) {
    const { data, error } = await supabase
      .from('suscripciones')
      .select(`
        *,
        cuenta:cuentas_streaming(*)
      `)
      .eq('cliente_id', clienteId)
      .eq('activa', true);

    if (error) throw error;
    return data || [];
  },

  async addSuscripcion(suscripcion: {
    cuenta_id: number;
    cliente_id: number;
    tipo_acceso: string;
    costo_mensual: number;
    proximo_cobro: string;
    notas?: string;
  }) {
    const { data, error } = await supabase
      .from('suscripciones')
      .insert([suscripcion])
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateSuscripcion(id: number, updates: any) {
    const { data, error } = await supabase
      .from('suscripciones')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async cancelarSuscripcion(id: number) {
    const { data, error } = await supabase
      .from('suscripciones')
      .update({
        activa: false,
        fecha_fin: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProximoCobro(suscripcionId: number) {
    // Obtener suscripción actual
    const { data: suscripcion, error: errorGet } = await supabase
      .from('suscripciones')
      .select('proximo_cobro')
      .eq('id', suscripcionId)
      .single();

    if (errorGet) throw errorGet;

    // Sumar 1 mes a la fecha actual
    const fechaActual = new Date(suscripcion.proximo_cobro);
    fechaActual.setMonth(fechaActual.getMonth() + 1);
    const nuevaFecha = fechaActual.toISOString().split('T')[0];

    // Actualizar
    const { data, error } = await supabase
      .from('suscripciones')
      .update({ proximo_cobro: nuevaFecha })
      .eq('id', suscripcionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async marcarRecordatorio(suscripcionId: number) {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('suscripciones')
      .update({ fecha_recordatorio: hoy })
      .eq('id', suscripcionId)
      .select(`
        *,
        cuenta:cuentas_streaming(*),
        cliente:clientes_streaming(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async limpiarRecordatorio(suscripcionId: number) {
    const { data, error } = await supabase
      .from('suscripciones')
      .update({ fecha_recordatorio: null })
      .eq('id', suscripcionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================
  // PAGOS DE STREAMING (Cobros a clientes)
  // ============================================

  async getPagos(mesContable?: string) {
    let query = supabase
      .from('pagos_streaming')
      .select(`
        *,
        suscripcion:suscripciones(*),
        cliente:clientes_streaming(*)
      `)
      .order('fecha_pago', { ascending: false });

    if (mesContable) {
      query = query.eq('mes_contable', mesContable);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addPago(pago: {
    suscripcion_id: number;
    cliente_id: number;
    servicio: string;
    monto: number;
    fecha_pago: string;
    banco_destino: string;
    mes_contable: string;
    notas?: string;
  }) {
    // 1. Crear registro de pago
    const { data: pagoData, error: pagoError } = await supabase
      .from('pagos_streaming')
      .insert([pago])
      .select()
      .single();

    if (pagoError) throw pagoError;

    // 2. Crear ingreso en movimientos
    const { error: movError } = await supabase
      .from('movimientos')
      .insert([{
        tipo: 'ingreso',
        valor: pago.monto,
        descripcion: `Cobro ${pago.servicio} - ${pago.notas || 'Cliente'}`,
        categoria: `Venta de cuentas ${pago.servicio}`,
        banco_destino: pago.banco_destino,
        fecha: pago.fecha_pago,
        mes_contable: pago.mes_contable
      }]);

    if (movError) {
      console.error('Error detallado al crear movimiento:', movError);
      throw movError;
    }

    return pagoData;
  },

  // ============================================
  // COSTOS DE STREAMING (Pagos a servicios)
  // ============================================

  async getCostos(mesContable?: string) {
    let query = supabase
      .from('costos_streaming')
      .select(`
        *,
        cuenta:cuentas_streaming(*)
      `)
      .order('fecha_pago', { ascending: false });

    if (mesContable) {
      query = query.eq('mes_contable', mesContable);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addCosto(costo: {
    cuenta_id: number;
    servicio: string;
    tipo_cuenta: string;
    monto: number;
    fecha_pago: string;
    banco_origen: string;
    mes_contable: string;
    notas?: string;
  }) {
    // 1. Crear registro de costo
    const { data: costoData, error: costoError } = await supabase
      .from('costos_streaming')
      .insert([costo])
      .select()
      .single();

    if (costoError) throw costoError;

    // 2. Crear gasto en movimientos
    const { error: movError } = await supabase
      .from('movimientos')
      .insert([{
        tipo: 'gasto',
        valor: costo.monto,
        descripcion: `Pago ${costo.servicio} ${costo.tipo_cuenta}`,
        categoria: `Pago de cuentas ${costo.servicio}`,
        banco_destino: costo.banco_origen,
        fecha: costo.fecha_pago,
        mes_contable: costo.mes_contable
      }]);

    if (movError) throw movError;

    return costoData;
  },

  // ============================================
  // CONSOLIDACIONES DE STREAMING
  // ============================================

  async getPendientesConsolidacion(mesContable?: string) {
    // Obtener pagos no consolidados
    let queryPagos = supabase
      .from('pagos_streaming')
      .select('*')
      .eq('consolidado', false);

    if (mesContable) {
      queryPagos = queryPagos.eq('mes_contable', mesContable);
    }

    const { data: pagos, error: errorPagos } = await queryPagos;
    if (errorPagos) throw errorPagos;

    // Obtener costos no consolidados
    let queryCostos = supabase
      .from('costos_streaming')
      .select('*')
      .eq('consolidado', false);

    if (mesContable) {
      queryCostos = queryCostos.eq('mes_contable', mesContable);
    }

    const { data: costos, error: errorCostos } = await queryCostos;
    if (errorCostos) throw errorCostos;

    return {
      pagos: pagos || [],
      costos: costos || [],
      totalCobros: pagos?.reduce((sum, p) => sum + p.monto, 0) || 0,
      totalCostos: costos?.reduce((sum, c) => sum + c.monto, 0) || 0,
      gananciaNeta: (pagos?.reduce((sum, p) => sum + p.monto, 0) || 0) - (costos?.reduce((sum, c) => sum + c.monto, 0) || 0)
    };
  },

  async consolidarGanancias(params: {
    pagoIds: number[];
    costoIds: number[];
    montoCobros: number;
    montoCostos: number;
    gananciaNeta: number;
    mesContable: string;
    notas?: string;
  }) {
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Crear el movimiento de ingreso (la ganancia consolidada)
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos')
      .insert([{
        tipo: 'ingreso',
        valor: params.gananciaNeta,
        descripcion: `Consolidación ganancias streaming - ${params.notas || 'Mes ' + params.mesContable}`,
        categoria: 'Ganancias streaming',
        fecha: hoy,
        mes_contable: params.mesContable,
        banco_destino: null // No afecta bancos, el dinero ya está ahí
      }])
      .select()
      .single();

    if (movError) throw movError;

    // 2. Crear registro de consolidación
    const { data: consolidacion, error: consError } = await supabase
      .from('consolidaciones_streaming')
      .insert([{
        monto_cobros: params.montoCobros,
        monto_costos: params.montoCostos,
        ganancia_neta: params.gananciaNeta,
        movimiento_id: movimiento.id,
        fecha_consolidacion: hoy,
        mes_contable: params.mesContable,
        notas: params.notas
      }])
      .select()
      .single();

    if (consError) throw consError;

    // 3. Marcar pagos como consolidados
    if (params.pagoIds.length > 0) {
      const { error: errorPagos } = await supabase
        .from('pagos_streaming')
        .update({
          consolidado: true,
          fecha_consolidacion: hoy,
          consolidacion_id: consolidacion.id
        })
        .in('id', params.pagoIds);

      if (errorPagos) throw errorPagos;
    }

    // 4. Marcar costos como consolidados
    if (params.costoIds.length > 0) {
      const { error: errorCostos } = await supabase
        .from('costos_streaming')
        .update({
          consolidado: true,
          fecha_consolidacion: hoy,
          consolidacion_id: consolidacion.id
        })
        .in('id', params.costoIds);

      if (errorCostos) throw errorCostos;
    }

    return consolidacion;
  },

  async getConsolidaciones(mesContable?: string) {
    let query = supabase
      .from('consolidaciones_streaming')
      .select('*')
      .order('created_at', { ascending: false });

    if (mesContable) {
      query = query.eq('mes_contable', mesContable);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};