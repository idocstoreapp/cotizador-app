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
    };
  };
}

// Tipo de usuario con roles
export type UserRole = 'admin' | 'tecnico';

// Perfil de usuario extendido
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  nombre?: string;
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
  iva: number; // 19%
  margen_ganancia: number; // Porcentaje configurado
  total: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  usuario_id: string; // ID del usuario que creó la cotización
  usuario?: UserProfile; // Relación cargada
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

