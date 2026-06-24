import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';

export default function HeatmapLayer({ locationsData, onLocationClick }) {
  return locationsData.map((loc, idx) => {
    const brokenCount = loc.devices.filter(d => d.STATUS !== 'OPERATIONAL').length;
    if (brokenCount === 0) return null;
    const radius = Math.min(15 + (brokenCount * 3), 60);
    return (
      <CircleMarker
        key={`heat-${idx}`}
        center={loc.coords}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6, weight: 2 }}
        radius={radius}
        eventHandlers={{ click: () => onLocationClick(loc) }}
      >
        <Tooltip className="premium-tooltip" direction="top" opacity={1}>
          <div className="font-bold text-slate-800 text-center p-2">
            <p className="text-lg mb-1">{loc.name}</p>
            <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">{brokenCount} Perangkat Bermasalah</span>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  });
}
