import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ search, setSearch, onSearchEnter }) {
  return (
    <div className="mb-6 relative group">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={onSearchEnter}
        placeholder="Cari lokasi, perangkat, merk..."
        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white transition-all shadow-sm"
      />
    </div>
  );
}
