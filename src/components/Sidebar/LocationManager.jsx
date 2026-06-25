import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    X,
    Plus,
    Edit2,
    Trash2,
    Save,
    MapPin,
    Building2,
    Layers,
    Hash,
    CheckCircle,
    AlertTriangle,
    ChevronDown,
    ArrowRight,
    Link2,
    Link2Off
} from 'lucide-react';
import toast from 'react-hot-toast';
import BottomSheet from '../BottomSheet';
import { REGIONAL_HIERARCHY, getCombinedHierarchy, triggerLocationsUpdate, loadCustomLocations as loadCustomLocsFromUtils } from '../../utils/hierarchy';

const STORAGE_KEY = 'map_inventory_locations';

// Default hierarchy structure derived from REGIONAL_HIERARCHY
const buildDefaultHierarchy = () => {
    const defaultData = {
        regionals: Object.keys(REGIONAL_HIERARCHY),
        districts: [],
        clusters: [],
        stos: []
    };
    for (const reg of defaultData.regionals) {
        const dists = Object.keys(REGIONAL_HIERARCHY[reg] || {});
        defaultData.districts.push(...dists);
        for (const dist of dists) {
            const clusts = Object.keys(REGIONAL_HIERARCHY[reg][dist] || {});
            defaultData.clusters.push(...clusts);
            for (const clust of clusts) {
                defaultData.stos.push(...(REGIONAL_HIERARCHY[reg][dist][clust] || []));
            }
        }
    }
    return defaultData;
};

const DEFAULT_HIERARCHY = buildDefaultHierarchy();

// Re-export loadCustomLocations from hierarchy utils
const loadCustomLocations = loadCustomLocsFromUtils;

// Save custom locations to localStorage
const saveCustomLocations = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    triggerLocationsUpdate();
};

// Get all locations (default + custom) - exported for other components
const getAllLocations = () => {
    const custom = loadCustomLocations();
    return {
        regionals: [...new Set([...DEFAULT_HIERARCHY.regionals, ...(custom.regionals || [])])],
        districts: [...new Set([...DEFAULT_HIERARCHY.districts, ...(custom.districts || [])])],
        clusters: [...new Set([...DEFAULT_HIERARCHY.clusters, ...(custom.clusters || [])])],
        stos: [...new Set([...DEFAULT_HIERARCHY.stos, ...(custom.stos || [])])]
    };
};

const TABS = [
    { id: 'regionals', label: 'Regional', icon: MapPin },
    { id: 'districts', label: 'District', icon: Building2 },
    { id: 'clusters', label: 'Cluster', icon: Layers },
    { id: 'stos', label: 'STO', icon: Hash }
];

export default function LocationManager({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('regionals');
    const [customData, setCustomData] = useState(loadCustomLocations);
    const [newItem, setNewItem] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Mode selection: 'hierarchy' (based on existing) or 'standalone' (create new without correlation)
    const [addMode, setAddMode] = useState('hierarchy');

    // Cascading dropdown state for hierarchy mode
    const [stoFormData, setStoFormData] = useState({
        regional: '',
        district: '',
        cluster: '',
        stoName: ''
    });

    // District/Cluster form data for hierarchy mode
    const [districtFormData, setDistrictFormData] = useState({
        regional: '',
        districtName: ''
    });

    const [clusterFormData, setClusterFormData] = useState({
        regional: '',
        district: '',
        clusterName: ''
    });

    // Computed options for cascading dropdowns - useMemo ensures reactivity to customData
    const FULL_HIERARCHY = useMemo(() => getCombinedHierarchy(), [refreshKey]);
    const allCustomData = useMemo(() => loadCustomLocations(), [refreshKey, customData]);

    // Regional options - include custom regionals
    const regionalOptions = useMemo(() => {
        const fromHierarchy = Object.keys(FULL_HIERARCHY);
        const customRegs = allCustomData?.regionals || [];
        return [...new Set([...fromHierarchy, ...customRegs])];
    }, [FULL_HIERARCHY, allCustomData]);

    // District options - include custom districts from the selected regional
    const districtOptions = useMemo(() => {
        if (!stoFormData.regional) return [];
        const fromHierarchy = Object.keys(FULL_HIERARCHY[stoFormData.regional] || {});
        // Get custom districts that belong to this regional
        const customDists = Object.entries(allCustomData?.districtHierarchy || {})
            .filter(([_, info]) => info?.regional === stoFormData.regional)
            .map(([name]) => name);
        return [...new Set([...fromHierarchy, ...customDists])];
    }, [stoFormData.regional, FULL_HIERARCHY, allCustomData]);

    // Cluster options - include custom clusters from the selected regional and district
    const clusterOptions = useMemo(() => {
        if (!stoFormData.regional || !stoFormData.district) return [];
        const fromHierarchy = Object.keys(FULL_HIERARCHY[stoFormData.regional]?.[stoFormData.district] || {});
        // Get custom clusters that belong to this regional and district
        const customClusters = Object.entries(allCustomData?.clusterHierarchy || {})
            .filter(([_, info]) => info?.regional === stoFormData.regional && info?.district === stoFormData.district)
            .map(([name]) => name);
        return [...new Set([...fromHierarchy, ...customClusters])];
    }, [stoFormData.regional, stoFormData.district, FULL_HIERARCHY, allCustomData]);

    // District hierarchy options (for adding new district)
    const districtHierarchyOptions = useMemo(() => {
        if (!districtFormData.regional) return [];
        const fromHierarchy = Object.keys(FULL_HIERARCHY[districtFormData.regional] || {});
        const customDists = Object.entries(allCustomData?.districtHierarchy || {})
            .filter(([_, info]) => info?.regional === districtFormData.regional)
            .map(([name]) => name);
        return [...new Set([...fromHierarchy, ...customDists])];
    }, [districtFormData.regional, FULL_HIERARCHY, allCustomData]);

    // Cluster hierarchy options (for adding new cluster)
    const clusterDistrictOptions = useMemo(() => {
        if (!clusterFormData.regional) return [];
        const fromHierarchy = Object.keys(FULL_HIERARCHY[clusterFormData.regional] || {});
        const customDists = Object.entries(allCustomData?.districtHierarchy || {})
            .filter(([_, info]) => info?.regional === clusterFormData.regional)
            .map(([name]) => name);
        return [...new Set([...fromHierarchy, ...customDists])];
    }, [clusterFormData.regional, FULL_HIERARCHY, allCustomData]);

    // Reset cascading form when tab changes
    useEffect(() => {
        setShowAddForm(false);
        setAddMode('hierarchy');
        setStoFormData({ regional: '', district: '', cluster: '', stoName: '' });
        setDistrictFormData({ regional: '', districtName: '' });
        setClusterFormData({ regional: '', district: '', clusterName: '' });
        setNewItem('');
    }, [activeTab]);

    // Reload data when modal opens
    useEffect(() => {
        if (isOpen) {
            setCustomData(loadCustomLocations());
            setRefreshKey(k => k + 1);
            setNewItem('');
            setEditingId(null);
            setDeleteConfirm(null);
            setStoFormData({ regional: '', district: '', cluster: '', stoName: '' });
            setDistrictFormData({ regional: '', districtName: '' });
            setClusterFormData({ regional: '', district: '', clusterName: '' });
            setAddMode('hierarchy');
        }
    }, [isOpen]);

    // Handle cascading dropdown changes for STO
    const handleStoFormChange = (field, value) => {
        setStoFormData(prev => {
            const updated = { ...prev, [field]: value };
            // Reset dependent fields
            if (field === 'regional') {
                updated.district = '';
                updated.cluster = '';
            } else if (field === 'district') {
                updated.cluster = '';
            }
            return updated;
        });
    };

    // Handle cascading dropdown changes for District
    const handleDistrictFormChange = (field, value) => {
        setDistrictFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'regional') {
                // No dependent fields for district
            }
            return updated;
        });
    };

    // Handle cascading dropdown changes for Cluster
    const handleClusterFormChange = (field, value) => {
        setClusterFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'regional') {
                updated.district = '';
            }
            return updated;
        });
    };

    // Handle add STO with hierarchy
    const handleAddStoWithHierarchy = useCallback(() => {
        if (!stoFormData.stoName.trim()) {
            toast.error('Nama STO tidak boleh kosong');
            return;
        }
        if (!stoFormData.regional || !stoFormData.district || !stoFormData.cluster) {
            toast.error('Pilih Regional, District, dan Cluster terlebih dahulu');
            return;
        }

        const normalizedSto = stoFormData.stoName.trim().toUpperCase();

        // Check for duplicates in STOs
        const allStos = getAllLocations().stos;
        if (allStos.some(sto => sto.toUpperCase() === normalizedSto)) {
            toast.error('STO sudah ada');
            return;
        }

        // Save STO with hierarchy info
        const updated = {
            ...customData,
            stos: [...(customData.stos || []), normalizedSto],
            // Also save STO hierarchy for reference
            stoHierarchy: {
                ...(customData.stoHierarchy || {}),
                [normalizedSto]: {
                    regional: stoFormData.regional,
                    district: stoFormData.district,
                    cluster: stoFormData.cluster
                }
            }
        };

        setCustomData(updated);
        saveCustomLocations(updated);
        setRefreshKey(k => k + 1);
        setStoFormData({ regional: '', district: '', cluster: '', stoName: '' });
        setShowAddForm(false);
        toast.success(`STO "${normalizedSto}" berhasil ditambahkan ke ${stoFormData.cluster}`);
    }, [stoFormData, customData]);

    // Handle add District with hierarchy
    const handleAddDistrictWithHierarchy = useCallback(() => {
        if (!districtFormData.districtName.trim()) {
            toast.error('Nama District tidak boleh kosong');
            return;
        }
        if (!districtFormData.regional) {
            toast.error('Pilih Regional terlebih dahulu');
            return;
        }

        const normalizedDistrict = districtFormData.districtName.trim().toUpperCase();

        // Check for duplicates
        const allDistricts = getAllLocations().districts;
        if (allDistricts.some(d => d.toUpperCase() === normalizedDistrict)) {
            toast.error('District sudah ada');
            return;
        }

        const updated = {
            ...customData,
            districts: [...(customData.districts || []), normalizedDistrict],
            districtHierarchy: {
                ...(customData.districtHierarchy || {}),
                [normalizedDistrict]: {
                    regional: districtFormData.regional
                }
            }
        };

        setCustomData(updated);
        saveCustomLocations(updated);
        setRefreshKey(k => k + 1);
        setDistrictFormData({ regional: '', districtName: '' });
        setShowAddForm(false);
        toast.success(`District "${normalizedDistrict}" berhasil ditambahkan ke ${districtFormData.regional}`);
    }, [districtFormData, customData]);

    // Handle add Cluster with hierarchy
    const handleAddClusterWithHierarchy = useCallback(() => {
        if (!clusterFormData.clusterName.trim()) {
            toast.error('Nama Cluster tidak boleh kosong');
            return;
        }
        if (!clusterFormData.regional || !clusterFormData.district) {
            toast.error('Pilih Regional dan District terlebih dahulu');
            return;
        }

        const normalizedCluster = clusterFormData.clusterName.trim().toUpperCase();

        // Check for duplicates
        const allClusters = getAllLocations().clusters;
        if (allClusters.some(c => c.toUpperCase() === normalizedCluster)) {
            toast.error('Cluster sudah ada');
            return;
        }

        const updated = {
            ...customData,
            clusters: [...(customData.clusters || []), normalizedCluster],
            clusterHierarchy: {
                ...(customData.clusterHierarchy || {}),
                [normalizedCluster]: {
                    regional: clusterFormData.regional,
                    district: clusterFormData.district
                }
            }
        };

        setCustomData(updated);
        saveCustomLocations(updated);
        setRefreshKey(k => k + 1);
        setClusterFormData({ regional: '', district: '', clusterName: '' });
        setShowAddForm(false);
        toast.success(`Cluster "${normalizedCluster}" berhasil ditambahkan`);
    }, [clusterFormData, customData]);

    // Recompute allLocations when customData changes
    const allLocations = useMemo(() => getAllLocations(), [refreshKey, customData]);
    const currentItems = allLocations[activeTab];
    const defaultItems = DEFAULT_HIERARCHY[activeTab];

    // Handle add standalone (no hierarchy correlation)
    const handleAddStandalone = () => {
        if (!newItem.trim()) {
            toast.error('Nama tidak boleh kosong');
            return;
        }

        const normalized = newItem.trim().toUpperCase();

        // Check for duplicates
        if (allLocations[activeTab].some(item => item.toUpperCase() === normalized)) {
            toast.error('Item sudah ada');
            return;
        }

        const updated = {
            ...customData,
            [activeTab]: [...customData[activeTab], normalized]
        };

        setCustomData(updated);
        saveCustomLocations(updated);
        setNewItem('');
        setShowAddForm(false);
        toast.success(`${TABS.find(t => t.id === activeTab).label} "${normalized}" berhasil ditambahkan (standalone)`);
    };

    const handleEdit = (item) => {
        setEditingId(item);
        setEditValue(item);
    };

    const handleSaveEdit = (oldItem) => {
        if (!editValue.trim()) {
            toast.error('Nama tidak boleh kosong');
            return;
        }

        const normalized = editValue.trim().toUpperCase();

        // Check for duplicates (exclude current item)
        if (allLocations[activeTab].some(item => item.toUpperCase() === normalized && item !== oldItem)) {
            toast.error('Item sudah ada');
            return;
        }

        // Check if it's a default item
        if (defaultItems.includes(oldItem)) {
            toast.error('Item default tidak bisa diedit');
            return;
        }

        const updated = {
            ...customData,
            [activeTab]: customData[activeTab].map(item =>
                item === oldItem ? normalized : item
            )
        };

        setCustomData(updated);
        saveCustomLocations(updated);
        setEditingId(null);
        setEditValue('');
        toast.success('Berhasil diupdate');
    };

    const handleDelete = (item) => {
        // Check if it's a default item
        if (defaultItems.includes(item)) {
            toast.error('Item default tidak bisa dihapus');
            return;
        }

        const updated = {
            ...customData,
            [activeTab]: customData[activeTab].filter(i => i !== item)
        };

        setCustomData(updated);
        saveCustomLocations(updated);
        setDeleteConfirm(null);
        toast.success('Berhasil dihapus');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    // Render mode selection buttons
    const renderModeSelection = () => (
        <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Pilih Mode Penambahan:
            </label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setAddMode('hierarchy')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${addMode === 'hierarchy'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                        }`}
                >
                    <Link2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Ikuti Hierarki</span>
                    <span className="text-[10px] opacity-70">Berbasis existing</span>
                </button>
                <button
                    onClick={() => setAddMode('standalone')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${addMode === 'standalone'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                        }`}
                >
                    <Link2Off className="w-5 h-5" />
                    <span className="text-xs font-medium">Buat Baru</span>
                    <span className="text-[10px] opacity-70">Tanpa korelasi</span>
                </button>
            </div>
        </div>
    );

    // Render hierarchy form based on active tab
    const renderHierarchyForm = () => {
        if (activeTab === 'stos') {
            return (
                <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-3">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {stoFormData.regional || 'Regional'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {stoFormData.district || 'District'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {stoFormData.cluster || 'Cluster'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Regional *</label>
                            <select
                                value={stoFormData.regional}
                                onChange={(e) => handleStoFormChange('regional', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Pilih Regional</option>
                                {regionalOptions.map(reg => (
                                    <option key={reg} value={reg}>{reg}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">District *</label>
                            <select
                                value={stoFormData.district}
                                onChange={(e) => handleStoFormChange('district', e.target.value)}
                                disabled={!stoFormData.regional}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Pilih District</option>
                                {districtOptions.map(dist => (
                                    <option key={dist} value={dist}>{dist}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cluster *</label>
                            <select
                                value={stoFormData.cluster}
                                onChange={(e) => handleStoFormChange('cluster', e.target.value)}
                                disabled={!stoFormData.district}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Pilih Cluster</option>
                                {clusterOptions.map(clust => (
                                    <option key={clust} value={clust}>{clust}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama STO *</label>
                        <input
                            type="text"
                            value={stoFormData.stoName}
                            onChange={(e) => handleStoFormChange('stoName', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddStoWithHierarchy()}
                            placeholder="Contoh: STO BARU..."
                            className="w-full p-2.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleAddStoWithHierarchy}
                            disabled={!stoFormData.regional || !stoFormData.district || !stoFormData.cluster || !stoFormData.stoName.trim()}
                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Tambah STO
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setStoFormData({ regional: '', district: '', cluster: '', stoName: '' }); }}
                            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                        >
                            Batal
                        </button>
                    </div>
                    {!stoFormData.regional && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 text-center">
                            Pilih Regional terlebih dahulu untuk memfilter District dan Cluster
                        </p>
                    )}
                </div>
            );
        }

        if (activeTab === 'districts') {
            return (
                <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 mb-3">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {districtFormData.regional || 'Regional'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {districtFormData.districtName || 'District Baru'}
                        </span>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Regional *</label>
                        <select
                            value={districtFormData.regional}
                            onChange={(e) => handleDistrictFormChange('regional', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Pilih Regional</option>
                            {regionalOptions.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama District *</label>
                        <input
                            type="text"
                            value={districtFormData.districtName}
                            onChange={(e) => handleDistrictFormChange('districtName', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddDistrictWithHierarchy()}
                            placeholder="Contoh: DISTRICT BARU..."
                            className="w-full p-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleAddDistrictWithHierarchy}
                            disabled={!districtFormData.regional || !districtFormData.districtName.trim()}
                            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Tambah District
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setDistrictFormData({ regional: '', districtName: '' }); }}
                            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'clusters') {
            return (
                <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 mb-3">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clusterFormData.regional || 'Regional'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {clusterFormData.district || 'District'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {clusterFormData.clusterName || 'Cluster Baru'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Regional *</label>
                            <select
                                value={clusterFormData.regional}
                                onChange={(e) => handleClusterFormChange('regional', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Pilih Regional</option>
                                {regionalOptions.map(reg => (
                                    <option key={reg} value={reg}>{reg}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">District *</label>
                            <select
                                value={clusterFormData.district}
                                onChange={(e) => handleClusterFormChange('district', e.target.value)}
                                disabled={!clusterFormData.regional}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Pilih District</option>
                                {clusterDistrictOptions.map(dist => (
                                    <option key={dist} value={dist}>{dist}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Cluster *</label>
                        <input
                            type="text"
                            value={clusterFormData.clusterName}
                            onChange={(e) => handleClusterFormChange('clusterName', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddClusterWithHierarchy()}
                            placeholder="Contoh: CLUSTER BARU..."
                            className="w-full p-2.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleAddClusterWithHierarchy}
                            disabled={!clusterFormData.regional || !clusterFormData.district || !clusterFormData.clusterName.trim()}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Tambah Cluster
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setClusterFormData({ regional: '', district: '', clusterName: '' }); }}
                            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            );
        }

        // Regionals hierarchy form
        return (
            <div className="space-y-4 p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 text-center">
                    Regional adalah level tertinggi. Hanya dapat dibuat standalone.
                </p>
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Regional *</label>
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddStandalone()}
                        placeholder="Contoh: REGIONAL BARU..."
                        className="w-full p-2.5 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        autoFocus
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleAddStandalone}
                        disabled={!newItem.trim()}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tambah Regional
                    </button>
                    <button
                        onClick={() => { setShowAddForm(false); setNewItem(''); }}
                        className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                    >
                        Batal
                    </button>
                </div>
            </div>
        );
    };

    // Render standalone form
    const renderStandaloneForm = () => (
        <div className="flex flex-col sm:flex-row gap-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStandalone()}
                placeholder={`Nama ${TABS.find(t => t.id === activeTab).label} baru tanpa hierarki...`}
                className="flex-1 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
            />
            <button
                onClick={handleAddStandalone}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-medium"
            >
                <Plus className="w-4 h-4" /> Tambah
            </button>
            <button
                onClick={() => { setShowAddForm(false); setNewItem(''); }}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
            >
                Batal
            </button>
        </div>
    );

    // Render content only (will be wrapped by BottomSheet)
    const renderContent = () => (
        <>
            {/* Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const count = allLocations[tab.id].length;
                    const customCount = customData[tab.id].length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-none sm:flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border-b-2 border-indigo-600'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {count}
                            </span>
                            {customCount > 0 && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                {/* Add Form */}
                <div className="mb-4">
                    {showAddForm ? (
                        <div>
                            {/* Mode Selection */}
                            {renderModeSelection()}

                            {/* Form based on mode */}
                            {addMode === 'hierarchy' ? renderHierarchyForm() : renderStandaloneForm()}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className={`w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'stos'
                                ? 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                : 'border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                }`}
                        >
                            <Plus className="w-5 h-5" />
                            Tambah {TABS.find(t => t.id === activeTab).label}
                        </button>
                    )}
                </div>

                {/* Info Banner */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-300">
                        <p className="font-semibold">Data default {TABS.find(t => t.id === activeTab).label.toLowerCase()}: {defaultItems.length}</p>
                        <p>Custom {TABS.find(t => t.id === activeTab).label.toLowerCase()}: {customData[activeTab].length}</p>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                    {currentItems.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Belum ada data</p>
                        </div>
                    ) : (
                        currentItems.map((item, index) => {
                            const isDefault = defaultItems.includes(item);
                            const isEditing = editingId === item;

                            return (
                                <div
                                    key={`${item}-${index}`}
                                    className={`p-3 rounded-xl border transition-colors ${isDefault
                                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                                        }`}
                                >
                                    {isEditing ? (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(item)}
                                                className="flex-1 p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveEdit(item)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button onClick={cancelEdit} className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${activeTab === 'regionals' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                    activeTab === 'districts' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        activeTab === 'clusters' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                    {activeTab === 'regionals' ? <MapPin className="w-4 h-4" /> :
                                                        activeTab === 'districts' ? <Building2 className="w-4 h-4" /> :
                                                            activeTab === 'clusters' ? <Layers className="w-4 h-4" /> :
                                                                <Hash className="w-4 h-4" />}
                                                </div>
                                                <span className="font-medium text-slate-800 dark:text-white">{item}</span>
                                                {isDefault && (
                                                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] rounded-full font-medium">
                                                        DEFAULT
                                                    </span>
                                                )}
                                            </div>
                                            {!isDefault && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Hapus">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[5100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md m-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Konfirmasi Hapus</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm}"</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Manajemen Lokasi"
            size="lg"
        >
            {renderContent()}
        </BottomSheet>
    );
}

// Export function untuk dipakai di komponen lain
export { getAllLocations, loadCustomLocations };
