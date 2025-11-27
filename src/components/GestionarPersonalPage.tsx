/**
 * Página de gestión de personal (vendedores y trabajadores de taller)
 * Solo accesible para administradores
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import { 
  obtenerVendedores, 
  obtenerTrabajadoresTaller,
  crearUsuario,
  actualizarUsuario
} from '../services/usuarios.service';
import { supabase } from '../utils/supabase';
import type { UserProfile } from '../types/database';

interface CrearEditarUsuarioModalProps {
  usuario?: UserProfile | null;
  tipo: 'vendedor' | 'trabajador_taller';
  onClose: () => void;
  onSuccess: () => void;
}

function CrearEditarUsuarioModal({ 
  usuario, 
  tipo, 
  onClose, 
  onSuccess 
}: CrearEditarUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    email: usuario?.email || '',
    password: '',
    especialidad: usuario?.especialidad || ''
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      if (usuario) {
        // Editar usuario existente
        const datosActualizacion: any = {
          nombre: formData.nombre,
          apellido: formData.apellido
        };
        
        if (tipo === 'trabajador_taller' && formData.especialidad) {
          datosActualizacion.especialidad = formData.especialidad;
        }

        const resultado = await actualizarUsuario(usuario.id, datosActualizacion);
        
        if (resultado.error) {
          throw new Error(resultado.error);
        }
      } else {
        // Crear nuevo registro
        if (!formData.nombre.trim()) {
          throw new Error('El nombre es requerido');
        }
        if (!formData.apellido.trim()) {
          throw new Error('El apellido es requerido');
        }

        // Validaciones específicas para vendedores
        if (tipo === 'vendedor') {
          if (!formData.email.trim()) {
            throw new Error('El email es requerido para vendedores');
          }
          if (!formData.password || formData.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
          }
        }

        const resultado = await crearUsuario(
          formData.nombre.trim(),
          formData.apellido.trim(),
          tipo,
          tipo === 'trabajador_taller' ? formData.especialidad : undefined,
          tipo === 'vendedor' ? formData.email.trim() : undefined,
          tipo === 'vendedor' ? formData.password : undefined
        );

        if (resultado.error) {
          throw new Error(resultado.error);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {usuario ? 'Editar' : 'Crear'} {tipo === 'vendedor' ? 'Vendedor' : 'Trabajador de Taller'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              disabled={guardando}
              placeholder="Nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              disabled={guardando}
              placeholder="Apellido"
            />
          </div>

          {tipo === 'vendedor' && !usuario && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  disabled={guardando}
                  placeholder="email@ejemplo.com"
                />
                <p className="text-xs text-gray-500 mt-1">El vendedor usará este email para iniciar sesión</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  disabled={guardando}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
            </>
          )}

          {tipo === 'trabajador_taller' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad (ej: carpintero, pintor, etc.)
              </label>
              <input
                type="text"
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ej: Carpintero"
                disabled={guardando}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : usuario ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GestionarPersonalPage() {
  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [vendedores, setVendedores] = useState<UserProfile[]>([]);
  const [trabajadores, setTrabajadores] = useState<UserProfile[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UserProfile | null>(null);
  const [tipoModal, setTipoModal] = useState<'vendedor' | 'trabajador_taller'>('vendedor');

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;
  const esAdmin = usuario?.role === 'admin' || false;

  // Cargar usuario directamente si no está en contexto
  useEffect(() => {
    const cargarUsuario = async () => {
      // Si ya tenemos usuario del contexto, usarlo
      if (contextoUsuario.usuario?.id) {
        console.log('✅ Usuario disponible desde contexto:', contextoUsuario.usuario.email);
        setUsuarioLocal(null);
        return;
      }

      // Si no, cargar directamente desde Supabase
      try {
        console.log('📥 Cargando usuario directamente desde Supabase...');
        const usuarioDirecto = await obtenerUsuarioActual();
        if (usuarioDirecto) {
          console.log('✅ Usuario cargado directamente:', usuarioDirecto.email);
          setUsuarioLocal(usuarioDirecto);
        } else {
          setCargando(false);
        }
      } catch (err: any) {
        console.error('❌ Error al cargar usuario:', err);
        setCargando(false);
      }
    };

    cargarUsuario();
  }, [contextoUsuario.usuario?.id]);

  useEffect(() => {
    // Esperar a que el usuario se cargue completamente
    if (!usuario?.id) {
      console.log('⏳ Esperando usuario...');
      setCargando(true);
      return;
    }

    if (esAdmin) {
      cargarDatos();
    } else {
      setCargando(false);
    }
  }, [usuario?.id, esAdmin]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [vendedoresData, trabajadoresData] = await Promise.all([
        obtenerVendedores(),
        obtenerTrabajadoresTaller()
      ]);
      setVendedores(vendedoresData);
      setTrabajadores(trabajadoresData);
    } catch (error) {
      console.error('Error al cargar personal:', error);
      alert('Error al cargar personal');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (usuarioId: string, tipo: 'vendedor' | 'trabajador_taller') => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Eliminar de auth.users (esto requiere permisos de admin en Supabase)
      // Por ahora, solo eliminamos el perfil
      const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', usuarioId);

      if (error) throw error;

      // Recargar datos
      await cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleAbrirModalCrear = (tipo: 'vendedor' | 'trabajador_taller') => {
    setTipoModal(tipo);
    setUsuarioEditando(null);
    setMostrarModal(true);
  };

  const handleAbrirModalEditar = (usuario: UserProfile, tipo: 'vendedor' | 'trabajador_taller') => {
    setTipoModal(tipo);
    setUsuarioEditando(usuario);
    setMostrarModal(true);
  };

  // Si aún no se ha cargado el usuario, mostrar loading
  if (usuario === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Acceso denegado</p>
          <p className="text-gray-600 mt-2">Solo los administradores pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
            <p className="text-gray-600 mt-1">Administra vendedores y trabajadores de taller</p>
          </div>
        </div>

        {/* Sección de Vendedores */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Vendedores</h2>
              <p className="text-sm text-gray-600 mt-1">
                {vendedores.length} vendedor{vendedores.length !== 1 ? 'es' : ''} registrado{vendedores.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => handleAbrirModalCrear('vendedor')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Vendedor
            </button>
          </div>

          {vendedores.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No hay vendedores registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendedores.map((vendedor) => (
                    <tr key={vendedor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vendedor.nombre || ''} {vendedor.apellido || ''}
                        </div>
                        {vendedor.email && (
                          <div className="text-xs text-gray-500">{vendedor.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAbrirModalEditar(vendedor, 'vendedor')}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(vendedor.id, 'vendedor')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sección de Trabajadores de Taller */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trabajadores de Taller</h2>
              <p className="text-sm text-gray-600 mt-1">
                {trabajadores.length} trabajador{trabajadores.length !== 1 ? 'es' : ''} registrado{trabajadores.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => handleAbrirModalCrear('trabajador_taller')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Trabajador
            </button>
          </div>

          {trabajadores.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No hay trabajadores de taller registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trabajadores.map((trabajador) => (
                    <tr key={trabajador.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {trabajador.nombre || ''} {trabajador.apellido || ''}
                        </div>
                        {trabajador.email && (
                          <div className="text-xs text-gray-500">{trabajador.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {trabajador.especialidad || 'Sin especialidad'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAbrirModalEditar(trabajador, 'trabajador_taller')}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(trabajador.id, 'trabajador_taller')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de crear/editar */}
      {mostrarModal && (
        <CrearEditarUsuarioModal
          usuario={usuarioEditando}
          tipo={tipoModal}
          onClose={() => {
            setMostrarModal(false);
            setUsuarioEditando(null);
          }}
          onSuccess={cargarDatos}
        />
      )}
    </>
  );
}


