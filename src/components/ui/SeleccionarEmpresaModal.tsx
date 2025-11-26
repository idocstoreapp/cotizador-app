/**
 * Modal para seleccionar la empresa antes de generar PDF/guardar cotización
 */
import { useState } from 'react';
import { EMPRESAS, type Empresa } from '../../types/empresas';

interface SeleccionarEmpresaModalProps {
  onSeleccionar: (empresa: Empresa) => void;
  onCancelar: () => void;
}

export default function SeleccionarEmpresaModal({
  onSeleccionar,
  onCancelar
}: SeleccionarEmpresaModalProps) {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);

  const handleConfirmar = () => {
    if (empresaSeleccionada) {
      onSeleccionar(empresaSeleccionada);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Seleccionar Empresa</h2>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Selecciona la empresa desde la cual se generará esta cotización:
          </p>
          
          <div className="space-y-4">
            {Object.values(EMPRESAS).map((empresa) => (
              <button
                key={empresa.id}
                onClick={() => setEmpresaSeleccionada(empresa.id)}
                className={`w-full p-4 border-2 rounded-lg transition-all ${
                  empresaSeleccionada === empresa.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={empresa.logo}
                      alt={empresa.nombre}
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        // Fallback si la imagen no carga
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{empresa.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      Prefijo: {empresa.prefijoNumero} | Inicia desde: {empresa.numeroInicial}
                    </p>
                  </div>
                  {empresaSeleccionada === empresa.id && (
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleConfirmar}
              disabled={!empresaSeleccionada}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={onCancelar}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

