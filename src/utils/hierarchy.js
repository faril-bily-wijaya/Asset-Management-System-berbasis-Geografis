// Pemetaan hierarki Enterprise Telkomsel Regional Sumbagsel
// Area → Regional → District → Cluster → Array of Location (Site) Names

export const REGIONAL_HIERARCHY = {
  "REGIONAL SUMBAGSEL": {
    "JAMBI": {
      "CLUSTER JAMBI": [
        "BANGKO", "JAMBI", "KOTA BARU", "KUALA TUNGKAL", "MANDALO",
        "MDF MUARA RUPIT", "MDF TELANAI PURA", "MUARA BULIAN", "MUARA BUNGO",
        "MUARA TEBO", "PANKALAN BULIAN", "PASIR PUTIH", "RIMBO BUJANG",
        "SAROLANGUN JAMBI", "SINGKUT", "SUNGAI PENUH", "TEBINGTINGGI JAMBI"
      ]
    },
    "PANGKAL PINANG": {
      "CLUSTER PANGKAL PINANG": [
        "BELINYU", "JEBUS", "KELAPA", "KOBA", "MANGGAR", "MDF TEMPILANG",
        "MUNTOK", "PANGKAL PINANG", "SUNGAI LIAT", "TANJUNG PANDAN", "TOBOALI"
      ]
    },
    "PALEMBANG": {
      "CLUSTER PALEMBANG": [
        "BABAT TOMAN", "BATURAJA", "BELITANG", "BETUNG", "BUKIT SIGUNTANG",
        "INDRALAYA", "KAYU AGUNG", "KENTEN UJUNG", "MARTAPURA",
        "MDF U/ DLC PANGKALAN BALAI", "MUARADUA", "MUARA ENIM", "PALEMBANG CENTRUM",
        "PENDOPO TALANG UBI", "PLAJU", "PRABUMULIH", "SEBERANG ULU", "SEKAYU",
        "SERONG", "SUNGAI BUAH", "SUNGAI LILIN", "TALANG KELAPA", "TANJUNG BATU",
        "TANJUNG ENIM", "TANJUNG RAJA", "TUGUMULYO OKI", "UNIT"
      ]
    },
    "LAMPUNG": {
      "CLUSTER LAMPUNG": [
        "BANDAR JAYA", "BLAMBANGAN UMPU", "BUKIT KEMUNING", "FAJAR BULAN",
        "GEDONG TATAAN", "KALIANDA", "KALIREJO", "KEDATON", "KOTA AGUNG",
        "KOTABUMI", "KRUI", "LABUAN MARINGGAI", "LANGKAPURA", "LIWA", "MENGGALA",
        "METRO", "NATAR", "PANJANG", "PESUT", "PRINGSEWU", "SIGING", "SIMPANG PALAS",
        "SRIBAWONO", "SUKADANA", "TALANG PADANG", "TANJUNG KARANG", "TELUK BETUNG",
        "WAY JEPARA"
      ]
    },
    "BENGKULU": {
      "CLUSTER BENGKULU": [
        "ARGA MAKMUR", "BINTUHAN", "IPUH", "KETAHUN", "MANNA", "MDF BENGKULU CENTRUM",
        "MDF CURUP", "MDF KEPAHIANG", "MDF MUARA AMAN", "MDF PAGAR DEWA", "MUKO-MUKO", "TAIS"
      ],
      "CLUSTER LUBUK LINGGAU": [
        "LAHAT", "LUBUKLINGGAU", "PAGAR ALAM", "PENDOPO LINTANG", "SIMPANG PERIUK",
        "TEBINGTINGGI SUMSEL", "TUGUMULYO MUSI RAWAS"
      ]
    }
  }
};

// Storage key for custom locations
const LOCATIONS_STORAGE_KEY = 'map_inventory_locations';

export const triggerLocationsUpdate = () => {
  window.dispatchEvent(new Event('locations_updated'));
};

// Default STO list from data-location.json
const DEFAULT_STOS = [
  'ARGA MAKMUR', 'BABAT TOMAN', 'BANDAR JAYA', 'BANGKO', 'BATURAJA',
  'BELINYU', 'BELITANG', 'BETUNG', 'BINTUHAN', 'BLAMBANGAN UMPU',
  'BUKIT KEMUNING', 'BUKIT SIGUNTANG', 'GEDONG TATAAN', 'INDRALAYA',
  'IPUH', 'JAMBI', 'JEBUS', 'KALIANDA', 'KALIREJO', 'KAYU AGUNG',
  'KEDATON', 'KENTEN UJUNG', 'KETAHUN', 'KOBA', 'KOTA BARU',
  'KOTA AGUNG', 'KRUI', 'KUALA TUNGKAL', 'LABUAN MARINGGAI',
  'LAHAT', 'LIWA', 'LUBUKLINGGAU', 'MUARA BUNGO', 'MUARA BULIAN',
  'MANDALO', 'MUARA ENIM', 'METRO', 'MENGGALA', 'MANGGAR',
  'MUKO-MUKO', 'MANNA', 'MARTAPURA', 'MUARA TEBO', 'MUNTOK',
  'MUARADUA', 'NATAR', 'PRABUMULIH', 'PAGAR ALAM', 'PALEMBANG CENTRUM',
  'PANGKAL PINANG', 'PANJANG', 'PANKALAN BULIAN', 'PLAJU',
  'PRINGSEWU', 'RIMBO BUJANG', 'SEBERANG ULU', 'SUNGAI BUAH',
  'SINGKUT', 'SUKADANA', 'SEKAYU', 'SUNGAI LILIN', 'SUNGAI LIAT',
  'SUNGAI PENUH', 'SIMPANG PERIUK', 'SIMPANG PALAS', 'SAROLANGUN JAMBI',
  'SERONG', 'SRIBAWONO', 'TANJUNG BATU', 'TANJUNG ENIM', 'TOBOALI',
  'TANJUNG KARANG', 'TANJUNG PANDAN', 'TELUK BETUNG', 'TANJUNG RAJA',
  'TEBINGTINGGI SUMSEL', 'TEBINGTINGGI JAMBI', 'KOTABUMI', 'WAY JEPARA',
  'UNIT', 'TUGUMULYO OKI', 'TUGUMULYO MUSI RAWAS', 'TALANG PADANG',
  'TAIS', 'TALANG KELAPA', 'FAJAR BULAN', 'PESUT', 'SIGING', 'KELAPA',
  'KAP', 'CRP', 'PST', 'SGX', 'FBL'
];

// Load custom locations from localStorage
export function loadCustomLocations() {
  try {
    const stored = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load custom locations', e);
  }
  return { regionals: [], districts: [], clusters: [], stos: [] };
}

// Get combined hierarchy (Static + Custom from localStorage)
export function getCombinedHierarchy() {
  // Deep clone static hierarchy
  const combined = JSON.parse(JSON.stringify(REGIONAL_HIERARCHY));
  
  const custom = loadCustomLocations();
  
  // Add standalone districts
  if (custom.districts) {
    custom.districts.forEach(d => {
      const reg = custom.districtHierarchy?.[d]?.regional || "REGIONAL SUMBAGSEL";
      if (!combined[reg]) combined[reg] = {};
      if (!combined[reg][d]) combined[reg][d] = {};
    });
  }

  // Add clusters
  if (custom.clusters) {
    custom.clusters.forEach(c => {
      const h = custom.clusterHierarchy?.[c] || {};
      const reg = h.regional || "REGIONAL SUMBAGSEL";
      const dist = h.district || "UNKNOWN_DISTRICT";
      if (!combined[reg]) combined[reg] = {};
      if (!combined[reg][dist]) combined[reg][dist] = {};
      if (!combined[reg][dist][c]) combined[reg][dist][c] = [];
    });
  }

  // Add STOs
  if (custom.stos) {
    custom.stos.forEach(sto => {
      const h = custom.stoHierarchy?.[sto] || {};
      const reg = h.regional || "REGIONAL SUMBAGSEL";
      const dist = h.district || "UNKNOWN_DISTRICT";
      const clust = h.cluster || "UNKNOWN_CLUSTER";
      
      if (!combined[reg]) combined[reg] = {};
      if (!combined[reg][dist]) combined[reg][dist] = {};
      if (!combined[reg][dist][clust]) combined[reg][dist][clust] = [];
      if (!combined[reg][dist][clust].includes(sto)) {
        combined[reg][dist][clust].push(sto);
      }
    });
  }

  return combined;
}

// Get list of Areas (top level)
export function getAreas() {
  return Object.keys(getCombinedHierarchy());
}

// Get Districts by Area
export function getDistrictsByArea(area) {
  const hierarchy = getCombinedHierarchy();
  if (!area || !hierarchy[area]) return [];
  return Object.keys(hierarchy[area]);
}

// Get Clusters by Area and District
export function getClustersByDistrict(area, district) {
  const hierarchy = getCombinedHierarchy();
  if (!area || !district || !hierarchy[area] || !hierarchy[area][district]) return [];
  return Object.keys(hierarchy[area][district]);
}

// Get Locations by Area, District, and Cluster
export function getLocationsByCluster(area, district, cluster) {
  const hierarchy = getCombinedHierarchy();
  if (!area || !district || !cluster) return [];
  if (!hierarchy[area] || !hierarchy[area][district]) return [];
  return hierarchy[area][district][cluster] || [];
}

// Get all locations for an area
export function getAllLocationsByArea(area) {
  const hierarchy = getCombinedHierarchy();
  if (!area || !hierarchy[area]) return [];
  const locations = [];
  for (const district of Object.keys(hierarchy[area])) {
    for (const cluster of Object.keys(hierarchy[area][district])) {
      locations.push(...hierarchy[area][district][cluster]);
    }
  }
  return [...new Set(locations)].sort();
}

// Get all locations (from hierarchy + custom STOs from localStorage)
export function getAllLocations() {
  const custom = loadCustomLocations();
  // Combine default STOs with custom STOs
  const allStos = [...new Set([...DEFAULT_STOS, ...custom.stos || []])].sort();
  return allStos;
}

// Fungsi bantuan untuk mendapatkan nama District dari sebuah lokasi
export function getDistrictForLocation(locationName) {
  const hierarchy = getCombinedHierarchy();
  for (const [area, districts] of Object.entries(hierarchy)) {
    for (const [district, clusters] of Object.entries(districts)) {
      for (const locations of Object.values(clusters)) {
        if (locations.includes(locationName)) {
          return district;
        }
      }
    }
  }
  return "UNKNOWN";
}

// Fungsi bantuan untuk mendapatkan nama Cluster dari sebuah lokasi
export function getClusterForLocation(locationName) {
  const hierarchy = getCombinedHierarchy();
  for (const [area, districts] of Object.entries(hierarchy)) {
    for (const [district, clusters] of Object.entries(districts)) {
      for (const [clusterName, locations] of Object.entries(clusters)) {
        if (locations.includes(locationName)) {
          return clusterName;
        }
      }
    }
  }
  return "UNKNOWN";
}

// Fungsi bantuan untuk mendapatkan Area dari sebuah lokasi
export function getAreaForLocation(locationName) {
  const hierarchy = getCombinedHierarchy();
  for (const [area, districts] of Object.entries(hierarchy)) {
    for (const clusters of Object.values(districts)) {
      for (const locations of Object.values(clusters)) {
        if (locations.includes(locationName)) {
          return area;
        }
      }
    }
  }
  return "UNKNOWN";
}

// Get hierarchy path for a location
export function getHierarchyPath(locationName) {
  const area = getAreaForLocation(locationName);
  const district = getDistrictForLocation(locationName);
  const cluster = getClusterForLocation(locationName);

  return { area, district, cluster };
}

// Legacy exports for backward compatibility

// Mengganti DISTRICT_LIST menjadi function agar nilainya dinamis
export function getDistrictListLegacy() {
  const hierarchy = getCombinedHierarchy();
  return Object.keys(hierarchy["REGIONAL SUMBAGSEL"] || {});
}

// Kita biarkan konstanta dummy untuk mencegah error import destructuring di file lama
export const DISTRICT_LIST = []; 

export function getClustersByDistrictLegacy(districtsArray) {
  let allClusters = [];
  const hierarchy = getCombinedHierarchy();
  const area = "REGIONAL SUMBAGSEL";
  const districts = districtsArray && districtsArray.length > 0 ? districtsArray : getDistrictListLegacy();

  for (const d of districts) {
    if (hierarchy[area] && hierarchy[area][d]) {
      allClusters = allClusters.concat(Object.keys(hierarchy[area][d]));
    }
  }
  return [...new Set(allClusters)].sort();
}

export function getLocationsByClusterLegacy(districtsArray, clustersArray) {
  let allLocations = [];
  const hierarchy = getCombinedHierarchy();
  const area = "REGIONAL SUMBAGSEL";
  const districts = districtsArray && districtsArray.length > 0 ? districtsArray : getDistrictListLegacy();

  for (const d of districts) {
    if (hierarchy[area] && hierarchy[area][d]) {
      const clustersInD = Object.keys(hierarchy[area][d]);
      const targetClusters = clustersArray && clustersArray.length > 0
        ? clustersInD.filter(c => clustersArray.includes(c))
        : clustersInD;

      for (const c of targetClusters) {
        if (hierarchy[area][d][c]) {
          allLocations = allLocations.concat(hierarchy[area][d][c]);
        }
      }
    }
  }

  return [...new Set(allLocations)].sort();
}

// React Hook untuk me-re-render komponen saat custom data lokasi berubah
import { useState, useEffect } from 'react';
export function useDynamicHierarchy() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('locations_updated', handleUpdate);
    return () => window.removeEventListener('locations_updated', handleUpdate);
  }, []);
  return tick;
}
