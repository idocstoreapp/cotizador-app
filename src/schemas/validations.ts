/**
 * Esquemas de validación con Zod
 * Se usan para validar datos de entrada en formularios y APIs
 */
import { z } from 'zod';

// Esquema para registro de usuario
export const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  role: z.enum(['admin', 'tecnico'], {
    errorMap: () => ({ message: 'El rol debe ser admin o tecnico' })
  })
});

// Esquema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

// Esquema para material
export const materialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  unidad: z.string().min(1, 'La unidad es requerida'),
  costo_unitario: z.number().positive('El costo debe ser mayor a 0'),
  proveedor: z.string().optional()
});

// Esquema para servicio
export const servicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio_por_hora: z.number().positive('El precio por hora debe ser mayor a 0'),
  horas_estimadas: z.number().positive('Las horas estimadas deben ser mayores a 0')
});

// Esquema para item de material en cotización
export const cotizacionMaterialSchema = z.object({
  material_id: z.string().uuid('ID de material inválido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z.number().positive('El precio unitario debe ser mayor a 0')
});

// Esquema para item de servicio en cotización
export const cotizacionServicioSchema = z.object({
  servicio_id: z.string().uuid('ID de servicio inválido'),
  horas: z.number().positive('Las horas deben ser mayores a 0'),
  precio_por_hora: z.number().positive('El precio por hora debe ser mayor a 0')
});

// Esquema para cotización
export const cotizacionSchema = z.object({
  cliente_nombre: z.string().min(1, 'El nombre del cliente es requerido'),
  cliente_email: z.string().email('Email inválido').optional().or(z.literal('')),
  cliente_telefono: z.string().optional(),
  cliente_direccion: z.string().optional(),
  materiales: z.array(cotizacionMaterialSchema).min(0),
  servicios: z.array(cotizacionServicioSchema).min(0),
  margen_ganancia: z.number().min(0).max(100, 'El margen de ganancia no puede ser mayor a 100%'),
  notas: z.string().optional()
});

// Tipos inferidos de los esquemas
export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type ServicioInput = z.infer<typeof servicioSchema>;
export type CotizacionInput = z.infer<typeof cotizacionSchema>;
export type CotizacionMaterialInput = z.infer<typeof cotizacionMaterialSchema>;
export type CotizacionServicioInput = z.infer<typeof cotizacionServicioSchema>;


