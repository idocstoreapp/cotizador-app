/**
 * Componente de Login simplificado y robusto
 * Versión mejorada con mejor manejo de eventos
 */
import { useState, useCallback } from 'react';
import { iniciarSesion } from '../services/auth.service';
import { loginSchema } from '../schemas/validations';
import type { LoginInput } from '../schemas/validations';

interface LoginSimpleProps {
  onLoginSuccess: () => void;
}

export default function LoginSimple({ onLoginSuccess }: LoginSimpleProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Maneja el envío del formulario de login
   */
  const handleSubmit = useCallback(async () => {
    console.log('=== INICIO DE LOGIN ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      // Validar datos con Zod
      console.log('Validando datos...');
      const datos: LoginInput = loginSchema.parse({ email, password });
      console.log('Datos validados correctamente');

      // Intentar iniciar sesión
      console.log('Intentando iniciar sesión...');
      const { sesion, error: errorLogin } = await iniciarSesion(datos);

      if (errorLogin) {
        console.error('Error de autenticación:', errorLogin);
        let mensajeError = errorLogin;
        
        if (errorLogin.includes('Invalid login credentials') || errorLogin.includes('Invalid credentials')) {
          mensajeError = 'Email o contraseña incorrectos. Verifica tus credenciales.';
        } else if (errorLogin.includes('Email not confirmed')) {
          mensajeError = 'Por favor confirma tu email antes de iniciar sesión. Revisa tu correo.';
        } else if (errorLogin.includes('User not found')) {
          mensajeError = 'Usuario no encontrado. Verifica tu email o regístrate primero.';
        }
        
        setError(mensajeError);
        setLoading(false);
        return;
      }

      // Si el login es exitoso
      if (sesion && sesion.user) {
        console.log('✓ Login exitoso para:', sesion.user.email);
        console.log('✓ Sesión establecida');
        
        // Verificar que la sesión esté guardada en localStorage
        const { supabase } = await import('../utils/supabase');
        
        // Esperar a que la sesión se guarde en localStorage
        let intentos = 0;
        let sessionVerificada = null;
        
        while (intentos < 10 && !sessionVerificada) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            sessionVerificada = session;
            break;
          }
          intentos++;
        }
        
        if (sessionVerificada) {
          console.log('✓ Sesión verificada y guardada');
          console.log('Esperando un momento antes de redirigir...');
          
          // Esperar un momento adicional para asegurar que todo esté sincronizado
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar una vez más antes de redirigir
          const { data: { session: finalCheck } } = await supabase.auth.getSession();
          if (finalCheck) {
            console.log('✓ Verificación final exitosa, redirigiendo...');
            // Usar replace para evitar que el botón "atrás" vuelva al login
            window.location.replace('/dashboard');
          } else {
            console.error('✗ La sesión se perdió en la verificación final');
            setError('Error: La sesión no se mantuvo. Intenta nuevamente.');
            setLoading(false);
          }
        } else {
          console.error('✗ La sesión no se guardó correctamente después de 2 segundos');
          setError('Error: La sesión no se guardó. Intenta nuevamente.');
          setLoading(false);
        }
      } else {
        console.error('✗ No se recibió sesión válida');
        setError('No se pudo iniciar sesión. Intenta nuevamente.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error completo en login:', err);
      let mensajeError = 'Error al iniciar sesión';
      
      if (err.errors) {
        mensajeError = err.errors.map((e: any) => e.message).join(', ');
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      setError(mensajeError);
      setLoading(false);
    }
  }, [email, password, onLoginSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Cotizaciones
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Error al iniciar sesión</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botón clickeado, ejecutando handleSubmit...');
                handleSubmit();
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

