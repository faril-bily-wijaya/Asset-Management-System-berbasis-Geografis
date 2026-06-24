import React from 'react';
import { Menu, LocateFixed, Flame, Network, Hexagon, Truck } from 'lucide-react';

export default function MapFloatingButtons({
  onOpenSidebar, onGPS,
  isHeatmapMode, onToggleHeatmap,
  showTopology, onToggleTopology,
  showCoverage, onToggleCoverage,
  showMobileGenset, onToggleMobileGenset,
}) {
  return (
    <>
      <button
        onClick={onOpenSidebar}
        className="absolute top-4 left-4 z-[1000] p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 md:hidden hover:bg-slate-50 dark:hover:bg-slate-700"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* GPS Button */}
      <button
        onClick={onGPS}
        className="absolute bottom-6 right-6 z-[1000] p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95"
        title="Lacak Lokasi Saya"
      >
        <LocateFixed className="w-6 h-6" />
      </button>

      {/* Control Buttons Group */}
      <div className="absolute bottom-24 right-6 z-[1000] flex flex-col gap-2">
        {/* Mobile Genset Toggle */}
        <button
          onClick={onToggleMobileGenset}
          className={`p-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95 ${showMobileGenset ? 'bg-emerald-600 text-white' : 'bg-slate-800 dark:bg-slate-700 text-slate-300'}`}
          title="Daftar Mobile Genset"
        >
          <Truck className="w-6 h-6" />
        </button>

        {/* Heatmap Toggle */}
        <button
          onClick={onToggleHeatmap}
          className={`p-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95 ${isHeatmapMode ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 dark:bg-slate-700 text-slate-300'}`}
          title="Mode Heatmap Kerusakan"
        >
          <Flame className="w-6 h-6" />
        </button>

        {/* Coverage Toggle */}
        <button
          onClick={onToggleCoverage}
          className={`p-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95 ${showCoverage ? 'bg-purple-600 text-white' : 'bg-slate-800 dark:bg-slate-700 text-slate-300'}`}
          title="Toggle Area Coverage"
        >
          <Hexagon className="w-6 h-6" />
        </button>

        {/* Topology Toggle */}
        <button
          onClick={onToggleTopology}
          className={`p-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95 ${showTopology ? 'bg-indigo-600 text-white' : 'bg-slate-800 dark:bg-slate-700 text-slate-300'}`}
          title="Tampilkan Topologi Jaringan"
        >
          <Network className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}
