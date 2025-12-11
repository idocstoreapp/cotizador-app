/**
 * Tipos TypeScript para la base de datos de Supabase
 * Estos tipos deben coincidir con las tablas creadas en Supabase
 */

// Tipo de base de datos para Supabase (simplificado)
export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      materiales: {
        Row: Material;
        Insert: Omit<Material, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Material, 'id' | 'created_at' | 'updated_at'>>;
      };
      servicios: {
        Row: Servicio;
        Insert: Omit<Servicio, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Servicio, 'id' | 'created_at' | 'updated_at'>>;
      };
      cotizaciones: {
        Row: Cotizacion;
        Insert: Omit<Cotizacion, 'id' | 'numero' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Cotizacion, 'id' | 'numero' | 'created_at' | 'updated_at'>>;
      };
      clientes: {
        Row: Cliente;
        Insert: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>;
      };
      trabajos: {
        Row: Trabajo;
        Insert: Omit<Trabajo, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Trabajo, 'id' | 'created_at' | 'updated_at'>>;
      };
      gastos_reales_materiales: {
        Row: GastoRealMaterial;
        Insert: Omit<GastoRealMaterial, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GastoRealMaterial, 'id' | 'created_at' | 'updated_at'>>;
      };
      cotizacion_trabajadores: {
        Row: CotizacionTrabajador;
        Insert: Omit<CotizacionTrabajador, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CotizacionTrabajador, 'id' | 'created_at' | 'updated_at'>>;
      };
      mano_obra_real: {
        Row: ManoObraReal;
        Insert: Omit<ManoObraReal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ManoObraReal, 'id' | 'created_at' | 'updated_at'>>;
      };
      gastos_hormiga: {
        Row: GastoHormiga;
        Insert: Omit<GastoHormiga, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GastoHormiga, 'id' | 'created_at' | 'updated_at'>>;
      };
      transporte_real: {
        Row: TransporteReal;
        Insert: Omit<TransporteReal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TransporteReal, 'id' | 'created_at' | 'updated_at'>>;
      };
      facturas: {
        Row: Factura;
        Insert: Omit<Factura, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Factura, 'id' | 'created_at' | 'updated_at'>>;
      };
      factura_items: {
        Row: FacturaItem;
        Insert: Omit<FacturaItem, 'id' | 'created_at'>;
        Update: Partial<Omit<FacturaItem, 'id' | 'created_at'>>;
      };
      fixed_expense_categories: {
        Row: FixedExpenseCategory;
        Insert: Omit<FixedExpenseCategory, 'id' | 'created_at'>;
        Update: Partial<Omit<FixedExpenseCategory, 'id' | 'created_at'>>;
      };
      fixed_expenses: {
        Row: FixedExpense;
        Insert: Omit<FixedExpense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FixedExpense, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Tipo de usuario con roles
export type UserRole = 'admin' | 'tecnico' | 'vendedor' | 'trabajador_taller';

// Perfil de usuario extendido
export interface UserProfile {
  id: string;
  email?: string; // Opcional para vendedores y trabajadores (solo registros de BD)
  role: UserRole;
  nombre?: string;
  apellido?: string; // Apellido para vendedores y trabajadores
  especialidad?: string; // Solo para trabajadores de taller (ej: "carpintero", "pintor", etc.)
  created_at: string;
}

// Material en la base de datos
export interface Material {
  id: string;
  nombre: string;
  tipo: string; // madera, MDF, hierro, insumos, pintura, etc.
  unidad: string; // m², metro lineal, unidad
  costo_unitario: number;
  proveedor?: string;
  created_at: string;
  updated_at: string;
}

// Servicio/Mano de obra
export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_por_hora: number;
  horas_estimadas: number;
  created_at: string;
  updated_at: string;
}

// Item de material en una cotización
export interface CotizacionMaterial {
  material_id: string;
  material?: Material; // Relación cargada
  cantidad: number;
  precio_unitario: number; // Precio al momento de la cotización
}

// Item de servicio en una cotización
export interface CotizacionServicio {
  servicio_id: string;
  servicio?: Servicio; // Relación cargada
  horas: number;
  precio_por_hora: number; // Precio al momento de la cotización
}

// Tipo de empresa
export type EmpresaType = 'casablanca' | 'kubica';

// Cotización completa
export interface Cotizacion {
  id: string;
  numero: string; // Número único de cotización
  empresa?: EmpresaType; // Empresa que generó la cotización
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  materiales: CotizacionMaterial[];
  servicios: CotizacionServicio[];
  items?: any[]; // Items completos con toda su información (nombre, descripción, medidas, materiales, servicios, costos, utilidades, etc.)
  subtotal_materiales: number;
  subtotal_servicios: number;
  subtotal: number;
  descuento?: number; // Porcentaje de descuento aplicado
  iva: number; // Monto del IVA calculado
  iva_porcentaje?: number; // Porcentaje de IVA (default 19%)
  margen_ganancia: number; // Porcentaje configurado
  total: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  estado_pago?: 'no_pagado' | 'pago_parcial' | 'pagado'; // Estado de pago (solo para cotizaciones aceptadas)
  monto_pagado?: number; // Monto total pagado hasta el momento
  usuario_id: string; // ID del usuario que creó la cotización
  usuario?: UserProfile; // Relación cargada
  vendedor_id?: string; // ID del vendedor que generó la cotización
  vendedor?: UserProfile; // Relación cargada
  pago_vendedor?: number; // Monto del pago al vendedor (solo para cotizaciones aceptadas)
  notas?: string;
  created_at: string;
  updated_at: string;
}

// Trabajador asignado a una cotización aceptada
export interface CotizacionTrabajador {
  id: string;
  cotizacion_id: string;
  trabajador_id: string;
  trabajador?: UserProfile; // Relación cargada
  pago_trabajador: number; // Monto del pago al trabajador
  notas?: string;
  created_at: string;
  updated_at: string;
}

// Configuración de la aplicación
export interface Configuracion {
  id: string;
  margen_ganancia_default: number; // Porcentaje por defecto
  iva_porcentaje: number; // 19
  empresa_nombre: string;
  empresa_logo?: string;
  empresa_direccion?: string;
  empresa_telefono?: string;
}

// Historial de modificaciones de cotizaciones
export interface HistorialModificacion {
  id: string;
  cotizacion_id: string;
  usuario_id: string;
  descripcion: string;
  cambios: any; // JSON con los cambios realizados
  total_anterior?: number;
  total_nuevo?: number;
  created_at: string;
  // Relaciones
  usuario?: UserProfile;
}

// Cliente
export interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  empresa?: EmpresaType; // Empresa a la que pertenece el cliente
  created_at: string;
  updated_at: string;
}

// Trabajo
export interface Trabajo {
  id: string;
  cliente_id: string;
  cotizacion_id?: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  empleados_asignados?: string[];
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  cliente?: Cliente;
  cotizacion?: Cotizacion;
}

// Gasto real de material
export interface GastoRealMaterial {
  id: string;
  cotizacion_id: string;
  item_id: string; // ID del item dentro de la cotización
  material_id?: string; // ID del material (puede ser null si el material fue eliminado)
  material_nombre: string; // Nombre del material al momento de la compra
  cantidad_presupuestada: number; // Cantidad que se presupuestó
  cantidad_real: number; // Cantidad realmente comprada/usada
  precio_unitario_presupuestado: number; // Precio que se presupuestó
  precio_unitario_real: number; // Precio realmente pagado
  unidad: string; // Unidad de medida
  fecha_compra: string; // Fecha en que se realizó la compra
  proveedor?: string; // Nombre del proveedor
  numero_factura?: string; // Número de factura o comprobante
  notas?: string; // Notas adicionales
  alcance_gasto?: 'unidad' | 'parcial' | 'total'; // Indica si el gasto es por 1 unidad, parcial o total
  cantidad_items_aplicados?: number; // Cantidad de items a los que aplica (solo para alcance_gasto = parcial)
  created_at: string;
  updated_at: string;
  // Relaciones
  cotizacion?: Cotizacion;
  material?: Material;
}

// Mano de obra real
export interface ManoObraReal {
  id: string;
  cotizacion_id: string;
  trabajador_id?: string; // ID del trabajador (puede ser null)
  trabajador?: UserProfile; // Relación cargada
  horas_trabajadas: number;
  pago_por_hora: number;
  monto_manual?: number; // Monto manual cuando tipo_calculo es 'monto'
  tipo_calculo?: 'horas' | 'monto'; // Tipo de cálculo: por horas o monto manual
  total_pagado: number; // Calculado: horas_trabajadas * pago_por_hora o monto_manual
  fecha: string; // Fecha del trabajo
  comprobante_url?: string; // URL del comprobante
  notas?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total'; // Indica si el gasto es por 1 unidad, parcial o total
  cantidad_items_aplicados?: number; // Cantidad de items a los que aplica (solo para alcance_gasto = parcial)
  created_at: string;
  updated_at: string;
  // Relaciones
  cotizacion?: Cotizacion;
}

// Gasto hormiga
export interface GastoHormiga {
  id: string;
  cotizacion_id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  factura_url?: string;
  evidencia_url?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total'; // Indica si el gasto es por 1 unidad, parcial o total
  cantidad_items_aplicados?: number; // Cantidad de items a los que aplica (solo para alcance_gasto = parcial)
  created_at: string;
  updated_at: string;
  // Relaciones
  cotizacion?: Cotizacion;
}

// Transporte real
export interface TransporteReal {
  id: string;
  cotizacion_id: string;
  tipo_descripcion: string; // Descripción del tipo de transporte
  costo: number;
  fecha: string;
  factura_url?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total'; // Indica si el gasto es por 1 unidad, parcial o total
  cantidad_items_aplicados?: number; // Cantidad de items a los que aplica (solo para alcance_gasto = parcial)
  created_at: string;
  updated_at: string;
  // Relaciones
  cotizacion?: Cotizacion;
}

// Factura
export interface Factura {
  id: string;
  cotizacion_id: string;
  numero_factura: string;
  fecha_factura: string;
  proveedor?: string;
  total: number;
  archivo_url?: string;
  tipo: 'material' | 'mano_obra' | 'transporte' | 'gasto_hormiga' | 'mixta';
  bsale_document_id?: number; // ID del documento en Bsale para enlaces directos
  created_at: string;
  updated_at: string;
  // Relaciones
  cotizacion?: Cotizacion;
  items?: FacturaItem[];
}

// Item de factura
export interface FacturaItem {
  id: string;
  factura_id: string;
  tipo_item: 'material_real' | 'mano_obra_real' | 'transporte_real' | 'gasto_hormiga';
  item_id: string; // ID del item correspondiente
  created_at: string;
  // Relaciones
  factura?: Factura;
}

// Categoría de gasto fijo
export interface FixedExpenseCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Gasto fijo
export interface FixedExpense {
  id: string;
  category_id?: string;
  category?: FixedExpenseCategory; // Relación cargada
  description: string;
  amount: number;
  provider?: string;
  payment_method?: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
  date: string; // Fecha del gasto
  created_at: string;
  updated_at: string;
}

// Liquidación de pago a trabajador/vendedor
export interface Liquidacion {
  id: string;
  persona_id: string;
  persona?: UserProfile; // Relación cargada
  tipo_persona: 'vendedor' | 'trabajador_taller';
  monto: number;
  fecha_liquidacion: string;
  metodo_pago?: 'efectivo' | 'transferencia' | 'cheque' | 'otro';
  numero_referencia?: string;
  notas?: string;
  liquidado_por?: string;
  liquidador?: UserProfile; // Relación cargada
  created_at: string;
  updated_at: string;
}

// Balance de un trabajador/vendedor
export interface BalancePersonal {
  persona_id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  tipo_persona: 'vendedor' | 'trabajador_taller';
  especialidad?: string;
  total_ganado_vendedor: number;
  total_ganado_trabajador: number;
  total_liquidado: number;
  balance_pendiente: number;
  cotizaciones_vendedor: number;
  trabajos_realizados: number;
  ultima_liquidacion?: string;
}

// Detalle de pago individual
export interface DetallePago {
  tipo: 'vendedor' | 'trabajador';
  cotizacion_id: string;
  cotizacion_numero: string;
  cliente_nombre: string;
  monto: number;
  fecha: string;
  estado: string;
}

// Resumen de liquidaciones
export interface ResumenLiquidaciones {
  total_vendedores: number;
  total_trabajadores: number;
  total_pendiente_vendedores: number;
  total_pendiente_trabajadores: number;
  total_liquidado_mes: number;
}