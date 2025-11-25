# 🔧 Solución: Error de Restricción de Estado en Cotizaciones

## ❌ Error

```
Error al guardar la cotización: new row for relation "cotizaciones" violates check constraint "cotizaciones_estado_check"
```

## 🔍 Causa

La base de datos tiene una restricción CHECK antigua que solo permite estos estados:
- `'borrador'`
- `'enviada'`
- `'aprobada'`
- `'rechazada'`

Pero el código está intentando usar:
- `'pendiente'`
- `'aceptada'`
- `'rechazada'`

## ✅ Solución

Ejecuta este script SQL en el SQL Editor de Supabase:

```sql
-- Eliminar la restricción antigua
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
```

## 📋 Pasos

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el script SQL de arriba
4. Ejecuta el script
5. Verifica que no haya errores
6. Intenta generar una cotización nuevamente

## ✅ Verificación

Después de ejecutar el script, verifica que funcionó:

```sql
-- Verificar la restricción
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'cotizaciones'::regclass
  AND conname = 'cotizaciones_estado_check';
```

Deberías ver:
```
CHECK (estado IN ('pendiente', 'aceptada', 'rechazada'))
```

## 🎯 Estados Válidos Después de la Actualización

- ✅ `'pendiente'` - Cotización creada, esperando aprobación
- ✅ `'aceptada'` - Cotización aceptada, se crea trabajo
- ✅ `'rechazada'` - Cotización rechazada

## 📝 Nota

El archivo `actualizar-estados-cotizaciones.sql` contiene el script completo listo para ejecutar.

