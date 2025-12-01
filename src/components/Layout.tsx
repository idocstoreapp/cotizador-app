/**
 * Layout principal con sidebar y topbar moderno
 */
import { useState, useEffect, useCallback } from 'react';
import { cerrarSesion, obtenerUsuarioActual } from '../services/auth.service';
import { supabase } from '../utils/supabase';
import { useCotizacionStore } from '../store/cotizacionStore';
import { UserProvider } from '../contexts/UserContext';
import type { UserProfile } from '../types/database';

interface LayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

export default function Layout({ children, currentPath }: LayoutProps) {
  const [usuario, setUsuario] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const itemsCotizacion = useCotizacionStore(state => state.items);

  /**
   * Obtiene el usuario autenticado
   * OPTIMIZADO: Usa onAuthStateChange como fuente principal, esta función es solo un fallback
   */
  const cargarUsuario = useCallback(async () => {
    console.log('=== cargarUsuario() llamado (fallback) ===');
    try {
      setLoading(true);
      
      // Intentar obtener sesión con timeout más largo (5s)
      console.log('Obteniendo sesión de Supabase (con timeout de 5s)...');
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: getSession() tardó más de 5 segundos')), 5000)
      );
      
      let sessionResult;
      try {
        sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('❌ Timeout al obtener sesión:', timeoutError);
        console.log('Esperando a que onAuthStateChange maneje la sesión...');
        // No hacer nada, dejar que onAuthStateChange maneje esto
        setLoading(false);
        return;
      }
      
      const { data: { session }, error: sessionError } = sessionResult as any;
      
      console.log('Resultado de getSession():', {
        tieneSession: !!session,
        sessionError: sessionError,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      if (sessionError) {
        console.error('Error al obtener sesión:', sessionError);
        setLoading(false);
        return;
      }
      
      if (!session || !session.user) {
        // No hay sesión, detener loading
        console.log('✗ No hay sesión activa');
        setUsuario(null);
        setLoading(false);
        setVerificandoSesion(false);
        return;
      }
      
      console.log('✓ Sesión encontrada:', session.user.email);
      console.log('Usuario ID:', session.user.id);
      
      // Crear perfil temporal primero para mostrar algo rápido
      const perfilTemporal: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        nombre: session.user.email?.split('@')[0] || 'Usuario',
        role: 'tecnico',
        created_at: new Date().toISOString()
      };
      setUsuario(perfilTemporal);
      setLoading(false);
      setVerificandoSesion(false);
      
      // Obtener perfil real en background
      console.log('Obteniendo perfil de la base de datos...');
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      console.log('Resultado de consulta de perfil:', {
        tienePerfil: !!perfil,
        perfilError: perfilError,
        perfilNombre: perfil?.nombre
      });
      
      if (perfil && !perfilError) {
        console.log('✓ Perfil encontrado:', perfil.nombre, '- Rol:', perfil.role);
        setUsuario(perfil as UserProfile);
      } else {
        console.log('⚠️ Manteniendo perfil temporal');
      }
    } catch (error) {
      console.error('❌ Error completo en cargarUsuario:', error);
      setLoading(false);
      setVerificandoSesion(false);
    }
  }, []);

  /**
   * Carga el usuario actual al montar el componente
   * OPTIMIZADO: Usa onAuthStateChange como fuente principal de verdad
   */
  useEffect(() => {
    let mounted = true;
    
    // Listener para cambios en tiempo real (más confiable y rápido)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (session?.user) {
        // Crear perfil temporal inmediatamente
        const perfilTemporal: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          nombre: session.user.email?.split('@')[0] || 'Usuario',
          role: 'tecnico',
          created_at: new Date().toISOString()
        };
        setUsuario(perfilTemporal);
        setLoading(false);
        setVerificandoSesion(false);

        // Consultar perfil real en background (sin bloquear)
        supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: perfil, error }) => {
            if (!mounted) return;
            
            if (perfil && !error) {
              setUsuario(perfil as UserProfile);
            }
            // Si hay error, mantener el perfil temporal
          })
          .catch(() => {
            // Mantener perfil temporal si falla
          });
      } else {
        // No hay sesión
        setUsuario(null);
        setLoading(false);
        setVerificandoSesion(false);
        
        // Solo redirigir si estamos en una ruta protegida
        if (currentPath && currentPath !== '/' && currentPath !== '/index') {
          setTimeout(() => {
            if (mounted) {
              // Guardar la URL de destino para redirigir después del login
              const currentUrl = window.location.pathname;
              localStorage.setItem('redirectAfterLogin', currentUrl);
              // Redirigir al login con el parámetro redirect
              window.location.href = `/?redirect=${encodeURIComponent(currentUrl)}`;
            }
          }, 500);
        }
      }
    });

    // También intentar obtener sesión inicial INMEDIATAMENTE (no bloquear)
    // Esto es crítico para que el usuario se cargue rápido
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      console.log('🔍 getSession() inicial:', { tieneSession: !!session, error, email: session?.user?.email });
      
      if (session?.user) {
        // Si hay sesión, crear perfil temporal inmediatamente
        const perfilTemporal: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          nombre: session.user.email?.split('@')[0] || 'Usuario',
          role: 'tecnico',
          created_at: new Date().toISOString()
        };
        console.log('✓ Usuario temporal creado desde getSession():', perfilTemporal.email);
        setUsuario(perfilTemporal);
        setLoading(false);
        setVerificandoSesion(false);

        // Consultar perfil real en background
        supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: perfil, error: perfilError }) => {
            if (!mounted) return;
            
            if (perfil && !perfilError) {
              console.log('✓ Perfil real cargado desde getSession():', perfil.email, perfil.role);
              setUsuario(perfil as UserProfile);
            } else {
              console.warn('⚠️ No se pudo cargar perfil real desde getSession(), usando temporal:', perfilError);
            }
          })
          .catch((err) => {
            console.error('Error al cargar perfil desde getSession():', err);
            // Mantener perfil temporal si falla
          });
      } else {
        // No hay sesión
        console.log('✗ No hay sesión activa en getSession() inicial');
        setUsuario(null);
        setLoading(false);
        setVerificandoSesion(false);
      }
    }).catch((err) => {
      console.error('❌ Error en getSession() inicial:', err);
      if (mounted) {
        setUsuario(null);
        setLoading(false);
        setVerificandoSesion(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [currentPath]);


  /**
   * Maneja el cierre de sesión
   */
  async function handleLogout() {
    try {
      await cerrarSesion();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // NO verificar sesión aquí - ya se hace en cargarUsuario y onAuthStateChange
  // Esto estaba causando verificaciones duplicadas

  // Si está cargando, mostrar loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está verificando sesión, mostrar loading
  if (verificandoSesion && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario
  if (!usuario) {
    // Si estamos en login, mostrar children
    if (!currentPath || currentPath === '/' || currentPath === '/index') {
      return <>{children}</>;
    }
    
    // Si estamos en una ruta protegida y ya verificamos, mostrar mensaje
    if (!verificandoSesion && !loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No estás autenticado</p>
            <a href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Ir al Login
            </a>
          </div>
        </div>
      );
    }
    
    // Aún verificando o cargando - mostrar loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // A partir de aquí, usuario está garantizado que no es null
  console.log('✅ Layout renderizando con usuario:', usuario.email, usuario.role);

  const esAdmin = usuario.role === 'admin';

  // Items del menú según el rol
      // Menú según rol
      const esVendedor = usuario.role === 'vendedor';
      
      const menuItems = esAdmin
        ? [
            { path: '/dashboard', label: 'Dashboard', icon: '📊' },
            { path: '/catalogo', label: 'Catálogo', icon: '📚' },
            { path: '/cotizacion', label: 'Cotización', icon: '📝' },
            { path: '/cotizaciones', label: 'Historial', icon: '📋' },
            { path: '/clientes', label: 'Clientes', icon: '👤' },
            { path: '/admin/precios', label: 'Precios', icon: '💰' },
            { path: '/admin/personal', label: 'Gestión de Personal', icon: '👥' },
            { path: '/liquidaciones', label: 'Liquidaciones', icon: '💵' },
            { path: '/gastos-fijos', label: 'Gastos Fijos', icon: '💳' }
          ]
        : esVendedor
        ? [
            // Vendedores solo pueden cotizar
            { path: '/catalogo', label: 'Catálogo', icon: '📚' },
            { path: '/cotizacion', label: 'Cotización', icon: '📝' },
            { path: '/cotizaciones', label: 'Mis Cotizaciones', icon: '📋' }
          ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/catalogo', label: 'Catálogo', icon: '📚' },
        { path: '/cotizacion', label: 'Cotización', icon: '📝' },
        { path: '/cotizaciones', label: 'Historial', icon: '📋' }
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            {sidebarOpen && (
              <h1 className="text-lg font-bold text-gray-900">Sistema de Cotizaciones</h1>
            )}
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === item.path
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Toggle sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {sidebarOpen && <span>Ocultar</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.path === currentPath)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {/* Carrito */}
              <a
                href="/cotizacion"
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemsCotizacion.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemsCotizacion.length}
                  </span>
                )}
              </a>

              {/* Usuario */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {usuario.nombre || usuario.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{usuario.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {(usuario.nombre || usuario.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
            <main className="flex-1 p-6 overflow-y-auto">
              <UserProvider usuario={usuario}>
                {children}
              </UserProvider>
            </main>
      </div>
    </div>
  );
}
