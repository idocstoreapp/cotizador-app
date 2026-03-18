# 📊 ANÁLISIS COMPLETO: SISTEMA DE PAGOS DE COTIZACIONES

**Fecha de análisis:** 18 de Marzo de 2026  
**Estado:** Sistema funcional con historial de pagos parciales

---

## 1️⃣ ARQUITECTURA GENERAL DEL SISTEMA

El sistema de pagos está diseñado para:
- Registrar **pagos parciales y totales** de cotizaciones
- Mantener un **historial completo** con fechas
- Calcular **automáticamente el estado de pago**
- Permite que **admins editen fechas** (para correcciones)
- **No permite eliminar pagos** (inmutabilidad del historial)

### Flujo Principal
```
Cliente acepta cotización 
    ↓
Estado = "aceptada" → Se puede registrar pagos
    ↓
Admin registra pago con fecha → Se suma al total pagado
    ↓
Estado auto-calcula: no_pagado → pago_parcial → pagado
```

---

## 2️⃣ PÁGINA DE CLIENTES (UI Principal)

### 📁 Ubicación
**Archivo:** [src/components/ClientesPage.tsx](src/components/ClientesPage.tsx)

### ✅ Funcionalidades

#### A) Visualización de Estado de Pago
```
Clientes (Admin View)
├── Tabla de Clientes
│   └── Botón: "Ver Historial" → Abre modal de detalles
│
└── Modal de Detalles del Cliente
    ├── Información Personal
    ├── Cotizaciones del cliente
    │   └── CADA COTIZACIÓN MUESTRA:
    │       ├── Número
    │       ├── Fecha
    │       ├── Total
    │       ├── Estado (pendiente/aceptada/rechazada)
    │       ├── ESTADO DE PAGO: ✅ Pagado / ⚠️ Pago Parcial / ❌ No Pagado
    │       ├── Monto pagado: $XXXX de $YYYY
    │       └── Botones:
    │           ├── "Editar" → Editar detalles cotización
    │           └── "Pagos / Historial" (solo si aceptada) → Modal de pagos
    │
    └── Trabajos Realizados
        └── Muestra estado de pago de trabajos/cotizaciones
```

#### B) Indicadores Visuales del Estado de Pago
```typescript
// En línea ~380-390 de ClientesPage.tsx
if (montoPagado >= total) {
  estadoPagoCalculado = 'pagado';  // AZUL ✅
} else if (montoPagado > 0) {
  estadoPagoCalculado = 'pago_parcial';  // NARANJA ⚠️
} else {
  estadoPagoCalculado = 'no_pagado';  // GRIS ❌
}
```

#### C) Modal de Pagos (Líneas 656-800)
**Función:** `setCotizacionEditandoPago(cotizacion)`

**Componentes del Modal:**
```
┌─────────────────────────────────────┐
│ Pagos – [NÚMERO COTIZACIÓN]     [×] │
├─────────────────────────────────────┤
│                                     │
│ RESUMEN (Grid 2x2):                 │
│ ┌──────────────┐ ┌──────────────┐   │
│ │Total cotización│ │Total pagado │   │
│ │  $500.000  │ │ $300.000 │   │
│ └──────────────┘ └──────────────┘   │
│ ┌──────────────┐ ┌──────────────┐   │
│ │Resta por cobrar│ │   Estado    │   │
│ │  $200.000  │ │Pago Parcial│   │
│ └──────────────┘ └──────────────┘   │
│                                     │
│ HISTORIAL DE PAGOS:                 │
│ ┌────────────────────────────────┐  │
│ │ Fecha  │ Monto  │ Nota │ Acc.  │  │
│ ├────────────────────────────────┤  │
│ │ 2026-03-01 │ +$100K │ ----- │Edit│  │
│ │ 2026-03-08 │ +$200K │Abono│Edit│  │
│ └────────────────────────────────┘  │
│                                     │
│ AGREGAR PAGO:                       │
│ ┌──────────────────────────────────┐ │
│ │ Monto:  ________                 │ │
│ │ Fecha:  __________               │ │
│ │ Nota:   ___________________      │ │
│ └──────────────────────────────────┘ │
│                                     │
│             [Cerrar] [Agregar pago] │
└─────────────────────────────────────┘
```

---

## 3️⃣ BASE DE DATOS: TABLAS PRINCIPALES

### 🗂️ A) Tabla `cotizaciones` (Campos relacionados a pagos)

**Ubicación:**
- Definición: `supabase/migrations/20260317000002_schema_compat_missing_columns_for_migration.sql`
- Tipo TypeScript: [src/types/database.ts](src/types/database.ts) líneas 170-210

**Campos de Pago:**
```sql
-- Tabla: cotizaciones
ALTER TABLE cotizaciones ADD COLUMN estado_pago TEXT 
  CHECK (estado_pago IN ('no_pagado', 'pago_parcial', 'pagado'));
  -- 📝 Valores: no_pagado | pago_parcial | pagado
  -- ❌ NO EDITABLE DIRECTAMENTE - se calcula automáticamente

ALTER TABLE cotizaciones ADD COLUMN monto_pagado NUMERIC DEFAULT 0;
  -- 📝 Suma acumulada de todos los pagos en cotizacion_pagos
  -- ❌ NUNCA editar directamente, se recalcula automáticamente
```

**Definición TypeScript:**
```typescript
interface Cotizacion {
  id: string;
  numero: string;
  cliente_nombre: string;
  total: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  
  // CAMPOS DE PAGO:
  estado_pago?: 'no_pagado' | 'pago_parcial' | 'pagado';
  monto_pagado?: number;  // Suma de cotizacion_pagos.monto
  
  // Adicionales:
  pago_vendedor?: number;  // Pago al vendedor (si es aceptada)
  usuario_id: string;
  vendedor_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}
```

---

### 📋 B) Tabla `cotizacion_pagos` (HISTORIAL DETALLADO)

**Ubicación:**
- SQL: [supabase/migrations/20250311000001_create_cotizacion_pagos.sql](supabase/migrations/20250311000001_create_cotizacion_pagos.sql)
- Tipo TypeScript: [src/types/database.ts](src/types/database.ts) líneas 457-464

**Estructura Completa:**
```sql
CREATE TABLE public.cotizacion_pagos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id   uuid NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  monto           numeric(14, 2) NOT NULL CHECK (monto > 0),
  fecha_pago      date NOT NULL DEFAULT CURRENT_DATE,
  nota            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_cotizacion_pagos_cotizacion_id ON cotizacion_pagos(cotizacion_id);

-- RLS: Row Level Security
ALTER TABLE cotizacion_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver pagos"
  ON cotizacion_pagos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar pagos"
  ON cotizacion_pagos FOR INSERT TO authenticated WITH CHECK (true);
```

**Definición TypeScript:**
```typescript
interface CotizacionPago {
  id: string;                    // UUID único
  cotizacion_id: string;         // FK a cotizaciones
  monto: number;                 // ✅ Monto del pago (> 0)
  fecha_pago: string;            // 📅 YYYY-MM-DD (editable solo por admin)
  nota?: string;                 // 📝 Ej: "Abono inicial", "Depositó en cuenta"
  created_at: string;            // Timestamp automático (NO EDITABLE)
}
```

**Características Importantes:**
- ✅ Historial **inmutable** (no se pueden eliminar pagos)
- ✅ Solo **se puede editar la fecha** (admin)
- ✅ Acumula desde `created_at` (no se reescribe)
- ✅ Automáticamente calcula `cotizaciones.monto_pagado` = SUM(cotizacion_pagos.monto)

---

### 👥 C) Tabla `cotizacion_trabajadores` (Pagos a trabajadores)

**Estructura:**
```sql
CREATE TABLE IF NOT EXISTS cotizacion_trabajadores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id   UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  trabajador_id   UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  pago_trabajador DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notas           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cotizacion_id, trabajador_id)
);
```

---

## 4️⃣ SERVICIOS DE PAGOS (Backend Logic)

### 🔧 Ubicación Principal
**Archivo:** [src/services/cotizacion-pagos.service.ts](src/services/cotizacion-pagos.service.ts) (94 líneas)

### 📌 Función 1: `obtenerPagosPorCotizacion()`
```typescript
export async function obtenerPagosPorCotizacion(
  cotizacionId: string
): Promise<CotizacionPago[]> {
  // Obtiene TODOS los pagos de una cotización ordenados por fecha descendente
  const { data, error } = await supabase
    .from('cotizacion_pagos')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('fecha_pago', { ascending: false });  // Más recientes primero
  
  if (error) throw error;
  return (data || []) as CotizacionPago[];
}
```

**Uso:**
```typescript
// En ClientesPage.tsx, línea 118
const pagos = await obtenerPagosPorCotizacion(cotizacionId);
// Retorna: CotizacionPago[]
```

---

### 🎯 Función 2: `agregarPagoCotizacion()` ⭐ PRINCIPAL

```typescript
export async function agregarPagoCotizacion(
  cotizacionId: string,
  monto: number,
  fechaPago: string,           // YYYY-MM-DD
  nota?: string,
  totalCotizacion?: number
): Promise<{
  pago: CotizacionPago;
  montoPagadoTotal: number;
  estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado';
}> {
  // 1️⃣ Validar monto > 0
  if (monto <= 0) throw new Error('El monto debe ser mayor a 0.');
  
  // 2️⃣ Insertar nuevo pago en cotizacion_pagos
  const { data: insertado, error: errInsert } = await supabase
    .from('cotizacion_pagos')
    .insert({
      cotizacion_id: cotizacionId,
      monto,
      fecha_pago: fechaPago,
      nota: nota || null
    })
    .select()
    .single();
  
  if (errInsert) throw errInsert;
  
  // 3️⃣ Sumar TODOS los palos para obtener montoPagadoTotal
  const todos = await obtenerPagosPorCotizacion(cotizacionId);
  const montoPagadoTotal = todos.reduce(
    (sum, p) => sum + Number(p.monto), 
    0
  );
  
  // 4️⃣ Calcular nuevo estado_pago automáticamente
  const total = totalCotizacion ?? 0;
  let estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado' = 'no_pagado';
  
  if (total > 0) {
    if (montoPagadoTotal >= total) {
      estadoPago = 'pagado';        // ✅ PAGADO COMPLETAMENTE
    } else if (montoPagadoTotal > 0) {
      estadoPago = 'pago_parcial';  // ⚠️ PAGADO PARCIALMENTE
    }
    // sino: no_pagado ❌
  }
  
  // 5️⃣ Actualizar cotizaciones.monto_pagado y estado_pago
  await actualizarEstadoPagoCotizacion(
    cotizacionId, 
    estadoPago, 
    montoPagadoTotal
  );
  
  // 6️⃣ Retornar resultado
  return { pago, montoPagadoTotal, estadoPago };
}
```

**Uso en ClientesPage.tsx (línea 140-150):**
```typescript
const agregarPago = async (
  cotizacion: Cotizacion, 
  monto: number, 
  fechaPago: string, 
  nota?: string
) => {
  const { montoPagadoTotal, estadoPago } = 
    await agregarPagoCotizacion(
      cotizacion.id, 
      monto, 
      fechaPago, 
      nota, 
      cotizacion.total
    );
  
  // Actualizar UI
  setCotizacionEditandoPago(prev => 
    prev && prev.id === cotizacion.id 
      ? { ...prev, monto_pagado: montoPagadoTotal, estado_pago: estadoPago }
      : prev
  );
  
  // Recargar historial
  const pagos = await obtenerPagosPorCotizacion(cotizacion.id);
  setPagosCotizacionModal(pagos);
};
```

---

### 🖊️ Función 3: `actualizarFechaPagoCotizacion()`

```typescript
export async function actualizarFechaPagoCotizacion(
  pagoId: string,
  nuevaFecha: string    // YYYY-MM-DD
): Promise<CotizacionPago> {
  // SOLO ACTUALIZABLES POR ADMIN (para correcciones)
  // NO RECALCULA nada, solo cambia la fecha
  
  const { data, error } = await supabase
    .from('cotizacion_pagos')
    .update({ fecha_pago: nuevaFecha })
    .eq('id', pagoId)
    .select()
    .single();
  
  if (error) throw error;
  return data as CotizacionPago;
}
```

**Uso - Editar fecha en tabla (línea ~720):**
```typescript
<input
  type="date"
  defaultValue={p.fecha_pago?.slice(0, 10) || ''}
  onChange={async (e) => {
    const nuevaFecha = e.target.value;
    try {
      await actualizarFechaPagoCotizacion(p.id, nuevaFecha);
      // Recargar pagos
      const pagosActualizados = await obtenerPagosPorCotizacion(p.cotizacion_id);
      setPagosCotizacionModal(pagosActualizados);
    } catch (err: any) {
      alert('Error al actualizar fecha de pago: ' + err.message);
    }
  }}
/>
```

---

### 🏗️ Función 4: `asegurarHistorialPagos()` (Migración)

```typescript
export async function asegurarHistorialPagos(
  cotizacionId: string, 
  montoPagadoActual: number,     // Del campo monto_pagado antiguo
  fechaFallback: string          // Fecha para crear el registro
): Promise<CotizacionPago[]> {
  // Función para MIGRACIÓN: si una cotización tiene monto_pagado
  // pero NO tiene registros en cotizacion_pagos, crea un registro único
  
  const existentes = await obtenerPagosPorCotizacion(cotizacionId);
  
  if (existentes.length > 0 || montoPagadoActual <= 0) {
    return existentes;  // Ya hay registros o sin monto pagado
  }
  
  // Crear registro único con el monto anterior
  await supabase.from('cotizacion_pagos').insert({
    cotizacion_id: cotizacionId,
    monto: montoPagadoActual,
    fecha_pago: fechaFallback
  });
  
  return await obtenerPagosPorCotizacion(cotizacionId);
}
```

**Uso - Al abrir modal de pagos (línea ~123):**
```typescript
useEffect(() => {
  if (!cotizacionEditandoPago) return;
  
  (async () => {
    let pagos = await obtenerPagosPorCotizacion(cotizacionEditandoPago.id);
    const montoActual = cotizacionEditandoPago.monto_pagado || 0;
    
    // Si hay monto_pagado pero NO hay registros → crear registro de migración
    if (pagos.length === 0 && montoActual > 0) {
      await asegurarHistorialPagos(
        cotizacionEditandoPago.id,
        montoActual,
        cotizacionEditandoPago.updated_at?.slice(0, 10) || fecha_hoy
      );
      // Recargar
      pagos = await obtenerPagosPorCotizacion(cotizacionEditandoPago.id);
    }
    
    setPagosCotizacionModal(pagos);
  })();
}, [cotizacionEditandoPago?.id]);
```

---

### 🔄 Función 5: `actualizarEstadoPagoCotizacion()` (En cotizaciones.service.ts)

**Ubicación:** [src/services/cotizaciones.service.ts](src/services/cotizaciones.service.ts) línea 526

```typescript
export async function actualizarEstadoPagoCotizacion(
  id: string,
  estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado',
  montoPagado: number
): Promise<Cotizacion> {
  // Actualiza AMBOS campos en tabla cotizaciones
  const { data, error } = await supabase
    .from('cotizaciones')
    .update({
      estado_pago: estadoPago,
      monto_pagado: montoPagado,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) throw error;
  return data as Cotizacion;
}
```

---

## 5️⃣ FUNCIONALIDADES ACTUALES

### ✅ LO QUE SE PUEDE HACER

| Acción | Admin | Usuario | Técnico |
|--------|-------|---------|---------|
| **Ver estado de pago** | ✅ Todos | ✅ Propios | ✅ Propios |
| **Registrar pago** | ✅ Sí | ❌ No | ❌ No |
| **Editar fecha de pago** | ✅ Sí | ❌ No | ❌ No |
| **Ver historial de pagos** | ✅ Todos | ✅ Propios | ✅ Propios |
| **Editar monto de pago** | ❌ No | ❌ No | ❌ No |
| **Eliminar pago** | ❌ No | ❌ No | ❌ No |

---

### ❌ LO QUE NO SE PUEDE HACER

1. **❌ Eliminar un pago registrado**
   - Sistema diseñado para **auditoría** (historial inmutable)
   - **Solución:** Crear un "pago compensatorio" (pago negativo) si es necesario

2. **❌ Editar el monto de un pago**
   - Solo se puede editar la fecha
   - **Solución:** Crear un nuevo pago y documentar en nota

3. **❌ Revertir a estado anterior**
   - Los valores se recalculan automáticamente
   - **Solución:** Crear compensaciones

4. **❌ Pagos de usuarios no-admin (vendedores, trabajadores)**
   - Solo admin puede registrar
   - **Próxima mejora:** Portal de pagos para clientes

---

## 6️⃣ CÁLCULO AUTOMÁTICO DEL ESTADO

### 📊 Lógica de Estado

```typescript
// En agregarPagoCotizacion()
const montoPagadoTotal = todos.reduce((sum, p) => sum + Number(p.monto), 0);
const total = totalCotizacion ?? 0;

if (total > 0) {
  if (montoPagadoTotal >= total) {
    estado = 'pagado';        // ✅ 100% pagado
  } else if (montoPagadoTotal > 0) {
    estado = 'pago_parcial';  // ⚠️ 0% < X% < 100%
  } else {
    estado = 'no_pagado';     // ❌ Nada pagado
  }
}

// También se recalcula automáticamente cada vez que:
// - Se abre el modal de pagos (visualización)
// - En ClientesPage línea ~380 (visualización en tabla)
```

---

## 7️⃣ ARCHIVO COMPLETO: ClientesPage.tsx

### Estado Local (Lines 15-40)
```typescript
const [cotizacionEditandoPago, setCotizacionEditandoPago] = useState<Cotizacion | null>(null);
const [pagosCotizacionModal, setPagosCotizacionModal] = useState<CotizacionPago[]>([]);
const [nuevoPagoMonto, setNuevoPagoMonto] = useState<string>('');
const [nuevoPagoFecha, setNuevoPagoFecha] = useState<string>(new Date().toISOString().split('T')[0]);
const [nuevoPagoNota, setNuevoPagoNota] = useState('');
const [guardandoPago, setGuardandoPago] = useState(false);
```

### Cargar Pagos (Lines 114-138)
```typescript
useEffect(() => {
  if (!cotizacionEditandoPago) {
    setPagosCotizacionModal([]);
    return;
  }
  
  (async () => {
    try {
      let pagos = await obtenerPagosPorCotizacion(cotizacionEditandoPago.id);
      const montoActual = cotizacionEditandoPago.monto_pagado || 0;
      
      // MIGRACIÓN: Si hay monto_pagado pero sin registros
      if (pagos.length === 0 && montoActual > 0) {
        await asegurarHistorialPagos(cotizacionEditandoPago.id, montoActual, fechaFallback);
        pagos = await obtenerPagosPorCotizacion(cotizacionEditandoPago.id);
      }
      
      setPagosCotizacionModal(pagos);
      // Reset formulario
      setNuevoPagoMonto('');
      setNuevoPagoFecha(new Date().toISOString().split('T')[0]);
      setNuevoPagoNota('');
    } catch (e) {
      setPagosCotizacionModal([]);
    }
  })();
  
  return () => { cancelled = true; };
}, [cotizacionEditandoPago?.id]);
```

### Agregar Pago (Lines 140-165)
```typescript
const agregarPago = async (cotizacion: Cotizacion, monto: number, fechaPago: string, nota?: string) => {
  try {
    const total = cotizacion.total || 0;
    const { montoPagadoTotal, estadoPago } = await agregarPagoCotizacion(
      cotizacion.id, 
      monto, 
      fechaPago, 
      nota, 
      total
    );
    
    // Actualizar estado local
    setCotizacionEditandoPago(prev => 
      prev && prev.id === cotizacion.id 
        ? { ...prev, monto_pagado: montoPagadoTotal, estado_pago: estadoPago }
        : prev
    );
    
    // Recargar listados
    const pagos = await obtenerPagosPorCotizacion(cotizacion.id);
    setPagosCotizacionModal(pagos);
    
    if (clienteSeleccionado) {
      await cargarCotizacionesCliente(clienteSeleccionado);
      await cargarTrabajosCliente(clienteSeleccionado.id);
    }
    
    alert('✅ Pago registrado correctamente');
  } catch (error: any) {
    alert('Error al registrar pago: ' + error.message);
  }
};
```

### Mostrar Pagos en Tabla de Cotizaciones (Lines 363-530)
```typescript
// Cuando aparece el botón "Pagos / Historial" para cotizaciones aceptadas:
{cotizacion.estado === 'aceptada' && (
  <button
    onClick={() => setCotizacionEditandoPago(cotizacion)}
    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    Pagos / Historial
  </button>
)}
```

### Modal Completo (Lines 656-825)
```typescript
{cotizacionEditandoPago && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Pagos – {cotizacionEditandoPago.numero}
        </h2>
        <button onClick={() => { setCotizacionEditandoPago(null); }} className="text-gray-400 text-2xl">×</button>
      </div>
      
      {/* BODY */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* RESUMEN */}
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Total cotización:</span>
            <span className="ml-2 font-semibold">${(cotizacionEditandoPago.total || 0).toLocaleString('es-CO')}</span>
          </div>
          <div>
            <span className="text-gray-600">Total pagado:</span>
            <span className="ml-2 font-semibold text-green-600">
              ${(cotizacionEditandoPago.monto_pagado ?? 0).toLocaleString('es-CO')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Resta por cobrar:</span>
            <span className="ml-2 font-bold text-red-600">
              ${((cotizacionEditandoPago.total || 0) - (cotizacionEditandoPago.monto_pagado ?? 0)).toLocaleString('es-CO')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Estado:</span>
            <span className={`ml-2 font-semibold ${
              cotizacionEditandoPago.estado_pago === 'pagado' ? 'text-blue-600' :
              cotizacionEditandoPago.estado_pago === 'pago_parcial' ? 'text-orange-600' : 'text-gray-600'
            }`}>
              {cotizacionEditandoPago.estado_pago === 'pagado' ? 'Pagado' :
               cotizacionEditandoPago.estado_pago === 'pago_parcial' ? 'Pago parcial' : 'No pagado'}
            </span>
          </div>
        </div>
        
        {/* HISTORIAL */}
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Historial de pagos</h3>
        {pagosCotizacionModal.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">Aún no hay pagos registrados.</p>
        ) : (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600">Fecha</th>
                  <th className="text-right py-2 text-gray-600">Monto</th>
                  <th className="text-left py-2 text-gray-600">Nota</th>
                  {esAdmin && <th className="text-center py-2 text-gray-600">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {pagosCotizacionModal.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2">
                      {esAdmin ? (
                        <input
                          type="date"
                          defaultValue={p.fecha_pago?.slice(0, 10) || ''}
                          onChange={async (e) => {
                            const nuevaFecha = e.target.value;
                            if (!nuevaFecha) return;
                            try {
                              await actualizarFechaPagoCotizacion(p.id, nuevaFecha);
                              const pagosActualizados = await obtenerPagosPorCotizacion(p.cotizacion_id);
                              setPagosCotizacionModal(pagosActualizados);
                            } catch (err: any) {
                              alert('Error: ' + err.message);
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                        />
                      ) : (
                        new Date(p.fecha_pago).toLocaleDateString('es-CO')
                      )}
                    </td>
                    <td className="py-2 text-right font-medium text-green-600">+${Number(p.monto).toLocaleString('es-CO')}</td>
                    <td className="py-2 text-gray-500">{p.nota || '—'}</td>
                    {esAdmin && (
                      <td className="py-2 text-center text-xs text-gray-400">
                        (Solo fecha editable)
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* AGREGAR PAGO */}
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Agregar pago</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
            <input
              type="number"
              value={nuevoPagoMonto}
              onChange={(e) => setNuevoPagoMonto(e.target.value)}
              min="0"
              step="1000"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del pago</label>
            <input
              type="date"
              value={nuevoPagoFecha}
              onChange={(e) => setNuevoPagoFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nota (opcional)</label>
            <input
              type="text"
              value={nuevoPagoNota}
              onChange={(e) => setNuevoPagoNota(e.target.value)}
              placeholder="Ej. Abono inicial"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
        <button
          onClick={() => { setCotizacionEditandoPago(null); }}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
        >
          Cerrar
        </button>
        <button
          disabled={guardandoPago || !nuevoPagoMonto || parseFloat(nuevoPagoMonto) <= 0}
          onClick={async () => {
            if (!cotizacionEditandoPago) return;
            const monto = parseFloat(nuevoPagoMonto);
            if (isNaN(monto) || monto <= 0) return;
            
            setGuardandoPago(true);
            try {
              await agregarPago(cotizacionEditandoPago, monto, nuevoPagoFecha, nuevoPagoNota.trim() || undefined);
              setNuevoPagoMonto('');
              setNuevoPagoFecha(new Date().toISOString().split('T')[0]);
              setNuevoPagoNota('');
            } finally {
              setGuardandoPago(false);
            }
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg"
        >
          {guardandoPago ? 'Guardando...' : 'Agregar pago'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 8️⃣ FLUJOS DE DATOS (Diagramas)

### 🔄 Flujo: Registrar un Pago

```
1. Usuario Admin abre Modal de Pagos
   ↓
2. Modal carga obtenerPagosPorCotizacion(cotizacionId)
   → Obtiene historial de pagos
   → Si está vacío y hay monto_pagado: asegurarHistorialPagos() (migración)
   ↓
3. Admin ingresa: Monto, Fecha, Nota
   ↓
4. Presiona "Agregar pago"
   ↓
5. Ejecuta: agregarPagoCotizacion()
   → Inserta en cotizacion_pagos {monto, fecha_pago, nota}
   → Suma TODOS los montos: montoPagadoTotal
   → Calcula estado: si >= total → "pagado", si > 0 → "pago_parcial", si 0 → "no_pagado"
   → Llama actualizarEstadoPagoCotizacion() para guardar estado
   ↓
6. Recargar:
   → Modal: setPagosCotizacionModal(pagos) ← muestra nuevo pago
   → Tabla cotizaciones: se actualiza monto_pagado y estado_pago
   → Historial trabajos: se actualiza si aplica
   ↓
7. Mostrar: ✅ "Pago registrado correctamente"
```

---

### 📊 Flujo: Editar Fecha de Pago (Admin)

```
1. Admin en modal de pagos ve tabla de pagos
   ↓
2. Admin hace click en campo de fecha (solo si esAdmin)
   ↓
3. Admin cambia la fecha
   ↓
4. onChange: actualizarFechaPagoCotizacion(pagoId, nuevaFecha)
   → UPDATE cotizacion_pagos SET fecha_pago = ? WHERE id = ?
   ↓
5. Recargar listado: obtenerPagosPorCotizacion(cotizacion_id)
   ↓
6. setPagosCotizacionModal(pagosActualizados) → Se refleja en tabla
```

---

### 🔢 Flujo: Calcular Estado

```
CADA VEZ QUE HAY UN CAMBIO EN PAGOS:

1. montoPagadoTotal = SUM(cotizacion_pagos.monto DONDE cotizacion_id = X)
2. total = cotizaciones.total

3. IF total > 0:
     IF montoPagadoTotal >= total:
       estado_pago = 'pagado' ✅
     ELSE IF montoPagadoTotal > 0:
       estado_pago = 'pago_parcial' ⚠️
     ELSE:
       estado_pago = 'no_pagado' ❌
   
4. Guardar en cotizaciones: {estado_pago, monto_pagado}
```

---

## 9️⃣ ARCHIVOS Y RUTAS IMPORTANTES

### 📂 Estructura Completa

```
cotizador-app/
├── src/
│   ├── components/
│   │   ├── ClientesPage.tsx ⭐ MAIN UI
│   │   ├── CotizacionesPage.tsx (muestra estado_pago)
│   │   ├── HistorialCotizaciones.tsx (muestra pago_vendedor)
│   │   └── EditarCotizacionModal.tsx
│   │
│   ├── services/
│   │   ├── cotizacion-pagos.service.ts ⭐ MAIN LOGIC
│   │   │   ├── obtenerPagosPorCotizacion(cotizacionId)
│   │   │   ├── agregarPagoCotizacion(...)
│   │   │   ├── actualizarFechaPagoCotizacion(...)
│   │   │   └── asegurarHistorialPagos(...)
│   │   │
│   │   ├── cotizaciones.service.ts
│   │   │   └── actualizarEstadoPagoCotizacion(...)
│   │   │
│   │   ├── cotizacion-trabajadores.service.ts (pago trabajadores)
│   │   ├── clientes.service.ts
│   │   └── liquidaciones.service.ts (pagos finales)
│   │
│   ├── types/
│   │   └── database.ts
│   │       ├── interface Cotizacion (estado_pago, monto_pagado)
│   │       ├── interface CotizacionPago
│   │       └── interface CotizacionTrabajador
│   │
│   └── store/
│       └── cotizacionStore.ts (state management)
│
├── supabase/
│   └── migrations/
│       ├── 20250311000001_create_cotizacion_pagos.sql ⭐
│       ├── 20260317000002_schema_compat_missing_columns_for_migration.sql
│       └── 20260317000003_schema_compat_round2.sql
│
├── migracion-estado-pago-mano-obra.sql
├── setup-liquidaciones.sql
└── setup-vendedores-trabajadores.sql
```

---

## 🔟 CASOS DE USO

### 📋 Caso 1: Registrar Pago Parcial

```
Cliente: "Voy a pagar $100K ahora y el resto en 15 días"

1. Admin abre Clientes → Cliente → Cotización → "Pagos / Historial"
2. Ingresa:
   - Monto: 100000
   - Fecha: 2026-03-18
   - Nota: "Abono inicial"
3. Presiona "Agregar pago"
4. Sistema:
   - Crea registro en cotizacion_pagos {monto: 100000, fecha_pago: '2026-03-18', nota: 'Abono inicial'}
   - Suma: montoPagadoTotal = 100000
   - Si total = 500000:
     * montoPagadoTotal (100000) < total (500000) → estado = 'pago_parcial' ⚠️
   - Actualiza cotizaciones: {monto_pagado: 100000, estado_pago: 'pago_parcial'}
5. Muestra en tabla: +$100K | 2026-03-18 | Abono inicial
6. Próximo pago: Admin registra otro pago de $400K
   - Suma: montoPagadoTotal = 500000
   - 500000 >= 500000 → estado = 'pagado' ✅
```

---

### 🔄 Caso 2: Corregir Fecha de Pago

```
Admin: "La fecha que registré es incorrecta, debería ser 2026-03-15"

1. Admin abre modal, ve tabla de pagos
2. Hace click en campo de fecha
3. Cambia de 2026-03-18 → 2026-03-15
4. onChange: actualizarFechaPagoCotizacion(pagoId, '2026-03-15')
5. Sistema: UPDATE cotizacion_pagos SET fecha_pago = '2026-03-15' WHERE id = ?
6. Recargar tabla: Se actualiza fecha mostrada
7. Mensaje de confirmación
```

---

### ❌ Caso 3: Cliente reclama que pagó dupli


cado

```
Cliente: "Registraron $200K en dos fechas diferentes, pero fue un solo pago"

⚠️ PROBLEMA ACTUAL:
- No se puede ELIMINAR pagos (diseño inmutable)
- No se puede EDITAR montos (solo fechas)

SOLUCIONES:
A) Crear "pago negativo" (complementación de feature):
   - Admin crea nuevo "pago" de -$200K con nota: "Reverso de pago duplicado"
   - Sistema suma: 200K + 200K - 200K = 200K ✅
   
B) Contactar soporte (manual):
   - Documentar en historial
   - Realizar transacción manual por fuera
   - Desactivar temporalmente cotización y reactivar con datos correctos
```

---

### 🎯 Caso 4: Reportar Saldo Pendiente

```
Admin necesita saber: "¿Cuánto falta cobrar de esta cotización?"

1. Abre modal de Pagos
2. Sistema muestra:
   - Total cotización: $500K
   - Total pagado: $200K (si es pago_parcial)
   - Resta por cobrar: $300K ← Calculado automáticamente
   - Estado: "Pago parcial" ⚠️
3. Admin usa "Resta por cobrar" para follow-up con cliente
```

---

## 1️⃣1️⃣ LIMITACIONES Y MEJORAS FUTURAS

### 🔴 Limitaciones Actuales

| Limitación | Impacto | Solución Propuesta |
|-----------|--------|-------------------|
| No se pueden eliminar pagos | Historial inmutable (bueno) pero sin "rollback" (malo) | Pagos compensatorios (-monto) |
| No se pueden editar montos | Apenas fechas | Permitir edición con auditoría |
| Solo admin puede registrar | Flujo centralizado | Portal de pagos para clientes |
| No hay notificaciones | Cliente no sabe estado | Email de confirmación + SMS |
| Sin métodos de pago | Registro manual | Integración Stripe/PayPal |
| Sin reportes de pagos | Difícil análisis | Dashboard con gráficos |

---

### 🟢 Mejoras Posibles

```typescript
// 1. FUNCIÓN: Eliminar pago con auditoría
export async function reversarPago(pagoId: string, razon: string): Promise<void> {
  const pago = await obtenerPago(pagoId);
  // Crear pago negativo
  await agregarPagoCotizacion(pago.cotizacion_id, -pago.monto, new Date().toISOString().split('T')[0], `REVERSO: ${razon}`);
}

// 2. FUNCIÓN: Editar monto con historial
export async function editarMontoPago(pagoId: string, nuevoMonto: number): Promise<void> {
  // Lógica...
}

// 3. FUNCIÓN: Pagos para clientes (public page)
export async function registrarPagoClienteViaPortal(cotizacionId: string, monto: number, metodo: 'transferencia' | 'efectivo'): Promise<void> {
  // Lógica...
}

// 4. FUNCIÓN: Notificaciones
export async function enviarNotificacionPago(cotizacionId: string): Promise<void> {
  // Lógica...
}
```

---

## 1️⃣2️⃣ RESUMEN EJECUTIVO

### 🎯 Sistema de Pagos - Estado Actual

| Aspecto | Detalles |
|--------|---------|
| **Tablas Principales** | `cotizaciones` + `cotizacion_pagos` |
| **UI Punto de Entrada** | `ClientesPage.tsx` → Modal de Pagos |
| **Funcionalidad Core** | Registrar, ver historial, editar fechas |
| **Cálculo Estado** | Automático (no_pagado/pago_parcial/pagado) |
| **Historial** | Inmutable (auditoría) |
| **Roles** | Solo Admin puede registrar |
| **Permisos** | Visualización según RLS (authenticated) |
| **Validaciones** | Monto > 0, fecha válida, cotización aceptada |

### 📊 Diagrama Relacional

```
┌─────────────────┐
│  cotizaciones   │
├─────────────────┤
│ id (PK)         │
│ numero          │
│ total           │
│ estado          │
│ estado_pago  ←─────────┐ (Calculado)
│ monto_pagado ←─────────┤ (Suma de pagos)
│ created_at      │     │
└─────────────────┘     │
        ▲               │
        │ FK            │
        │         ┌──────────────────┐
        │         │ cotizacion_pagos │
        └─────────┤──────────────────┤
                  │ id (PK)          │
                  │ cotizacion_id(FK)│
                  │ monto            │
                  │ fecha_pago       │
                  │ nota             │
                  │ created_at       │
                  └──────────────────┘
```

---

## 📞 REFERENCIAS Y LINKS IMPORTANTES

| Recurso | Ubicación |
|---------|-----------|
| **Componente UI Pagos** | [ClientesPage.tsx](src/components/ClientesPage.tsx) |
| **Servicio Pagos** | [cotizacion-pagos.service.ts](src/services/cotizacion-pagos.service.ts) |
| **Tabla SQL** | [20250311000001_create_cotizacion_pagos.sql](supabase/migrations/20250311000001_create_cotizacion_pagos.sql) |
| **Tipos TypeScript** | [database.ts](src/types/database.ts) |
| **Setup SQL** | [setup-liquidaciones.sql](setup-liquidaciones.sql) |
| **Sistema Vendedores** | [setup-vendedores-trabajadores.sql](setup-vendedores-trabajadores.sql) |

---

## 🎓 CONCLUSIONES

✅ **Sistema robusto y bien estructurado** para pagos de cotizaciones
- Historial inmutable para auditoría
- Auto-cálculo de estado
- Solo admin puede registrar (control)
- Interfaz clara y funcional

⚠️ **Limitaciones documentadas:**
- No hay eliminación de pagos
- No hay edición de montos
- Solo admin registra pagos
- Sin integración de métodos de pago

🚀 **Listo para enhances:**
- Pagos compensatorios
- Portal de pagos para clientes
- Notificaciones automáticas
- Reportes y analytics

