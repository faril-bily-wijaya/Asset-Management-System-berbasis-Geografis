import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, X, Moon, Sun, Settings, BarChart3, Network, ChevronDown, ChevronUp, SlidersHorizontal, PanelLeftClose, LogOut, User } from 'lucide-react';
import SearchBar from './SearchBar';
import DataSummaryCard from './DataSummaryCard';
import MapStyleToggle from './MapStyleToggle';
import AdvancedFilters from './AdvancedFilters';
import DeviceCategoryFilter from './DeviceCategoryFilter';
import HierarchyFilter from './HierarchyFilter';
import { useFilterContext } from '../../contexts/FilterContext';
import { useMapContext } from '../../contexts/MapContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({
  isOpen, onClose,
  // Search
  search, setSearch, onSearchEnter,
  // Data Summary
  stats, loading, chartData, onShowAnalytics, onShowNetwork, onExportGlobal,
  // Map Style
  mapStyle, setMapStyle,
  // Dark Mode
  isDarkMode, toggleDarkMode,
  // Navigation
  onNavigate,
  // Collapse
  isCollapsed, onToggleCollapse,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilterContext();
  const mapData = useMapContext();
  const [showFilters, setShowFilters] = useState(true);

  // Check if any filter is active
  const hasActiveFilters = filters.filter !== 'ALL' || filters.statusFilter !== 'ALL' || filters.conditionFilter !== 'ALL' || filters.brandFilter !== 'ALL' || filters.districtFilter.length > 0 || filters.clusterFilter.length > 0 || filters.locationFilter.length > 0;

  // If collapsed, don't render the full sidebar
  if (isCollapsed) {
    return null;
  }

  return (
    <div className={`absolute md:relative z-20 h-full w-[360px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Collapse Button */}
          <button
            className="hidden md:flex p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={onToggleCollapse}
            title="Sembunyikan Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
          <div>
            <img
              src="/logo.png"
              alt="Infranexia by Telkom Indonesia"
              className="h-8 object-contain drop-shadow-sm dark:brightness-200 dark:grayscale"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                document.getElementById('fallback-logo').style.display = 'flex';
              }}
            />
            <h1 id="fallback-logo" className="hidden text-xl font-extrabold text-slate-800 dark:text-white tracking-tight items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-md">
                <MapPin className="w-4 h-4" />
              </div>
              Infra<span className="text-red-500">nexia</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={toggleDarkMode}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {/* Search */}
        <SearchBar search={search} setSearch={setSearch} onSearchEnter={onSearchEnter} />

        {/* Data Summary */}
        <DataSummaryCard
          stats={stats}
          loading={loading}
          chartData={chartData}
          onShowAnalytics={onShowAnalytics}
          onExportGlobal={onExportGlobal}
          onShowNetwork={onShowNetwork}
        />

        {/* Filter Section - Collapsible */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className={`w-5 h-5 ${hasActiveFilters ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="font-bold text-slate-700 dark:text-slate-200">Filter & Kategori</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showFilters && (
            <div className="p-4 space-y-4">
              {/* Device Category Filter */}
              <div>
                <DeviceCategoryFilter filter={filters.filter} setFilter={filters.setFilter} />
              </div>

              {/* Advanced Filters */}
              <div>
                <AdvancedFilters
                  statusFilter={filters.statusFilter}
                  setStatusFilter={filters.setStatusFilter}
                  availableStatuses={mapData.availableStatuses}
                  conditionFilter={filters.conditionFilter}
                  setConditionFilter={filters.setConditionFilter}
                  availableConditions={mapData.availableConditions}
                  brandFilter={filters.brandFilter}
                  setBrandFilter={filters.setBrandFilter}
                  availableBrands={mapData.availableBrands}
                />
              </div>

              {/* Hierarchy Filter */}
              <div>
                <HierarchyFilter
                  districtFilter={filters.districtFilter}
                  setDistrictFilter={(val) => { filters.setDistrictFilter(val); mapData.setActiveLocation(null); }}
                  clusterFilter={filters.clusterFilter}
                  setClusterFilter={(val) => { filters.setClusterFilter(val); mapData.setActiveLocation(null); }}
                  locationFilter={filters.locationFilter}
                  setLocationFilter={(val) => { filters.setLocationFilter(val); mapData.setActiveLocation(null); }}
                />
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    filters.resetAllFilters();
                  }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Menu</h3>

          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <LogOut className="w-5 h-5 rotate-180" />
              Login Admin
            </button>
          ) : (
            <>
              <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Logged in as</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.full_name || user?.username}</span>
              </div>

              <button
                onClick={() => onNavigate('management')}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <Settings className="w-5 h-5" />
                Manajemen Data
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full py-2.5 px-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <User className="w-4 h-4" />
                  Profil
                </button>
                <button
                  onClick={logout}
                  className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>


        {/* Map Style Toggle */}
        <MapStyleToggle mapStyle={mapStyle} setMapStyle={setMapStyle} />
      </div>
    </div>
  );
}
