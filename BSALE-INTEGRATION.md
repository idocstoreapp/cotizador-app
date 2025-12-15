# Integración con Bsale

Esta integración permite sincronizar las facturas registradas en el sistema con los documentos de terceros en Bsale, y generar enlaces directos a los documentos en la plataforma de Bsale.

## Configuración

### 1. Obtener Access Token de Bsale

1. Inicia sesión en tu cuenta de Bsale
2. Ve a **Configuración** → **API**
3. Genera un nuevo **Access Token**
4. Copia el token generado

### 2. Configurar Variables de Entorno

Agrega el token a tu archivo `.env`:

```env
# Token de acceso a la API de Bsale
BSALE_ACCESS_TOKEN=tu_token_aqui

# URL base de la API (opcional, por defecto: https://api.bsale.io/v1)
BSALE_BASE_URL=https://api.bsale.io/v1
```

**Nota**: Si estás usando variables públicas (con `PUBLIC_`), también puedes usar:
```env
PUBLIC_BSALE_ACCESS_TOKEN=tu_token_aqui
PUBLIC_BSALE_BASE_URL=https://api.bsale.io/v1
```

### 3. Actualizar la Base de Datos

Ejecuta el script SQL para agregar el campo `bsale_document_id` a la tabla `facturas`:

```sql
-- Ejecutar en Supabase SQL Editor
-- O usar el archivo: setup-bsale-integration.sql
```

O ejecuta directamente:
```bash
# Si tienes acceso a psql
psql -h tu_host -U tu_usuario -d tu_base_de_datos -f setup-bsale-integration.sql
```

## Uso

### Sincronizar una Factura Individual

1. Ve a la sección de **Costos** de una cotización
2. Abre la pestaña **Facturas**
3. En la columna **Bsale**, haz clic en **🔄 Sincronizar** para facturas sin enlace
4. El sistema buscará el documento en Bsale por número de factura
5. Si se encuentra, se actualizará automáticamente con el ID de Bsale

### Sincronizar Todas las Facturas

1. En la pestaña **Facturas**, haz clic en **🔄 Sincronizar con Bsale**
2. El sistema procesará todas las facturas sin `bsale_document_id`
3. Se mostrará un resumen con:
   - Facturas sincronizadas exitosamente
   - Facturas no encontradas en Bsale
   - Errores durante la sincronización

### Ver Documento en Bsale

Una vez sincronizada, la factura mostrará un enlace **🔗 Ver en Bsale** que te llevará directamente al documento en la plataforma de Bsale.

## API Endpoints

### POST `/api/sincronizar-factura-bsale`

Sincroniza una factura individual con Bsale.

**Body:**
```json
{
  "facturaId": "uuid-de-la-factura"
}
```

O por número de factura:
```json
{
  "numeroFactura": "20925"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Factura sincronizada exitosamente",
  "factura": {
    "id": "...",
    "numero_factura": "20925",
    "bsale_document_id": 34758,
    "bsale_url": "https://www.bsale.cl/document/34758"
  }
}
```

### POST `/api/sincronizar-todas-facturas-bsale`

Sincroniza todas las facturas sin `bsale_document_id`.

**Body (opcional):**
```json
{
  "limit": 100
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización completada: 10 sincronizadas, 2 no encontradas, 0 errores",
  "sincronizadas": 10,
  "no_encontradas": 2,
  "errores": 0,
  "total_procesadas": 12,
  "resultados": [...]
}
```

## Solución de Problemas

### Error: "Bsale no está configurado"

- Verifica que `BSALE_ACCESS_TOKEN` esté en tu archivo `.env`
- Reinicia el servidor después de agregar la variable
- Verifica que el token sea válido

### Error: "No se encontró el documento en Bsale"

- Verifica que el número de factura coincida exactamente con el número en Bsale
- Asegúrate de que el documento esté registrado en Bsale como "Documento de Terceros"
- Verifica que tu cuenta de Bsale tenga acceso al documento

### El enlace sigue mostrando el ID antiguo

- Haz clic en **🔄 Sincronizar** nuevamente para actualizar
- Verifica que el número de factura en el sistema coincida con el de Bsale

## Notas Técnicas

- La búsqueda se realiza por el campo `number` (número de folio) en la API de Bsale
- El sistema guarda el `id` del documento de Bsale para generar enlaces directos
- Los enlaces apuntan a `https://www.bsale.cl/document/{id}`
- La sincronización es unidireccional: del sistema hacia Bsale (solo lectura)








