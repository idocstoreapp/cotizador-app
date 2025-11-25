/**
 * Wrapper para la página de autenticación
 * Renderiza Login y Registro con el QueryProvider incluido
 */
import { useState } from 'react';
import LoginSimple from './LoginSimple';
import Registro from './Registro';
import QueryProvider from './QueryProvider';

export default function AuthWrapper() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const handleLoginSuccess = async () => {
    // Esta función ya no se usa porque LoginSimple redirige directamente
    // Pero la mantenemos por compatibilidad
    console.log('handleLoginSuccess llamado (pero LoginSimple redirige directamente)');
  };

  const handleRegistroSuccess = () => {
    console.log('Registro exitoso, redirigiendo...');
    window.location.href = '/dashboard';
  };

  return (
    <QueryProvider>
      {mostrarRegistro ? (
        <Registro
          onRegistroSuccess={handleRegistroSuccess}
          onCancel={() => setMostrarRegistro(false)}
        />
      ) : (
        <div className="min-h-screen">
          <LoginSimple onLoginSuccess={handleLoginSuccess} />
          <div className="text-center mt-6 mb-8 -mt-8">
            <p className="text-gray-600 mb-2">¿No tienes cuenta?</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cambiando a registro...');
                setMostrarRegistro(true);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline text-lg"
            >
              Regístrate aquí
            </button>
          </div>
        </div>
      )}
    </QueryProvider>
  );
}

