'use client';

import { useState } from 'react';
import { useUpdateExchangeRate, useCashRegister } from '../hooks/useCashRegister';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ExchangeRateEditor() {
  const { user } = useAuth();
  const { currentRegister } = useCashRegister();
  const { updateExchangeRate } = useUpdateExchangeRate();

  const [isEditing, setIsEditing] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Si no hay caja abierta, no mostrar nada
  if (!currentRegister) {
    return null;
  }

  // Si no es super_admin, mostrar solo lectura
  if (user?.role !== 'super_admin') {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-lg">
        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">
          TIPO DE CAMBIO
        </div>
        <div className="text-sm font-black text-white">
          $1 = ₡{currentRegister.exchangeRate.toFixed(2)}
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setNewRate(currentRegister.exchangeRate.toString());
    setIsEditing(true);
  };

  const handleSave = async () => {
    const rate = parseFloat(newRate);

    if (isNaN(rate) || rate <= 0) {
      alert('Tipo de cambio inválido');
      return;
    }

    setIsSaving(true);

    const result = await updateExchangeRate(rate);

    if (result.success) {
      setIsEditing(false);
    } else {
      alert(result.error || 'Error al actualizar');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewRate('');
  };

  if (!isEditing) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">
              TIPO DE CAMBIO
            </div>
            <div className="text-sm font-black text-white">
              $1 = ₡{currentRegister.exchangeRate.toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 px-2 py-1 text-[10px] font-bold text-blue-400 rounded-lg transition-all"
          >
            EDITAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-500/20 backdrop-blur-xl border border-blue-500/50 px-4 py-2 rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="text-[9px] text-blue-400 font-bold uppercase tracking-wide mb-1">
            NUEVO TIPO DE CAMBIO
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-white">
              $1 =
            </span>
            <input
              type="number"
              step="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              autoFocus
              disabled={isSaving}
              className="w-20 border border-white/20 bg-white/10 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 rounded"
            />
            <span className="text-xs font-bold text-white">
              ₡
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600 px-2 py-1 text-xs font-bold text-white rounded transition-all disabled:opacity-50"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 text-xs font-bold text-white rounded transition-all disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
