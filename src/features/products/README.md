# 📦 Feature: Products

Sistema completo de gestión de productos con importación CSV desde Mónica 8.5.

---

## 📁 Estructura

```
products/
├── components/
│   ├── ProductsList.tsx      # Tabla de productos con búsqueda
│   ├── ProductForm.tsx        # Formulario crear/editar
│   ├── CSVImporter.tsx        # Importador desde Mónica 8.5
│   └── index.ts
├── hooks/
│   └── useProducts.ts         # Hooks de productos
├── services/
│   ├── productsService.ts     # CRUD con Supabase
│   └── csvParser.ts           # Parser inteligente de CSV
├── store/
│   └── productsStore.ts       # Estado global (Zustand)
├── types/
│   └── index.ts               # Tipos TypeScript
└── README.md                  # Este archivo
```

---

## 🚀 Uso

### Cargar Productos

```tsx
'use client';

import { useLoadProducts, useProducts } from '@/features/products/hooks/useProducts';

export function MyComponent() {
  useLoadProducts(); // Carga automática al montar
  const { products, filteredProducts, isLoading } = useProducts();

  return (
    <div>
      {products.length} productos cargados
    </div>
  );
}
```

### Crear Producto

```tsx
import { useCreateProduct } from '@/features/products/hooks/useProducts';

export function CreateProductButton() {
  const { createProduct } = useCreateProduct();

  const handleCreate = async () => {
    const result = await createProduct({
      code: '7501055300082',
      name: 'Coca Cola 500ml',
      category: 'Bebidas',
      cost: 400,
      price: 800,
      stock: 100,
      minStock: 10,
    });

    if (result.success) {
      console.log('Producto creado:', result.product);
    }
  };

  return <button onClick={handleCreate}>Crear</button>;
}
```

### Buscar Producto por Código

```tsx
import { useProducts } from '@/features/products/hooks/useProducts';

export function SearchProduct() {
  const { getProductByCode } = useProducts();

  const product = getProductByCode('7501055300082');

  return <div>{product?.name}</div>;
}
```

### Importar CSV

```tsx
import { CSVImporter } from '@/features/products/components';

export function ImportPage() {
  return (
    <CSVImporter
      onSuccess={() => console.log('Importación exitosa')}
    />
  );
}
```

---

## 📊 Componentes

### ProductsList

Tabla completa de productos con:
- ✅ Búsqueda en tiempo real (código o nombre)
- ✅ Filtro de stock bajo
- ✅ Indicador visual de productos con stock crítico
- ✅ Cálculo de margen de ganancia
- ✅ Acciones: Editar / Eliminar
- ✅ Confirmación doble para eliminar

**Props:**
```tsx
interface ProductsListProps {
  onEdit: (product: Product) => void;
}
```

### ProductForm

Formulario de creación/edición con:
- ✅ Validación de campos obligatorios
- ✅ Validación de precios (precio > costo)
- ✅ Cálculo automático de margen
- ✅ Indicador visual de margen de ganancia
- ✅ Campos: código, nombre, categoría, costo, precio, stock, stock mínimo

**Props:**
```tsx
interface ProductFormProps {
  product?: Product | null;  // null = crear, Product = editar
  onSuccess: () => void;
  onCancel: () => void;
}
```

### CSVImporter

Importador inteligente desde Mónica 8.5 con:
- ✅ Drag & drop de archivos
- ✅ Detección automática de columnas (español/inglés)
- ✅ Validación de datos
- ✅ Reporte detallado de errores
- ✅ Resumen de importación

**Columnas CSV soportadas:**
- `codigo` / `code` / `cod` / `barcode` → Código
- `nombre` / `name` / `producto` → Nombre
- `cantidad` / `quantity` / `stock` → Stock
- `costo` / `cost` → Costo
- `precio` / `price` / `pvp` → Precio
- `categoria` / `category` → Categoría

**Props:**
```tsx
interface CSVImporterProps {
  onSuccess: () => void;
}
```

---

## 🔍 Búsqueda y Filtros

### Búsqueda por Texto

```tsx
const { setFilters } = useProducts();

setFilters({ search: 'coca cola' });
// Busca en código Y nombre
```

### Filtro de Stock Bajo

```tsx
const { setFilters, lowStockProducts } = useProducts();

setFilters({ lowStock: true });
// Muestra solo productos con stock <= minStock
```

### Filtro por Categoría

```tsx
const { setFilters } = useProducts();

setFilters({ category: 'Bebidas' });
```

### Limpiar Filtros

```tsx
const { clearFilters } = useProducts();

clearFilters();
```

---

## 💾 Persistencia

Los productos se almacenan en:

1. **Supabase** (nube): Tabla `products`
2. **Zustand Store** (memoria): Estado local React

### Estructura de Datos

```typescript
interface Product {
  id: string;
  code: string;
  name: string;
  category?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🛠️ Servicios

### productsService

**Métodos:**
- `getAll()` - Obtener todos los productos
- `getByCode(code)` - Buscar por código
- `create(input)` - Crear producto
- `update(input)` - Actualizar producto
- `delete(id)` - Eliminar producto
- `importFromCSV(rows)` - Importación masiva
- `adjustStock(id, quantity)` - Ajustar stock

### csvParser

**Funciones:**
- `parseCSV(content)` - Parsear CSV a objetos
- `readFileAsText(file)` - Leer archivo

**Features:**
- Maneja comillas y comas dentro de campos
- Detección automática de headers
- Soporta múltiples variaciones de nombres de columnas

---

## 🎨 Página de Productos

**Ubicación:** `/products`

**Vistas:**
1. **Lista** - Tabla de todos los productos
2. **Crear** - Formulario de nuevo producto
3. **Editar** - Formulario de edición
4. **Importar** - Importador CSV

**Navegación:**
```
Lista → [+ Nuevo Producto] → Crear → Guardar → Lista
     → [📥 Importar CSV] → Importar → Lista
     → [Editar] → Editar → Guardar → Lista
```

---

## 📈 Estadísticas en Dashboard

El dashboard muestra:
- **Total de productos** en inventario
- **Productos con stock bajo** (alertas)

Integración:
```tsx
import { useLoadProducts, useProducts } from '@/features/products/hooks/useProducts';

const { products, lowStockProducts } = useProducts();
```

---

## 🔒 Permisos

| Acción | Cashier | Admin | Super Admin |
|--------|---------|-------|-------------|
| Ver productos | ✅ | ✅ | ✅ |
| Crear productos | ❌ | ✅ | ✅ |
| Editar productos | ❌ | ✅ | ✅ |
| Eliminar productos | ❌ | ✅ | ✅ |
| Importar CSV | ❌ | ✅ | ✅ |

---

## 🧪 Ejemplos de Uso

### Importar Productos desde Mónica 8.5

1. En Mónica 8.5, exportar productos a CSV
2. En Sabrosita POS, ir a `/products`
3. Click en "📥 Importar CSV"
4. Arrastrar archivo CSV exportado
5. Revisar resultado de importación

### Crear Producto Manualmente

1. Ir a `/products`
2. Click en "+ Nuevo Producto"
3. Llenar formulario:
   - Código: `7501055300082`
   - Nombre: `Coca Cola 500ml`
   - Categoría: `Bebidas`
   - Costo: `400`
   - Precio: `800`
   - Stock: `100`
4. Click en "Crear Producto"

### Editar Precio de un Producto

1. En `/products`, buscar producto
2. Click en "Editar"
3. Modificar precio
4. Click en "Actualizar Producto"

---

## 🔄 Sincronización

Los productos se sincronizan automáticamente con Supabase:
- **Crear/Editar/Eliminar**: Se guarda inmediatamente en Supabase
- **Lectura**: Se carga desde Supabase al montar la app
- **Caché local**: Zustand mantiene los productos en memoria para acceso rápido

---

## 🚧 Próximas Mejoras

- [ ] Paginación para catálogos grandes (>1000 productos)
- [ ] Imágenes de productos
- [ ] Códigos de barras generados automáticamente
- [ ] Historial de cambios de precio
- [ ] Exportación a PDF/Excel
- [ ] Etiquetas personalizadas
- [ ] Múltiples unidades de medida

---

*Feature completada: 2026-01-16*
