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
import { 
  crearLiquidacion,
  obtenerLiquidacionesPorPersona,
  calcularBalancePersona,
  eliminarLiquidacion
} from '../services/liquidaciones.service';
import { obtenerSaldoDisponible } from '../services/saldo-disponible.service';
import { supabase } from '../utils/supabase';
import type { UserProfile, Liquidacion } from '../types/database';

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
    rut: usuario?.rut || '',
    direccion: usuario?.direccion || '',
    telefono: usuario?.telefono || '',
    email: usuario?.email || '',
    password: '',
    especialidad: usuario?.especialidad || '',
    sueldo: usuario?.sueldo?.toString() || '',
    frecuencia_pago: (usuario?.frecuencia_pago || 'mensual') as 'mensual' | 'quincenal' | 'semanal' | 'diario'
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar formData cuando cambia el usuario
  useEffect(() => {
    console.log('🔄 [Modal] Usuario cambió:', usuario);
    setFormData({
      nombre: usuario?.nombre || '',
      apellido: usuario?.apellido || '',
      rut: usuario?.rut || '',
      direccion: usuario?.direccion || '',
      telefono: usuario?.telefono || '',
      email: usuario?.email || '',
      password: '',
      especialidad: usuario?.especialidad || '',
      sueldo: usuario?.sueldo?.toString() || '',
      frecuencia_pago: (usuario?.frecuencia_pago || 'mensual') as 'mensual' | 'quincenal' | 'semanal' | 'diario'
    });
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      if (usuario) {
        // Editar usuario existente
        const datosActualizacion: any = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          rut: formData.rut || null,
          direccion: formData.direccion || null,
          telefono: formData.telefono || null,
          sueldo: formData.sueldo ? parseFloat(formData.sueldo) : null,
          frecuencia_pago: formData.frecuencia_pago
        };
        
        if (tipo === 'trabajador_taller' && formData.especialidad) {
          datosActualizacion.especialidad = formData.especialidad;
        } else if (tipo === 'vendedor') {
          datosActualizacion.especialidad = 'vendedor';
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
          tipo === 'trabajador_taller' ? formData.especialidad : 'vendedor',
          tipo === 'vendedor' ? formData.email.trim() : undefined,
          tipo === 'vendedor' ? formData.password : undefined,
          formData.rut.trim() || undefined,
          formData.direccion.trim() || undefined,
          formData.telefono.trim() || undefined,
          formData.sueldo ? parseFloat(formData.sueldo) : undefined,
          formData.frecuencia_pago
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT
            </label>
            <input
              type="text"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={guardando}
              placeholder="RUT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={guardando}
              placeholder="Dirección"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={guardando}
              placeholder="Número de teléfono"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sueldo
            </label>
            <input
              type="number"
              value={formData.sueldo}
              onChange={(e) => setFormData({ ...formData, sueldo: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0"
              min="0"
              step="0.01"
              disabled={guardando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia de Pago *
            </label>
            <select
              value={formData.frecuencia_pago}
              onChange={(e) => setFormData({ ...formData, frecuencia_pago: e.target.value as any })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              disabled={guardando}
            >
              <option value="mensual">Mensual</option>
              <option value="quincenal">Quincenal</option>
              <option value="semanal">Semanal</option>
              <option value="diario">Diario</option>
            </select>
          </div>

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
  const [actionsMenuOpen, setActionsMenuOpen] = useState<{ tipo: 'vendedor' | 'trabajador_taller', id: string } | null>(null);
  
  // Estados para pagos manuales
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [personaPago, setPersonaPago] = useState<UserProfile | null>(null);
  const [balancePersona, setBalancePersona] = useState<{ totalGanado: number; totalLiquidado: number; balancePendiente: number } | null>(null);
  const [liquidacionesPersona, setLiquidacionesPersona] = useState<Liquidacion[]>([]);

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

  const cargarDatos = async (forzarRecarga = false) => {
    try {
      console.log('🔄 [GestionarPersonal] Cargando datos...', forzarRecarga ? '(forzado)' : '');
      setCargando(true);
      
      // Si es una recarga forzada, limpiar primero los estados
      if (forzarRecarga) {
        setVendedores([]);
        setTrabajadores([]);
        // Pequeño delay para asegurar que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const [vendedoresData, trabajadoresData] = await Promise.all([
        obtenerVendedores(),
        obtenerTrabajadoresTaller()
      ]);
      
      console.log('📊 [GestionarPersonal] Vendedores cargados:', vendedoresData.length);
      console.log('📊 [GestionarPersonal] Trabajadores cargados:', trabajadoresData.length);
      console.log('📋 [GestionarPersonal] IDs de vendedores:', vendedoresData.map(v => v.id));
      console.log('📋 [GestionarPersonal] IDs de trabajadores:', trabajadoresData.map(t => t.id));
      
      setVendedores(vendedoresData);
      setTrabajadores(trabajadoresData);
      console.log('✅ [GestionarPersonal] Datos actualizados en el estado');
    } catch (error) {
      console.error('❌ [GestionarPersonal] Error al cargar personal:', error);
      alert('Error al cargar personal');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (usuarioId: string, tipo: 'vendedor' | 'trabajador_taller', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('🗑️ [GestionarPersonal] Intentando eliminar usuario:', usuarioId, tipo);
    
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      console.log('❌ [GestionarPersonal] Usuario canceló la eliminación');
      return;
    }

    try {
      console.log('🔄 [GestionarPersonal] Eliminando usuario:', usuarioId, tipo);
      
      // Verificar que el usuario existe antes de eliminar
      const { data: usuarioExistente, error: errorVerificacion } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, role, email')
        .eq('id', usuarioId)
        .single();
      
      console.log('🔍 [GestionarPersonal] Usuario encontrado:', usuarioExistente);
      
      if (errorVerificacion) {
        console.error('❌ [GestionarPersonal] Error al verificar usuario:', errorVerificacion);
        throw new Error('No se pudo verificar el usuario: ' + errorVerificacion.message);
      }
      
      if (!usuarioExistente) {
        throw new Error('Usuario no encontrado');
      }
      
      // Si es vendedor, también eliminar de auth.users usando API endpoint
      if (tipo === 'vendedor' || usuarioExistente.role === 'vendedor') {
        console.log('👤 [GestionarPersonal] Es vendedor, eliminando de auth.users también...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No estás autenticado');
          }
          
          const response = await fetch('/api/eliminar-vendedor', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ usuarioId })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error('❌ [GestionarPersonal] Error al eliminar de auth.users:', result.error);
            // Continuar para intentar eliminar el perfil de todas formas
          } else {
            console.log('✅ [GestionarPersonal] Vendedor eliminado de auth.users');
          }
        } catch (authError: any) {
          console.warn('⚠️ [GestionarPersonal] Error al eliminar de auth.users, continuando con perfil:', authError);
          // Continuar para eliminar el perfil de todas formas
        }
      }
      
      // Eliminar el perfil de la tabla perfiles
      console.log('🗑️ [GestionarPersonal] Ejecutando DELETE en perfiles...');
      const { data, error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', usuarioId)
        .select();

      console.log('📊 [GestionarPersonal] Resultado de eliminación:', { data, error });
      console.log('📊 [GestionarPersonal] Data eliminada:', JSON.stringify(data, null, 2));
      console.log('📊 [GestionarPersonal] Error completo:', JSON.stringify(error, null, 2));

      if (error) {
        console.error('❌ [GestionarPersonal] Error de Supabase:', error);
        console.error('❌ [GestionarPersonal] Código de error:', error.code);
        console.error('❌ [GestionarPersonal] Mensaje de error:', error.message);
        console.error('❌ [GestionarPersonal] Detalles de error:', error.details);
        console.error('❌ [GestionarPersonal] Hint de error:', error.hint);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ [GestionarPersonal] No se eliminó ningún registro. Verificar políticas RLS.');
        throw new Error('No se pudo eliminar el usuario. Verifica que tengas permisos de administrador y que la política RLS de DELETE esté configurada.');
      }

      console.log('✅ [GestionarPersonal] Usuario eliminado exitosamente');
      console.log('📊 [GestionarPersonal] Datos eliminados:', data);
      
      // Actualizar el estado inmediatamente para reflejar el cambio
      if (tipo === 'vendedor') {
        setVendedores(prev => {
          const nuevos = prev.filter(v => v.id !== usuarioId);
          console.log('🔄 [GestionarPersonal] Estado de vendedores actualizado:', prev.length, '->', nuevos.length);
          return nuevos;
        });
      } else {
        setTrabajadores(prev => {
          const nuevos = prev.filter(t => t.id !== usuarioId);
          console.log('🔄 [GestionarPersonal] Estado de trabajadores actualizado:', prev.length, '->', nuevos.length);
          return nuevos;
        });
      }
      
      // Esperar un momento para que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // También recargar datos desde el servidor para asegurar sincronización (forzado)
      await cargarDatos(true);
    } catch (error: any) {
      console.error('❌ [GestionarPersonal] Error al eliminar usuario:', error);
      alert('Error al eliminar usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleAbrirModalCrear = (tipo: 'vendedor' | 'trabajador_taller', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setTipoModal(tipo);
    setUsuarioEditando(null);
    setMostrarModal(true);
  };

  const handleAbrirModalEditar = (usuario: UserProfile, tipo: 'vendedor' | 'trabajador_taller', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('✏️ [GestionarPersonal] Abriendo modal de edición:', usuario.id, tipo);
    setTipoModal(tipo);
    setUsuarioEditando(usuario);
    setMostrarModal(true);
    console.log('✅ [GestionarPersonal] Modal abierto, mostrarModal:', true);
  };

  const handleAbrirModalPago = async (persona: UserProfile, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      setPersonaPago(persona);
      // Cargar balance y liquidaciones de la persona
      const [balance, liquidaciones] = await Promise.all([
        calcularBalancePersona(persona.id),
        obtenerLiquidacionesPorPersona(persona.id)
      ]);
      setBalancePersona(balance);
      setLiquidacionesPersona(liquidaciones);
      setMostrarModalPago(true);
    } catch (error: any) {
      console.error('Error al cargar datos de pago:', error);
      alert('Error al cargar datos: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCerrarModalPago = () => {
    setMostrarModalPago(false);
    setPersonaPago(null);
    setBalancePersona(null);
    setLiquidacionesPersona([]);
  };

  const handlePagoExitoso = async () => {
    // Recargar balance después del pago
    if (personaPago) {
      const balance = await calcularBalancePersona(personaPago.id);
      const liquidaciones = await obtenerLiquidacionesPorPersona(personaPago.id);
      setBalancePersona(balance);
      setLiquidacionesPersona(liquidaciones);
    }
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
            <>
              {/* Vista móvil - Cards */}
              <div className="lg:hidden space-y-3 p-4">
                {vendedores.map((vendedor) => (
                  <div key={vendedor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-0.5">Nombre</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {vendedor.nombre || ''} {vendedor.apellido || ''}
                        </div>
                        {vendedor.email && (
                          <div className="text-xs text-gray-500 mt-1">{vendedor.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          handleAbrirModalEditar(vendedor, 'vendedor', e);
                          setActionsMenuOpen(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleAbrirModalPago(vendedor, e);
                          setActionsMenuOpen(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                      >
                        💰 Pagar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleEliminar(vendedor.id, 'vendedor', e);
                          setActionsMenuOpen(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendedores.map((vendedor) => (
                      <tr key={vendedor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vendedor.nombre || ''} {vendedor.apellido || ''}
                          </div>
                          {vendedor.email && (
                            <div className="text-xs text-gray-500">{vendedor.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🖱️ [Vendedor] Click en Editar:', vendedor.id);
                                handleAbrirModalEditar(vendedor, 'vendedor', e);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAbrirModalPago(vendedor, e)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors cursor-pointer"
                            >
                              💰 Pagar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🖱️ [Vendedor] Click en Eliminar:', vendedor.id);
                                handleEliminar(vendedor.id, 'vendedor', e);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
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
            </>
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
            <>
              {/* Vista móvil - Cards */}
              <div className="lg:hidden space-y-3 p-4">
                {trabajadores.map((trabajador) => (
                  <div key={trabajador.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-0.5">Nombre</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {trabajador.nombre || ''} {trabajador.apellido || ''}
                        </div>
                        {trabajador.email && (
                          <div className="text-xs text-gray-500 mt-1">{trabajador.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-0.5">Especialidad</div>
                      <div className="text-sm text-gray-700">
                        {trabajador.especialidad || 'Sin especialidad'}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          handleAbrirModalEditar(trabajador, 'trabajador_taller', e);
                          setActionsMenuOpen(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleAbrirModalPago(trabajador, e);
                          setActionsMenuOpen(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                      >
                        💰 Pagar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleEliminar(trabajador.id, 'trabajador_taller', e);
                          setActionsMenuOpen(null);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trabajadores.map((trabajador) => (
                      <tr key={trabajador.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trabajador.nombre || ''} {trabajador.apellido || ''}
                          </div>
                          {trabajador.email && (
                            <div className="text-xs text-gray-500">{trabajador.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {trabajador.especialidad || 'Sin especialidad'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🖱️ [Trabajador] Click en Editar:', trabajador.id);
                                handleAbrirModalEditar(trabajador, 'trabajador_taller', e);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAbrirModalPago(trabajador, e)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors cursor-pointer"
                            >
                              💰 Pagar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🖱️ [Trabajador] Click en Eliminar:', trabajador.id);
                                handleEliminar(trabajador.id, 'trabajador_taller', e);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
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
            </>
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

      {/* Modal de pago */}
      {mostrarModalPago && personaPago && balancePersona && (
        <ModalPagoPersonal
          persona={personaPago}
          balancePendiente={balancePersona.balancePendiente}
          liquidaciones={liquidacionesPersona}
          balancePersona={balancePersona}
          onClose={handleCerrarModalPago}
          onSuccess={handlePagoExitoso}
        />
      )}
    </>
  );
}

interface ModalPagoPersonalProps {
  persona: UserProfile;
  balancePendiente: number;
  liquidaciones: Liquidacion[];
  balancePersona: { totalGanado: number; totalLiquidado: number; balancePendiente: number };
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

function ModalPagoPersonal({ persona, balancePendiente, liquidaciones, balancePersona, onClose, onSuccess }: ModalPagoPersonalProps) {
  // Función para generar número de referencia automático
  const generarNumeroReferencia = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `PAGO-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  const [monto, setMonto] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'cheque' | 'otro'>('efectivo');
  const [numeroReferencia, setNumeroReferencia] = useState(generarNumeroReferencia());
  const [descripcion, setDescripcion] = useState('');
  const [esPagoSueldo, setEsPagoSueldo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoPagoId, setEliminandoPagoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disponibleParaGastar, setDisponibleParaGastar] = useState<number | null>(null);

  const cargarSaldoDisponible = async () => {
    try {
      const saldo = await obtenerSaldoDisponible();
      setDisponibleParaGastar(saldo.disponibleParaGastar);
    } catch {
      setDisponibleParaGastar(null);
    }
  };

  useEffect(() => {
    cargarSaldoDisponible();
  }, []);

  // Efecto para actualizar número de referencia cuando cambia la fecha
  useEffect(() => {
    if (fechaPago) {
      const fecha = new Date(fechaPago + 'T12:00:00');
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setNumeroReferencia(`PAGO-${year}${month}${day}-${hours}${minutes}${seconds}`);
    }
  }, [fechaPago]);

  // Efecto para completar datos cuando se selecciona pago de sueldo
  useEffect(() => {
    if (esPagoSueldo && persona.sueldo) {
      setMonto(persona.sueldo.toString());
      const frecuencia = persona.frecuencia_pago || 'mensual';
      const descripcionSueldo = `Pago de sueldo ${frecuencia} - ${persona.nombre} ${persona.apellido}`;
      setDescripcion(descripcionSueldo);
    }
    // No limpiar automáticamente cuando se desmarca para permitir edición manual
  }, [esPagoSueldo, persona.sueldo, persona.frecuencia_pago, persona.nombre, persona.apellido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    
    if (!monto || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    // Advertencia si el pago hará que el balance sea muy negativo
    const nuevoBalance = balancePendiente - montoNum;
    if (nuevoBalance < -50000 && balancePersona.totalGanado === 0) {
      const confirmar = window.confirm(
        `⚠️ Advertencia: Este pago hará que el balance sea de $${nuevoBalance.toLocaleString('es-CO')}.\n\n` +
        `La persona no tiene ganancias registradas. ¿Estás seguro de continuar?`
      );
      if (!confirmar) {
        return;
      }
    }

    try {
      setGuardando(true);
      setError(null);

      // Crear fecha con hora actual si no se especifica
      const fechaCompleta = fechaPago ? new Date(fechaPago + 'T12:00:00').toISOString() : new Date().toISOString();

      await crearLiquidacion({
        persona_id: persona.id,
        tipo_persona: persona.role as 'vendedor' | 'trabajador_taller',
        monto: montoNum,
        metodo_pago: metodoPago,
        numero_referencia: numeroReferencia.trim() || undefined,
        notas: descripcion.trim() || undefined
      });

      // Actualizar fecha_liquidacion manualmente si es diferente a hoy
      if (fechaPago && fechaPago !== new Date().toISOString().split('T')[0]) {
        // Obtener la última liquidación creada y actualizar su fecha
        const liquidacionesActualizadas = await obtenerLiquidacionesPorPersona(persona.id);
        const ultimaLiquidacion = liquidacionesActualizadas[0];
        if (ultimaLiquidacion) {
          await supabase
            .from('liquidaciones')
            .update({ fecha_liquidacion: fechaCompleta })
            .eq('id', ultimaLiquidacion.id);
        }
      }

      await onSuccess();
      await cargarSaldoDisponible();
      // No cerrar el modal automáticamente para permitir agregar más pagos
      setMonto('');
      setNumeroReferencia(generarNumeroReferencia());
      setDescripcion('');
      setEsPagoSueldo(false);
      setFechaPago(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarPago = async (liquidacion: Liquidacion) => {
    const referencia = liquidacion.numero_referencia ? ` (${liquidacion.numero_referencia})` : '';
    if (!confirm(`¿Estás seguro de eliminar este pago de $${liquidacion.monto.toLocaleString('es-CO')}${referencia}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setEliminandoPagoId(liquidacion.id);
      setError(null);
      await eliminarLiquidacion(liquidacion.id);
      await onSuccess();
      await cargarSaldoDisponible();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar pago');
    } finally {
      setEliminandoPagoId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Registrar Pago - {persona.nombre} {persona.apellido}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumen de balance */}
          <div className={`rounded-lg p-4 border-2 ${
            balancePendiente >= 0 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-orange-50 border-orange-300'
          }`}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">
                  {balancePendiente >= 0 ? (
                    <span className="text-blue-800">Total Ganado</span>
                  ) : (
                    <span className="text-orange-800">Total Ganado</span>
                  )}
                </p>
                <p className={`text-xl font-bold ${
                  balancePendiente >= 0 ? 'text-blue-900' : 'text-orange-900'
                }`}>
                  ${balancePersona.totalGanado.toLocaleString('es-CO')}
                </p>
                {balancePersona.totalGanado === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Sin ganancias registradas</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  {balancePendiente >= 0 ? (
                    <span className="text-blue-800">Total Liquidado</span>
                  ) : (
                    <span className="text-orange-800">Total Liquidado</span>
                  )}
                </p>
                <p className={`text-xl font-bold ${
                  balancePendiente >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  ${balancePersona.totalLiquidado.toLocaleString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  {balancePendiente >= 0 ? (
                    <span className="text-blue-800">Balance Pendiente</span>
                  ) : (
                    <span className="text-orange-800">Balance (Adelantado)</span>
                  )}
                </p>
                <p className={`text-2xl font-bold ${
                  balancePendiente >= 0 ? 'text-blue-900' : 'text-orange-900'
                }`}>
                  ${balancePendiente.toLocaleString('es-CO')}
                </p>
                {balancePendiente < 0 && (
                  <p className="text-xs text-orange-700 mt-1 font-medium">
                    ⚠️ Se ha pagado más de lo ganado
                  </p>
                )}
              </div>
            </div>
            {balancePendiente < 0 && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <p className="text-xs text-orange-800">
                  <strong>Nota:</strong> El balance negativo indica que se han realizado pagos por un monto mayor 
                  a las ganancias registradas. Esto puede deberse a pagos anticipados, bonos u otros conceptos 
                  no relacionados con cotizaciones específicas.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {disponibleParaGastar !== null && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="text-amber-800 font-medium">Disponible para gastar: ${disponibleParaGastar.toLocaleString('es-CO')}</p>
              <p className="text-amber-700 mt-0.5 text-xs">Este pago se descontará de ese saldo (no de la caja de ahorros).</p>
              {monto && parseFloat(monto) > disponibleParaGastar && (
                <p className="text-red-600 font-medium mt-2">⚠️ El monto supera lo disponible para gastar.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Opción de pago de sueldo */}
            {persona.sueldo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPagoSueldo}
                    onChange={(e) => setEsPagoSueldo(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={guardando}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Es pago de sueldo ({persona.frecuencia_pago || 'mensual'})
                  </span>
                </label>
                {esPagoSueldo && (
                  <p className="text-xs text-blue-700 mt-2">
                    Se completarán automáticamente: Monto ${persona.sueldo.toLocaleString('es-CO')} y descripción del pago
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de referencia *
              </label>
              <input
                type="text"
                value={numeroReferencia}
                onChange={(e) => setNumeroReferencia(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Número de referencia del pago"
                required
                disabled={guardando}
              />
              <p className="text-xs text-gray-500 mt-1">Se genera automáticamente, pero puedes editarlo</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del pago *
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={2}
                placeholder="Descripción del pago (ej: Pago de sueldo mensual, Pago por comisión, etc.)"
                required
                disabled={guardando}
              />
              <p className="text-xs text-gray-500 mt-1">Describe qué se está pagando</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto del pago *
              </label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                disabled={guardando}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del pago *
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={guardando}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={guardando}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Historial de pagos */}
            {liquidaciones.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Historial de Pagos</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {liquidaciones.map((liquidacion) => (
                    <div key={liquidacion.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            ${liquidacion.monto.toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(liquidacion.fecha_liquidacion).toLocaleDateString('es-CO')} - {liquidacion.metodo_pago || 'N/A'}
                          </p>
                          {liquidacion.notas && (
                            <p className="text-xs text-gray-600 mt-1">{liquidacion.notas}</p>
                          )}
                          {liquidacion.numero_referencia && (
                            <p className="text-xs text-gray-500 mt-1">Ref: {liquidacion.numero_referencia}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEliminarPago(liquidacion)}
                          disabled={guardando || eliminandoPagoId === liquidacion.id}
                          className="shrink-0 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Eliminar pago"
                        >
                          {eliminandoPagoId === liquidacion.id ? 'Eliminando...' : '🗑️ Eliminar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


