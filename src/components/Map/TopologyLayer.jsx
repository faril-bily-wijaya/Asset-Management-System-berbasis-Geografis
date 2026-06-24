import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';

export default function TopologyLayer({ topologyLinks, showTopology, onLinkClick }) {
  if (!showTopology) return null;

  return topologyLinks.map((link, idx) => {
    const brokenDevices = link.target.devices ? link.target.devices.filter(d => d.STATUS !== 'OPERATIONAL') : [];

    const criticalDevices = brokenDevices.filter(d =>
      ['ROUTER', 'SWITCH', 'OLT', 'SERVER', 'GENSET', 'RECTIFIER', 'BATTERE', 'MDP'].some(type => d.DEVICE_TYPE.includes(type))
    );

    const warningDevices = brokenDevices.filter(d =>
      ['AC SPLIT', 'EXHAUST', 'LAMPU'].some(type => d.DEVICE_TYPE.includes(type)) || !criticalDevices.includes(d)
    );

    const isCritical = criticalDevices.length > 0;
    const isWarning = warningDevices.length > 0 && !isCritical;

    let linkColor = link.type === 'CORE_LINK' ? '#6366f1' : '#3b82f6';
    if (isCritical) linkColor = '#ef4444';
    else if (isWarning) linkColor = '#f59e0b';

    const linkWeight = link.type === 'CORE_LINK' ? 4 : 2;
    const linkDash = link.type === 'CORE_LINK' ? '' : '5, 10';

    return (
      <Polyline
        key={`link-${idx}`}
        positions={[link.source.coords, link.target.coords]}
        eventHandlers={{
          click: () => onLinkClick(link)
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
  });
}
