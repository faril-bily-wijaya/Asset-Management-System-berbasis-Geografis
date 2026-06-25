import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Layers } from 'lucide-react';
import DeviceCRUDPanel from '../components/Sidebar/DeviceCRUDPanel';
import LocationManager from '../components/Sidebar/LocationManager';
import { useMapContext } from '../contexts/MapContext';

export default function ManagementPage() {
    const navigate = useNavigate();
    const mapData = useMapContext();

    const [showCRUDPanel, setShowCRUDPanel] = React.useState(true);
    const [showLocationManager, setShowLocationManager] = React.useState(false);

    const handleDeviceAdded = (device) => {
        // Device akan otomatis ditambahkan ke context
        console.log('Device ditambahkan:', device);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Data</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Kelola perangkat dan lokasi inventori
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { setShowCRUDPanel(true); setShowLocationManager(false); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${showCRUDPanel
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Database className="w-5 h-5" />
                            Manajemen Perangkat
                        </button>
                        <button
                            onClick={() => { setShowCRUDPanel(false); setShowLocationManager(true); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${showLocationManager
                                    ? 'bg-indigo-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Layers className="w-5 h-5" />
                            Manajemen Lokasi
                        </button>
                    </div>
                </div>

                {/* Content Panels */}
                <div>
                    {showCRUDPanel && (
                        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Database className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tambah & Edit Perangkat</h2>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Tambahkan perangkat baru atau edit data perangkat yang sudah ada.
                            </p>
                            <DeviceCRUDPanel
                                isOpen={true}
                                onClose={() => setShowCRUDPanel(false)}
                                onDeviceAdded={handleDeviceAdded}
                            />
                        </section>
                    )}

                    {showLocationManager && (
                        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Kelola Lokasi</h2>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Kelola data lokasi dan koordinat perangkat.
                            </p>
                            <LocationManager
                                isOpen={true}
                                onClose={() => setShowLocationManager(false)}
                            />
                        </section>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Lokasi</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{mapData.locationsData?.length || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Perangkat</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{mapData.stats?.total || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Perangkat Kustom</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{mapData.customDevices?.length || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
