import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, MapPin, SlidersHorizontal } from 'lucide-react';
import AdvancedFilters from '../components/Sidebar/AdvancedFilters';
import DeviceCategoryFilter from '../components/Sidebar/DeviceCategoryFilter';
import HierarchyFilter from '../components/Sidebar/HierarchyFilter';
import { useFilterContext } from '../contexts/FilterContext';
import { useMapContext } from '../contexts/MapContext';

export default function FilterPage() {
    const navigate = useNavigate();
    const filters = useFilterContext();
    const mapData = useMapContext();

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Kembali ke Peta</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <SlidersHorizontal className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Filter & Kategori</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Atur filter untuk menampilkan data perangkat
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl space-y-6">
                {/* Device Category Filter */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Kategori Perangkat</h2>
                    </div>
                    <DeviceCategoryFilter filter={filters.filter} setFilter={filters.setFilter} />
                </section>

                {/* Advanced Filters */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Filter Lanjutan</h2>
                    </div>
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
                </section>

                {/* Hierarchy Filter */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Filter Hierarki Area</h2>
                    </div>
                    <HierarchyFilter
                        districtFilter={filters.districtFilter}
                        setDistrictFilter={(val) => { filters.setDistrictFilter(val); mapData.setActiveLocation(null); }}
                        clusterFilter={filters.clusterFilter}
                        setClusterFilter={(val) => { filters.setClusterFilter(val); mapData.setActiveLocation(null); }}
                        locationFilter={filters.locationFilter}
                        setLocationFilter={(val) => { filters.setLocationFilter(val); mapData.setActiveLocation(null); }}
                    />
                </section>

                {/* Active Filters Summary */}
                {(filters.filter !== 'ALL' || filters.statusFilter !== 'ALL' || filters.conditionFilter !== 'ALL' || filters.brandFilter !== 'ALL' || filters.districtFilter.length > 0 || filters.clusterFilter.length > 0 || filters.locationFilter.length > 0) && (
                    <section className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200">Filter Aktif</h2>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                            Sedang menampilkan data dengan filter aktif. Kembali ke peta untuk melihat hasilnya.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Lihat di Peta
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}
