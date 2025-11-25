/**
 * Componente principal del Cotizador
 * Permite crear cotizaciones agregando materiales y servicios
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerMateriales } from '../services/materiales.service';
import { obtenerServicios } from '../services/servicios.service';
import { crearCotizacion } from '../services/cotizaciones.service';
import { obtenerUsuarioActual } from '../services/auth.service';
import { calcularCotizacionCompleta } from '../utils/calcularCotizacion';
import { cotizacionSchema } from '../schemas/validations';
import type { Material, Servicio } from '../types/database';
import type { CotizacionMaterialInput, CotizacionServicioInput } from '../schemas/validations';

export default function Cotizador() {
  // Estado del formulario de cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [margenGanancia, setMargenGanancia] = useState('30');
  const [notas, setNotas] = useState('');

  // Estado de materiales y servicios seleccionados
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<Array<{
    material: Material;
    cantidad: number;
    precioUnitario: number;
  }>>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Array<{
    servicio: Servicio;
    horas: number;
    precioPorHora: number;
  }>>([]);

  // Estado para agregar nuevos items
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>('');
  const [cantidadMaterial, setCantidadMaterial] = useState('1');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('');
  const [horasServicio, setHorasServicio] = useState('1');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Obtener materiales y servicios con React Query
  const { data: materiales = [], isLoading: loadingMateriales } = useQuery({
    queryKey: ['materiales'],
    queryFn: obtenerMateriales
  });

  const { data: servicios = [], isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios
  });

  /**
   * Agrega un material a la cotización
   */
  const agregarMaterial = () => {
    if (!materialSeleccionado) return;

    const material = materiales.find(m => m.id === materialSeleccionado);
    if (!material) return;

    const cantidad = parseFloat(cantidadMaterial) || 1;
    const precioUnitario = material.costo_unitario;

    setMaterialesSeleccionados([
      ...materialesSeleccionados,
      { material, cantidad, precioUnitario }
    ]);

    // Resetear selección
    setMaterialSeleccionado('');
    setCantidadMaterial('1');
  };

  /**
   * Elimina un material de la cotización
   */
  const eliminarMaterial = (index: number) => {
    setMaterialesSeleccionados(materialesSeleccionados.filter((_, i) => i !== index));
  };

  /**
   * Agrega un servicio a la cotización
   */
  const agregarServicio = () => {
    if (!servicioSeleccionado) return;

    const servicio = servicios.find(s => s.id === servicioSeleccionado);
    if (!servicio) return;

    const horas = parseFloat(horasServicio) || 1;
    const precioPorHora = servicio.precio_por_hora;

    setServiciosSeleccionados([
      ...serviciosSeleccionados,
      { servicio, horas, precioPorHora }
    ]);

    // Resetear selección
    setServicioSeleccionado('');
    setHorasServicio('1');
  };

  /**
   * Elimina un servicio de la cotización
   */
  const eliminarServicio = (index: number) => {
    setServiciosSeleccionados(serviciosSeleccionados.filter((_, i) => i !== index));
  };

  /**
   * Calcula los totales de la cotización
   */
  const calcularTotales = () => {
    const materialesInput: CotizacionMaterialInput[] = materialesSeleccionados.map(m => ({
      material_id: m.material.id,
      cantidad: m.cantidad,
      precio_unitario: m.precioUnitario
    }));

    const serviciosInput: CotizacionServicioInput[] = serviciosSeleccionados.map(s => ({
      servicio_id: s.servicio.id,
      horas: s.horas,
      precio_por_hora: s.precioPorHora
    }));

    return calcularCotizacionCompleta(
      materialesInput,
      serviciosInput,
      parseFloat(margenGanancia) || 30
    );
  };

  /**
   * Maneja el envío de la cotización
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Obtener usuario actual
      const usuario = await obtenerUsuarioActual();
      if (!usuario) {
        throw new Error('Debes estar autenticado para crear una cotización');
      }

      // Preparar datos
      const materialesInput: CotizacionMaterialInput[] = materialesSeleccionados.map(m => ({
        material_id: m.material.id,
        cantidad: m.cantidad,
        precio_unitario: m.precioUnitario
      }));

      const serviciosInput: CotizacionServicioInput[] = serviciosSeleccionados.map(s => ({
        servicio_id: s.servicio.id,
        horas: s.horas,
        precio_por_hora: s.precioPorHora
      }));

      // Validar con Zod
      const datos = cotizacionSchema.parse({
        cliente_nombre: clienteNombre,
        cliente_email: clienteEmail || undefined,
        cliente_telefono: clienteTelefono || undefined,
        cliente_direccion: clienteDireccion || undefined,
        materiales: materialesInput,
        servicios: serviciosInput,
        margen_ganancia: parseFloat(margenGanancia) || 30,
        notas: notas || undefined
      });

      // Crear cotización
      await crearCotizacion(datos, usuario.id);

      setSuccess(true);
      
      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        setClienteNombre('');
        setClienteEmail('');
        setClienteTelefono('');
        setClienteDireccion('');
        setMaterialesSeleccionados([]);
        setServiciosSeleccionados([]);
        setNotas('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cotización');
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Cotización creada exitosamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del cliente */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Datos del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Materiales */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Materiales</h2>
          
          <div className="flex gap-2 mb-4">
            <select
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={materialSeleccionado}
              onChange={(e) => setMaterialSeleccionado(e.target.value)}
              disabled={loadingMateriales}
            >
              <option value="">Seleccionar material</option>
              {materiales.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} - ${m.costo_unitario.toLocaleString()} / {m.unidad}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Cantidad"
              className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={cantidadMaterial}
              onChange={(e) => setCantidadMaterial(e.target.value)}
            />
            <button
              type="button"
              onClick={agregarMaterial}
              disabled={!materialSeleccionado}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>

          {materialesSeleccionados.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialesSeleccionados.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.material.nombre}</td>
                    <td className="px-4 py-2 text-sm">{item.cantidad} {item.material.unidad}</td>
                    <td className="px-4 py-2 text-sm">${item.precioUnitario.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">${(item.cantidad * item.precioUnitario).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() => eliminarMaterial(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Servicios */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Servicios / Mano de Obra</h2>
          
          <div className="flex gap-2 mb-4">
            <select
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={servicioSeleccionado}
              onChange={(e) => setServicioSeleccionado(e.target.value)}
              disabled={loadingServicios}
            >
              <option value="">Seleccionar servicio</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre} - ${s.precio_por_hora.toLocaleString()} / hora
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="Horas"
              className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={horasServicio}
              onChange={(e) => setHorasServicio(e.target.value)}
            />
            <button
              type="button"
              onClick={agregarServicio}
              disabled={!servicioSeleccionado}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>

          {serviciosSeleccionados.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio/Hora</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosSeleccionados.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.servicio.nombre}</td>
                    <td className="px-4 py-2 text-sm">{item.horas}</td>
                    <td className="px-4 py-2 text-sm">${item.precioPorHora.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">${(item.horas * item.precioPorHora).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() => eliminarServicio(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Configuración y totales */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margen de Ganancia (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={margenGanancia}
              onChange={(e) => setMargenGanancia(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Resumen de totales */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal Materiales:</span>
              <span>${totales.subtotalMateriales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal Servicios:</span>
              <span>${totales.subtotalServicios.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totales.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Margen de Ganancia ({margenGanancia}%):</span>
              <span>${((totales.subtotal * parseFloat(margenGanancia)) / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19%):</span>
              <span>${totales.iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>TOTAL:</span>
              <span>${totales.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || materialesSeleccionados.length === 0 && serviciosSeleccionados.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cotización'}
          </button>
        </div>
      </form>
    </div>
  );
}


