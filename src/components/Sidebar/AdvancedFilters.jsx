import React from 'react';
import { Filter } from 'lucide-react';

export default function AdvancedFilters({
  statusFilter, setStatusFilter, availableStatuses,
  conditionFilter, setConditionFilter, availableConditions,
  brandFilter, setBrandFilter, availableBrands,
}) {
  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <Filter className="w-3.5 h-3.5" /> Advanced Filters
      </h3>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Semua Status</option>
              {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Kondisi</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Semua Kondisi</option>
              {availableConditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Merk / Brand</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">Semua Merk</option>
            {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
