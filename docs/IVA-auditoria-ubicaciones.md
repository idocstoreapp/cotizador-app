# Auditoría: Dónde puede no mostrarse, descontarse o aclararse el IVA

> **Regla de negocio:** El IVA no es ganancia. Debe descontarse siempre en costos y saldos disponibles, y aclararse donde se muestren totales o ganancias.

---

## Crítico: Cálculo incorrecto (IVA no descontado)

### 1. **`src/services/rentabilidad.service.ts` – `obtenerEstadisticasRentabilidad`**

- **Qué hace:** Calcula la "Utilidad Total" y la tabla "Top Proyectos" del Dashboard (Resumen de Rentabilidad).
- **Problema:** Usa `obtenerResumenCostosReales()`, cuyo `totalReal` **no incluye IVA** (solo materiales, mano de obra, gastos hormiga, transporte). Por tanto:
  - `utilidad = totalCotizado - totalReal` **no resta el IVA**.
  - La "Utilidad Total" y la "Utilidad" por proyecto quedan **infladas**.
- **Dónde se ve:** Dashboard admin → sección "Resumen de Rentabilidad" (Utilidad Total, tabla Cotizado / Real / Utilidad / %).
- **Recomendación:** Para cada cotización aceptada, sumar el IVA presupuestado al `total_real` (o usar la misma lógica que `obtenerComparacionPresupuestoReal`, donde sí se incluye IVA en `totalRealGastado`) y que `utilidad = totalCotizado - (totalReal + ivaPresupuestado)`.

---

## Donde no se aclara que el IVA no es ganancia

### 2. **`src/components/DashboardVendedor.tsx`**

- **Qué muestra:** "Ventas del Mes" y "Ventas Totales" (histórico).
- **Problema:** Los montos son totales con IVA incluido, pero no se indica que:
  - el total incluye IVA, ni
  - que el IVA no es ganancia del vendedor/empresa.
- **Recomendación:** Añadir una línea tipo: "Total con IVA incluido (el IVA no es ganancia)".

### 3. **`src/components/Dashboard.tsx` – Resumen de Rentabilidad (admin)**

- **Qué muestra:** "Utilidad Total", "Proyectos Rentables", "Proyectos con Pérdidas", tabla "Top Proyectos" (Cotizado, Real, Utilidad, %).
- **Problema:** No se indica que la utilidad debería ser "después de IVA". Además, por el bug del punto 1, la utilidad está mal calculada.
- **Recomendación:** Corregir el cálculo (punto 1) y añadir texto: "Utilidad neta (IVA ya descontado)" o similar.

### 4. **`src/components/ReportesPage.tsx`**

- **Qué muestra:** KPIs estáticos: "Total Ganado", "Ticket Promedio", gráficos de ventas y ganancias.
- **Problema:** No se aclara si "Total Ganado" es bruto o neto de IVA. Si en el futuro se enlaza a datos reales, debe quedar claro que las ganancias son después de IVA.
- **Recomendación:** Al conectar datos reales, asegurar que "Total Ganado" / ganancias sean netos de IVA y añadir leyenda "IVA no es ganancia; ya descontado".

### 5. **`src/components/ui/CotizacionCart.tsx`**

- **Qué muestra:** "Impuestos (IVA 19%)" y "Total Final".
- **Problema:** Se muestra el IVA pero no se aclara que "el IVA no es ganancia".
- **Recomendación:** Opcional: añadir una nota corta debajo del IVA, por ejemplo: "IVA (impuesto, no es ganancia)".

### 6. **`src/components/HistorialCotizaciones.tsx`**

- **Qué muestra:** En el detalle de una cotización: Subtotal, IVA (19%), Margen de Ganancia, Total.
- **Problema:** Se muestra el IVA pero no se indica que no es ganancia.
- **Recomendación:** Junto a la línea de IVA, texto: "IVA (impuesto, no es ganancia)".

### 7. **`src/components/CotizacionesPage.tsx`**

- **Qué muestra:** En el modal de detalle: Subtotal Materiales, Subtotal Servicios, Subtotal, IVA (19%), Margen de Ganancia, Total.
- **Problema:** Misma situación que HistorialCotizaciones: IVA visible pero sin aclaración.
- **Recomendación:** Misma aclaración que en el punto 6.

### 8. **`src/components/ui/FacturasTab.tsx`**

- **Qué muestra:** "Total Facturas" y columna "Total" por factura.
- **Problema:** El total de la factura suele incluir IVA; no se aclara. En UtilidadesTab sí se explica que el IVA se extrae del total facturado.
- **Recomendación:** En el resumen "Total Facturas", indicar: "Total facturado (incluye IVA; el IVA no es ganancia)".

---

## Donde ya está bien tratado o aclarado

- **`src/components/ui/ResumenCostosTab.tsx`:** "Total Real Gastado" indica "Incluye IVA" y "Utilidad Real" indica "Total cotizado - Total real gastado (incluye IVA)". Correcto.
- **`src/components/ui/UtilidadesTab.tsx`:** Explica IVA presupuestado vs real y que el IVA se resta de la utilidad. Correcto.
- **`src/services/dashboard-stats.service.ts`:** Costos del mes e histórico incluyen IVA; se exponen `ivaRealMes` e `ivaRealHistorico`. Correcto (tras los cambios recientes).
- **`src/components/Dashboard.tsx` (tarjetas principales):** Costos con "Incluye IVA (no es ganancia)", Ganancia Neta con "Saldo real disponible (IVA ya descontado)", histórico con IVA y aclaraciones. Correcto.
- **`src/services/rentabilidad.service.ts` – `obtenerComparacionPresupuestoReal`:** Incluye IVA en `totalRealGastado` y en la utilidad real. Correcto.
- **PDFs (`generarPDF.ts`, `convertirCotizacionAPDF.ts`, `convertirItemsAPDF.ts`):** Muestran IVA en el desglose. Opcional: añadir en el pie o junto al IVA que "IVA es impuesto, no ganancia" si se quiere uniformidad.

---

## Resumen de acciones sugeridas

| Prioridad | Ubicación | Acción | Estado |
|----------|-----------|--------|--------|
| **Alta** | `rentabilidad.service.ts` → `obtenerEstadisticasRentabilidad` | Incluir IVA en `total_real` por proyecto para que la utilidad sea "después de IVA". | ✅ Hecho |
| Media | `DashboardVendedor.tsx` | Aclarar que ventas son "con IVA incluido" y que el IVA no es ganancia. | ✅ Hecho |
| Media | `Dashboard.tsx` (Resumen Rentabilidad) | Tras corregir el servicio, añadir leyenda "IVA ya descontado" en Utilidad Total y tabla. | ✅ Hecho |
| Baja | `ReportesPage.tsx` | Al usar datos reales, definir ganancia neta de IVA y aclararlo. | ✅ Hecho (leyenda añadida) |
| Baja | `CotizacionCart.tsx`, `HistorialCotizaciones.tsx`, `CotizacionesPage.tsx` | Añadir nota corta: "IVA no es ganancia" donde se muestra el IVA. | ✅ Hecho |
| Baja | `FacturasTab.tsx` | Aclarar que "Total Facturas" incluye IVA y que el IVA no es ganancia. | ✅ Hecho |
