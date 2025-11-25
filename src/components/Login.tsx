/**
 * Componente de Login
 * Permite a los usuarios iniciar sesión con email y contraseña
 */
import { useState } from 'react';
import { iniciarSesion } from '../services/auth.service';
import { loginSchema } from '../schemas/validations';
import type { LoginInput } from '../schemas/validations';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Estado del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Maneja el envío del formulario de login
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Prevenir comportamiento por defecto del formulario
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Formulario enviado - Email:', email);
    setError(null);
    setLoading(true);

    try {
      console.log('Validando datos...');
      // Validar datos con Zod
      const datos: LoginInput = loginSchema.parse({ email, password });
      console.log('Datos validados, intentando login...');

      // Intentar iniciar sesión
      const { sesion, error: errorLogin } = await iniciarSesion(datos);

      if (errorLogin) {
        console.error('Error de login:', errorLogin);
        // Mostrar error específico
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

      // Si el login es exitoso, esperar un momento y luego redirigir
      if (sesion && sesion.user) {
        console.log('Login exitoso, redirigiendo...', sesion.user.email);
        // Esperar un momento para que la sesión se establezca
        await new Promise(resolve => setTimeout(resolve, 500));
        onLoginSuccess();
      } else {
        console.error('No se recibió sesión válida');
        setError('No se pudo iniciar sesión. Intenta nuevamente.');
        setLoading(false);
      }
    } catch (err: any) {
      // Error de validación o de login
      console.error('Error en login:', err);
      let mensajeError = 'Error al iniciar sesión';
      
      if (err.errors) {
        // Error de validación Zod
        mensajeError = err.errors.map((e: any) => e.message).join(', ');
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      setError(mensajeError);
      setLoading(false);
    }
  };

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
        <form 
          className="mt-8 space-y-6" 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
          noValidate
        >
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


