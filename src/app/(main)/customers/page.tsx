'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { customersService } from '@/features/customers';
import type { Customer } from '@/features/customers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Users,
  Home,
  LogOut,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_email' | 'with_phone' | 'with_taxid'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    const data = await customersService.getAll();
    setCustomers(data.filter(c => !c.isGeneric));
    setIsLoading(false);
  };

  const handleCreate = () => {
    setFormData({ name: '', phone: '', email: '', address: '', taxId: '' });
    setEditingCustomer(null);
    setIsCreating(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      taxId: customer.taxId || '',
    });
    setEditingCustomer(customer);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    const result = editingCustomer
      ? await customersService.update(editingCustomer.id, formData)
      : await customersService.create(formData);

    if (result.success) {
      await loadCustomers();
      setIsCreating(false);
      setEditingCustomer(null);
    } else {
      alert(result.error || 'Error al guardar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    const result = await customersService.delete(id);
    if (result.success) {
      await loadCustomers();
    } else {
      alert(result.error || 'Error al eliminar cliente');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.taxId?.includes(searchTerm);

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'with_email' && c.email) ||
      (filterType === 'with_phone' && c.phone) ||
      (filterType === 'with_taxid' && c.taxId);

    return matchesSearch && matchesFilter;
  });

  const totalCustomers = customers.length;
  const customersWithEmail = customers.filter(c => c.email).length;
  const customersWithPhone = customers.filter(c => c.phone).length;
  const customersWithTaxId = customers.filter(c => c.taxId).length;
  const customersComplete = customers.filter(c => c.email && c.phone && c.taxId).length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="min-h-[4.5rem] md:h-20 px-3 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0">
          <Link href="/dashboard" className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 md:p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform flex-shrink-0">
            <Home className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
              <p className="text-base md:text-xl font-black text-white tracking-tight uppercase truncate">Gestión de Clientes</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Registro y administración</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          <div className="hidden lg:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-lg font-bold text-white tabular-nums">{currentTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{currentTime.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {!isCreating && (
              <button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-white font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 md:gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            )}

            <Link href="/logout">
              <button className="p-2.5 md:p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
                <LogOut className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {!isCreating ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
                <div className="p-3 bg-gradient-to-tr from-purple-500 to-purple-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Total Clientes</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums">{totalCustomers}</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">Registrados</p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Con Email</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums">{customersWithEmail}</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">
                  {totalCustomers > 0 ? `${((customersWithEmail / totalCustomers) * 100).toFixed(0)}%` : '0%'} del total
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
                <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Con Teléfono</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums">{customersWithPhone}</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">
                  {totalCustomers > 0 ? `${((customersWithPhone / totalCustomers) * 100).toFixed(0)}%` : '0%'} del total
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
                <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Con Cédula/RUC</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums">{customersWithTaxId}</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">
                  {totalCustomers > 0 ? `${((customersWithTaxId / totalCustomers) * 100).toFixed(0)}%` : '0%'} del total
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
                <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Datos Completos</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums">{customersComplete}</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">Con todo completo</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-white text-sm uppercase tracking-wide">
                  Filtros y Búsqueda
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Buscar Cliente
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, teléfono, email o cédula..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Filtrar por Datos
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="all" className="bg-[#020617] text-white">TODOS</option>
                    <option value="with_email" className="bg-[#020617] text-white">CON EMAIL</option>
                    <option value="with_phone" className="bg-[#020617] text-white">CON TELÉFONO</option>
                    <option value="with_taxid" className="bg-[#020617] text-white">CON CÉDULA/RUC</option>
                  </select>
                </div>
              </div>

              {(searchTerm || filterType !== 'all') && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Filtros activos:</span>
                  {searchTerm && (
                    <span className="bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-xs text-blue-300 rounded-lg">
                      Búsqueda: "{searchTerm}"
                    </span>
                  )}
                  {filterType !== 'all' && (
                    <span className="bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-xs text-blue-300 rounded-lg">
                      {filterType === 'with_email' && 'Con Email'}
                      {filterType === 'with_phone' && 'Con Teléfono'}
                      {filterType === 'with_taxid' && 'Con Cédula/RUC'}
                    </span>
                  )}
                  <button
                    onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                    className="bg-rose-600 hover:bg-rose-700 px-3 py-1 text-xs text-white font-bold rounded-lg transition-all"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            {/* Clientes Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <h3 className="font-black text-white text-sm uppercase tracking-wide">
                      Registro de Clientes
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Mostrando <span className="text-white font-black">{filteredCustomers.length}</span> de <span className="text-white font-black">{totalCustomers}</span> clientes
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">ID</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">Nombre</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">Teléfono</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">Email</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">Cédula/RUC</th>
                      <th className="px-3 py-3 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wide">Estado</th>
                      <th className="px-3 py-3 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
                          <p className="mt-4 text-white font-bold text-xs uppercase tracking-wide">Cargando clientes...</p>
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="bg-white/5 border border-white/10 p-6 mb-3 rounded-2xl">
                              <Users className="w-12 h-12 text-slate-600 mx-auto" />
                            </div>
                            <p className="text-sm font-black text-white uppercase tracking-wide">
                              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => {
                        const hasAllData = customer.email && customer.phone && customer.taxId;
                        const hasPartialData = customer.email || customer.phone || customer.taxId;

                        return (
                          <tr key={customer.id} className="hover:bg-white/5 transition-all">
                            <td className="px-3 py-3 text-xs font-mono text-slate-300">
                              {customer.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="px-3 py-3 text-xs text-white font-medium">
                              {customer.name}
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-300 font-medium">
                              {customer.phone || <span className="text-slate-500">-</span>}
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-300 font-medium">
                              {customer.email || <span className="text-slate-500">-</span>}
                            </td>
                            <td className="px-3 py-3 text-xs font-mono text-slate-300">
                              {customer.taxId || <span className="text-slate-500">-</span>}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {hasAllData ? (
                                <span className="inline-flex items-center bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 text-[10px] font-black text-emerald-300 rounded-lg">
                                  COMPLETO
                                </span>
                              ) : hasPartialData ? (
                                <span className="inline-flex items-center bg-amber-500/20 border border-amber-500/30 px-2 py-1 text-[10px] font-black text-amber-300 rounded-lg">
                                  PARCIAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-slate-500/20 border border-slate-500/30 px-2 py-1 text-[10px] font-black text-slate-300 rounded-lg">
                                  BÁSICO
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEdit(customer)}
                                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 p-1.5 rounded-lg transition-all duration-300"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                  onClick={() => handleDelete(customer.id)}
                                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/30 p-1.5 rounded-lg transition-all duration-300"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-white/10 bg-white/5 px-5 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-400">
                    MOSTRANDO: <span className="text-blue-400 font-black">{filteredCustomers.length}</span> de {totalCustomers} cliente{totalCustomers !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-medium">
                      Completos: <span className="text-white font-black">{customersComplete}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Formulario de creación/edición
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                  <p className="text-sm text-slate-500 font-medium">Complete la información del cliente</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Cédula/RUC
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Dirección
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-white font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-3 text-white font-bold rounded-xl transition-all"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            © 2026 Sabrosita POS v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
