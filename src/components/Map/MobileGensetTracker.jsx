import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, X, Plus, Save, Edit2, MapPin, Activity, Navigation, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileGensetTracker({ isOpen, onClose, onGensetClick }) {
  const [gensets, setGensets] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load static data initially
      fetch('/DATA_SECRET/mobile_gensets.json')
        .then(res => res.json())
        .then(data => setGensets(data))
        .catch(err => {
          console.error("Failed to load mobile gensets", err);
          toast.error("Gagal memuat data genset mobile.");
        });
    }
  }, [isOpen]);

  const handleSave = (id) => {
    if (isAdding) {
      const newGenset = {
        id: `MGEN-${Date.now()}`,
        name: editForm.name || 'Genset Baru',
        capacity: editForm.capacity || '-',
        location: editForm.location || '-',
        status: editForm.status || 'IDLE',
        position: {
          lat: editForm.lat ? parseFloat(editForm.lat) : null,
          lng: editForm.lng ? parseFloat(editForm.lng) : null,
        },
        notes: editForm.notes || '',
        lastUpdated: new Date().toISOString(),
        updatedBy: editForm.updatedBy || 'Admin',
      };
      setGensets([newGenset, ...gensets]);
      setIsAdding(false);
      toast.success("Genset berhasil ditambahkan");
    } else {
      setGensets(gensets.map(g => g.id === id ? {
        ...g,
        ...editForm,
        position: {
          lat: editForm.lat ? parseFloat(editForm.lat) : g.position?.lat,
          lng: editForm.lng ? parseFloat(editForm.lng) : g.position?.lng,
        },
        lastUpdated: new Date().toISOString(),
      } : g));
      setIsEditing(null);
      toast.success("Perubahan disimpan");
    }
  };

  const handleGensetClick = (genset) => {
    if (onGensetClick && genset.position?.lat && genset.position?.lng) {
      onGensetClick(genset);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 z-[2000] w-full md:w-96 h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
        >
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Mobile Genset</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 dark:text-slate-300" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => { setIsAdding(true); setEditForm({}); setIsEditing(null); }}
              disabled={isAdding}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Tambah Genset Mobile
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {isAdding && (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Genset Baru</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Nama Genset" className="w-full p-2 text-sm border dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  <input type="text" placeholder="Kapasitas (mis: 100 KVa)" className="w-full p-2 text-sm border dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} />
                  <input type="text" placeholder="Lokasi (mis: STO Jambi)" className="w-full p-2 text-sm border dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                  <select className="w-full p-2 text-sm border dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white" onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="IDLE">IDLE</option>
                    <option value="OPERASIONAL">OPERASIONAL</option>
                    <option value="TIDAK BERFUNGSI">TIDAK BERFUNGSI</option>
                  </select>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded font-bold text-sm">Batal</button>
                    <button onClick={() => handleSave(null)} className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold text-sm flex items-center justify-center gap-1"><Save className="w-4 h-4" /> Simpan</button>
                  </div>
                </div>
              </motion.div>
            )}

            {gensets.map(genset => {
              const editing = isEditing === genset.id;
              return (
                <div key={genset.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    {editing ? (
                      <input type="text" className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 border-none rounded p-1 w-2/3" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    ) : (
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">{genset.name}</h3>
                    )}
                    {editing ? (
                      <button onClick={() => handleSave(genset.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Save className="w-4 h-4" /></button>
                    ) : (
                      <button onClick={() => { setIsEditing(genset.id); setIsAdding(false); setEditForm(genset); }} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><Edit2 className="w-4 h-4" /></button>
                    )}
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold w-16">Kapasitas:</span>
                      {editing ? <input type="text" className="flex-1 p-1 bg-slate-100 dark:bg-slate-700 rounded border-none" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} /> : <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-xs">{genset.capacity}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="font-semibold w-16">Posisi:</span>
                      {editing ? <input type="text" className="flex-1 p-1 bg-slate-100 dark:bg-slate-700 rounded border-none" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} /> : <span>{genset.location}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 pt-1">
                      <span className="font-semibold w-16 ml-6">Status:</span>
                      {editing ? (
                        <select className="flex-1 p-1 bg-slate-100 dark:bg-slate-700 rounded border-none" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                          <option value="IDLE">IDLE</option>
                          <option value="OPERASIONAL">OPERASIONAL</option>
                          <option value="TIDAK BERFUNGSI">TIDAK BERFUNGSI</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide ${genset.status === 'OPERASIONAL' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : genset.status === 'IDLE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>{genset.status}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-right text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Terakhir diupdate: {genset.lastUpdated}
                  </div>
                </div>
              );
            })}

            {gensets.length === 0 && !isAdding && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm">
                <Truck className="w-12 h-12 mb-3 opacity-20" />
                Tidak ada data mobile genset.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
