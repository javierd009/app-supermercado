'use client';

import { useState, useEffect } from 'react';
import { customersService } from '@/features/customers';
import type { Customer } from '@/features/customers';
import { User, Plus, X, Check } from 'lucide-react';

interface Props {
  selectedCustomerId: string;
  onCustomerChange: (customerId: string) => void;
}

export function CustomerSelector({ selectedCustomerId, onCustomerChange }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    const data = await customersService.getAll();
    setCustomers(data);
    setIsLoading(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert('Ingrese un nombre de cliente');
      return;
    }

    const result = await customersService.createQuick(newCustomerName.trim());
    if (result.success && result.customer) {
      setCustomers([...customers, result.customer]);
      onCustomerChange(result.customer.id);
      setNewCustomerName('');
      setIsCreating(false);
    } else {
      alert(result.error || 'Error al crear cliente');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/[0.08] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
              Cliente / Entidad
            </p>
            <p className="text-sm font-black text-white leading-none">
              {selectedCustomer?.name || 'Cargando...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`p-2 rounded-lg transition-all ${
            isCreating
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              : 'bg-white/5 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400'
          }`}
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {isCreating ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCustomer();
            }}
            placeholder="Nombre completo..."
            autoFocus
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={handleCreateCustomer}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all active:scale-95"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <select
          value={selectedCustomerId}
          onChange={(e) => onCustomerChange(e.target.value)}
          disabled={isLoading}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-white/[0.15] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <option className="bg-[#020617] text-white">Cargando lista...</option>
          ) : (
            <>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id} className="bg-[#020617] text-white">
                  {customer.name} {customer.isGeneric ? '(Cliente Contado)' : ''}
                </option>
              ))}
            </>
          )}
        </select>
      )}
    </div>
  );
}
