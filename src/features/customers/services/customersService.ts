import { databaseAdapter } from '@/lib/database';
import type { Customer, CreateCustomerInput } from '../types';
import { GENERIC_CUSTOMER_ID } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

class CustomersService {
  /**
   * Obtener todos los clientes
   */
  async getAll(): Promise<Customer[]> {
    try {
      console.log('[CustomersService] Obteniendo todos los clientes...');

      const customers = await databaseAdapter.query<CustomerRow>(
        'SELECT id, name, phone, email, address, created_at, updated_at FROM customers ORDER BY name ASC'
      );

      console.log(`[CustomersService] ✅ ${customers.length} clientes obtenidos`);

      return customers.map(this.mapToCustomer);
    } catch (error: any) {
      console.error('[CustomersService] Error obteniendo clientes:', {
        message: error?.message || 'Unknown error',
        name: error?.name,
        stack: error?.stack,
      });
      return [];
    }
  }

  /**
   * Obtener cliente genérico
   */
  async getGenericCustomer(): Promise<Customer | null> {
    try {
      const customers = await databaseAdapter.query<CustomerRow>(
        'SELECT id, name, phone, email, address, created_at, updated_at FROM customers WHERE id = ? LIMIT 1',
        [GENERIC_CUSTOMER_ID]
      );

      if (!customers || customers.length === 0) return null;

      return this.mapToCustomer(customers[0]);
    } catch (error) {
      console.error('Get generic customer error:', error);
      return null;
    }
  }

  /**
   * Crear cliente completo
   */
  async create(input: CreateCustomerInput): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const customerId = uuidv4();
      const now = new Date().toISOString();

      const customerData = {
        id: customerId,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        created_at: now,
        updated_at: now,
      };

      // Insertar usando databaseAdapter (maneja online/offline automáticamente)
      await databaseAdapter.insert('customers', customerData);

      console.log('[CustomersService] ✅ Cliente creado:', input.name);

      return {
        success: true,
        customer: this.mapToCustomer(customerData),
      };
    } catch (error: any) {
      console.error('Create customer error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear cliente',
      };
    }
  }

  /**
   * Crear cliente rápido (solo nombre)
   */
  async createQuick(name: string): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    return this.create({ name });
  }

  /**
   * Actualizar cliente
   */
  async update(
    id: string,
    input: Partial<CreateCustomerInput>
  ): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const updates: any = { updated_at: new Date().toISOString() };

      if (input.name !== undefined) updates.name = input.name;
      if (input.phone !== undefined) updates.phone = input.phone || null;
      if (input.email !== undefined) updates.email = input.email || null;
      if (input.address !== undefined) updates.address = input.address || null;

      // Actualizar usando databaseAdapter (maneja online/offline automáticamente)
      await databaseAdapter.update('customers', id, updates);

      console.log('[CustomersService] ✅ Cliente actualizado:', id);

      // Obtener el cliente actualizado
      const updatedCustomer = await databaseAdapter.query<CustomerRow>(
        'SELECT id, name, phone, email, address, created_at, updated_at FROM customers WHERE id = ? LIMIT 1',
        [id]
      );

      if (!updatedCustomer || updatedCustomer.length === 0) {
        throw new Error('Cliente no encontrado después de actualizar');
      }

      return {
        success: true,
        customer: this.mapToCustomer(updatedCustomer[0]),
      };
    } catch (error: any) {
      console.error('Update customer error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar cliente',
      };
    }
  }

  /**
   * Eliminar cliente
   */
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar que no sea el cliente genérico
      if (id === GENERIC_CUSTOMER_ID) {
        return {
          success: false,
          error: 'No se puede eliminar el cliente genérico',
        };
      }

      // Verificar que no tenga ventas asociadas
      const sales = await databaseAdapter.query<{ id: string }>(
        'SELECT id FROM sales WHERE customer_id = ? LIMIT 1',
        [id]
      );

      if (sales && sales.length > 0) {
        return {
          success: false,
          error: 'No se puede eliminar: el cliente tiene ventas registradas',
        };
      }

      // Eliminar cliente usando databaseAdapter
      await databaseAdapter.delete('customers', id);

      console.log('[CustomersService] ✅ Cliente eliminado:', id);

      return { success: true };
    } catch (error: any) {
      console.error('Delete customer error:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar cliente',
      };
    }
  }

  /**
   * Mapear datos de DB a Customer
   */
  private mapToCustomer(data: CustomerRow): Customer {
    return {
      id: data.id,
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      // NOTA: SQLite no tiene tax_id ni is_generic
      taxId: undefined,
      isGeneric: data.id === GENERIC_CUSTOMER_ID,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const customersService = new CustomersService();
