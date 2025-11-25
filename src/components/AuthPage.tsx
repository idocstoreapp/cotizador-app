/**
 * Componente de página de autenticación
 * Maneja el toggle entre login y registro
 */
import { useState } from 'react';
import Login from './Login';
import Registro from './Registro';

export default function AuthPage() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const handleLoginSuccess = () => {
    console.log('Redirigiendo a dashboard...');
    // Forzar recarga completa para asegurar que la sesión se cargue
    window.location.href = '/dashboard';
  };

  const handleRegistroSuccess = () => {
    window.location.href = '/dashboard';
  };

  if (mostrarRegistro) {
    return (
      <Registro
        onRegistroSuccess={handleRegistroSuccess}
        onCancel={() => setMostrarRegistro(false)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Login onLoginSuccess={handleLoginSuccess} />
      <div className="text-center mt-6 mb-8">
        <p className="text-gray-600 mb-2">¿No tienes cuenta?</p>
        <button
          type="button"
          onClick={() => {
            console.log('Cambiando a registro...');
            setMostrarRegistro(true);
          }}
          className="text-indigo-600 hover:text-indigo-800 font-medium underline"
        >
          Regístrate aquí
        </button>
      </div>
    </div>
  );
}


