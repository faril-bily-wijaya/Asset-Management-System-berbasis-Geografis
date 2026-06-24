import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    X,
    Save,
    Search,
    AlertTriangle,
    CheckCircle,
    Database,
    Download,
    Upload as UploadIcon,
    MapPin,
    Layers,
    FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllLocations, getAreaForLocation, getDistrictForLocation, getClusterForLocation } from '../../utils/hierarchy';
import BottomSheet from '../BottomSheet';
import LocationManager from './LocationManager';
import AutoComplete from '../AutoComplete';
import FuzzySuggest from '../FuzzySuggest';
import UploadCSVModal from '../UploadCSVModal';
import DeviceNamePreview from '../DeviceNamePreview';

const STORAGE_KEY = 'map_inventory_custom_devices';
const BRANDS_KEY = 'map_inventory_brands';
const MODELS_KEY = 'map_inventory_models';
const ROOMS_KEY = 'map_inventory_rooms';

// Field definitions for device form
const DEVICE_FIELDS = [
    { name: 'LOCATION', label: 'Lokasi', type: 'select', required: true },
    { name: 'DEVICE_TYPE', label: 'Jenis Perangkat', type: 'select', required: true },
    { name: 'DEVICE_NAME', label: 'Nama Perangkat', type: 'text', required: true },
    { name: 'MERK', label: 'Merk', type: 'text', required: false },
    { name: 'MODEL', label: 'Model', type: 'text', required: false },
    { name: 'SERIAL_NUMBER', label: 'Serial Number', type: 'text', required: false },
    { name: 'KAPASITAS', label: 'Kapasitas', type: 'text', required: false },
    { name: 'YEAR', label: 'Tahun Operasi', type: 'number', required: false },
    { name: 'ROOM', label: 'Ruangan', type: 'text', required: false },
    { name: 'STATUS', label: 'Status', type: 'select', required: true },
];

const DEVICE_TYPES = [
    'ACSPLIT', 'ACSTANDING', 'PAC', 'RECTIFIER', 'BATTERY', 'BATBASAH',
    'GENSET', 'GENSET MOBILE', 'PLN', 'INVERTER', 'RECTIFIER'
];

const STATUS_OPTIONS = [
    'Operational', 'Maintenance', 'Fault', 'Standby', 'Decommissioned'
];

const emptyDevice = {
    LOCATION: '',
    DEVICE_TYPE: '',
    DEVICE_NAME: '',
    MERK: '',
    MODEL: '',
    SERIAL_NUMBER: '',
    KAPASITAS: '',
    YEAR: new Date().getFullYear(),
    ROOM: '',
    STATUS: 'Operational',
};

// Load custom data from localStorage
const loadCustomData = (key, defaultValue = []) => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error(`Failed to load ${key}`, e);
    }
    return defaultValue;
};

// Save custom data to localStorage
const saveCustomData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export default function DeviceCRUDPanel({ isOpen, onClose, onDeviceAdded }) {
    const [devices, setDevices] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyDevice);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showExport, setShowExport] = useState(false);
    const [showLocationManager, setShowLocationManager] = useState(false);
    const [showUploadCSV, setShowUploadCSV] = useState(false);

    // Custom data states
    const [customBrands, setCustomBrands] = useState([]);
    const [customModels, setCustomModels] = useState([]);
    const [customRooms, setCustomRooms] = useState([]);

    const locations = getAllLocations();

    // Load all data on mount
    useEffect(() => {
        setCustomBrands(loadCustomData(BRANDS_KEY, []));
        setCustomModels(loadCustomData(MODELS_KEY, []));
        setCustomRooms(loadCustomData(ROOMS_KEY, []));
    }, [isOpen]);

    // Load devices from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setDevices(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored devices', e);
                setDevices([]);
            }
        }
    }, [isOpen]);

    // Save devices to localStorage
    const saveDevices = (newDevices) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDevices));
        setDevices(newDevices);
    };

    // Get unique brands from devices
    const allBrands = useMemo(() => {
        const deviceBrands = [...new Set(
            devices
                .map(d => d.MERK)
                .filter(Boolean)
        )];
        return [...new Set([...customBrands, ...deviceBrands])].sort();
    }, [devices, customBrands]);

    // Get unique models from devices
    const allModels = useMemo(() => {
        const deviceModels = [...new Set(
            devices
                .map(d => d.MODEL)
                .filter(Boolean)
        )];
        return [...new Set([...customModels, ...deviceModels])].sort();
    }, [devices, customModels]);

    // Get unique rooms from devices
    const allRooms = useMemo(() => {
        const deviceRooms = [...new Set(
            devices
                .map(d => d.ROOM)
                .filter(Boolean)
        )];
        return [...new Set([...customRooms, ...deviceRooms])].sort();
    }, [devices, customRooms]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.LOCATION || !formData.DEVICE_TYPE || !formData.DEVICE_NAME) {
            toast.error('Mohon isi field yang wajib');
            return;
        }

        // Get hierarchy info
        const area = getAreaForLocation(formData.LOCATION);
        const district = getDistrictForLocation(formData.LOCATION);
        const cluster = getClusterForLocation(formData.LOCATION);

        const deviceData = {
            ...formData,
            id: editingId || `CUSTOM-${Date.now()}`,
            area,
            district,
            cluster,
            createdAt: editingId ? devices.find(d => d.id === editingId)?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        let newDevices;
        if (editingId) {
            newDevices = devices.map(d => d.id === editingId ? deviceData : d);
            toast.success('Perangkat berhasil diupdate');
        } else {
            newDevices = [deviceData, ...devices];
            toast.success('Perangkat berhasil ditambahkan');
        }

        // Add new brand if not exists
        if (formData.MERK && !allBrands.includes(formData.MERK)) {
            const newBrands = [...customBrands, formData.MERK];
            setCustomBrands(newBrands);
            saveCustomData(BRANDS_KEY, newBrands);
        }

        // Add new model if not exists
        if (formData.MODEL && !allModels.includes(formData.MODEL)) {
            const newModels = [...customModels, formData.MODEL];
            setCustomModels(newModels);
            saveCustomData(MODELS_KEY, newModels);
        }

        // Add new room if not exists
        if (formData.ROOM && !allRooms.includes(formData.ROOM)) {
            const newRooms = [...customRooms, formData.ROOM];
            setCustomRooms(newRooms);
            saveCustomData(ROOMS_KEY, newRooms);
        }

        saveDevices(newDevices);
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyDevice);

        if (onDeviceAdded) {
            onDeviceAdded(deviceData);
        }
    };

    const handleEdit = (device) => {
        setFormData({ ...device });
        setEditingId(device.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        const newDevices = devices.filter(d => d.id !== id);
        saveDevices(newDevices);
        setShowDeleteConfirm(null);
        toast.success('Perangkat berhasil dihapus');
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(devices, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devices_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Data berhasil diexport');
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    saveDevices([...imported, ...devices]);
                    toast.success(`Berhasil import ${imported.length} perangkat`);
                } else {
                    toast.error('Format file tidak valid');
                }
            } catch (err) {
                toast.error('Gagal import file');
            }
        };
        reader.readAsText(file);
    };

    // Filter devices
    const filteredDevices = devices.filter(device => {
        const matchesSearch = !searchQuery ||
            device.DEVICE_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.DEVICE_TYPE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.LOCATION?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation = !filterLocation || device.LOCATION === filterLocation;
        const matchesType = !filterType || device.DEVICE_TYPE === filterType;

        return matchesSearch && matchesLocation && matchesType;
    });

    // Render content for BottomSheet
    const renderContent = () => (
        <>
            {/* Export/Import Panel */}
            {showExport && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex flex-wrap gap-3 items-center">
                    <button
                        onClick={handleExport}
                        disabled={devices.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> Export JSON
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                        <Upload className="w-4 h-4" /> Import JSON
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                    <span className="text-xs text-slate-500">Export/import data perangkat dalam format JSON</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari perangkat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                </div>
                <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                    <option value="">Semua Lokasi</option>
                    {locations.slice(0, 50).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                    <option value="">Semua Jenis</option>
                    {DEVICE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyDevice); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
                >
                    <Plus className="w-4 h-4" /> Tambah
                </button>
                <button
                    onClick={() => setShowLocationManager(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                    <Layers className="w-4 h-4" /> Kelola Lokasi
                </button>
                <button
                    onClick={() => setShowUploadCSV(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
                >
                    <FileSpreadsheet className="w-4 h-4" /> Upload CSV
                </button>
            </div>

            {/* Device List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredDevices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Database className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Belum ada perangkat</p>
                        <p className="text-sm">Klik tombol "Tambah" untuk menambahkan perangkat baru</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredDevices.map(device => (
                            <div
                                key={device.id}
                                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{device.DEVICE_NAME}</h4>
                                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${device.STATUS === 'Operational' ? 'bg-emerald-100 text-emerald-700' :
                                                device.STATUS === 'Fault' ? 'bg-red-100 text-red-700' :
                                                    device.STATUS === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {device.STATUS}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{device.DEVICE_TYPE}</span>
                                            <span>📍 {device.LOCATION}</span>
                                            {device.MERK && <span>🏭 {device.MERK}</span>}
                                            {device.KAPASITAS && <span>⚡ {device.KAPASITAS}</span>}
                                            {device.YEAR && <span>📅 {device.YEAR}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 ml-3">
                                        <button
                                            onClick={() => handleEdit(device)}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(device)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[4100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingId ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Lokasi *</label>
                                    <select
                                        value={formData.LOCATION}
                                        onChange={(e) => handleInputChange('LOCATION', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        required
                                    >
                                        <option value="">Pilih Lokasi</option>
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Jenis Perangkat *</label>
                                    <select
                                        value={formData.DEVICE_TYPE}
                                        onChange={(e) => handleInputChange('DEVICE_TYPE', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        required
                                    >
                                        <option value="">Pilih Jenis</option>
                                        {DEVICE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status *</label>
                                    <select
                                        value={formData.STATUS}
                                        onChange={(e) => handleInputChange('STATUS', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        required
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Perangkat *</label>
                                    <input
                                        type="text"
                                        value={formData.DEVICE_NAME}
                                        onChange={(e) => handleInputChange('DEVICE_NAME', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Contoh: AC UTAMA, RECTIFIER CADANGAN"
                                        required
                                    />
                                    {/* Device Name Preview - shows grouping info */}
                                    <DeviceNamePreview
                                        value={formData.DEVICE_NAME}
                                        existingDevices={devices}
                                        currentId={editingId}
                                        location={formData.LOCATION}
                                    />
                                </div>

                                {/* Merk with AutoComplete */}
                                <AutoComplete
                                    label="Merk"
                                    value={formData.MERK}
                                    onChange={(value) => handleInputChange('MERK', value)}
                                    options={allBrands}
                                    placeholder="Ketik atau pilih merk..."
                                    allowAddNew={true}
                                    addNewLabel="Tambah merk baru"
                                />

                                {/* Model with AutoComplete */}
                                <AutoComplete
                                    label="Model"
                                    value={formData.MODEL}
                                    onChange={(value) => handleInputChange('MODEL', value)}
                                    options={allModels}
                                    placeholder="Ketik atau pilih model..."
                                    allowAddNew={true}
                                    addNewLabel="Tambah model baru"
                                />

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kapasitas</label>
                                    <input
                                        type="text"
                                        value={formData.KAPASITAS}
                                        onChange={(e) => handleInputChange('KAPASITAS', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Contoh: 10 KVA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tahun Operasi</label>
                                    <input
                                        type="number"
                                        value={formData.YEAR}
                                        onChange={(e) => handleInputChange('YEAR', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        min="1990"
                                        max={new Date().getFullYear()}
                                    />
                                </div>

                                {/* Ruangan with FuzzySuggest */}
                                <div className="col-span-2">
                                    <FuzzySuggest
                                        label="Ruangan"
                                        value={formData.ROOM}
                                        onChange={(value) => handleInputChange('ROOM', value)}
                                        existingRooms={allRooms}
                                        locationName={formData.LOCATION}
                                        placeholder="Contoh: R. Server"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[4100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md m-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Konfirmasi Hapus</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Apakah Anda yakin ingin menghapus perangkat "{showDeleteConfirm.DEVICE_NAME}"?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm.id)}
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
        <>
            <BottomSheet
                isOpen={isOpen}
                onClose={onClose}
                title="Manajemen Perangkat"
                size="xl"
            >
                {renderContent()}
            </BottomSheet>

            {/* Location Manager Modal - rendered outside BottomSheet */}
            <LocationManager
                isOpen={showLocationManager}
                onClose={() => setShowLocationManager(false)}
            />

            {/* Upload CSV Modal */}
            <UploadCSVModal
                isOpen={showUploadCSV}
                onClose={() => setShowUploadCSV(false)}
                existingLocations={locations}
                onImport={(data) => {
                    // Transform CSV data to device format
                    const newDevices = data.map(row => ({
                        ...row,
                        id: `CSV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        STATUS: row.STATUS || 'Operational',
                        YEAR: row.YEAR ? parseInt(row.YEAR) : new Date().getFullYear(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        area: getAreaForLocation(row.LOCATION),
                        district: getDistrictForLocation(row.LOCATION),
                        cluster: getClusterForLocation(row.LOCATION),
                    }));

                    // Add to existing devices
                    const updatedDevices = [...newDevices, ...devices];
                    saveDevices(updatedDevices);

                    // Collect unique brands, models, rooms from CSV
                    const csvBrands = [...new Set(data.map(r => r.MERK).filter(Boolean))];
                    const csvModels = [...new Set(data.map(r => r.MODEL).filter(Boolean))];
                    const csvRooms = [...new Set(data.map(r => r.ROOM).filter(Boolean))];

                    // Merge with existing custom data
                    const mergedBrands = [...new Set([...customBrands, ...csvBrands])];
                    const mergedModels = [...new Set([...customModels, ...csvModels])];
                    const mergedRooms = [...new Set([...customRooms, ...csvRooms])];

                    saveCustomData(BRANDS_KEY, mergedBrands);
                    saveCustomData(MODELS_KEY, mergedModels);
                    saveCustomData(ROOMS_KEY, mergedRooms);

                    setCustomBrands(mergedBrands);
                    setCustomModels(mergedModels);
                    setCustomRooms(mergedRooms);

                    toast.success(`${newDevices.length} perangkat berhasil diimport dari CSV`);
                }}
            />
        </>
    );
}
