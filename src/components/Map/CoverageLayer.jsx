import React, { useEffect, useState, useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getClusterForLocation } from '../../utils/hierarchy';

// Pemetaan dari nama cluster Telkom ke nama propinsi di GeoJSON
const CLUSTER_TO_PROVINCE = {
  'CLUSTER BENGKULU': 'BENGKULU',
  'CLUSTER LUBUK LINGGAU': 'BENGKULU', // Meskipun sebagian di Sumsel, kita gabungkan ke Bengkulu sesuai struktur atau bisa dipisah
  'CLUSTER JAMBI': 'JAMBI',
  'CLUSTER LAMPUNG': 'LAMPUNG',
  'CLUSTER PALEMBANG': 'SUMATERA SELATAN',
  'CLUSTER PANGKAL PINANG': 'BANGKA BELITUNG'
};

// Warna untuk masing-masing provinsi agar terlihat menarik
const PROVINCE_COLORS = {
  'BENGKULU': '#8b5cf6', // Ungu
  'JAMBI': '#ec4899', // Pink
  'LAMPUNG': '#3b82f6', // Biru
  'SUMATERA SELATAN': '#10b981', // Hijau
  'BANGKA BELITUNG': '#f59e0b' // Kuning/Orange
};

export default function CoverageLayer({ locationsData, districtFilter, clusterFilter }) {
  const [geoData, setGeoData] = useState(null);

  // Load file GeoJSON saat komponen pertama kali dirender
  useEffect(() => {
    fetch('/DATA/indonesia-prov.geojson')
      .then(res => {
        if (!res.ok) throw new Error("File GeoJSON tidak ditemukan");
        return res.json();
      })
      .then(data => {
        setGeoData(data);
      })
      .catch(err => {
        console.error("Gagal meload GeoJSON provinsi:", err);
      });
  }, []);

  // Filter geojson features berdasarkan lokasi yang sedang aktif/difilter
  const activeProvinces = useMemo(() => {
    if (!locationsData || locationsData.length === 0) return new Set();
    
    const active = new Set();
    locationsData.forEach(loc => {
      const cluster = getClusterForLocation(loc.name);
      // Khusus Lubuk Linggau secara geografis masuk Sumatera Selatan, tapi di struktur Telkom masuk Bengkulu.
      // Untuk akurasi peta, kita bisa paksa Lubuk Linggau ke Sumatera Selatan:
      if (cluster === 'CLUSTER LUBUK LINGGAU') {
        active.add('SUMATERA SELATAN');
      } else if (CLUSTER_TO_PROVINCE[cluster]) {
        active.add(CLUSTER_TO_PROVINCE[cluster]);
      }
    });

    return active;
  }, [locationsData]);

  // Styling function untuk GeoJSON
  const style = (feature) => {
    const propinsi = feature.properties.Propinsi;
    return {
      fillColor: PROVINCE_COLORS[propinsi] || '#cccccc',
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.3
    };
  };

  // Interaksi saat mouse berada di atas wilayah
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.5
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        // Reset style
        geoJsonLayerRef.current?.resetStyle(e.target);
      }
    });
  };

  // Simpan reference ke GeoJSON layer untuk fitur resetStyle
  const geoJsonLayerRef = React.useRef(null);

  if (!geoData) return null;

  // Saring fitur yang hanya masuk dalam set activeProvinces
  const filteredGeoData = {
    ...geoData,
    features: geoData.features.filter(feature => 
      activeProvinces.has(feature.properties.Propinsi)
    )
  };

  // Gunakan key unik berdasarkan panjang features agar komponen GeoJSON di-remount saat difilter
  // Hal ini penting karena React-Leaflet GeoJSON tidak mengupdate features secara reaktif tanpa perubahan key
  return (
    <GeoJSON 
      key={`geojson-${filteredGeoData.features.length}-${Array.from(activeProvinces).join('-')}`}
      ref={geoJsonLayerRef}
      data={filteredGeoData} 
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
