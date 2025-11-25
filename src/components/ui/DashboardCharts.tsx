/**
 * Componentes de gráficos para el dashboard
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Datos de ejemplo (en producción vendrían de la API)
const ventasPorCategoria = [
  { name: 'Clóset Modular', ventas: 4500000 },
  { name: 'Cocina Integral', ventas: 1800000 },
  { name: 'Mueble de Baño', ventas: 1200000 },
  { name: 'Estación Sensorial Madera', ventas: 900000 }
];

const distribucionGanancias = [
  { name: 'Cocina Integral', value: 45 },
  { name: 'Clóset Integral', value: 30 },
  { name: 'Otros', value: 25 }
];

const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

interface DashboardChartsProps {
  ventasData?: typeof ventasPorCategoria;
  gananciasData?: typeof distribucionGanancias;
}

export function VentasPorCategoriaChart({ ventasData = ventasPorCategoria }: DashboardChartsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Ventas por Categoría de Mueble
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={ventasData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip
            formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Bar dataKey="ventas" fill="#4F46E5" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistribucionGananciasChart({ gananciasData = distribucionGanancias }: DashboardChartsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Distribución de Ganancias
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={gananciasData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}%`}
          >
            {gananciasData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold text-indigo-600">30%</p>
        <p className="text-sm text-gray-500">Margen Promedio</p>
      </div>
    </div>
  );
}


