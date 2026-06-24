import React, { useState } from 'react';
import { Server, Zap, Info } from 'lucide-react';

export default function DeviceCategoryFilter({ filter, setFilter }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori Perangkat</h3>
        <div className="relative">
          <button
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
          {showInfo && (
            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl z-[100] border border-slate-700">
              <p className="font-bold mb-1 text-red-400">Catu Daya mencakup:</p>
              <p className="text-slate-300 leading-relaxed">GENSET, BATTERE, RECTIFIER, MDP, ATS, TANGKI, PDB, AVR, INVERTER, UPS.</p>
              <p className="font-bold mt-2 mb-1 text-blue-400">Non-Catu Daya:</p>
              <p className="text-slate-300 leading-relaxed">Semua tipe selain di atas (OSASE, AC SPLIT, ROUTER, dsb).</p>
              <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${filter === 'ALL' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 shadow-sm ring-1 ring-red-100 dark:ring-red-900' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          <span className="font-semibold text-sm">Semua Perangkat</span>
        </button>

        <button
          onClick={() => setFilter('CATU_DAYA')}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${filter === 'CATU_DAYA' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 shadow-sm ring-1 ring-orange-100 dark:ring-orange-900' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${filter === 'CATU_DAYA' ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-500'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Catu Daya</span>
          </div>
        </button>

        <button
          onClick={() => setFilter('NON_CATU_DAYA')}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${filter === 'NON_CATU_DAYA' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${filter === 'NON_CATU_DAYA' ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-500'}`}>
              <Server className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Non-Catu Daya</span>
          </div>
        </button>
      </div>
    </div>
  );
}
