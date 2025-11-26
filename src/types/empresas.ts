/**
 * Tipos y constantes para el sistema multi-empresa
 */

export type Empresa = 'casablanca' | 'kubica';

export interface EmpresaInfo {
  id: Empresa;
  nombre: string;
  nombreCompleto: string; // Nombre completo para transferencias
  logo: string;
  numeroInicial: number;
  prefijoNumero: string;
  rut?: string;
  direccion: string;
  emails: string[];
  telefonos: string[];
  sitioWeb?: string;
  descripcion?: string;
}

export const EMPRESAS: Record<Empresa, EmpresaInfo> = {
  casablanca: {
    id: 'casablanca',
    nombre: 'Mueblería Casablanca',
    nombreCompleto: 'FIX PRO SPA',
    logo: '/images/logo-muebleria.png',
    numeroInicial: 400,
    prefijoNumero: 'CASA',
    rut: '77.064.513-1',
    direccion: 'Barnechea 420, Independencia',
    emails: ['Contacto@muebleriacasablanca.cl', 'Muebleriacasablanca.cl@gmail.com'],
    telefonos: ['+56964295258', '226458059'],
    sitioWeb: 'https://muebleriacasablanca.cl/',
    descripcion: 'Fabricacion de Muebles'
  },
  kubica: {
    id: 'kubica',
    nombre: 'KUBICA',
    nombreCompleto: 'KUBICA Mobiliario',
    logo: '/images/logo-kubica.png',
    numeroInicial: 1000,
    prefijoNumero: 'KUB',
    direccion: 'Barnechea 420, Independencia',
    emails: ['kubicamobiliario@gmail.com'],
    telefonos: ['+56964295258', '226458059'], // Mismos teléfonos
    sitioWeb: 'kubicamobiliario.cl',
    descripcion: 'Fabricacion de Muebles'
  }
};

export function obtenerEmpresaPorId(id: Empresa): EmpresaInfo {
  return EMPRESAS[id];
}

export function obtenerEmpresas(): EmpresaInfo[] {
  return Object.values(EMPRESAS);
}

