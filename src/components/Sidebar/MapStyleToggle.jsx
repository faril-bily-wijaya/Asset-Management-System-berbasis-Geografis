import React from 'react';
import { MapPin, Layers } from 'lucide-react';

export default function MapStyleToggle({ mapStyle, setMapStyle }) {
  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tampilan Peta</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMapStyle('street')}
          className={`py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all ${mapStyle === 'street' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <MapPin className="w-3 h-3" />
          Jalan (Street)
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all ${mapStyle === 'satellite' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Layers className="w-3 h-3" />
          Satelit
        </button>
      </div>
    </div>
  );
}
