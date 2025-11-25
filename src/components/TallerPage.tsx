/**
 * Página de gestión de empleados del taller
 * Muestra tabla con empleados, estados y asignaciones
 */
import StaffTable from './ui/StaffTable';

// Datos de ejemplo (en producción vendrían de la API)
const empleados = [
  {
    id: '1',
    nombre: 'Pedro Ramírez',
    foto: undefined,
    cargo: 'Carpintero',
    estado: 'ocupado' as const,
    trabajo_asignado: 'Ocupado',
    orden_asignada: 'Orden #2024-005'
  },
  {
    id: '2',
    nombre: 'Sofia Mendoza',
    foto: 'https://i.pravatar.cc/150?img=45',
    cargo: 'Acabados',
    estado: 'disponible' as const,
    trabajo_asignado: 'Disponible',
    orden_asignada: 'Orden #2024-006'
  },
  {
    id: '3',
    nombre: 'Sofia Mendoza',
    foto: 'https://i.pravatar.cc/150?img=45',
    cargo: 'Acabados',
    estado: 'disponible' as const,
    trabajo_asignado: undefined,
    orden_asignada: undefined
  }
];

export default function TallerPage() {
  /**
   * Maneja la asignación de trabajo
   */
  const handleAsignar = (id: string) => {
    console.log('Asignar trabajo a empleado:', id);
    alert(`Asignar trabajo al empleado ${id}`);
  };

  /**
   * Maneja la liberación de trabajo
   */
  const handleLiberar = (id: string) => {
    console.log('Liberar trabajo del empleado:', id);
    if (confirm('¿Estás seguro de liberar este trabajo?')) {
      alert(`Trabajo liberado del empleado ${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Empleados del Taller</h1>
        <p className="text-gray-600">Asignación de trabajos</p>
      </div>

      {/* Tabla de empleados */}
      <StaffTable
        empleados={empleados}
        onAsignar={handleAsignar}
        onLiberar={handleLiberar}
      />
    </div>
  );
}


