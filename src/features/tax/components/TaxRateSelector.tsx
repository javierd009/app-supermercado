'use client';

import { TAX_RATES, getTaxRateLabel } from '../utils/taxCalculations';

interface TaxRateSelectorProps {
  value: number;
  onChange: (rate: number) => void;
  disabled?: boolean;
}

export function TaxRateSelector({ value, onChange, disabled }: TaxRateSelectorProps) {
  const options = [
    { 
      value: TAX_RATES.EXEMPT, 
      label: '0% - Exento', 
      description: 'Canasta básica (arroz, frijoles, aceite, azúcar, sal, huevos, leche, pan)',
      color: 'border-green-400 bg-green-50 hover:bg-green-100'
    },
    { 
      value: TAX_RATES.REDUCED, 
      label: '4% - Reducido', 
      description: 'Medicamentos con receta médica',
      color: 'border-blue-400 bg-blue-50 hover:bg-blue-100'
    },
    { 
      value: TAX_RATES.STANDARD, 
      label: '13% - General', 
      description: 'Mayoría de productos (gaseosas, snacks, procesados, limpieza)',
      color: 'border-orange-400 bg-orange-50 hover:bg-orange-100'
    },
  ];

  return (
    <div className="space-y-2">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={`w-full border-2 p-3 text-left transition-all ${
            value === option.value
              ? 'border-blue-600 bg-blue-100'
              : option.color
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                {option.label}
              </p>
              <p className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                {option.description}
              </p>
            </div>
            {value === option.value && (
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
