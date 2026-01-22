'use client';

import { useState, useEffect, useRef } from 'react';

interface CABYSResult {
  codigo: string;
  descripcion: string;
  impuesto: number;
  categorias?: string[];
}

interface CABYSSearchProps {
  onSelect: (result: { codigo: string; impuesto: number; descripcion: string }) => void;
  currentCode?: string;
  disabled?: boolean;
}

/**
 * Componente de búsqueda de códigos CABYS usando la API del Ministerio de Hacienda
 *
 * Cuando el usuario selecciona un resultado:
 * - Se auto-llena el código CABYS
 * - Se auto-llena la tasa de IVA correcta (del catálogo oficial)
 */
export function CABYSSearch({ onSelect, currentCode, disabled }: CABYSSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CABYSResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar en la API de Hacienda
  const searchCABYS = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determinar si es búsqueda por código o por texto
      const isCodeSearch = /^\d+$/.test(searchQuery);
      const param = isCodeSearch ? 'codigo' : 'q';

      const response = await fetch(
        `https://api.hacienda.go.cr/fe/cabys?${param}=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Error al consultar CABYS');
      }

      const data = await response.json();

      if (data.cabys && Array.isArray(data.cabys)) {
        // Limitar a 10 resultados para mejor UX
        setResults(data.cabys.slice(0, 10));
        setIsOpen(true);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando CABYS:', err);
      setError('No se pudo conectar con el servicio de Hacienda');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para no hacer muchas peticiones
  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedDescription(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCABYS(value);
    }, 400); // Esperar 400ms después de que el usuario deje de escribir
  };

  // Seleccionar un resultado
  const handleSelect = (result: CABYSResult) => {
    setSelectedDescription(result.descripcion);
    setQuery('');
    setIsOpen(false);
    setResults([]);

    onSelect({
      codigo: result.codigo,
      impuesto: result.impuesto,
      descripcion: result.descripcion,
    });
  };

  // Mapear tasa de impuesto a nombre
  const getTaxLabel = (impuesto: number) => {
    switch (impuesto) {
      case 0: return '0% Exento';
      case 1: return '1% CBT';
      case 2: return '2%';
      case 4: return '4%';
      case 13: return '13%';
      default: return `${impuesto}%`;
    }
  };

  const getTaxColor = (impuesto: number) => {
    switch (impuesto) {
      case 0:
      case 1: return 'bg-emerald-500/20 text-emerald-300';
      case 2:
      case 4: return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-amber-500/20 text-amber-300';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
          Buscar Código CABYS
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre o código (ej: arroz, leche, 235260...)"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            disabled={disabled}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
          />
        </div>

        {/* Mostrar código seleccionado */}
        {currentCode && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">Código actual:</span>
            <span className="font-mono text-sm text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
              {currentCode}
            </span>
            {selectedDescription && (
              <span className="text-xs text-slate-500 truncate max-w-[200px]" title={selectedDescription}>
                - {selectedDescription}
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}

        <p className="text-xs text-slate-500">
          Busca en el catálogo oficial del Ministerio de Hacienda
        </p>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-slate-900 shadow-xl max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.codigo}-${index}`}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {result.descripcion}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {result.codigo}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${getTaxColor(result.impuesto)}`}>
                  {getTaxLabel(result.impuesto)}
                </span>
              </div>
              {result.categorias && result.categorias.length > 0 && (
                <p className="text-[10px] text-slate-600 mt-1 truncate">
                  {result.categorias.slice(0, 3).join(' > ')}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-slate-900 shadow-xl p-4">
          <p className="text-sm text-slate-400 text-center">
            No se encontraron resultados para "{query}"
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            Intenta con otro término de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}
