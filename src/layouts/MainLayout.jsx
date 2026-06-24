import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { PanelLeftClose, PanelLeft } from 'lucide-react';

import { useFilterContext } from '../contexts/FilterContext';
import { useMapContext } from '../contexts/MapContext';
import Sidebar from '../components/Sidebar/Sidebar';

export default function MainLayout() {
  const filters = useFilterContext();
  const mapData = useMapContext();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setIsSidebarCollapsed(savedCollapsed === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      if (mapData.locationsData.length > 0) {
        const target = mapData.locationsData[0];
        mapData.setActiveLocation(target.coords);
        navigate('/'); // Go back to map if searching
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
    }
  };

  const chartData = [
    { name: 'Catu Daya', value: mapData.stats.catuDaya, color: '#f97316' },
    { name: 'Non-Catu', value: mapData.stats.nonCatuDaya, color: '#3b82f6' }
  ];

  const exportGlobalCSV = () => {
    let allDevices = [];
    mapData.locationsData.forEach(loc => {
      loc.devices.forEach(d => allDevices.push({ LOKASI: loc.name, ...d }));
    });
    if (allDevices.length === 0) return toast.error("Tidak ada data untuk diekspor!");
    const headers = ['LOKASI', 'DEVICE_CODE', 'DEVICE_TYPE', 'BRAND', 'CAP_REAL', 'CONDITION', 'STATUS'];
    const rows = allDevices.map(d => headers.map(h => `"${d[h] || ''}"`).join(';'));
    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Global_Infranexia.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengunduh ${allDevices.length} data!`);
  };

  // Handle navigation from Sidebar buttons
  const handleNavigate = (page) => {
    switch (page) {
      case 'management':
        navigate('/manajemen');
        break;
      default:
        break;
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-slate-900/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        search={filters.search}
        setSearch={filters.setSearch}
        onSearchEnter={handleSearchEnter}
        stats={mapData.stats}
        loading={mapData.loading}
        chartData={chartData}
        onShowAnalytics={() => navigate('/analytics')}
        onShowNetwork={() => navigate('/network')}
        onExportGlobal={exportGlobalCSV}
        mapStyle={mapData.mapStyle}
        setMapStyle={mapData.setMapStyle}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Floating Expand Button when collapsed */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={toggleSidebar}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group"
            title="Tampilkan Sidebar"
          >
            <PanelLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className={`flex-1 relative z-0 bg-slate-100 dark:bg-slate-900 overflow-hidden transition-all duration-300`}>
        <Outlet context={{ setIsSidebarOpen }} />
      </div>
    </div>
  );
}
