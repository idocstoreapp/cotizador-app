# 🔗 Integración Directa: Mostrar Catálogo Dentro de tu Web

## 🎯 Dos Opciones Disponibles

### Opción 1: Iframe Embebido (MÁS SIMPLE) ⭐ RECOMENDADO

La forma más fácil es usar un iframe que muestre tu catálogo directamente.

#### Componente React para Iframe:

```tsx
// src/components/CatalogoCocinasEmbebido.tsx
interface CatalogoCocinasEmbebidoProps {
  urlCotizador?: string;
  altura?: string;
  className?: string;
}

export default function CatalogoCocinasEmbebido({
  urlCotizador = 'https://cotizador-app-two.vercel.app/cocinas-publico',
  altura = '800px',
  className = ''
}: CatalogoCocinasEmbebidoProps) {
  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-lg ${className}`}>
      <iframe
        src={urlCotizador}
        width="100%"
        height={altura}
        frameBorder="0"
        className="border-0"
        title="Catálogo de Cocinas"
        allowFullScreen
        style={{ minHeight: altura }}
      />
    </div>
  );
}
```

#### Uso en Astro:

```astro
---
// src/pages/cocinas.astro
import Layout from '../components/Layout.astro';
import CatalogoCocinasEmbebido from '../components/CatalogoCocinasEmbebido';
---

<Layout title="Cocinas">
  <main className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Nuestras Cocinas</h1>
    
    <CatalogoCocinasEmbebido 
      client:load
      urlCotizador="https://cotizador-app-two.vercel.app/cocinas-publico"
      altura="900px"
    />
  </main>
</Layout>
```

**Ventajas:**
- ✅ Muy fácil de implementar
- ✅ No requiere configurar Supabase en tu otra web
- ✅ Funciona inmediatamente
- ✅ Se actualiza automáticamente cuando actualizas el catálogo

**Desventajas:**
- ⚠️ Puede tener problemas de scroll en móvil
- ⚠️ No puedes personalizar completamente el diseño

---

### Opción 2: Componentes React Directos (MÁS CONTROL)

Si quieres más control y personalización, puedes copiar los componentes React directamente.

#### Requisitos Previos:

1. **Configurar Supabase en tu otra web:**
   - Crea un archivo `.env` con:
     ```env
     PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
     ```

2. **Instalar dependencias:**
   ```bash
   npm install @tanstack/react-query @supabase/supabase-js
   ```

#### Componente Principal:

```tsx
// src/components/CatalogoCocinasDirecto.tsx
import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

// Configurar Supabase
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan las variables de entorno de Supabase');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
});

// Función para obtener cocinas
async function obtenerCocinas() {
  const { data, error } = await supabase
    .from('muebles')
    .select('*')
    .eq('categoria', 'cocina')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Componente de contenido
function CatalogoCocinasDirectoContent() {
  const [cocinaSeleccionada, setCocinaSeleccionada] = useState<any>(null);

  const { data: cocinas = [], isLoading } = useQuery({
    queryKey: ['cocinas-publico'],
    queryFn: obtenerCocinas
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (cocinaSeleccionada) {
    return (
      <div>
        <button
          onClick={() => setCocinaSeleccionada(null)}
          className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          ← Volver al catálogo
        </button>
        {/* Aquí puedes mostrar el detalle de la cocina */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{cocinaSeleccionada.nombre}</h2>
          <img
            src={cocinaSeleccionada.imagen}
            alt={cocinaSeleccionada.nombre}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
          <p className="text-gray-700 mb-4">{cocinaSeleccionada.descripcion}</p>
          <p className="text-2xl font-bold text-indigo-600">
            ${cocinaSeleccionada.precio_base?.toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Cocinas</h1>
        <p className="text-gray-600">Explora nuestras opciones y cotiza la tuya</p>
      </header>

      {cocinas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay cocinas disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cocinas.map((cocina) => (
            <div
              key={cocina.id}
              onClick={() => setCocinaSeleccionada(cocina)}
              className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={cocina.imagen}
                  alt={cocina.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(cocina.nombre);
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cocina.nombre}</h3>
                {cocina.descripcion && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cocina.descripcion}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-indigo-600">
                    ${cocina.precio_base?.toLocaleString('es-CO')}
                  </span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente wrapper con QueryProvider
export default function CatalogoCocinasDirecto() {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogoCocinasDirectoContent />
    </QueryClientProvider>
  );
}
```

#### Uso en Astro:

```astro
---
// src/pages/cocinas.astro
import Layout from '../components/Layout.astro';
import CatalogoCocinasDirecto from '../components/CatalogoCocinasDirecto';
---

<Layout title="Cocinas">
  <main className="container mx-auto px-4 py-8">
    <CatalogoCocinasDirecto client:load />
  </main>
</Layout>
```

**Ventajas:**
- ✅ Control total sobre el diseño
- ✅ Puedes personalizar completamente
- ✅ Mejor rendimiento (no iframe)
- ✅ Mejor experiencia en móvil

**Desventajas:**
- ⚠️ Requiere configurar Supabase
- ⚠️ Más complejo de implementar
- ⚠️ Necesitas mantener los componentes actualizados

---

## 🎯 Recomendación

**Usa la Opción 1 (Iframe)** si:
- Quieres algo rápido y fácil
- No necesitas personalización extrema
- Prefieres que se actualice automáticamente

**Usa la Opción 2 (Componentes Directos)** si:
- Necesitas control total del diseño
- Quieres integrarlo perfectamente con tu diseño
- No te importa configurar Supabase

---

## 📝 Prompt para Cursor (Opción 1 - Iframe)

```
Crea un componente React en src/components/CatalogoCocinasEmbebido.tsx que muestre un iframe embebido con el catálogo de cocinas.

URL: https://cotizador-app-two.vercel.app/cocinas-publico

El componente debe:
- Recibir props: urlCotizador (opcional), altura (opcional, default: "800px"), className (opcional)
- Mostrar un iframe responsive
- Tener diseño moderno con sombras y bordes redondeados
- Funcionar con Astro usando client:load

Dame el código completo con TypeScript.
```

---

## 📝 Prompt para Cursor (Opción 2 - Componentes Directos)

```
Crea un componente React completo para mostrar un catálogo de cocinas desde Supabase.

Requisitos:
1. Componente: CatalogoCocinasDirecto.tsx en src/components/
2. Usar @tanstack/react-query para obtener datos
3. Conectar a Supabase usando variables de entorno:
   - PUBLIC_SUPABASE_URL
   - PUBLIC_SUPABASE_ANON_KEY
4. Obtener muebles donde categoria = 'cocina'
5. Mostrar grid de cards con imagen, nombre, descripción y precio
6. Al hacer click, mostrar detalle de la cocina
7. Incluir QueryClientProvider
8. Diseño moderno con Tailwind CSS
9. Responsive
10. Funcionar con Astro usando client:load

Dame el código completo con TypeScript.
```

---

## ✅ Checklist

### Para Iframe:
- [ ] Componente creado
- [ ] URL configurada correctamente
- [ ] Probado en página Astro
- [ ] Responsive funciona

### Para Componentes Directos:
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Componente creado
- [ ] Conexión a Supabase funciona
- [ ] Probado en página Astro
- [ ] Responsive funciona

