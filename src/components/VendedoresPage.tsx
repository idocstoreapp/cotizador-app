/**
 * Página de gestión de vendedores
 * Muestra tarjetas de vendedores con información y estadísticas
 */
import StaffCard from './ui/StaffCard';

// Datos de ejemplo (en producción vendrían de la API)
const vendedores = [
  {
    id: '1',
    nombre: 'Juan Pérez',
    foto: 'https://i.pravatar.cc/150?img=12',
    sucursal: 'Sucursal Centro',
    cotizaciones: 125
  },
  {
    id: '2',
    nombre: 'Ana García',
    foto: 'https://i.pravatar.cc/150?img=47',
    sucursal: 'Sucursal Centro',
    cotizaciones: 98
  },
  {
    id: '3',
    nombre: 'Carlos Ruíz',
    foto: 'https://i.pravatar.cc/150?img=33',
    sucursal: 'Sucursal Centro',
    cotizaciones: 98
  },
  {
    id: '4',
    nombre: 'Carlos Ruíz',
    foto: 'https://i.pravatar.cc/150?img=33',
    sucursal: 'Sucursal Centro',
    cotizaciones: 74
  }
];

export default function VendedoresPage() {
  /**
   * Maneja el click en "Ver Perfil"
   */
  const handleVerPerfil = (id: string) => {
    // En producción, esto navegaría a la página de perfil del vendedor
    console.log('Ver perfil de vendedor:', id);
    alert(`Ver perfil del vendedor ${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión & Personal y Taller</h1>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Vendedor
        </button>
      </div>

      {/* Sección de Vendedores */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendedores</h2>
        <p className="text-sm text-gray-600 mb-6">Lista del equipo comercial</p>

        {/* Grid de tarjetas de vendedores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vendedores.map((vendedor) => (
            <StaffCard
              key={vendedor.id}
              vendedor={vendedor}
              onVerPerfil={handleVerPerfil}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


