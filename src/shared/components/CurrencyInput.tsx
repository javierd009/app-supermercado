'use client';

import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Input de moneda con formato costarricense
 * - Punto (.) separa miles: 100.000
 * - Coma (,) separa decimales: 100.000,44
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  autoFocus = false,
  required = false,
  disabled = false,
  className = '',
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Formatear número a formato costarricense
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return '';

    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];

    return `${integerPart},${decimalPart}`;
  };

  // Parsear string formateado a número
  const parseFormattedValue = (formatted: string): number => {
    if (!formatted) return 0;
    // Remover puntos de miles y convertir coma decimal a punto
    const cleaned = formatted.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Inicializar display value desde value prop
  useEffect(() => {
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setDisplayValue(formatNumber(num));
      }
    } else {
      setDisplayValue('');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Permitir solo números, puntos y comas
    const sanitized = input.replace(/[^\d.,]/g, '');

    // Manejar entrada vacía
    if (!sanitized) {
      setDisplayValue('');
      onChange('');
      return;
    }

    // Detectar si el usuario está escribiendo decimales
    const hasDecimalSeparator = sanitized.includes(',');

    // Remover todos los puntos (miles) para trabajar con el número limpio
    let cleanedForParsing = sanitized.replace(/\./g, '');

    // Convertir coma a punto para parseo
    cleanedForParsing = cleanedForParsing.replace(',', '.');

    // Validar que no haya más de una coma/punto decimal
    const decimalCount = (cleanedForParsing.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    // Limitar decimales a 2
    const parts = cleanedForParsing.split('.');
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      cleanedForParsing = parts.join('.');
    }

    const numericValue = parseFloat(cleanedForParsing) || 0;

    // Formatear para display
    if (hasDecimalSeparator) {
      // Si está escribiendo decimales, preservar el formato parcial
      const intPart = parts[0] || '0';
      const decPart = parts[1] || '';
      const formattedInt = parseInt(intPart).toLocaleString('es-CR').replace(/,/g, '.');
      setDisplayValue(`${formattedInt},${decPart}`);
    } else {
      // Solo parte entera
      const formatted = parseInt(cleanedForParsing).toLocaleString('es-CR').replace(/,/g, '.');
      setDisplayValue(formatted);
    }

    // Enviar valor numérico al padre (formato decimal con punto)
    onChange(cleanedForParsing);
  };

  const handleBlur = () => {
    // Al perder foco, formatear completamente
    if (displayValue) {
      const num = parseFormattedValue(displayValue);
      if (!isNaN(num)) {
        setDisplayValue(formatNumber(num));
        onChange(num.toFixed(2));
      }
    }
  };

  const handleFocus = () => {
    // Seleccionar todo al enfocar
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
}
