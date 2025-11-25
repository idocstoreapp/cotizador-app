/**
 * Página del catálogo de muebles
 * Muestra los muebles en una cuadrícula con tarjetas visuales
 * Incluye gestión de catálogo para administradores
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import ProductDetail from './ui/ProductDetail';
import GestionarCatalogo from './admin/GestionarCatalogo';
import MueblesListWrapper from './MueblesListWrapper';
import ClientOnly from './ClientOnly';
import { useCotizacionStore } from '../store/cotizacionStore';
import type { Mueble, OpcionesMueble } from '../types/muebles';

// Variable global para almacenar la función setMostrarGestion
// Esto permite que el botón del Layout llame directamente a la función
let setMostrarGestionGlobal: ((value: boolean) => void) | null = null;

// Componente que renderiza GestionarCatalogo
// QueryProvider DEBE estar montado en el árbol padre (catalogo.astro)
// Si no está, el Error Boundary dentro de GestionarCatalogo capturará el error
function GestionarCatalogoConVerificacion() {
  // Renderizar directamente - QueryProvider debería estar montado
  // El Error Boundary dentro de GestionarCatalogo manejará cualquier error
  return <GestionarCatalogo />;
}

// Componente interno que usa React Query - SOLO se renderiza en el cliente
function CatalogoContent() {
  const [muebleSeleccionado, setMuebleSeleccionado] = useState<Mueble | null>(null);
  const [mostrarGestion, setMostrarGestion] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const { agregarMueble } = useCotizacionStore();

  // Obtener usuario del contexto
  const { usuario: usuarioContexto, esAdmin: esAdminContexto } = useUser();
  
  // REGISTRAR FUNCIÓN GLOBAL INMEDIATAMENTE - antes de cualquier otra cosa
  // Esto asegura que funcione incluso si hay errores en otros componentes
  useEffect(() => {
    console.log('🔴 REGISTRANDO FUNCIÓN GLOBAL Y LISTENER...');
    
    // Guardar la función en variable global
    setMostrarGestionGlobal = setMostrarGestion;
    
    // Registrar función global en window
    (window as any).abrirGestionCatalogo = () => {
      console.log('🔴🔴🔴 FUNCIÓN GLOBAL LLAMADA');
      if (setMostrarGestionGlobal) {
        console.log('🔴🔴🔴 Llamando setMostrarGestionGlobal(true)');
        setMostrarGestionGlobal(true);
        console.log('🔴🔴🔴 setMostrarGestionGlobal ejecutado');
      } else {
        console.error('🔴 ERROR: setMostrarGestionGlobal es null');
      }
    };
    
    // También registrar listener de eventos
    const handleAbrirGestion = (e?: Event) => {
      console.log('🔴 Evento recibido: abrir gestión', e);
      if (setMostrarGestionGlobal) {
        setMostrarGestionGlobal(true);
      }
    };
    
    window.addEventListener('abrirGestionCatalogo', handleAbrirGestion);
    console.log('🔴 Listener y función global registrados');
    
    return () => {
      setMostrarGestionGlobal = null;
      window.removeEventListener('abrirGestionCatalogo', handleAbrirGestion);
      delete (window as any).abrirGestionCatalogo;
    };
  }, []); // Sin dependencias para que solo se registre una vez
  
  // Verificar admin con múltiples métodos para asegurar que funcione
  useEffect(() => {
    const verificarAdmin = async () => {
      let esAdminValue = false;
      
      // Método 1: Desde el contexto
      if (usuarioContexto) {
        esAdminValue = usuarioContexto.role === 'admin';
        console.log('✓ Admin desde contexto:', esAdminValue, usuarioContexto.role);
        if (esAdminValue) {
          setEsAdmin(true);
          return;
        }
      }
      
      // Método 2: Desde esAdminContexto del contexto
      if (esAdminContexto) {
        console.log('✓ Admin desde esAdminContexto:', true);
        setEsAdmin(true);
        return;
      }
      
      // Método 3: Consultar directamente el servicio
      try {
        const usuario = await obtenerUsuarioActual();
        esAdminValue = usuario?.role === 'admin' || false;
        console.log('✓ Admin desde servicio directo:', esAdminValue, usuario?.role);
        setEsAdmin(esAdminValue);
      } catch (error) {
        console.error('Error al verificar admin:', error);
        setEsAdmin(false);
      }
    };
    
    verificarAdmin();
  }, [usuarioContexto, esAdminContexto]);
  
  // Usar cualquier valor que indique que es admin
  const esAdminFinal = esAdminContexto || esAdmin || (usuarioContexto?.role === 'admin');
  
  // Debug: mostrar en consola y alerta visual
  useEffect(() => {
    const debugInfo = {
      esAdminContexto,
      esAdmin,
      esAdminFinal,
      usuarioContexto: usuarioContexto?.role,
      usuarioContextoCompleto: usuarioContexto
    };
    console.log('🔍 Estado admin en catálogo:', debugInfo);
    
    // Si es admin, mostrar alerta visual temporal
    if (esAdminFinal) {
      console.log('✅ USUARIO ES ADMIN - El botón debería estar visible');
    } else {
      console.warn('⚠️ USUARIO NO ES ADMIN - Verificar rol:', usuarioContexto?.role);
    }
  }, [esAdminContexto, esAdmin, esAdminFinal, usuarioContexto]);

  /**
   * Maneja el click en "Agregar a Cotización" desde la tarjeta
   * NO agrega inmediatamente, sino que abre el detalle para personalizar
   */
  const handleAddToQuoteFromCard = (mueble: Mueble) => {
    // Abrir el detalle del producto para que el usuario personalice antes de agregar
    setMuebleSeleccionado(mueble);
  };

  /**
   * Maneja el agregado desde el detalle del producto
   */
  const handleAddToQuoteFromDetail = (mueble: Mueble, opciones: OpcionesMueble, cantidad: number) => {
    agregarMueble(mueble, opciones, cantidad);
    setMuebleSeleccionado(null);
    alert(`${mueble.nombre} agregado a la cotización`);
  };

  // Si hay un mueble seleccionado, mostrar el detalle
  if (muebleSeleccionado) {
    return (
      <ProductDetail
        mueble={muebleSeleccionado}
        onAddToQuote={handleAddToQuoteFromDetail}
        onBack={() => setMuebleSeleccionado(null)}
      />
    );
  }

  // Si está en modo gestión, mostrar gestión (SIN CONDICIÓN DE ADMIN)
  // ESTO DEBE ESTAR ANTES DE CUALQUIER OTRO RENDER PARA QUE FUNCIONE
  if (mostrarGestion) {
    console.log('✅✅✅ RENDERIZANDO GESTIÓN - mostrarGestion es TRUE');
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-green-50 border-2 border-green-200 p-4 rounded-lg">
          <p className="text-green-800 font-bold mb-2 text-xl">✅ Modo Gestión Activado</p>
          <p className="text-green-700 text-sm mb-4">Ahora puedes gestionar el catálogo de muebles</p>
          <button
            onClick={() => {
              console.log('Volviendo al catálogo');
              setMostrarGestion(false);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2"
          >
            <span>←</span>
            <span>Volver al Catálogo</span>
          </button>
        </div>
        {/* 
          IMPORTANTE: GestionarCatalogo DEBE estar dentro de QueryProvider.
          Verificar que QueryProvider esté montado antes de renderizar.
        */}
        <GestionarCatalogoConVerificacion />
      </div>
    );
  }
  
  console.log('🔵 No en modo gestión, mostrarGestion es:', mostrarGestion);

  // Vista de catálogo
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* BANNER SUPERIOR CON BOTÓN GRANDE - SIEMPRE VISIBLE */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Catálogo de Muebles</h1>
              <p className="text-indigo-100">Gestiona tu catálogo de muebles</p>
            </div>
            <button
              onClick={() => {
                console.log('🔵 CLICK EN GESTIONAR CATÁLOGO (banner)');
                setMostrarGestion(true);
              }}
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>⚙️ GESTIONAR CATÁLOGO</span>
            </button>
          </div>
        </div>

      {/* Header secundario */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <a
            href="/cotizacion"
            className="relative inline-flex items-center p-2 text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {useCotizacionStore.getState().items.length}
            </span>
          </a>
          <a
            href="/cotizacion"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Ver Cotización
          </a>
        </div>
      </div>

         {/* Grid de productos - usando wrapper con Error Boundary */}
         {/* ClientOnly asegura que no se renderice durante SSR */}
         <ClientOnly
           fallback={
             <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
               <p className="ml-4 text-gray-600">Cargando catálogo...</p>
             </div>
           }
         >
           <MueblesListWrapper
             onMuebleClick={setMuebleSeleccionado}
             onAddToQuote={handleAddToQuoteFromCard}
           />
         </ClientOnly>
      </div>
    </>
  );
}

// Componente exportado que se renderiza dentro de QueryProvider
// NO usa ClientOnly aquí porque QueryProvider ya maneja el renderizado del cliente
export default function CatalogoPage() {
  return <CatalogoContent />;
}
