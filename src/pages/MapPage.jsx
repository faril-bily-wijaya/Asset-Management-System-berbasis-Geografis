import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useMapContext } from '../contexts/MapContext';
import MapFloatingButtons from '../components/Map/MapFloatingButtons';
import TopologyLayer from '../components/Map/TopologyLayer';
import HeatmapLayer from '../components/Map/HeatmapLayer';
import MarkerLayer from '../components/Map/MarkerLayer';
import CoverageLayer from '../components/Map/CoverageLayer';
import DeviceTableModal from '../components/Modals/DeviceTableModal';
import FaultImpactPanel from '../components/Network/FaultImpactPanel';
import MobileGensetTracker from '../components/Map/MobileGensetTracker';
import { useFilterContext } from '../contexts/FilterContext';

const gpsIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 border-[3px] border-white shadow-xl"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapController({ activeLocation, locationsData, areaFilter, districtFilter }) {
  const map = useMap();

  useEffect(() => {
    if (activeLocation) {
      map.flyTo(activeLocation, 14, { duration: 1.5 });
    }
  }, [activeLocation, map]);

  useEffect(() => {
    if ((areaFilter || districtFilter.length > 0) && locationsData && locationsData.length > 0 && !activeLocation) {
      if (locationsData.length === 1) {
        map.flyTo(locationsData[0].coords, 16, { duration: 1.5 });
      } else {
        const bounds = L.latLngBounds(locationsData.map(loc => loc.coords));
        map.flyToBounds(bounds, { duration: 1.5, padding: [50, 50] });
      }
    } else if (!areaFilter && districtFilter.length === 0 && !activeLocation && locationsData && locationsData.length > 0) {
      map.flyTo([-3.1, 103.5], 7.5, { duration: 1.5 });
    }
  }, [areaFilter, districtFilter, locationsData, map, activeLocation]);

  return null;
}

export default function MapPage() {
  const mapData = useMapContext();
  const filters = useFilterContext();
  const { setIsSidebarOpen } = useOutletContext();

  const [modalData, setModalData] = useState(null);
  const [faultImpactSite, setFaultImpactSite] = useState(null);
  const [showMobileGenset, setShowMobileGenset] = useState(false);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung Geolocation.");
      return;
    }
    toast.loading("Mencari lokasi Anda...", { id: 'gps' });
    navigator.geolocation.getCurrentPosition((position) => {
      toast.success("Lokasi ditemukan!", { id: 'gps' });
      const coords = [position.coords.latitude, position.coords.longitude];
      mapData.setUserGPSLocation(coords);
      mapData.setActiveLocation(coords);
    }, () => {
      toast.error("Gagal mendapatkan lokasi.", { id: 'gps' });
    });
  };

  const downloadCSV = (locationName, devices) => {
    const headers = ['DEVICE_CODE', 'DEVICE_TYPE', 'BRAND', 'CAP_REAL', 'CONDITION', 'STATUS'];
    const rows = devices.map(d => headers.map(h => `"${d[h] || ''}"`).join(';'));
    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_${locationName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("File CSV berhasil diunduh!");
  };

  const handleSaveEdit = (locationName, deviceCode, editForm) => {
    mapData.setRawLocationsData(prev => prev.map(loc => {
      if (loc.name === locationName) {
        return {
          ...loc,
          devices: loc.devices.map(d => d.DEVICE_CODE === deviceCode ? { ...d, ...editForm } : d)
        };
      }
      return loc;
    }));
    setModalData(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.DEVICE_CODE === deviceCode ? { ...d, ...editForm } : d)
    }));
  };

  const handleLocationClick = (loc) => {
    mapData.setActiveLocation(loc.coords);
    setModalData({ name: loc.name, devices: loc.devices, coords: loc.coords });
    setFaultImpactSite(null);
  };

  const handleLocationRightClick = (loc) => {
    mapData.setActiveLocation(loc.coords);
    setFaultImpactSite(loc);
    setModalData(null);
  };

  const handleLinkClick = (link) => {
    mapData.setActiveLocation(link.target.coords);
    setModalData({ name: link.target.name, devices: link.target.devices, coords: link.target.coords });
    setFaultImpactSite(null);
  };

  return (
    <div className={`w-full h-full relative ${mapData.mapStyle === 'satellite' ? 'map-satellite' : ''}`}>
      <MapFloatingButtons
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onGPS={handleGPS}
        isHeatmapMode={mapData.isHeatmapMode}
        onToggleHeatmap={() => mapData.setIsHeatmapMode(!mapData.isHeatmapMode)}
        showTopology={mapData.showTopology}
        onToggleTopology={() => mapData.setShowTopology(!mapData.showTopology)}
        showCoverage={mapData.showCoverage}
        onToggleCoverage={() => mapData.setShowCoverage(!mapData.showCoverage)}
        showMobileGenset={showMobileGenset}
        onToggleMobileGenset={() => setShowMobileGenset(!showMobileGenset)}
      />

      <AnimatePresence>
        {mapData.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium text-slate-700 dark:text-slate-200">Memuat Data Perangkat...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapContainer center={[-3.1, 103.5]} zoom={7.5} className="w-full h-full" zoomControl={false} maxZoom={22}>
        <MapController activeLocation={mapData.activeLocation} locationsData={mapData.locationsData} areaFilter={filters.areaFilter} districtFilter={filters.districtFilter} />
        {mapData.mapStyle === 'street' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/intl/id_id/help/terms_maps/">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={22}
            maxNativeZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/intl/id_id/help/terms_maps/">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            maxZoom={22}
            maxNativeZoom={19}
          />
        )}

        {mapData.userGPSLocation && (
          <Marker position={mapData.userGPSLocation} icon={gpsIcon}>
            <Popup>Lokasi Anda Saat Ini</Popup>
          </Marker>
        )}

        {mapData.showCoverage && (
          <CoverageLayer locationsData={mapData.locationsData} districtFilter={filters.districtFilter} clusterFilter={filters.clusterFilter} />
        )}

        <TopologyLayer
          topologyLinks={mapData.topologyLinks}
          showTopology={mapData.showTopology}
          onLinkClick={handleLinkClick}
        />

        {mapData.isHeatmapMode ? (
          <HeatmapLayer locationsData={mapData.locationsData} onLocationClick={handleLocationClick} />
        ) : (
          <MarkerLayer locationsData={mapData.locationsData} addressMap={mapData.addressMap} onLocationClick={handleLocationClick} onLocationRightClick={handleLocationRightClick} />
        )}
      </MapContainer>

      <MobileGensetTracker isOpen={showMobileGenset} onClose={() => setShowMobileGenset(false)} />

      <AnimatePresence>
        {modalData && (
          <DeviceTableModal
            modalData={modalData}
            addressMap={mapData.addressMap}
            onClose={() => setModalData(null)}
            onSaveEdit={handleSaveEdit}
            onDownloadCSV={downloadCSV}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {faultImpactSite && (
          <FaultImpactPanel
            site={faultImpactSite}
            topologyLinks={mapData.topologyLinks}
            onClose={() => setFaultImpactSite(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
