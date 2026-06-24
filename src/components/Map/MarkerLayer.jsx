import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { MapPin, HardDrive, Layers } from 'lucide-react';

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

export default function MarkerLayer({ locationsData, addressMap, onLocationClick, onLocationRightClick }) {
  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={40} spiderfyOnMaxZoom={true} showCoverageOnHover={false}>
      {locationsData.map((loc, idx) => {
        let icon = mixedIcon;
        if (loc.catuDayaCount > 0 && loc.nonCatuDayaCount === 0) icon = catuDayaIcon;
        else if (loc.nonCatuDayaCount > 0 && loc.catuDayaCount === 0) icon = nonCatuDayaIcon;

        return (
          <Marker key={idx} position={loc.coords} icon={icon} eventHandlers={{ click: () => onLocationClick(loc), contextmenu: () => onLocationRightClick(loc) }}>
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

                <div className="w-full mt-3 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2"><Layers className="w-4 h-4" /> Klik kiri (Tabel Perangkat)</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">Klik kanan (Analisis Impact Jaringan)</div>
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}
