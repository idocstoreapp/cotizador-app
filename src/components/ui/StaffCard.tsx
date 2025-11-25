/**
 * Tarjeta de vendedor para la sección de gestión de personal
 */
interface Vendedor {
  id: string;
  nombre: string;
  foto?: string;
  sucursal: string;
  cotizaciones: number;
}

interface StaffCardProps {
  vendedor: Vendedor;
  onVerPerfil: (id: string) => void;
}

export default function StaffCard({ vendedor, onVerPerfil }: StaffCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow relative">
      {/* Icono de persona en la esquina */}
      <div className="absolute top-4 right-4">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>

      {/* Foto del vendedor */}
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-100">
          {vendedor.foto ? (
            <img
              src={vendedor.foto}
              alt={vendedor.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-100">
              <span className="text-2xl font-bold text-indigo-600">
                {vendedor.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Información */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {vendedor.nombre}
        </h3>
        <p className="text-sm text-gray-600 mb-1">
          {vendedor.sucursal}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Cotizaciones: <span className="font-medium text-indigo-600">{vendedor.cotizaciones}</span>
        </p>

        {/* Botón */}
        <button
          onClick={() => onVerPerfil(vendedor.id)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Ver Perfil
        </button>
      </div>
    </div>
  );
}


