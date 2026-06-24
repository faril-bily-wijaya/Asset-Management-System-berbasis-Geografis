import React, { useState } from 'react';
import { MapPin, Download, X, Edit2, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import BottomSheet from '../BottomSheet';

export default function DeviceTableModal({ modalData, addressMap, onClose, onSaveEdit, onDownloadCSV }) {
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Kriteria Umur Perangkat DEFA yang prioritas dilakukan modernisasi
  const needsModernization = (type, yearStr) => {
    if (!yearStr) return false;
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) return false;

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    const t = type.toUpperCase();
    if (t.includes('AC') && age > 15) return true;
    if (t.includes('RECTIFIER') && age > 15) return true;
    if (t.includes('BATKERING') && age > 10) return true; // VRLA kering
    if (t.includes('BATBASAH') && age > 20) return true;  // VLA basah
    if (t.includes('GENSET') && age > 25) return true;

    return false;
  };

  // Group devices by ROOM
  const groupedByRoom = modalData.devices.reduce((acc, dev) => {
    const room = dev.ROOM || 'TIDAK ADA RUANGAN';
    if (!acc[room]) acc[room] = [];
    acc[room].push(dev);
    return acc;
  }, {});

  const handleSave = (roomName) => {
    onSaveEdit(modalData.name, editingDeviceId, editForm);
    setEditingDeviceId(null);
    toast.success("Perubahan disimpan sementara. Jangan lupa unduh CSV!");
  };

  // Render content for BottomSheet
  const renderContent = () => (
    <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
      {Object.entries(groupedByRoom).map(([room, devices]) => (
        <div key={room} className="mb-6 bg-white dark:bg-slate-900 border-y md:border md:rounded-xl md:m-4 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center flex-wrap gap-2">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base">{room}</h3>
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
              {devices.length} Perangkat
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px]">Kode</th>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px]">Tipe</th>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px]">Merk</th>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px]">Kapasitas | Tahun</th>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px] text-center">Rekomendasi</th>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px] text-center">Status</th>
                  <th className="py-3 px-2 md:px-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] md:text-[11px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {devices.map((dev, i) => {
                  const isEditing = editingDeviceId === dev.DEVICE_CODE;
                  const modernisasi = needsModernization(dev.DEVICE_TYPE, dev.YEAR);
                  return (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-2 px-2 md:py-3 md:px-4 text-slate-500 dark:text-slate-400 font-mono text-[10px] md:text-[11px]">{dev.DEVICE_CODE}</td>
                      <td className="py-2 px-2 md:py-3 md:px-4 text-slate-800 dark:text-slate-200 font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs">{dev.DEVICE_TYPE}</td>
                      <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 dark:text-slate-300 font-medium text-xs">
                        {isEditing ? (
                          <input type="text" className="w-full p-1 border dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={editForm.BRAND || ''} onChange={e => setEditForm({ ...editForm, BRAND: e.target.value })} />
                        ) : dev.BRAND}
                      </td>
                      <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input type="text" className="w-16 md:w-20 p-1 border dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Kapasitas" value={editForm.CAP_REAL || ''} onChange={e => setEditForm({ ...editForm, CAP_REAL: e.target.value })} />
                            <input type="text" className="w-14 md:w-16 p-1 border dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Tahun" value={editForm.YEAR || ''} onChange={e => setEditForm({ ...editForm, YEAR: e.target.value })} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{dev.CAP_REAL || '-'}</span>
                            {dev.YEAR && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600 hidden md:inline">|</span>
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400">{dev.YEAR}</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                        {modernisasi ? (
                          <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1 py-0.5 rounded border border-red-200 dark:border-red-800/30 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" /> Perlu Mod.
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                        {isEditing ? (
                          <select className="w-full p-1 border dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={editForm.STATUS || 'OPERATIONAL'} onChange={e => setEditForm({ ...editForm, STATUS: e.target.value })}>
                            <option value="AKTIF">AKTIF</option>
                            <option value="OPERATIONAL">OPERATIONAL</option>
                            <option value="TIDAK BERFUNGSI">TIDAK BERFUNGSI</option>
                            <option value="IDLE">IDLE</option>
                          </select>
                        ) : (
                          <span className={`text-[9px] md:text-[10px] px-1 py-0.5 rounded font-bold uppercase tracking-wide inline-block ${dev.STATUS === 'OPERATIONAL' || dev.STATUS === 'AKTIF' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : dev.STATUS === 'IDLE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                            {dev.STATUS}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                        {isEditing ? (
                          <button onClick={() => handleSave(room)} className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors" title="Simpan">
                            <Save className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setEditingDeviceId(dev.DEVICE_CODE); setEditForm({ BRAND: dev.BRAND, CAP_REAL: dev.CAP_REAL, STATUS: dev.STATUS, CONDITION: dev.CONDITION, YEAR: dev.YEAR }); }}
                            className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100" title="Edit Data"
                          >
                            <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {Object.keys(groupedByRoom).length === 0 && (
        <div className="flex items-center justify-center h-full text-slate-400">
          Tidak ada data perangkat.
        </div>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={modalData.name}
      size="full"
    >
      {/* Location info */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <MapPin className="w-4 h-4 text-red-500" />
        {addressMap[`${modalData.coords[0]},${modalData.coords[1]}`] || 'Detail lokasi'}
      </div>

      {/* Download button */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onDownloadCSV(modalData.name, modalData.devices)}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 font-bold text-sm"
        >
          <Download className="w-4 h-4" /> Unduh CSV
        </button>
      </div>

      {renderContent()}
    </BottomSheet>
  );
}
