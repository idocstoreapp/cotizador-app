# 🍳 Instrucciones: Sistema de Opciones Personalizadas para Cocinas

## ✅ Sistema Implementado

Se ha implementado un sistema completo de opciones personalizadas para cocinas que permite:

1. **Tipo de Cocina**: Recta, Cara a Cara, En L, Irregular (con imagen)
2. **Material de Puertas**: Vidrio, Brillantes, Vintage, Melamina (con imagen)
3. **Tipo de Topes**: Cuarzo, Madera, Granito, Mármol, Laminado (con imagen)

Cada opción puede tener:
- Imagen asociada
- Precio adicional (suma fija)
- Multiplicador (porcentaje del precio base)

## 📋 Cómo Usar el Sistema

### 1. Crear/Editar un Mueble de Cocina

1. Ve a **Gestionar Catálogo** (botón en el catálogo)
2. Crea un nuevo mueble o edita uno existente
3. Selecciona la categoría **"Cocina"**
4. Verás una nueva sección: **"🍳 Opciones Personalizadas de Cocina"**

### 2. Agregar Opciones Personalizadas

Para cada tipo de opción (Tipo de Cocina, Material de Puertas, Tipo de Topes):

1. Haz clic en **"+ Agregar [Tipo de Opción]"**
2. Selecciona la imagen desde tu computadora
3. Ingresa el nombre de la opción (ej: "Recta", "Vidrio", "Cuarzo")
4. Configura el precio:
   - **Precio adicional**: Suma fija que se agrega al precio base
   - **Multiplicador**: Multiplica el precio base (ej: 1.2 = 20% más)
   - Puedes dejar uno vacío y usar solo el otro

### 3. Ejemplo de Configuración

#### Tipo de Cocina:
- **Recta**: Imagen `recta.jpg`, Precio adicional: $0 (o Multiplicador: 1.0)
- **Cara a Cara**: Imagen `cara-a-cara.jpg`, Precio adicional: $50000
- **En L**: Imagen `en-l.jpg`, Precio adicional: $80000
- **Irregular**: Imagen `irregular.jpg`, Multiplicador: 1.3

#### Material de Puertas:
- **Vidrio**: Imagen `puertas-vidrio.jpg`, Multiplicador: 1.2
- **Brillantes**: Imagen `puertas-brillantes.jpg`, Precio adicional: $30000
- **Vintage**: Imagen `puertas-vintage.jpg`, Multiplicador: 1.15
- **Melamina**: Imagen `puertas-melamina.jpg`, Precio adicional: $0

#### Tipo de Topes:
- **Cuarzo**: Imagen `tope-cuarzo.jpg`, Precio adicional: $100000
- **Madera**: Imagen `tope-madera.jpg`, Precio adicional: $50000
- **Granito**: Imagen `tope-granito.jpg`, Precio adicional: $120000
- **Mármol**: Imagen `tope-marmol.jpg`, Precio adicional: $150000
- **Laminado**: Imagen `tope-laminado.jpg`, Precio adicional: $0

### 4. Usar en el Catálogo

Cuando un cliente vea un mueble de cocina en el catálogo:

1. Verá selectores visuales con imágenes para cada opción
2. Al seleccionar una opción, verá el precio adicional o multiplicador
3. El precio final se calculará automáticamente incluyendo todas las opciones

## 📁 Estructura de Carpetas de Imágenes

Si tienes imágenes organizadas en `public/images/cocina-cotizador/`, puedes:

1. **Subir manualmente** cada imagen desde el formulario de gestión
2. O usar las imágenes que ya subiste a Supabase Storage

### Organización Sugerida:

```
public/images/cocina-cotizador/
├── tipo-cocina/
│   ├── recta.jpg
│   ├── cara-a-cara.jpg
│   ├── en-l.jpg
│   └── irregular.jpg
├── material-puertas/
│   ├── vidrio.jpg
│   ├── brillantes.jpg
│   ├── vintage.jpg
│   └── melamina.jpg
└── tipo-topes/
    ├── cuarzo.jpg
    ├── madera.jpg
    ├── granito.jpg
    ├── marmol.jpg
    └── laminado.jpg
```

## 🔧 Notas Técnicas

- Las opciones personalizadas se guardan en `opciones_disponibles.opciones_personalizadas`
- El cálculo de precios incluye automáticamente las opciones seleccionadas
- Las imágenes se suben a Supabase Storage (bucket `muebles-imagenes`)
- El sistema es extensible: puedes agregar más tipos de opciones personalizadas en el futuro

## ⚠️ Importante

- Las opciones personalizadas **solo aparecen para muebles de categoría "Cocina"**
- Si cambias la categoría de un mueble, las opciones personalizadas se mantienen pero no se mostrarán
- Para otros tipos de muebles (closets, muebles), puedes extender el sistema de manera similar

