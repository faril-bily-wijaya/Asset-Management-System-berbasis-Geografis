import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, CircleMarker, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Server, Activity, Search, MapPin, Zap, HardDrive, Layers, PieChart as PieChartIcon, Menu, X, Download, Moon, Sun, Filter, LocateFixed, BarChart3, Info, Edit2, Save, Flame, Network } from 'lucide-react';
import { isCatuDaya } from './utils/parser';
import { generateTopologyLinks } from './utils/topology';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// Custom icons using Leaflet DivIcon
const catuDayaIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow-lg text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const nonCatuDayaIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const mixedIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 border-2 border-white shadow-lg text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const gpsIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 border-[3px] border-white shadow-xl"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapController({ activeLocation }) {
  const map = useMap();
  useEffect(() => {
    if (activeLocation) {
      map.flyTo(activeLocation, 14, { duration: 1.5 });
    }
  }, [activeLocation, map]);
  return null;
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'ALL';
  const statusFilter = searchParams.get('status') || 'ALL';
  const conditionFilter = searchParams.get('condition') || 'ALL';
  const brandFilter = searchParams.get('brand') || 'ALL';
  const search = searchParams.get('search') || '';

  const updateSearchParams = (key, val) => {
    setSearchParams(prev => {
      if (val && val !== 'ALL' && val !== '') prev.set(key, val);
      else prev.delete(key);
      return prev;
    });
  };

  const setFilter = (val) => updateSearchParams('filter', val);
  const setStatusFilter = (val) => updateSearchParams('status', val);
  const setConditionFilter = (val) => updateSearchParams('condition', val);
  const setBrandFilter = (val) => updateSearchParams('brand', val);
  const setSearch = (val) => updateSearchParams('search', val);

  const [mapStyle, setMapStyle] = useState('street');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalData, setModalData] = useState(null); 
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [showTopology, setShowTopology] = useState(true); // Default diaktifkan untuk pameran
  
  // Edit State
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const [rawLocationsData, setRawLocationsData] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { availableBrands, availableStatuses, availableConditions } = useMemo(() => {
    const brands = new Set();
    const statuses = new Set();
    const conditions = new Set();
    rawLocationsData.forEach(loc => {
      loc.devices.forEach(d => {
        const isCD = isCatuDaya(d.DEVICE_TYPE);
        if (filter === 'CATU_DAYA' && !isCD) return;
        if (filter === 'NON_CATU_DAYA' && isCD) return;
        if (d.BRAND) brands.add(d.BRAND);
        if (d.STATUS) statuses.add(d.STATUS);
        if (d.CONDITION) conditions.add(d.CONDITION);
      });
    });
    return { 
      availableBrands: Array.from(brands).sort(), 
      availableStatuses: Array.from(statuses).sort(),
      availableConditions: Array.from(conditions).sort()
    };
  }, [rawLocationsData, filter]);

  const topologyLinks = useMemo(() => {
    return generateTopologyLinks(locationsData);
  }, [locationsData]);

  const [activeLocation, setActiveLocation] = useState(null);
  const [userGPSLocation, setUserGPSLocation] = useState(null);
  const [addressMap, setAddressMap] = useState(() => {
    try {
      const saved = localStorage.getItem('addressCache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [stats, setStats] = useState({ total: 0, catuDaya: 0, nonCatuDaya: 0, operational: 0, nonOperational: 0 });

  useEffect(() => {
    // Try to load secret data first (for local dev with real data), fallback to public anonymous data
    fetch('/DATA_SECRET/data-grouped.json')
      .then(res => {
        if (!res.ok) throw new Error('Secret data not found, falling back to public data');
        return res.json();
      })
      .catch(() => fetch('/DATA/data-grouped.json').then(res => res.json()))
      .then(data => {
        setRawLocationsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat data", err);
        toast.error("Gagal memuat data sistem!");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeLocation) {
      const key = `${activeLocation[0]},${activeLocation[1]}`;
      if (!addressMap[key]) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${activeLocation[0]}&lon=${activeLocation[1]}`)
          .then(res => res.json())
          .then(data => {
            const newAddr = data && data.display_name ? data.display_name : "Detail alamat tidak ditemukan di koordinat ini.";
            setAddressMap(prev => {
              const updated = { ...prev, [key]: newAddr };
              localStorage.setItem('addressCache', JSON.stringify(updated));
              return updated;
            });
            if (data && data.display_name) toast.success("Alamat berhasil dimuat!");
            else toast.error("Detail alamat kosong.");
          })
          .catch(err => {
            console.error(err);
            setAddressMap(prev => ({ ...prev, [key]: "Gagal memuat alamat detail." }));
            toast.error("Gagal memuat alamat dari OpenStreetMap.");
          });
      }
    }
  }, [activeLocation, addressMap]);

  useEffect(() => {
    if (!rawLocationsData.length) return;

    let totalDevs = 0;
    let cDaya = 0;
    let nonCDaya = 0;
    let op = 0;
    let nonOp = 0;

    const newLocations = rawLocationsData.map(loc => {
      const filteredDevices = loc.devices.filter(d => {
        const isCD = isCatuDaya(d.DEVICE_TYPE);
        if (filter === 'CATU_DAYA' && !isCD) return false;
        if (filter === 'NON_CATU_DAYA' && isCD) return false;
        
        if (statusFilter !== 'ALL' && d.STATUS !== statusFilter) return false;
        if (conditionFilter !== 'ALL' && d.CONDITION !== conditionFilter) return false;
        if (brandFilter !== 'ALL' && d.BRAND !== brandFilter) return false;

        if (search) {
          const q = search.toLowerCase();
          if (!d.LOCATION.toLowerCase().includes(q) && 
              !(d.DEVICE_CODE && d.DEVICE_CODE.toLowerCase().includes(q)) &&
              !(d.DEVICE_TYPE && d.DEVICE_TYPE.toLowerCase().includes(q)) &&
              !(d.BRAND && d.BRAND.toLowerCase().includes(q)) &&
              !(d.CONDITION && d.CONDITION.toLowerCase().includes(q))) {
            return false;
          }
        }
        return true;
      });

      let catuDayaCount = 0;
      let nonCatuDayaCount = 0;
      filteredDevices.forEach(d => {
        if (isCatuDaya(d.DEVICE_TYPE)) { catuDayaCount++; cDaya++; } else { nonCatuDayaCount++; nonCDaya++; }
        if (d.STATUS === 'OPERATIONAL') op++; else nonOp++;
      });

      totalDevs += filteredDevices.length;

      return {
        ...loc,
        devices: filteredDevices,
        catuDayaCount,
        nonCatuDayaCount
      };
    }).filter(loc => loc.devices.length > 0);

    setLocationsData(newLocations);
    setStats({ total: totalDevs, catuDaya: cDaya, nonCatuDaya: nonCDaya, operational: op, nonOperational: nonOp });
  }, [rawLocationsData, filter, statusFilter, conditionFilter, brandFilter, search]);

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      if (locationsData.length > 0) {
        const target = locationsData[0];
        setActiveLocation(target.coords);
        if (locationsData.length === 1 && target.devices.length === 1) {
          setModalData({ name: target.name, devices: target.devices, coords: target.coords });
          toast.success(`Perangkat spesifik ditemukan!`);
        } else {
          toast.success(`Ditemukan ${locationsData.length} lokasi!`);
        }
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      } else {
        toast.error("Tidak ada lokasi yang cocok.");
      }
    }
  };

  const downloadCSV = (locationName, devices) => {
    const headers = ['DEVICE_CODE', 'DEVICE_TYPE', 'BRAND', 'CAP_REAL', 'CONDITION', 'STATUS'];
    const rows = devices.map(d => headers.map(h => `"${d[h] || ''}"`).join(';'));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_${locationName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV berhasil diunduh!");
  };

  const exportGlobalCSV = () => {
    let allDevices = [];
    locationsData.forEach(loc => {
      loc.devices.forEach(d => allDevices.push({ LOKASI: loc.name, ...d }));
    });
    if (allDevices.length === 0) return toast.error("Tidak ada data untuk diekspor!");
    const headers = ['LOKASI', 'DEVICE_CODE', 'DEVICE_TYPE', 'BRAND', 'CAP_REAL', 'CONDITION', 'STATUS'];
    const rows = allDevices.map(d => headers.map(h => `"${d[h] || ''}"`).join(';'));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Global_Infranexia.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengunduh ${allDevices.length} data!`);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung Geolocation.");
      return;
    }
    toast.loading("Mencari lokasi Anda...", { id: 'gps' });
    navigator.geolocation.getCurrentPosition((position) => {
      toast.success("Lokasi ditemukan!", { id: 'gps' });
      const coords = [position.coords.latitude, position.coords.longitude];
      setUserGPSLocation(coords);
      setActiveLocation(coords);
    }, () => {
      toast.error("Gagal mendapatkan lokasi.", { id: 'gps' });
    });
  };

  const handleSaveEdit = () => {
    // Update rawLocationsData
    setRawLocationsData(prev => prev.map(loc => {
      if (loc.name === modalData.name) {
        return {
          ...loc,
          devices: loc.devices.map(d => {
            if (d.DEVICE_CODE === editingDeviceId) {
              return { ...d, ...editForm };
            }
            return d;
          })
        };
      }
      return loc;
    }));
    
    // Update modalData view
    setModalData(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.DEVICE_CODE === editingDeviceId ? { ...d, ...editForm } : d)
    }));

    setEditingDeviceId(null);
    toast.success("Perubahan disimpan sementara. Jangan lupa unduh CSV!");
  };

  const chartData = [
    { name: 'Catu Daya', value: stats.catuDaya, color: '#f97316' }, 
    { name: 'Non-Catu', value: stats.nonCatuDaya, color: '#3b82f6' } 
  ];

  const statusPieData = [
    { name: 'Operational', value: stats.operational, color: '#10b981' },
    { name: 'Non-Operational', value: stats.nonOperational, color: '#ef4444' }
  ];

  // Top 10 locations for bar chart
  const topLocations = [...locationsData]
    .sort((a, b) => b.devices.length - a.devices.length)
    .slice(0, 10)
    .map(l => ({ name: l.name, Total: l.devices.length }));

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />

      {/* Mobile Sidebar Overlay */}
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

      {/* Sidebar */}
      <div className={`absolute md:relative z-20 h-full w-[360px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
          <div>
            <img 
              src="/logo.png" 
              alt="Infranexia by Telkom Indonesia" 
              className="h-10 object-contain drop-shadow-sm dark:brightness-200 dark:grayscale"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                document.getElementById('fallback-logo').style.display = 'flex';
              }}
            />
            <h1 id="fallback-logo" className="hidden text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              Infra<span className="text-red-500">nexia</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Inventori Perangkat Sumbagsel</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-6 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder="Cari lokasi, perangkat, merk..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white transition-all shadow-sm"
            />
          </div>

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
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAnalytics(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-sm border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <BarChart3 className="w-4 h-4" /> Dashboard
              </button>
              <button 
                onClick={exportGlobalCSV}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                title="Unduh semua data yang sedang ter-filter"
              >
                <Download className="w-4 h-4" /> Ekspor (Semua)
              </button>
            </div>
          </div>

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
        </div>
      </div>

      {/* Map Container */}
      <div className={`flex-1 relative z-0 bg-slate-100 dark:bg-slate-900 ${mapStyle === 'satellite' ? 'map-satellite' : ''}`}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-[1000] p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 md:hidden hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* GPS Button */}
        <button 
          onClick={handleGPS}
          className="absolute bottom-6 right-6 z-[1000] p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95"
          title="Lacak Lokasi Saya"
        >
          <LocateFixed className="w-6 h-6" />
        </button>

        {/* Heatmap Toggle */}
        <button 
          onClick={() => setIsHeatmapMode(!isHeatmapMode)}
          className={`absolute bottom-24 right-6 z-[1000] p-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95 ${isHeatmapMode ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 dark:bg-slate-700 text-slate-300'}`}
          title="Mode Heatmap Kerusakan"
        >
          <Flame className="w-6 h-6" />
        </button>

        {/* Topology Toggle */}
        <button 
          onClick={() => setShowTopology(!showTopology)}
          className={`absolute bottom-44 right-6 z-[1000] p-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95 ${showTopology ? 'bg-indigo-600 text-white' : 'bg-slate-800 dark:bg-slate-700 text-slate-300'}`}
          title="Tampilkan Topologi Jaringan"
        >
          <Network className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium text-slate-700 dark:text-slate-200">Memuat Data Perangkat...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <MapContainer center={[-3.1, 103.5]} zoom={7.5} className="w-full h-full" zoomControl={false} maxZoom={22}>
          <MapController activeLocation={activeLocation} />
          {mapStyle === 'street' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/intl/id_id/help/terms_maps/">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={22}
              maxNativeZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/intl/id_id/help/terms_maps/">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={22}
              maxNativeZoom={19}
            />
          )}
          
          {userGPSLocation && (
            <Marker position={userGPSLocation} icon={gpsIcon}>
              <Popup>Lokasi Anda Saat Ini</Popup>
            </Marker>
          )}

          {/* Render Topology Links */}
          {showTopology && topologyLinks.map((link, idx) => {
            // Logika Korelasi Jaringan (Domino Effect yang realistis)
            const brokenDevices = link.target.devices ? link.target.devices.filter(d => d.STATUS !== 'OPERATIONAL') : [];
            
            // Pisahkan perangkat yang benar-benar memutus jaringan (Kritis) vs sekadar peringatan (Warning)
            const criticalDevices = brokenDevices.filter(d => 
              ['ROUTER', 'SWITCH', 'OLT', 'SERVER', 'GENSET', 'RECTIFIER', 'BATTERE', 'MDP'].some(type => d.DEVICE_TYPE.includes(type))
            );
            
            const warningDevices = brokenDevices.filter(d => 
              ['AC SPLIT', 'EXHAUST', 'LAMPU'].some(type => d.DEVICE_TYPE.includes(type)) || !criticalDevices.includes(d)
            );

            const isCritical = criticalDevices.length > 0;
            const isWarning = warningDevices.length > 0 && !isCritical;
            
            // Penentuan Warna: Merah jika Kritis (Jaringan putus), Oranye jika Warning (Lingkungan/Suhu), Biru jika Normal
            let linkColor = link.type === 'CORE_LINK' ? '#6366f1' : '#3b82f6'; // Default Normal
            if (isCritical) linkColor = '#ef4444'; // Merah (Kritis)
            else if (isWarning) linkColor = '#f59e0b'; // Oranye (Warning)
            
            const linkWeight = link.type === 'CORE_LINK' ? 4 : 2;
            const linkDash = link.type === 'CORE_LINK' ? '' : '5, 10';

            return (
              <Polyline
                key={`link-${idx}`}
                positions={[link.source.coords, link.target.coords]}
                eventHandlers={{
                  click: () => {
                    setActiveLocation(link.target.coords);
                    setModalData({ name: link.target.name, devices: link.target.devices, coords: link.target.coords });
                  }
                }}
                pathOptions={{
                  color: linkColor,
                  weight: linkWeight,
                  opacity: 0.7,
                  dashArray: linkDash
                }}
              >
                <Tooltip sticky direction="top" className="premium-tooltip">
                  <div className="p-1 min-w-[200px]">
                    <p className="font-bold text-slate-800 border-b pb-1 mb-1">Link Jaringan</p>
                    <p className="text-sm">Dari: <span className="font-semibold">{link.source.name}</span></p>
                    <p className="text-sm">Ke: <span className="font-semibold">{link.target.name}</span></p>
                    <p className="text-xs text-slate-500 mt-1">Jarak: {Math.round(link.distance)} km</p>
                    
                    {isCritical && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-xs text-red-600 font-bold mb-1">🚨 Jaringan Terputus!</p>
                        <p className="text-[10px] text-red-500 mb-1">Penyebab Kritis:</p>
                        <ul className="text-[10px] text-red-500 list-disc pl-3">
                          {criticalDevices.slice(0, 3).map((d, i) => (
                            <li key={i}>{d.DEVICE_TYPE} ({d.STATUS})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isWarning && (
                      <div className="mt-2 pt-2 border-t border-orange-200">
                        <p className="text-xs text-orange-600 font-bold mb-1">⚠️ Peringatan Lingkungan</p>
                        <p className="text-[10px] text-orange-500 mb-1">Jaringan aman, namun ada isu:</p>
                        <ul className="text-[10px] text-orange-500 list-disc pl-3">
                          {warningDevices.slice(0, 3).map((d, i) => (
                            <li key={i}>{d.DEVICE_TYPE} ({d.STATUS})</li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium italic">(Bisa menyebabkan *Overheat* jika dibiarkan)</p>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {isHeatmapMode ? (
            locationsData.map((loc, idx) => {
              const brokenCount = loc.devices.filter(d => d.STATUS !== 'OPERATIONAL').length;
              if (brokenCount === 0) return null;
              const radius = Math.min(15 + (brokenCount * 3), 60);
              return (
                <CircleMarker 
                  key={`heat-${idx}`} 
                  center={loc.coords} 
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6, weight: 2 }} 
                  radius={radius}
                  eventHandlers={{ click: () => { setActiveLocation(loc.coords); setModalData({ name: loc.name, devices: loc.devices, coords: loc.coords }); } }}
                >
                  <Tooltip className="premium-tooltip" direction="top" opacity={1}>
                    <div className="font-bold text-slate-800 text-center p-2">
                      <p className="text-lg mb-1">{loc.name}</p>
                      <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">{brokenCount} Perangkat Bermasalah</span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })
          ) : (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={40} spiderfyOnMaxZoom={true} showCoverageOnHover={false}>
              {locationsData.map((loc, idx) => {
                let icon = mixedIcon;
                if (loc.catuDayaCount > 0 && loc.nonCatuDayaCount === 0) icon = catuDayaIcon;
                else if (loc.nonCatuDayaCount > 0 && loc.catuDayaCount === 0) icon = nonCatuDayaIcon;

                return (
                  <Marker key={idx} position={loc.coords} icon={icon} eventHandlers={{ click: () => { setActiveLocation(loc.coords); setModalData(loc); } }}>
                    <Tooltip className="premium-tooltip" direction="top" offset={[0, -35]} opacity={1}>
                      <div className="p-1 min-w-[260px] max-w-[320px]">
                        <h3 className="font-bold text-lg text-slate-800">{loc.name}</h3>
                        <div className="flex items-start gap-1.5 mt-1 mb-3 pb-2 border-b">
                          <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-500 leading-tight">
                            {addressMap[`${loc.coords[0]},${loc.coords[1]}`] || 'Memuat alamat detail...'}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                          {loc.catuDayaCount > 0 && (
                            <div className="flex-1 bg-orange-50 p-2 rounded-lg border border-orange-100 text-center">
                              <p className="text-xs text-orange-600 font-medium">Catu Daya</p>
                              <p className="font-bold text-orange-700 text-lg">{loc.catuDayaCount}</p>
                            </div>
                          )}
                          {loc.nonCatuDayaCount > 0 && (
                            <div className="flex-1 bg-blue-50 p-2 rounded-lg border border-blue-100 text-center">
                              <p className="text-xs text-blue-600 font-medium">Non-Catu</p>
                              <p className="font-bold text-blue-700 text-lg">{loc.nonCatuDayaCount}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                          {loc.devices.slice(0, 10).map((dev, i) => (
                            <div key={i} className="mb-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-slate-700">{dev.DEVICE_TYPE}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${dev.STATUS === 'OPERATIONAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {dev.STATUS}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <HardDrive className="w-3 h-3" /> {dev.BRAND} • {dev.CAP_REAL}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="w-full mt-3 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2">
                          <Layers className="w-4 h-4" />
                          Klik Marker Untuk Tabel Lengkap ({loc.devices.length})
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                )
              })}
            </MarkerClusterGroup>
          )}
        </MapContainer>

        {/* Full Screen Analytics Dashboard Modal */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 md:p-8"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
              >
                <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-indigo-500" /> Dashboard Analitik Aset
                    </h2>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Berdasarkan filter pencarian saat ini ({stats.total} Perangkat)</p>
                  </div>
                  <button onClick={() => setShowAnalytics(false)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all shadow-sm">
                    <X className="w-5 h-5 dark:text-slate-300" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Top 10 Lokasi Perangkat Terbanyak</h3>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topLocations} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis dataKey="name" type="category" width={100} stroke="#64748b" tick={{fontSize: 10}} />
                          <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'white', color: 'black', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="Total" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Rasio Status Perangkat</h3>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                            {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'white', color: 'black', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#475569' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Screen Table Modal */}
        <AnimatePresence>
          {modalData && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 md:p-8"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-5xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
              >
                <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{modalData.name}</h2>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-500" />
                      {addressMap[`${modalData.coords[0]},${modalData.coords[1]}`] || 'Detail lokasi'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={() => downloadCSV(modalData.name, modalData.devices)}
                      className="hidden md:flex p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm items-center gap-2 font-bold text-sm"
                    >
                      <Download className="w-4 h-4" /> Unduh CSV
                    </button>
                    <button 
                      onClick={() => setModalData(null)}
                      className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all shadow-sm"
                    >
                      <X className="w-5 h-5 dark:text-slate-300" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-0 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Kode Perangkat</th>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Tipe</th>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Merk</th>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Kapasitas</th>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs text-center">Kondisi</th>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs text-center">Status</th>
                        <th className="py-4 px-4 md:px-6 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modalData.devices.map((dev, i) => {
                        const isEditing = editingDeviceId === dev.DEVICE_CODE;
                        return (
                          <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="py-3.5 px-4 md:px-6 text-slate-500 dark:text-slate-400 font-mono text-xs">{dev.DEVICE_CODE}</td>
                            <td className="py-3.5 px-4 md:px-6 text-slate-800 dark:text-white font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{dev.DEVICE_TYPE}</td>
                            <td className="py-3.5 px-4 md:px-6 text-slate-600 dark:text-slate-300 font-medium">
                              {isEditing ? (
                                <input type="text" className="w-full p-1.5 border rounded text-xs text-black" value={editForm.BRAND || ''} onChange={e => setEditForm({...editForm, BRAND: e.target.value})} />
                              ) : dev.BRAND}
                            </td>
                            <td className="py-3.5 px-4 md:px-6 text-slate-600 dark:text-slate-300">
                              {isEditing ? (
                                <input type="text" className="w-full p-1.5 border rounded text-xs text-black" value={editForm.CAP_REAL || ''} onChange={e => setEditForm({...editForm, CAP_REAL: e.target.value})} />
                              ) : dev.CAP_REAL}
                            </td>
                            <td className="py-3.5 px-4 md:px-6 text-center font-bold text-slate-700 dark:text-slate-300">
                              {isEditing ? (
                                <select className="w-full p-1.5 border rounded text-xs text-black" value={editForm.CONDITION || 'NORMAL'} onChange={e => setEditForm({...editForm, CONDITION: e.target.value})}>
                                  <option value="NORMAL">NORMAL</option>
                                  <option value="RUSAK">RUSAK</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide inline-block w-full text-center max-w-[120px] ${dev.CONDITION === 'NORMAL' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50'}`}>
                                  {dev.CONDITION}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 md:px-6 text-center">
                              {isEditing ? (
                                <select className="w-full p-1.5 border rounded text-xs text-black" value={editForm.STATUS || 'OPERATIONAL'} onChange={e => setEditForm({...editForm, STATUS: e.target.value})}>
                                  <option value="OPERATIONAL">OPERATIONAL</option>
                                  <option value="TIDAK BERFUNGSI">TIDAK BERFUNGSI</option>
                                  <option value="IDLE">IDLE</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide inline-block w-full text-center max-w-[120px] ${dev.STATUS === 'OPERATIONAL' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : dev.STATUS === 'IDLE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'}`}>
                                  {dev.STATUS}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 md:px-6 text-center">
                              {isEditing ? (
                                <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors" title="Simpan">
                                  <Save className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { setEditingDeviceId(dev.DEVICE_CODE); setEditForm({ BRAND: dev.BRAND, CAP_REAL: dev.CAP_REAL, STATUS: dev.STATUS, CONDITION: dev.CONDITION }); }} 
                                  className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100" title="Edit Data"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:hidden">
                  <button 
                    onClick={() => downloadCSV(modalData.name, modalData.devices)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Download className="w-4 h-4" /> Unduh Data CSV
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default App;
