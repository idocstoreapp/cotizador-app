# ⚡ Instrucciones Rápidas - Integración en Astro

## 🎯 Opción Más Rápida (5 minutos)

### 1. Copia el Componente

Copia el archivo `COMPONENTE-PARA-COPIAR.tsx` a tu otra página web:
- Ruta: `src/components/CotizadorCocinas.tsx`
- Reemplaza la URL por defecto con tu URL real

### 2. Úsalo en Cualquier Página

```astro
---
// src/pages/cualquier-pagina.astro
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<CotizadorCocinas 
  client:load
  urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
  estilo="banner"
/>
```

### 3. Listo! ✅

---

## 📝 O Usa el Prompt en Cursor

Copia el prompt de `PROMPT-FINAL-CURSOR.md` y pégaselo a Cursor en tu otra página web.

---

## 🎨 Estilos Disponibles

- `estilo="boton"` - Botón simple
- `estilo="banner"` - Banner completo (recomendado)
- `estilo="card"` - Card con imagen
- `estilo="flotante"` - Botón flotante en esquina

---

## 🔗 URL a Configurar

Reemplaza en el componente o en el uso:
```
https://tu-dominio-cotizador.com/cocinas-publico
```

Por tu URL real del cotizador.

---

## ✅ Checklist

- [ ] Componente copiado a `src/components/CotizadorCocinas.tsx`
- [ ] URL actualizada con tu dominio real
- [ ] Probado en una página Astro
- [ ] Funciona correctamente
- [ ] Responsive en móvil y desktop

---

## 🆘 Si Algo No Funciona

1. Verifica que React esté configurado en Astro
2. Verifica que uses `client:load` en el componente
3. Revisa la consola del navegador por errores
4. Verifica que la URL del catálogo sea correcta y accesible

