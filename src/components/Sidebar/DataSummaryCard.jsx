import React from 'react';
import { PieChart as PieChartIcon, BarChart3, Download, Network } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function DataSummaryCard({ stats, loading, chartData, onShowAnalytics, onShowNetwork, onExportGlobal }) {
  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <PieChartIcon className="w-3.5 h-3.5" /> Ringkasan Data
      </h3>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{loading ? '-' : stats.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Total Perangkat</p>
        </div>
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={35}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={onShowAnalytics}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" /> Aset
          </button>
          <button
            onClick={onShowNetwork}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-bold text-xs border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Network className="w-4 h-4" /> Jaringan
          </button>
        </div>
        <button
          onClick={onExportGlobal}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          title="Unduh semua data yang sedang ter-filter"
        >
          <Download className="w-4 h-4" /> Ekspor Data (Semua)
        </button>
      </div>
    </div>
  );
}
