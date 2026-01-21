import type { ProductCSVRow } from '../types';

/**
 * Parsear archivo CSV a array de objetos
 */
export function parseCSV(csvContent: string): ProductCSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Primera línea son los headers
  const headers = parseCSVLine(lines[0]);

  // Mapear headers a nombres conocidos (case-insensitive)
  const headerMap = mapHeaders(headers);

  // Parsear el resto de líneas
  const rows: ProductCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0) continue;

    const row: ProductCSVRow = {
      code: '',
      name: '',
    };

    // Mapear valores según headers
    headers.forEach((header, index) => {
      const field = headerMap[header.toLowerCase()];
      const value = values[index]?.trim();

      if (field && value) {
        if (field === 'code') row.code = value;
        else if (field === 'name') row.name = value;
        else if (field === 'quantity') row.quantity = value;
        else if (field === 'cost') row.cost = value;
        else if (field === 'price') row.price = value;
        else if (field === 'category') row.category = value;
      }
    });

    // Solo agregar si tiene código y nombre
    if (row.code && row.name) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parsear una línea CSV (maneja comillas y comas dentro de campos)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
}

/**
 * Mapear headers del CSV a campos conocidos
 * Soporta múltiples variaciones de nombres
 */
function mapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  const patterns = {
    code: ['codigo', 'code', 'cod', 'código', 'barcode', 'sku'],
    name: ['nombre', 'name', 'producto', 'product', 'articulo', 'artículo', 'descripcion', 'descripción'],
    quantity: ['cantidad', 'quantity', 'stock', 'existencia', 'cant'],
    cost: ['costo', 'cost', 'precio costo', 'precio_costo'],
    price: ['precio', 'price', 'precio venta', 'precio_venta', 'pvp'],
    category: ['categoria', 'category', 'categoría', 'tipo'],
  };

  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();

    for (const [field, variations] of Object.entries(patterns)) {
      if (variations.some(v => normalized.includes(v))) {
        map[normalized] = field;
        break;
      }
    }
  });

  return map;
}

/**
 * Leer archivo como texto
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Error al leer archivo'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}
