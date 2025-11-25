# 📋 Instrucciones de Setup - Tabla Muebles

## ⚠️ Error: "relation muebles does not exist"

Si recibes este error, significa que la tabla `muebles` no ha sido creada aún en tu base de datos.

## ✅ Solución Rápida

### Opción 1: Script Completo (Recomendado)

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `setup-completo-muebles.sql`
3. Copia y pega todo el contenido
4. Haz clic en **"Run"** o presiona `Ctrl+Enter`
5. Verifica que el mensaje sea exitoso

Este script:
- ✅ Crea la tabla `muebles` con todos los campos necesarios
- ✅ Incluye el campo `imagenes_por_variante` desde el inicio
- ✅ Configura las políticas de seguridad (RLS)
- ✅ Crea los índices necesarios
- ✅ Configura los triggers

### Opción 2: Script Original + Migración

Si prefieres usar el script original:

1. Primero ejecuta `supabase-muebles-setup.sql` (crea la tabla base)
2. Luego ejecuta `migracion-imagenes-variante.sql` (agrega el nuevo campo)

## 🔍 Verificación

Después de ejecutar el script, verifica que todo esté correcto:

```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'muebles';

-- Verificar que tiene el campo imagenes_por_variante
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'muebles'
AND column_name = 'imagenes_por_variante';
```

Deberías ver:
- ✅ `muebles` en la lista de tablas
- ✅ `imagenes_por_variante` con tipo `jsonb`

## 📝 Orden de Ejecución Recomendado

1. **setup-completo-muebles.sql** - Crea la tabla completa
2. **supabase-storage-setup.sql** - Configura el bucket de Storage (si no lo has hecho)
3. **crear-closet-ejemplo.sql** - Crea el Closet de ejemplo (después de subir las imágenes)

## ⚠️ Notas Importantes

- Si ya tienes datos en la tabla `muebles`, el script `setup-completo-muebles.sql` es seguro (usa `CREATE TABLE IF NOT EXISTS`)
- Las políticas de seguridad se recrean, así que no perderás permisos
- Si tienes problemas, verifica que tengas permisos de administrador en Supabase

## 🆘 Si Aún Tienes Problemas

1. Verifica que estás en el proyecto correcto de Supabase
2. Verifica que tienes permisos de administrador
3. Revisa la consola de Supabase para ver errores detallados
4. Asegúrate de que la función `update_updated_at_column()` existe (el script la crea)

