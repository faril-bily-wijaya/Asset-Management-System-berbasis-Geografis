import React, { createContext, useContext, useState } from 'react';
import useMapData from '../hooks/useMapData';
import { useFilterContext } from './FilterContext';

const MapContext = createContext(null);

export function MapProvider({ children }) {
  const filters = useFilterContext();
  const mapData = useMapData(filters);
  const [mapStyle, setMapStyle] = useState('street');
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [showTopology, setShowTopology] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);

  const value = {
    ...mapData,
    mapStyle, setMapStyle,
    isHeatmapMode, setIsHeatmapMode,
    showTopology, setShowTopology,
    showCoverage, setShowCoverage
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}
