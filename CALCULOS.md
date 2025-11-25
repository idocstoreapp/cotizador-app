# Documentación de Lógica de Cálculo

Este documento explica en detalle cómo funciona la lógica de cálculo de cotizaciones.

## Ubicación del Código

La lógica de cálculo está centralizada en:
- **Archivo**: `src/utils/calcularCotizacion.ts`
- **Función principal**: `calcularCotizacionCompleta()`

## Fórmulas de Cálculo

### 1. Subtotal de Materiales

```typescript
Subtotal Materiales = Σ(cantidad × precio_unitario) de cada material
```

**Ejemplo**:
- Material A: 10 unidades × $5,000 = $50,000
- Material B: 5 m² × $15,000 = $75,000
- **Subtotal Materiales** = $125,000

### 2. Subtotal de Servicios

```typescript
Subtotal Servicios = Σ(horas × precio_por_hora) de cada servicio
```

**Ejemplo**:
- Servicio A: 8 horas × $25,000/hora = $200,000
- Servicio B: 4 horas × $30,000/hora = $120,000
- **Subtotal Servicios** = $320,000

### 3. Subtotal General

```typescript
Subtotal General = Subtotal Materiales + Subtotal Servicios
```

**Ejemplo**:
- Subtotal Materiales: $125,000
- Subtotal Servicios: $320,000
- **Subtotal General** = $445,000

### 4. IVA (Impuesto al Valor Agregado)

```typescript
IVA = Subtotal General × (IVA_PORCENTAJE / 100)
```

**Por defecto**: IVA_PORCENTAJE = 19% (Colombia)

**Ejemplo**:
- Subtotal General: $445,000
- **IVA** = $445,000 × 0.19 = $84,550

### 5. Margen de Ganancia

```typescript
Margen de Ganancia = Subtotal General × (margen_ganancia% / 100)
```

**Por defecto**: margen_ganancia = 30%

**Ejemplo**:
- Subtotal General: $445,000
- Margen: 30%
- **Margen de Ganancia** = $445,000 × 0.30 = $133,500

### 6. Total Final

```typescript
Total = (Subtotal General + Margen de Ganancia) + IVA
```

**Ejemplo**:
- Subtotal General: $445,000
- Margen de Ganancia: $133,500
- IVA: $84,550
- **Total** = $445,000 + $133,500 + $84,550 = $663,050

## Orden de Cálculo

El orden de ejecución es importante:

1. ✅ Calcular subtotal de materiales
2. ✅ Calcular subtotal de servicios
3. ✅ Calcular subtotal general
4. ✅ Calcular IVA sobre el subtotal general
5. ✅ Calcular margen de ganancia sobre el subtotal general
6. ✅ Calcular total final

## Funciones Disponibles

### `calcularSubtotalMateriales(materiales)`
Calcula el subtotal de todos los materiales.

**Parámetros**:
- `materiales`: Array de objetos `CotizacionMaterial`

**Retorna**: `number` - Subtotal de materiales

### `calcularSubtotalServicios(servicios)`
Calcula el subtotal de todos los servicios.

**Parámetros**:
- `servicios`: Array de objetos `CotizacionServicio`

**Retorna**: `number` - Subtotal de servicios

### `calcularSubtotal(subtotalMateriales, subtotalServicios)`
Calcula el subtotal general.

**Parámetros**:
- `subtotalMateriales`: number
- `subtotalServicios`: number

**Retorna**: `number` - Subtotal general

### `calcularIVA(subtotal, ivaPorcentaje)`
Calcula el IVA sobre el subtotal.

**Parámetros**:
- `subtotal`: number
- `ivaPorcentaje`: number (opcional, por defecto 19)

**Retorna**: `number` - Monto del IVA

### `calcularTotal(subtotal, iva, margenGanancia)`
Calcula el total final aplicando margen e IVA.

**Parámetros**:
- `subtotal`: number
- `iva`: number
- `margenGanancia`: number (opcional, por defecto 30)

**Retorna**: `number` - Total final (redondeado a 2 decimales)

### `calcularCotizacionCompleta(materiales, servicios, margenGanancia, ivaPorcentaje)`
Función principal que calcula todos los valores de una cotización.

**Parámetros**:
- `materiales`: Array de `CotizacionMaterial`
- `servicios`: Array de `CotizacionServicio`
- `margenGanancia`: number (opcional, por defecto 30)
- `ivaPorcentaje`: number (opcional, por defecto 19)

**Retorna**: Objeto con:
```typescript
{
  subtotalMateriales: number;
  subtotalServicios: number;
  subtotal: number;
  iva: number;
  margenGanancia: number;
  total: number;
}
```

## Modificar las Fórmulas

### Cambiar Porcentaje de IVA

Edita `src/utils/calcularCotizacion.ts`:

```typescript
// Cambiar de 19% a otro valor
export const IVA_PORCENTAJE = 21; // Por ejemplo, para Argentina
```

### Cambiar Margen de Ganancia por Defecto

```typescript
// Cambiar de 30% a otro valor
export const MARGEN_GANANCIA_DEFAULT = 40; // 40% de margen
```

### Modificar la Fórmula del Total

Si necesitas cambiar cómo se calcula el total, modifica la función `calcularTotal()`:

```typescript
export function calcularTotal(
  subtotal: number,
  iva: number,
  margenGanancia: number = MARGEN_GANANCIA_DEFAULT
): number {
  // Ejemplo: Aplicar margen después del IVA
  const subtotalConIva = subtotal + iva;
  const total = subtotalConIva * (1 + margenGanancia / 100);
  return Math.round(total * 100) / 100;
}
```

### Aplicar Descuentos

Para agregar descuentos, puedes modificar `calcularCotizacionCompleta()`:

```typescript
export function calcularCotizacionCompleta(
  materiales: CotizacionMaterial[],
  servicios: CotizacionServicio[],
  margenGanancia: number = MARGEN_GANANCIA_DEFAULT,
  ivaPorcentaje: number = IVA_PORCENTAJE,
  descuento: number = 0 // Nuevo parámetro
) {
  // ... cálculos anteriores ...
  
  // Aplicar descuento
  const subtotalConDescuento = subtotal * (1 - descuento / 100);
  
  // Recalcular IVA sobre el subtotal con descuento
  const iva = calcularIVA(subtotalConDescuento, ivaPorcentaje);
  
  // ... resto del cálculo ...
}
```

## Ejemplo Completo

```typescript
import { calcularCotizacionCompleta } from './utils/calcularCotizacion';

const materiales = [
  { material_id: '1', cantidad: 10, precio_unitario: 5000 },
  { material_id: '2', cantidad: 5, precio_unitario: 15000 }
];

const servicios = [
  { servicio_id: '1', horas: 8, precio_por_hora: 25000 },
  { servicio_id: '2', horas: 4, precio_por_hora: 30000 }
];

const resultado = calcularCotizacionCompleta(
  materiales,
  servicios,
  30, // 30% de margen
  19  // 19% de IVA
);

console.log(resultado);
// {
//   subtotalMateriales: 125000,
//   subtotalServicios: 320000,
//   subtotal: 445000,
//   iva: 84550,
//   margenGanancia: 30,
//   total: 663050
// }
```

## Notas Importantes

1. **Redondeo**: El total final se redondea a 2 decimales
2. **IVA sobre subtotal**: El IVA se calcula sobre el subtotal general, no sobre el total con margen
3. **Margen configurable**: Cada cotización puede tener un margen diferente
4. **Validaciones**: Los valores deben ser positivos (validado con Zod)

## Testing

Para probar los cálculos, puedes crear un archivo de test:

```typescript
import { calcularCotizacionCompleta } from './utils/calcularCotizacion';

// Test básico
const materiales = [{ material_id: '1', cantidad: 1, precio_unitario: 100 }];
const servicios = [{ servicio_id: '1', horas: 1, precio_por_hora: 50 }];

const resultado = calcularCotizacionCompleta(materiales, servicios, 30, 19);

// Verificar resultados esperados
console.assert(resultado.subtotal === 150, 'Subtotal incorrecto');
console.assert(resultado.iva === 28.5, 'IVA incorrecto');
console.assert(resultado.total === 223.5, 'Total incorrecto');
```


