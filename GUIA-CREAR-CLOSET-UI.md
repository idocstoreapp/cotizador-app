# 🎨 Guía: Crear Closet de Ejemplo desde la UI

## 📋 Pasos Detallados

### Paso 1: Subir las imágenes a Supabase Storage

1. **Ve a Supabase Dashboard**
   - Abre: https://app.supabase.com
   - Selecciona tu proyecto

2. **Ve a Storage**
   - En el menú lateral, haz clic en **"Storage"**
   - Si no existe el bucket `muebles-imagenes`, créalo:
     - Haz clic en **"New bucket"**
     - Nombre: `muebles-imagenes`
     - Marca **"Public bucket"** ✅
     - Haz clic en **"Create bucket"**

3. **Sube las 4 imágenes**
   - Haz clic en el bucket `muebles-imagenes`
   - Haz clic en **"Upload file"** o arrastra las imágenes
   - Sube:
     - `mueble1.png` (será para color "Marrón")
     - `mueble2.png` (será para color "Azul Rey")
     - `mueble3.png` (será para color "Gris")
     - `mueble4.png` (será para color "Beige")

4. **Obtén las URLs públicas**
   - Haz clic en cada imagen subida
   - Copia la URL pública (debería verse así):
     ```
     https://[tu-proyecto].supabase.co/storage/v1/object/public/muebles-imagenes/[nombre-archivo].png
     ```
   - **Guarda estas URLs** (las necesitarás en el siguiente paso)

### Paso 2: Crear el Closet desde la UI

1. **Abre tu aplicación**
   - Ve a **Catálogo**
   - Haz clic en el botón **"⚙️ GESTIONAR CATÁLOGO"** (en el banner)

2. **Crear nuevo mueble**
   - Haz clic en **"Crear Nuevo Mueble"**

3. **Completa el formulario básico:**
   - **Nombre:** `Closet Modular Premium`
   - **Descripción:** `Closet modular con sistema de organización inteligente. Disponible en múltiples colores y acabados.`
   - **Imagen Principal:** Sube `mueble1.png` (o usa la URL de mueble1.png)
   - **Precio Base:** `1950000`
   - **Categoría:** Selecciona `closet`

4. **Agregar medidas:**
   - **Ancho (cm):** `240`
   - **Alto (cm):** `240`
   - **Profundidad (cm):** `60`

5. **Agregar opciones de color:**
   - En la sección **"Opciones Disponibles"** → **"Colores"**
   - Agrega uno por uno (haz clic en "Agregar" después de cada uno):
     - `Marrón`
     - `Azul Rey`
     - `Gris`
     - `Beige`

6. **Agregar opciones de material:**
   - En la sección **"Materiales (Opciones)"**
   - Agrega:
     - `Melanina`
     - `Lacado Brillo`
     - `Madera Sólida`

7. **🎨 AGREGAR IMÁGENES POR VARIANTE (IMPORTANTE):**
   - Ve a la sección **"🎨 Imágenes por Variante (Vista Previa Dinámica)"**
   - Para cada variante:
     
     **Variante 1 - Marrón:**
     - Haz clic en **"Agregar nueva imagen por variante"**
     - Selecciona `mueble1.png` (o pega la URL de mueble1.png)
     - Cuando te pregunte el color, escribe: `Marrón`
     - Cuando te pregunte el material, deja vacío (presiona Enter)
     - Cuando te pregunte la encimera, deja vacío (presiona Enter)
     
     **Variante 2 - Azul Rey:**
     - Haz clic en **"Agregar nueva imagen por variante"**
     - Selecciona `mueble2.png` (o pega la URL)
     - Color: `Azul Rey`
     - Material: (vacío)
     - Encimera: (vacío)
     
     **Variante 3 - Gris:**
     - Haz clic en **"Agregar nueva imagen por variante"**
     - Selecciona `mueble3.png` (o pega la URL)
     - Color: `Gris`
     - Material: (vacío)
     - Encimera: (vacío)
     
     **Variante 4 - Beige:**
     - Haz clic en **"Agregar nueva imagen por variante"**
     - Selecciona `mueble4.png` (o pega la URL)
     - Color: `Beige`
     - Material: (vacío)
     - Encimera: (vacío)

8. **Configuración de fabricación:**
   - **Días de Fabricación:** `15`
   - **Horas de Mano de Obra:** `24`
   - **Margen de Ganancia (%):** `30`

9. **Guardar:**
   - Haz clic en **"Crear Mueble"**
   - Deberías ver un mensaje de éxito: "Mueble creado exitosamente"

### Paso 3: Verificar

1. **Ve al Catálogo**
   - Deberías ver el "Closet Modular Premium" en la lista

2. **Prueba la vista previa dinámica:**
   - Haz clic en el Closet
   - Deberías ver:
     - ✅ Imagen grande a la izquierda
     - ✅ Thumbnails de las 4 variantes debajo
     - ✅ Opciones de color a la derecha
   - **Prueba cambiar el color:**
     - Haz clic en los círculos de color o selecciona del dropdown
     - La imagen principal debería cambiar automáticamente
     - El thumbnail correspondiente debería estar resaltado

## ✅ Checklist Final

- [ ] Las 4 imágenes están subidas a Supabase Storage
- [ ] El Closet aparece en el catálogo
- [ ] Tiene 4 opciones de color (Marrón, Azul Rey, Gris, Beige)
- [ ] Al seleccionar cada color, la imagen cambia correctamente
- [ ] Los thumbnails se muestran debajo de la imagen principal
- [ ] Al hacer clic en un thumbnail, cambia el color y la imagen

## 🆘 Problemas Comunes

### Las imágenes no cambian al seleccionar el color
- Verifica que los nombres de los colores coincidan exactamente (mayúsculas/minúsculas)
- Verifica que las imágenes se subieron correctamente a Storage
- Revisa la consola del navegador (F12) para ver errores

### No veo los thumbnails
- Asegúrate de haber agregado las imágenes en la sección "Imágenes por Variante"
- Verifica que cada imagen tenga asociado un color

### Error al subir imágenes
- Verifica que el bucket `muebles-imagenes` existe y es público
- Verifica que las imágenes sean JPG, PNG o WEBP y menores a 5MB

