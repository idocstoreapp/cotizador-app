/**
 * Componente de autocompletado para materiales
 * Muestra una lista de sugerencias mientras el usuario escribe
 */
import { useState, useRef, useEffect } from 'react';
import type { Material } from '../../types/database';

interface MaterialAutocompleteProps {
  materiales: Material[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (material: Material | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDetails?: boolean; // Si true, muestra tipo, precio y unidad en las opciones
}

export default function MaterialAutocomplete({
  materiales,
  value,
  onChange,
  onSelect,
  placeholder = 'Buscar o escribir material...',
  disabled = false,
  className = '',
  showDetails = true
}: MaterialAutocompleteProps) {
  const [sugerencias, setSugerencias] = useState<Material[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);

  // Filtrar materiales según el texto ingresado
  useEffect(() => {
    if (!value.trim()) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const textoBusqueda = value.toLowerCase().trim();
    const filtrados = materiales.filter(material => 
      material.nombre.toLowerCase().includes(textoBusqueda) ||
      (material.tipo && material.tipo.toLowerCase().includes(textoBusqueda))
    ).slice(0, 10); // Limitar a 10 sugerencias

    setSugerencias(filtrados);
    setMostrarSugerencias(filtrados.length > 0);
    setIndiceSeleccionado(-1);
  }, [value, materiales]);

  // Manejar selección de material
  const seleccionarMaterial = (material: Material | null) => {
    if (material) {
      onChange(material.nombre);
      onSelect(material);
    } else {
      onSelect(null);
    }
    setMostrarSugerencias(false);
    setIndiceSeleccionado(-1);
  };

  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSeleccionado(prev => 
          prev < sugerencias.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceSeleccionado(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (indiceSeleccionado >= 0 && indiceSeleccionado < sugerencias.length) {
          seleccionarMaterial(sugerencias[indiceSeleccionado]);
        }
        break;
      case 'Escape':
        setMostrarSugerencias(false);
        setIndiceSeleccionado(-1);
        break;
    }
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!mostrarSugerencias && e.target.value.trim()) {
            setMostrarSugerencias(true);
          }
        }}
        onFocus={() => {
          if (value.trim() && sugerencias.length > 0) {
            setMostrarSugerencias(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
        autoComplete="off"
      />
      
      {mostrarSugerencias && sugerencias.length > 0 && (
        <div
          ref={sugerenciasRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {sugerencias.map((material, index) => (
            <div
              key={material.id}
              onClick={() => seleccionarMaterial(material)}
              onMouseEnter={() => setIndiceSeleccionado(index)}
              className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 transition-colors ${
                index === indiceSeleccionado ? 'bg-indigo-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === sugerencias.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{material.nombre}</div>
              {showDetails && (
                <div className="text-xs text-gray-500 mt-1">
                  {material.tipo && <span>{material.tipo}</span>}
                  {material.tipo && material.costo_unitario > 0 && <span> • </span>}
                  {material.costo_unitario > 0 && (
                    <span>${material.costo_unitario.toLocaleString('es-CO')} / {material.unidad}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


