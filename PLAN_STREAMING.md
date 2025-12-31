# Plan de Implementación: Módulo de Gestión de Streaming

## IMPORTANTE: Lógica de Reconocimiento de Ingresos

**Problema identificado:** El dinero cobrado a clientes NO debe aparecer como ganancia hasta que se paguen las cuentas a Netflix/Prime/etc.

**Solución implementada:**
- Los cobros a clientes se registran como INGRESOS normales (porque sí es dinero que entra)
- Los pagos a Netflix/Prime/etc se registran como GASTOS normales (porque sí es dinero que sale)
- La GANANCIA real se calcula automáticamente: `Balance = Ingresos - Gastos`

**Ejemplo:**
1. Cobras $20 de 4 clientes Netflix → +$20 ingresos
2. Pagas $20 a Netflix → -$20 gastos
3. Balance final: $20 - $20 = $0 (no hay ganancia, es punto de equilibrio)
4. Si uno de los clientes no paga: $15 cobrado - $20 pagado = -$5 (pérdida)
5. Si todos pagan y Netflix cuesta $15: $20 cobrado - $15 pagado = +$5 (ganancia real)

**Ventaja:** El sistema principal de Control de Gastos ya maneja correctamente el balance (Ingresos - Gastos). No necesitamos lógica especial, solo categorizar correctamente.

---

## 1. Modelo de Datos (Supabase)

### Tabla: `cuentas_streaming`
```sql
CREATE TABLE cuentas_streaming (
  id SERIAL PRIMARY KEY,
  servicio TEXT NOT NULL, -- 'Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'YouTube Premium'
  tipo_cuenta TEXT NOT NULL, -- 'Netflix 1 pantalla', 'Netflix 2 pantallas', 'Netflix 4 pantallas', '5 perfiles', 'Premium'
  extras JSONB DEFAULT '{}', -- Para extras de Netflix como juegos móviles
  costo_mensual DECIMAL(10,2) NOT NULL,
  dia_pago INTEGER, -- Día del mes que se paga (1-31)
  activa BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `clientes_streaming`
```sql
CREATE TABLE clientes_streaming (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `suscripciones`
```sql
CREATE TABLE suscripciones (
  id SERIAL PRIMARY KEY,
  cuenta_id INTEGER REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes_streaming(id) ON DELETE CASCADE,
  tipo_acceso TEXT NOT NULL, -- 'Pantalla 1', 'Pantalla 2', 'Perfil 1', 'Cuenta principal', 'Cuenta vinculada 1'
  costo_mensual DECIMAL(10,2) NOT NULL, -- Lo que paga el cliente
  proximo_cobro DATE NOT NULL, -- Fecha del próximo cobro (ej: 2025-01-05)
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE, -- NULL si está activa
  activa BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**NOTA IMPORTANTE sobre `proximo_cobro`:**
- Esta fecha se actualiza automáticamente al marcar un pago como cobrado
- Ejemplo: Cliente paga el 5 de enero (proximo_cobro: 2025-01-01) → al cobrar se actualiza a 2025-02-01
- Permite identificar fácilmente quién ya pagó vs quién está pendiente
- Al cambiar de mes (cerrar mes), los clientes con proximo_cobro < nuevo mes aparecen como pendientes

### Tabla: `pagos_streaming`
```sql
CREATE TABLE pagos_streaming (
  id SERIAL PRIMARY KEY,
  suscripcion_id INTEGER REFERENCES suscripciones(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes_streaming(id), -- Desnormalizado para queries más rápidas
  servicio TEXT NOT NULL, -- Desnormalizado: 'Netflix', 'Prime Video', etc
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago DATE NOT NULL, -- Fecha en que se recibió el pago
  banco_destino TEXT NOT NULL, -- Banco donde se recibió: 'Nequi', 'Daviplata', 'Bancolombia', etc
  mes_contable TEXT NOT NULL, -- Mes al que pertenece este pago (ej: '2025-01')
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**NOTA:** Esta tabla guarda un registro histórico de TODOS los pagos recibidos. No se auto-genera al inicio del mes, sino que se crea cuando el cliente efectivamente paga.

### Tabla: `costos_streaming`
```sql
CREATE TABLE costos_streaming (
  id SERIAL PRIMARY KEY,
  cuenta_id INTEGER REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
  servicio TEXT NOT NULL, -- Desnormalizado
  tipo_cuenta TEXT NOT NULL, -- Desnormalizado: 'Netflix 4 pantallas', etc
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago DATE NOT NULL, -- Fecha en que se pagó a Netflix/Prime/etc
  banco_origen TEXT NOT NULL, -- Banco desde donde se pagó
  mes_contable TEXT NOT NULL, -- Mes al que pertenece este pago (ej: '2025-01')
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**NOTA:** Similar a pagos_streaming, guarda histórico de pagos realizados a los servicios.

---

## 2. Lógica de Gestión de Pagos (Sin Auto-Generación)

### Sistema actual propuesto:

**Para Cobros a Clientes:**
1. Cada suscripción tiene campo `proximo_cobro` (fecha)
2. La UI muestra suscripciones donde `proximo_cobro <= mes_actual` como "Pendientes de pago"
3. Al marcar como cobrado:
   - Crear registro en `pagos_streaming` con fecha, banco y mes_contable
   - Crear `ingreso` en tabla `movimientos`
   - **Actualizar `suscripciones.proximo_cobro`** sumando 1 mes (ej: de 2025-01-01 a 2025-02-01)
4. Así el cliente desaparece de "pendientes" y reaparece el próximo mes

**Para Pagos a Servicios:**
1. Cada cuenta tiene campo `dia_pago` (día del mes)
2. La UI calcula si ya se pagó este mes buscando en `costos_streaming` con mes_contable actual
3. Si no existe registro para este mes, mostrar como "Pendiente de pago"
4. Al marcar como pagado:
   - Crear registro en `costos_streaming` con fecha, banco y mes_contable
   - Crear `gasto` en tabla `movimientos`

**Ventajas de este enfoque:**
- No necesita cron jobs ni cloud functions
- Simple y directo
- Historial completo en tablas de pagos/costos
- Fácil auditoría
- El campo `proximo_cobro` funciona como "recordatorio" de quién debe pagar

---

## 3. Integración con Sistema Principal

### Cuando un cliente paga su cuota:
```typescript
// 1. Crear registro histórico de pago
await supabase
  .from('pagos_streaming')
  .insert({
    suscripcion_id: suscripcionId,
    cliente_id: clienteId,
    servicio: servicio,
    monto: monto,
    fecha_pago: new Date(),
    banco_destino: bancoSeleccionado,
    mes_contable: mesActivoActual, // Del contexto global
    notas: ''
  });

// 2. Actualizar próximo cobro (sumar 1 mes)
const nuevaFecha = addMonths(suscripcion.proximo_cobro, 1);
await supabase
  .from('suscripciones')
  .update({ proximo_cobro: nuevaFecha })
  .eq('id', suscripcionId);

// 3. Crear INGRESO en tabla principal de movimientos
await dbHelpers.insertMovimiento({
  tipo: 'ingreso',
  valor: monto,
  descripcion: `Cobro ${servicio} - ${clienteNombre} - ${mesActual}`,
  categoria: `Venta de cuentas ${servicio}`, // 'Venta de cuentas Netflix', etc
  banco_destino: bancoSeleccionado,
  fecha: new Date(),
  mes_contable: mesActivoActual
});
```

### Cuando pagas la cuenta a Netflix/Prime/etc:
```typescript
// 1. Crear registro histórico de costo
await supabase
  .from('costos_streaming')
  .insert({
    cuenta_id: cuentaId,
    servicio: servicio,
    tipo_cuenta: tipoCuenta,
    monto: monto,
    fecha_pago: new Date(),
    banco_origen: bancoSeleccionado,
    mes_contable: mesActivoActual,
    notas: ''
  });

// 2. Crear GASTO en tabla principal de movimientos
await dbHelpers.insertMovimiento({
  tipo: 'gasto',
  valor: monto,
  descripcion: `Pago ${servicio} ${tipoCuenta} - ${mesActual}`,
  categoria: `Pago de cuentas ${servicio}`, // 'Pago de cuentas Netflix', etc
  banco_destino: bancoSeleccionado,
  fecha: new Date(),
  mes_contable: mesActivoActual
});
```

---

## 4. Categorías a Crear en el Sistema

### Categorías de Ingresos:
- `Venta de cuentas Netflix`
- `Venta de cuentas Prime Video`
- `Venta de cuentas Disney+`
- `Venta de cuentas HBO Max`
- `Venta de cuentas YouTube Premium`

### Categorías de Gastos:
- `Pago de cuentas Netflix`
- `Pago de cuentas Prime Video`
- `Pago de cuentas Disney+`
- `Pago de cuentas HBO Max`
- `Pago de cuentas YouTube Premium`

---

## 5. UI/UX - Estructura del Módulo

### Tab 1: Dashboard/Resumen
**Métricas del mes actual:**
- 💰 Total cobrado (suma de `pagos_streaming` donde `mes_contable = mesActual`)
- 💸 Total gastado (suma de `costos_streaming` donde `mes_contable = mesActual`)
- 📊 Ganancia neta (cobrado - gastado)
- ⏳ Cobros pendientes (contador de suscripciones donde `proximo_cobro <= hoy` + monto total)
- ⚠️ Pagos pendientes a servicios (cuentas sin registro en `costos_streaming` para mesActual)

**Gráficos/visuales:**
- Por servicio: ingresos vs costos
- Estado de cobros del mes (pagados/pendientes)
- Tendencia mensual (últimos 6 meses)

### Tab 2: Cuentas
**Lista de cuentas activas:**
```
Netflix 1 pantalla - $10,000/mes - Paga día 15 - 1/1 espacios usados
Netflix 4 pantallas - $20,000/mes - Paga día 15 - 3/4 espacios usados
Prime Video 5 perfiles - $15,000/mes - Paga día 20 - 5/5 espacios usados
```

**Acciones:**
- ➕ Agregar Cuenta Nueva
- ✏️ Editar cuenta (cambiar costo, día de pago, extras)
- 🗑️ Eliminar cuenta (solo si no tiene suscripciones activas)
- 👁️ Ver detalles (suscriptores, historial de pagos a servicio)

**Modal Agregar/Editar Cuenta:**
- Servicio: [Netflix ▼] [Prime Video] [Disney+] [HBO Max] [YouTube Premium]
- Tipo cuenta: [4 pantallas ▼] (opciones según servicio)
- Costo mensual: [$20,000]
- Día de pago: [15] (1-31)
- Extras: [Toggle: Juegos móviles] (solo Netflix)
- Notas: [textarea]

### Tab 3: Clientes
**Lista de clientes:**
```
Juan Pérez - 📱 3001234567 - 2 servicios activos - $10,000/mes total
María García - 📱 3007654321 - 1 servicio activo - $5,000/mes
```

**Acciones:**
- ➕ Agregar Cliente
- ✏️ Editar cliente
- 🗑️ Eliminar cliente (solo si no tiene suscripciones activas)
- 👁️ Ver historial de pagos

**Modal Agregar/Editar Cliente:**
- Nombre: [Juan Pérez]
- Teléfono: [3001234567]
- Email: [juan@example.com]
- Notas: [textarea]

### Tab 4: Suscripciones
**Vista de asignaciones activas:**

Tabla:
| Cliente | Servicio | Tipo acceso | Costo mensual | Próximo cobro | Estado | Acciones |
|---------|----------|-------------|---------------|---------------|--------|----------|
| Juan | Netflix | Pantalla 1 | $5,000 | 2025-02-01 | ✅ Al día | ✏️ ❌ |
| María | Netflix | Pantalla 2 | $5,000 | 2025-01-01 | ⏳ Pendiente | ✏️ ❌ 💰 |

**Estado:**
- ✅ Al día: `proximo_cobro > hoy`
- ⏳ Pendiente: `proximo_cobro <= hoy`

**Acciones:**
- ➕ Nueva Suscripción (asignar pantalla/perfil a cliente)
- ✏️ Editar suscripción (cambiar costo, próximo cobro)
- ❌ Cancelar suscripción (marca fecha_fin, desactiva)
- 💰 Cobrar (solo si está pendiente)

**Modal Nueva Suscripción:**
1. Seleccionar cuenta: [Netflix 4 pantallas ▼]
2. Seleccionar cliente: [Juan Pérez ▼] o [+ Crear nuevo cliente]
3. Tipo de acceso: [Pantalla 1 ▼] [Pantalla 2] [Pantalla 3] [Pantalla 4]
   - Mostrar solo espacios disponibles
4. Costo mensual: [$5,000]
5. Próximo cobro: [2025-01-01] (fecha del primer cobro)
6. Notas: [textarea]

**Validaciones:**
- No permitir asignar más pantallas/perfiles de los disponibles
- Alertar si cuenta está completa
- No permitir duplicar tipo_acceso en misma cuenta

### Tab 5: Cobros
**Vista de cobros pendientes y realizados:**

Filtros:
- [Mes: Enero 2025 ▼]
- [Servicio: Todos ▼]
- [Estado: Todos ▼] [Pendientes] [Cobrados]

**Lista de cobros:**

**Pendientes (proximo_cobro <= hoy):**
| Cliente | Servicio | Monto | Próximo cobro | Días atraso | Acciones |
|---------|----------|-------|---------------|-------------|----------|
| María | Netflix | $5,000 | 2025-01-01 | 30 días | 💰 Cobrar |
| Pedro | Prime | $3,000 | 2025-01-15 | 15 días | 💰 Cobrar |

**Cobrados este mes:**
| Cliente | Servicio | Monto | Fecha pago | Banco | Ver |
|---------|----------|-------|------------|-------|-----|
| Juan | Netflix | $5,000 | 2025-01-05 | Nequi | 👁️ |
| Ana | Disney+ | $4,000 | 2025-01-10 | Daviplata | 👁️ |

**Botón "💰 Cobrar":**
Abre modal:
- Cliente: María García
- Servicio: Netflix - Pantalla 2
- Monto: $5,000
- Fecha de pago: [Hoy ▼] (calendar picker)
- Banco: [Nequi ▼] [Daviplata] [Bancolombia] [Efectivo] etc
- Notas: [textarea]
- Botón: "Confirmar y registrar ingreso"

**Al confirmar:**
1. Crea registro en `pagos_streaming`
2. Actualiza `proximo_cobro` (+1 mes)
3. Crea `ingreso` en `movimientos`
4. Muestra toast: "✅ Pago registrado y próximo cobro actualizado a 2025-02-01"

### Tab 6: Costos/Pagos a Servicios
**Vista de pagos a servicios:**

Filtros:
- [Mes: Enero 2025 ▼]
- [Servicio: Todos ▼]

**Lista de costos:**

**Pendientes este mes:**
| Servicio | Tipo Cuenta | Monto | Día pago | Estado | Acciones |
|----------|-------------|-------|----------|--------|----------|
| Netflix | 4 pantallas | $20,000 | 15 | ⏳ Pendiente | 💸 Pagar |
| Prime | 5 perfiles | $15,000 | 20 | ⏳ Pendiente | 💸 Pagar |

**Pagados este mes:**
| Servicio | Tipo Cuenta | Monto | Fecha pago | Banco | Ver |
|----------|-------------|-------|------------|-------|-----|
| Disney+ | 5 perfiles | $12,000 | 2025-01-18 | Nequi | 👁️ |

**Botón "💸 Pagar":**
Abre modal:
- Servicio: Netflix
- Tipo cuenta: 4 pantallas
- Monto: $20,000
- Fecha de pago: [Hoy ▼] (calendar picker)
- Banco: [Nequi ▼] [Daviplata] [Bancolombia] etc
- Notas: [textarea]
- Botón: "Confirmar y registrar gasto"

**Al confirmar:**
1. Crea registro en `costos_streaming`
2. Crea `gasto` en `movimientos`
3. Muestra toast: "✅ Pago a Netflix registrado"

---

## 6. Arquitectura de Componentes

```
📁 app/
  └── 📁 streaming/
      └── 📄 page.tsx (página principal, usa StreamingDashboard)

📁 components/
  └── 📁 streaming/
      ├── 📄 StreamingDashboard.tsx (componente principal con tabs)
      ├── 📄 ResumenTab.tsx (métricas y gráficos)
      ├── 📄 CuentasTab.tsx (gestión de cuentas)
      ├── 📄 ClientesTab.tsx (gestión de clientes)
      ├── 📄 SuscripcionesTab.tsx (asignaciones)
      ├── 📄 CobrosTab.tsx (cobros pendientes y realizados)
      ├── 📄 CostosTab.tsx (pagos a servicios)
      └── 📁 modals/
          ├── 📄 CuentaModal.tsx (agregar/editar cuenta)
          ├── 📄 ClienteModal.tsx (agregar/editar cliente)
          ├── 📄 SuscripcionModal.tsx (nueva suscripción)
          ├── 📄 CobrarModal.tsx (marcar pago cobrado + banco)
          └── 📄 PagarCostoModal.tsx (marcar costo pagado + banco)

📁 hooks/
  └── 📄 useStreaming.ts (lógica de negocio y conexión a Supabase)

📁 lib/
  └── 📄 supabase.ts (agregar streamingHelpers)
```

---

## 7. Hook Principal: `useStreaming.ts`

```typescript
import { useState, useEffect } from 'react';
import { streamingHelpers } from '@/lib/supabase';
import { useGastos } from './useGastos';

export const useStreaming = () => {
  const { mesActivo } = useGastos(); // Obtener mes contable actual

  const [cuentas, setCuentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    loadAllData();
  }, [mesActivo]);

  const loadAllData = async () => {
    try {
      const [cuentasData, clientesData, suscripcionesData, pagosData, costosData] = await Promise.all([
        streamingHelpers.getCuentas(),
        streamingHelpers.getClientes(),
        streamingHelpers.getSuscripciones(),
        streamingHelpers.getPagos(mesActivo),
        streamingHelpers.getCostos(mesActivo)
      ]);

      setCuentas(cuentasData);
      setClientes(clientesData);
      setSuscripciones(suscripcionesData);
      setPagos(pagosData);
      setCostos(costosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de cuentas
  const agregarCuenta = async (cuenta) => {
    const nueva = await streamingHelpers.addCuenta(cuenta);
    setCuentas(prev => [...prev, nueva]);
    return nueva;
  };

  const actualizarCuenta = async (id, updates) => {
    const actualizada = await streamingHelpers.updateCuenta(id, updates);
    setCuentas(prev => prev.map(c => c.id === id ? actualizada : c));
    return actualizada;
  };

  const eliminarCuenta = async (id) => {
    await streamingHelpers.deleteCuenta(id);
    setCuentas(prev => prev.filter(c => c.id !== id));
  };

  // Funciones de clientes
  const agregarCliente = async (cliente) => {
    const nuevo = await streamingHelpers.addCliente(cliente);
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  };

  const actualizarCliente = async (id, updates) => {
    const actualizado = await streamingHelpers.updateCliente(id, updates);
    setClientes(prev => prev.map(c => c.id === id ? actualizado : c));
    return actualizado;
  };

  const eliminarCliente = async (id) => {
    await streamingHelpers.deleteCliente(id);
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  // Funciones de suscripciones
  const asignarSuscripcion = async (suscripcion) => {
    const nueva = await streamingHelpers.addSuscripcion(suscripcion);
    setSuscripciones(prev => [...prev, nueva]);
    return nueva;
  };

  const actualizarSuscripcion = async (id, updates) => {
    const actualizada = await streamingHelpers.updateSuscripcion(id, updates);
    setSuscripciones(prev => prev.map(s => s.id === id ? actualizada : s));
    return actualizada;
  };

  const cancelarSuscripcion = async (id) => {
    const cancelada = await streamingHelpers.cancelSuscripcion(id);
    setSuscripciones(prev => prev.map(s => s.id === id ? cancelada : s));
    return cancelada;
  };

  // Funciones de cobros
  const cobrarPago = async (suscripcionId, banco, fecha, notas = '') => {
    // 1. Crear pago
    const pago = await streamingHelpers.addPago({
      suscripcion_id: suscripcionId,
      banco_destino: banco,
      fecha_pago: fecha,
      mes_contable: mesActivo,
      notas
    });

    // 2. Actualizar próximo cobro (+1 mes)
    await streamingHelpers.updateProximoCobro(suscripcionId);

    // 3. Recargar datos
    await loadAllData();

    return pago;
  };

  // Funciones de costos
  const pagarCosto = async (cuentaId, banco, fecha, notas = '') => {
    // 1. Crear costo
    const costo = await streamingHelpers.addCosto({
      cuenta_id: cuentaId,
      banco_origen: banco,
      fecha_pago: fecha,
      mes_contable: mesActivo,
      notas
    });

    // 2. Recargar datos
    await loadAllData();

    return costo;
  };

  // Métricas
  const calcularMetricas = () => {
    const totalCobrado = pagos.reduce((sum, p) => sum + p.monto, 0);
    const totalGastado = costos.reduce((sum, c) => sum + c.monto, 0);
    const ganancia = totalCobrado - totalGastado;

    const cobrosPendientes = suscripciones.filter(s =>
      s.activa && new Date(s.proximo_cobro) <= new Date()
    );
    const montoPendiente = cobrosPendientes.reduce((sum, s) => sum + s.costo_mensual, 0);

    const costosPendientes = cuentas.filter(c =>
      c.activa && !costos.some(costo => costo.cuenta_id === c.id)
    );
    const montoCostosPendiente = costosPendientes.reduce((sum, c) => sum + c.costo_mensual, 0);

    return {
      totalCobrado,
      totalGastado,
      ganancia,
      cobrosPendientes: cobrosPendientes.length,
      montoPendiente,
      costosPendientes: costosPendientes.length,
      montoCostosPendiente
    };
  };

  // Calcular espacios disponibles por cuenta
  const getEspaciosDisponibles = (cuentaId) => {
    const cuenta = cuentas.find(c => c.id === cuentaId);
    if (!cuenta) return { total: 0, ocupados: 0, disponibles: 0 };

    let total = 0;
    if (cuenta.tipo_cuenta.includes('1 pantalla')) total = 1;
    else if (cuenta.tipo_cuenta.includes('2 pantallas')) total = 2;
    else if (cuenta.tipo_cuenta.includes('4 pantallas')) total = 4;
    else if (cuenta.tipo_cuenta.includes('5 perfiles')) total = 5;
    else if (cuenta.tipo_cuenta.includes('Premium')) total = 6; // YouTube: 1 principal + 5 vinculadas

    const ocupados = suscripciones.filter(s =>
      s.cuenta_id === cuentaId && s.activa
    ).length;

    return { total, ocupados, disponibles: total - ocupados };
  };

  return {
    // Estado
    cuentas,
    clientes,
    suscripciones,
    pagos,
    costos,
    loading,

    // Funciones de cuentas
    agregarCuenta,
    actualizarCuenta,
    eliminarCuenta,

    // Funciones de clientes
    agregarCliente,
    actualizarCliente,
    eliminarCliente,

    // Funciones de suscripciones
    asignarSuscripcion,
    actualizarSuscripcion,
    cancelarSuscripcion,
    getEspaciosDisponibles,

    // Funciones de cobros y costos
    cobrarPago,
    pagarCosto,

    // Utilidades
    calcularMetricas,
    recargarDatos: loadAllData
  };
};
```

---

## 8. Flujo de Trabajo Completo - Ejemplo

### Configuración Inicial (Primera vez):

1. **Crear cuenta Netflix:**
   - Tab Cuentas → ➕ Agregar Cuenta
   - Servicio: Netflix
   - Tipo: 4 pantallas
   - Costo: $20,000/mes
   - Día pago: 15

2. **Agregar clientes:**
   - Tab Clientes → ➕ Agregar Cliente
   - Crear: Juan, María, Pedro, Ana

3. **Asignar suscripciones:**
   - Tab Suscripciones → ➕ Nueva Suscripción
   - Juan → Netflix 4 pantallas → Pantalla 1 → $5,000 → Próximo cobro: 2025-01-01
   - María → Netflix 4 pantallas → Pantalla 2 → $5,000 → Próximo cobro: 2025-01-01
   - Pedro → Netflix 4 pantallas → Pantalla 3 → $5,000 → Próximo cobro: 2025-01-10
   - Ana → Netflix 4 pantallas → Pantalla 4 → $5,000 → Próximo cobro: 2025-01-10

### Mes de Enero 2025:

**05-Ene-2025:** Juan paga su cuota
- Tab Cobros → Pendientes → Juan → 💰 Cobrar
- Modal: Banco: Nequi, Fecha: 05-Ene-2025
- ✅ Confirmar
- **Resultado:**
  - Registro en `pagos_streaming`
  - `proximo_cobro` actualizado a 2025-02-01
  - Ingreso en `movimientos`: +$5,000 en Nequi, categoría "Venta de cuentas Netflix"
  - Juan desaparece de "Pendientes"

**05-Ene-2025:** María paga su cuota
- Tab Cobros → Pendientes → María → 💰 Cobrar
- Modal: Banco: Daviplata, Fecha: 05-Ene-2025
- ✅ Confirmar
- **Resultado:**
  - Similar a Juan
  - `proximo_cobro` → 2025-02-01

**10-Ene-2025:** Pedro paga
- Tab Cobros → Pendientes → Pedro → 💰 Cobrar
- Modal: Banco: Nequi, Fecha: 10-Ene-2025
- ✅ Confirmar
- `proximo_cobro` → 2025-02-10

**12-Ene-2025:** Ana NO paga (sigue pendiente)
- Ana permanece en lista de "Pendientes" porque su `proximo_cobro` sigue siendo 2025-01-10

**15-Ene-2025:** Pagar cuenta a Netflix
- Tab Costos → Pendientes → Netflix 4 pantallas → 💸 Pagar
- Modal: Banco: Nequi, Fecha: 15-Ene-2025, Monto: $20,000
- ✅ Confirmar
- **Resultado:**
  - Registro en `costos_streaming`
  - Gasto en `movimientos`: -$20,000 en Nequi, categoría "Pago de cuentas Netflix"

### Resumen del Mes (Tab Dashboard):
```
💰 Total cobrado: $15,000 (Juan + María + Pedro)
💸 Total gastado: $20,000 (Netflix)
📊 Ganancia neta: -$5,000 (pérdida)
⏳ Cobros pendientes: 1 (Ana - $5,000)
✅ Costos pagados
```

### Al Cerrar el Mes y Cambiar a Febrero 2025:

**Tab Cobros → Pendientes muestra:**
- Ana (atraso desde 10-Ene-2025) - $5,000 - 21 días de atraso

**Cuando Ana finalmente paga el 03-Feb:**
- Tab Cobros → Pendientes → Ana → 💰 Cobrar
- Modal: Banco: Efectivo, Fecha: 03-Feb-2025
- ✅ Confirmar
- `proximo_cobro` → 2025-02-10 (su fecha original era cada 10)

**Nueva lista de pendientes en Febrero:**
- Juan (proximo_cobro: 2025-02-01) ← Ya pasó, aparece pendiente
- María (proximo_cobro: 2025-02-01) ← Ya pasó, aparece pendiente
- (Pedro y Ana no aparecen porque sus fechas son 2025-02-10)

---

## 9. Validaciones y Reglas de Negocio

### Espacios disponibles:
- Netflix 1 pantalla: máximo 1 suscripción
- Netflix 2 pantallas: máximo 2 suscripciones
- Netflix 4 pantallas: máximo 4 suscripciones
- Prime/Disney/HBO 5 perfiles: máximo 5 suscripciones
- YouTube Premium: 1 principal + 5 vinculadas = 6 suscripciones

### No permitir duplicados:
- No se puede asignar el mismo `tipo_acceso` dos veces en la misma cuenta
- Ejemplo: No puede haber dos "Pantalla 1" en la misma cuenta Netflix

### Eliminación de registros:
- No se puede eliminar cuenta con suscripciones activas
- No se puede eliminar cliente con suscripciones activas
- Cancelar suscripción marca `fecha_fin` y `activa: false` pero mantiene historial

### Integración con movimientos:
- Usar `mes_contable` del contexto global (useGastos)
- Descripción completa: incluir servicio, cliente, mes
- Categoría correcta según servicio

### Actualización de próximo cobro:
- Sumar exactamente 1 mes a la fecha actual
- Ejemplo: 2025-01-01 → 2025-02-01
- Ejemplo: 2025-01-31 → 2025-02-28 (o 29 en año bisiesto)

---

## 10. Próximos Pasos de Implementación

### Fase 1: Base de Datos ✅
- [x] Diseñar estructura de 5 tablas
- [ ] Crear tablas en Supabase
- [ ] Agregar 10 categorías nuevas al sistema
- [ ] Crear índices para optimizar queries

### Fase 2: Backend (Supabase Helpers)
- [ ] `streamingHelpers.getCuentas()`
- [ ] `streamingHelpers.addCuenta()`
- [ ] `streamingHelpers.updateCuenta()`
- [ ] `streamingHelpers.deleteCuenta()`
- [ ] `streamingHelpers.getClientes()`
- [ ] `streamingHelpers.addCliente()`
- [ ] `streamingHelpers.updateCliente()`
- [ ] `streamingHelpers.deleteCliente()`
- [ ] `streamingHelpers.getSuscripciones()`
- [ ] `streamingHelpers.addSuscripcion()`
- [ ] `streamingHelpers.updateSuscripcion()`
- [ ] `streamingHelpers.cancelSuscripcion()`
- [ ] `streamingHelpers.updateProximoCobro()` (suma 1 mes)
- [ ] `streamingHelpers.getPagos(mesContable)`
- [ ] `streamingHelpers.addPago()` + crear ingreso en movimientos
- [ ] `streamingHelpers.getCostos(mesContable)`
- [ ] `streamingHelpers.addCosto()` + crear gasto en movimientos

### Fase 3: Hook useStreaming
- [ ] Estado y carga inicial de datos
- [ ] Implementar funciones de cuentas
- [ ] Implementar funciones de clientes
- [ ] Implementar funciones de suscripciones
- [ ] Implementar cobrarPago (con actualización de próximo cobro)
- [ ] Implementar pagarCosto
- [ ] Calcular métricas
- [ ] Función getEspaciosDisponibles
- [ ] Manejo de errores

### Fase 4: UI - Componentes Principales
- [ ] `/app/streaming/page.tsx`
- [ ] `StreamingDashboard.tsx` (estructura de tabs)
- [ ] `ResumenTab.tsx` (métricas y gráficos)
- [ ] `CuentasTab.tsx` (lista + acciones)
- [ ] `ClientesTab.tsx` (lista + acciones)
- [ ] `SuscripcionesTab.tsx` (tabla + filtros)
- [ ] `CobrosTab.tsx` (pendientes + cobrados)
- [ ] `CostosTab.tsx` (pendientes + pagados)

### Fase 5: Modales
- [ ] `CuentaModal.tsx` (agregar/editar)
- [ ] `ClienteModal.tsx` (agregar/editar)
- [ ] `SuscripcionModal.tsx` (asignar nueva)
- [ ] `CobrarModal.tsx` (marcar pago + banco)
- [ ] `PagarCostoModal.tsx` (marcar costo + banco)

### Fase 6: Validaciones
- [ ] Validar espacios disponibles antes de asignar
- [ ] Impedir duplicar tipo_acceso en misma cuenta
- [ ] Impedir eliminar cuenta/cliente con suscripciones activas
- [ ] Validar campos obligatorios en formularios

### Fase 7: Testing y Ajustes
- [ ] Probar flujo completo de alta de cuenta → cliente → suscripción
- [ ] Probar cobro de pago y actualización de próximo cobro
- [ ] Probar pago de costo
- [ ] Validar integración con tabla movimientos
- [ ] Verificar cálculos de métricas
- [ ] Probar cambio de mes
- [ ] Ajustar estilos y UX

### Fase 8: Deploy
- [ ] Commit de todos los archivos
- [ ] Push a GitHub
- [ ] Verificar deploy en Vercel
- [ ] Pruebas en producción

---

## 11. Notas Técnicas Adicionales

### Formato de `mes_contable`:
Usar formato 'YYYY-MM' (ej: '2025-01') para facilitar filtrado y ordenamiento.

### Actualización de `proximo_cobro`:
Usar librería `date-fns` (ya instalada) para sumar meses:
```typescript
import { addMonths } from 'date-fns';
const nuevaFecha = addMonths(new Date(suscripcion.proximo_cobro), 1);
```

### Desnormalización de datos:
Las tablas `pagos_streaming` y `costos_streaming` incluyen campos desnormalizados (cliente_id, servicio, etc) para acelerar queries de reportes sin necesidad de múltiples JOINs.

### Historial completo:
NUNCA eliminar registros de `pagos_streaming` o `costos_streaming`. Esto permite auditoría completa y reportes históricos.

### Integración con sistema principal:
Los helpers deben usar `dbHelpers.insertMovimiento()` existente para crear ingresos/gastos, manteniendo consistencia con el resto del sistema.

### Categorías:
Las categorías se nombran dinámicamente: `Venta de cuentas ${servicio}` y `Pago de cuentas ${servicio}` para mantener consistencia.

### Estados visuales:
- ✅ Al día (verde): `proximo_cobro > hoy`
- ⏳ Pendiente (amarillo): `proximo_cobro <= hoy` y diferencia < 7 días
- ⚠️ Atrasado (rojo): `proximo_cobro <= hoy` y diferencia >= 7 días

### Futuros reportes:
El sistema está diseñado para permitir:
- Rentabilidad por servicio
- Clientes morosos (mayor tiempo de atraso)
- Tendencias mensuales (ingresos vs costos por servicio)
- Tasa de cobro (% de suscripciones cobradas vs pendientes)
- Proyección de ingresos (basado en suscripciones activas)
