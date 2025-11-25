# Guía para Importar Datos del Excel

## Pasos para Importar los Datos del Excel "Plantilla 250425 subida.xlsm"

### Opción 1: Usar el Script SQL (Recomendado)

1. Abre el archivo `importar-datos-excel.sql`
2. Revisa los datos de ejemplo y reemplázalos con los datos reales de tu Excel
3. Ve a Supabase Dashboard → SQL Editor
4. Pega el contenido del script SQL
5. Ejecuta el script

### Opción 2: Importar Manualmente desde la Aplicación

1. Inicia sesión como administrador
2. Ve a la sección de Materiales o Servicios
3. Agrega cada material/servicio manualmente usando el formulario

### Opción 3: Usar la Función de Importación (Próximamente)

Se puede crear un componente que lea el Excel directamente, pero requiere:
- Librería para leer Excel (xlsx, exceljs)
- Componente de carga de archivos
- Procesamiento del archivo en el cliente

## Estructura Esperada del Excel

### Hoja de Materiales:
- Nombre del material
- Tipo (madera, hierro, insumos, pintura, etc.)
- Unidad (m², metro lineal, unidad, galón)
- Costo unitario
- Proveedor (opcional)

### Hoja de Servicios:
- Nombre del servicio
- Descripción
- Precio por hora
- Horas estimadas

## Fórmulas del Excel que se Replican en la App

1. **Subtotal Materiales** = Suma de (Cantidad × Precio Unitario) de cada material
2. **Subtotal Servicios** = Suma de (Horas × Precio por Hora) de cada servicio
3. **Gastos Extras** = Suma de todos los gastos adicionales
4. **Subtotal General** = Materiales + Servicios + Gastos Extras
5. **Margen de Ganancia** = Subtotal × (Margen % / 100)
6. **Precio con Margen** = Subtotal + Margen de Ganancia
7. **Descuento** = Precio con Margen × (Descuento % / 100)
8. **Precio Final** = Precio con Margen - Descuento
9. **IVA** = Precio Final × 19% (en Colombia)
10. **Total** = Precio Final + IVA

Todas estas fórmulas están implementadas en el componente `AgregarItemManual`.


