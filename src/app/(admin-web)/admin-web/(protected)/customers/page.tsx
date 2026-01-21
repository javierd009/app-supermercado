'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Phone, Mail, ShoppingBag, TrendingUp } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
}

interface CustomerWithStats extends Customer {
  totalPurchases: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadCustomers();

    // Suscribirse a cambios en tiempo real
    const customersChannel = supabase
      .channel('admin-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        console.log('[Admin Customers] Cambio detectado');
        loadCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(customersChannel);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);

      // Obtener clientes
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .neq('name', 'Cliente General')
        .order('name', { ascending: true });

      if (customersError) throw customersError;

      // Obtener estadísticas de compras para cada cliente
      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: salesData } = await supabase
            .from('sales')
            .select('total')
            .eq('customer_id', customer.id)
            .is('canceled_at', null);

          const totalPurchases = salesData?.length || 0;
          const totalSpent = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;

          return {
            ...customer,
            totalPurchases,
            totalSpent,
          };
        })
      );

      setCustomers(customersWithStats);
      setFilteredCustomers(customersWithStats);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 px-4 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">Clientes</h1>
            <p className="text-slate-400 text-base font-medium mt-1">
              Base de datos de clientes y estadísticas
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-slate-400 text-sm font-bold uppercase">Total Clientes</p>
            <p className="text-white text-2xl font-black">{customers.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold uppercase">Clientes Activos</p>
            <p className="text-green-400 text-xl font-black">
              {customers.filter((c) => c.totalPurchases > 0).length}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold uppercase">Ventas Totales</p>
            <p className="text-blue-400 text-xl font-black">
              {customers.reduce((sum, c) => sum + c.totalPurchases, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="px-4 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 mt-4 font-medium">Cargando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-bold">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-all"
              >
                {/* Customer Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-black text-xl mb-1">{customer.name}</h3>
                    <div className="flex flex-col gap-1 text-slate-400 text-base font-medium">
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-slate-400 text-sm font-bold uppercase">Cliente desde</p>
                    <p className="text-white text-base font-bold">{formatDate(customer.created_at)}</p>
                  </div>
                </div>

                {/* Customer Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="w-4 h-4 text-blue-400" />
                      <p className="text-slate-400 text-sm font-bold uppercase">Compras</p>
                    </div>
                    <p className="text-white text-2xl font-black">{customer.totalPurchases}</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <p className="text-slate-400 text-sm font-bold uppercase">Total Gastado</p>
                    </div>
                    <p className="text-white text-2xl font-black">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>

                {/* Notes */}
                {customer.notes && (
                  <div className="mt-3 bg-white/5 rounded-lg p-3">
                    <p className="text-slate-300 text-base font-medium">{customer.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
