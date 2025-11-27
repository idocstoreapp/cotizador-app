/**
 * Página de gestión de vendedores
 * Redirige a la página de gestión de personal
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VendedoresPage() {
  // Esta página ahora redirige a la gestión de personal
  // Mantenemos el componente por compatibilidad con rutas existentes
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <p className="text-gray-600">Esta página ha sido movida a "Gestión de Personal"</p>
        <p className="text-sm text-gray-500 mt-2">
          Por favor, usa el menú de navegación para acceder a la gestión de personal
        </p>
      </div>
    </div>
  );
}


