-- Script para actualizar la restricción de estados de cotizaciones
-- Ejecuta este script en el SQL Editor de Supabase

-- Eliminar la restricción antigua si existe
ALTER TABLE cotizaciones 
  DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;

-- Agregar la nueva restricción con los estados correctos
ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_estado_check 
  CHECK (estado IN ('pendiente', 'aceptada', 'rechazada'));

-- Actualizar el valor por defecto
ALTER TABLE cotizaciones
  ALTER COLUMN estado SET DEFAULT 'pendiente';

-- Actualizar cotizaciones existentes con estados antiguos a 'pendiente'
UPDATE cotizaciones 
SET estado = 'pendiente' 
WHERE estado NOT IN ('pendiente', 'aceptada', 'rechazada');

-- Verificar que todas las cotizaciones tengan un estado válido
SELECT id, numero, estado 
FROM cotizaciones 
WHERE estado NOT IN ('pendiente', 'aceptada', 'rechazada');

