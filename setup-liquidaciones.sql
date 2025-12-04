-- ============================================
-- Script SQL: Sistema de Liquidaciones para Trabajadores y Vendedores
-- ============================================
-- Este script crea:
-- 1. Tabla liquidaciones para registrar pagos realizados
-- 2. Vista para ver balance acumulado por trabajador/vendedor
-- 3. Función para obtener resumen de pagos pendientes
-- ============================================

-- ============================================
-- 1. CREAR TABLA LIQUIDACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS liquidaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('vendedor', 'trabajador_taller')),
  monto DECIMAL(12, 2) NOT NULL,
  fecha_liquidacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'otro')),
  numero_referencia TEXT, -- Número de transacción, cheque, etc.
  notas TEXT,
  liquidado_por UUID REFERENCES perfiles(id), -- Admin que realizó la liquidación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_liquidaciones_persona_id ON liquidaciones(persona_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_fecha ON liquidaciones(fecha_liquidacion);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_tipo_persona ON liquidaciones(tipo_persona);

-- Habilitar RLS
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver todas las liquidaciones
CREATE POLICY "Admins can view all liquidaciones" ON liquidaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Cada persona puede ver sus propias liquidaciones
CREATE POLICY "Users can view own liquidaciones" ON liquidaciones
  FOR SELECT USING (persona_id = auth.uid());

-- Política: Solo admins pueden crear/modificar liquidaciones
CREATE POLICY "Admins can modify liquidaciones" ON liquidaciones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE liquidaciones IS 'Registro de pagos realizados a vendedores y trabajadores de taller';
COMMENT ON COLUMN liquidaciones.monto IS 'Monto pagado en esta liquidación';
COMMENT ON COLUMN liquidaciones.tipo_persona IS 'Tipo de persona: vendedor o trabajador_taller';

-- ============================================
-- 2. CREAR VISTA DE BALANCE POR PERSONA
-- ============================================

-- Vista que muestra el balance de cada trabajador/vendedor
CREATE OR REPLACE VIEW balance_personal AS
SELECT 
  p.id as persona_id,
  p.nombre,
  p.apellido,
  p.email,
  p.role as tipo_persona,
  p.especialidad,
  -- Total ganado por vendedores (de cotizaciones aceptadas)
  COALESCE(
    (SELECT SUM(c.pago_vendedor) 
     FROM cotizaciones c 
     WHERE c.vendedor_id = p.id 
     AND c.estado = 'aceptada'
     AND c.pago_vendedor > 0),
    0
  ) as total_ganado_vendedor,
  -- Total ganado por trabajadores (de cotizacion_trabajadores)
  COALESCE(
    (SELECT SUM(ct.pago_trabajador) 
     FROM cotizacion_trabajadores ct 
     WHERE ct.trabajador_id = p.id),
    0
  ) as total_ganado_trabajador,
  -- Total ya liquidado
  COALESCE(
    (SELECT SUM(l.monto) 
     FROM liquidaciones l 
     WHERE l.persona_id = p.id),
    0
  ) as total_liquidado,
  -- Balance pendiente por liquidar
  (
    COALESCE(
      (SELECT SUM(c.pago_vendedor) 
       FROM cotizaciones c 
       WHERE c.vendedor_id = p.id 
       AND c.estado = 'aceptada'
       AND c.pago_vendedor > 0),
      0
    ) +
    COALESCE(
      (SELECT SUM(ct.pago_trabajador) 
       FROM cotizacion_trabajadores ct 
       WHERE ct.trabajador_id = p.id),
      0
    ) -
    COALESCE(
      (SELECT SUM(l.monto) 
       FROM liquidaciones l 
       WHERE l.persona_id = p.id),
      0
    )
  ) as balance_pendiente,
  -- Cantidad de cotizaciones/trabajos realizados
  (
    SELECT COUNT(DISTINCT c.id) 
    FROM cotizaciones c 
    WHERE c.vendedor_id = p.id 
    AND c.estado = 'aceptada'
  ) as cotizaciones_vendedor,
  (
    SELECT COUNT(DISTINCT ct.cotizacion_id) 
    FROM cotizacion_trabajadores ct 
    WHERE ct.trabajador_id = p.id
  ) as trabajos_realizados,
  -- Última liquidación
  (
    SELECT MAX(l.fecha_liquidacion) 
    FROM liquidaciones l 
    WHERE l.persona_id = p.id
  ) as ultima_liquidacion
FROM perfiles p
WHERE p.role IN ('vendedor', 'trabajador_taller');

-- ============================================
-- 3. CREAR FUNCIÓN PARA OBTENER DETALLE DE PAGOS
-- ============================================

-- Función para obtener el detalle de pagos de una persona
CREATE OR REPLACE FUNCTION obtener_detalle_pagos(persona_uuid UUID)
RETURNS TABLE (
  tipo TEXT,
  cotizacion_id UUID,
  cotizacion_numero TEXT,
  cliente_nombre TEXT,
  monto DECIMAL(12,2),
  fecha TIMESTAMP WITH TIME ZONE,
  estado TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Pagos como vendedor
  RETURN QUERY
  SELECT 
    'vendedor'::TEXT as tipo,
    c.id as cotizacion_id,
    c.numero as cotizacion_numero,
    c.cliente_nombre,
    c.pago_vendedor as monto,
    c.updated_at as fecha,
    c.estado::TEXT
  FROM cotizaciones c
  WHERE c.vendedor_id = persona_uuid
  AND c.estado = 'aceptada'
  AND c.pago_vendedor > 0
  
  UNION ALL
  
  -- Pagos como trabajador
  SELECT 
    'trabajador'::TEXT as tipo,
    c.id as cotizacion_id,
    c.numero as cotizacion_numero,
    c.cliente_nombre,
    ct.pago_trabajador as monto,
    ct.created_at as fecha,
    c.estado::TEXT
  FROM cotizacion_trabajadores ct
  JOIN cotizaciones c ON c.id = ct.cotizacion_id
  WHERE ct.trabajador_id = persona_uuid
  
  ORDER BY fecha DESC;
END;
$$;

-- ============================================
-- 4. CREAR FUNCIÓN PARA RESUMEN GENERAL
-- ============================================

CREATE OR REPLACE FUNCTION obtener_resumen_liquidaciones()
RETURNS TABLE (
  total_vendedores BIGINT,
  total_trabajadores BIGINT,
  total_pendiente_vendedores DECIMAL(12,2),
  total_pendiente_trabajadores DECIMAL(12,2),
  total_liquidado_mes DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM perfiles WHERE role = 'vendedor')::BIGINT as total_vendedores,
    (SELECT COUNT(*) FROM perfiles WHERE role = 'trabajador_taller')::BIGINT as total_trabajadores,
    COALESCE(
      (SELECT SUM(balance_pendiente) FROM balance_personal WHERE tipo_persona = 'vendedor'),
      0
    )::DECIMAL(12,2) as total_pendiente_vendedores,
    COALESCE(
      (SELECT SUM(balance_pendiente) FROM balance_personal WHERE tipo_persona = 'trabajador_taller'),
      0
    )::DECIMAL(12,2) as total_pendiente_trabajadores,
    COALESCE(
      (SELECT SUM(monto) FROM liquidaciones 
       WHERE fecha_liquidacion >= date_trunc('month', CURRENT_DATE)),
      0
    )::DECIMAL(12,2) as total_liquidado_mes;
END;
$$;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Instrucciones:
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. La tabla liquidaciones registra todos los pagos
-- 3. La vista balance_personal muestra el estado de cada persona
-- 4. Las funciones ayudan a obtener detalles y resúmenes
-- ============================================





