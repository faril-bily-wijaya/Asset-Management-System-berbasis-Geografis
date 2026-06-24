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

// Get list of Areas (top level)
export function getAreas() {
  return Object.keys(REGIONAL_HIERARCHY);
}

// Get Districts by Area
export function getDistrictsByArea(area) {
  if (!area || !REGIONAL_HIERARCHY[area]) return [];
  return Object.keys(REGIONAL_HIERARCHY[area]);
}

// Get Clusters by Area and District
export function getClustersByDistrict(area, district) {
  if (!area || !district || !REGIONAL_HIERARCHY[area] || !REGIONAL_HIERARCHY[area][district]) return [];
  return Object.keys(REGIONAL_HIERARCHY[area][district]);
}

// Get Locations by Area, District, and Cluster
export function getLocationsByCluster(area, district, cluster) {
  if (!area || !district || !cluster) return [];
  if (!REGIONAL_HIERARCHY[area] || !REGIONAL_HIERARCHY[area][district]) return [];
  return REGIONAL_HIERARCHY[area][district][cluster] || [];
}

// Get all locations for an area
export function getAllLocationsByArea(area) {
  if (!area || !REGIONAL_HIERARCHY[area]) return [];
  const locations = [];
  for (const district of Object.keys(REGIONAL_HIERARCHY[area])) {
    for (const cluster of Object.keys(REGIONAL_HIERARCHY[area][district])) {
      locations.push(...REGIONAL_HIERARCHY[area][district][cluster]);
    }
  }
  return [...new Set(locations)].sort();
}

// Storage key for custom locations
const LOCATIONS_STORAGE_KEY = 'map_inventory_locations';

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

// Get all locations (from hierarchy + custom STOs from localStorage)
export function getAllLocations() {
  const custom = loadCustomLocations();
  // Combine default STOs with custom STOs
  const allStos = [...new Set([...DEFAULT_STOS, ...custom.stos || []])].sort();
  return allStos;
}

// Fungsi bantuan untuk mendapatkan nama District dari sebuah lokasi
export function getDistrictForLocation(locationName) {
  for (const [area, districts] of Object.entries(REGIONAL_HIERARCHY)) {
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
  for (const [area, districts] of Object.entries(REGIONAL_HIERARCHY)) {
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
  for (const [area, districts] of Object.entries(REGIONAL_HIERARCHY)) {
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
export const DISTRICT_LIST = Object.keys(REGIONAL_HIERARCHY["REGIONAL SUMBAGSEL"] || {});

export function getClustersByDistrictLegacy(districtsArray) {
  let allClusters = [];
  const area = "REGIONAL SUMBAGSEL";
  const districts = districtsArray && districtsArray.length > 0 ? districtsArray : DISTRICT_LIST;

  for (const d of districts) {
    if (REGIONAL_HIERARCHY[area] && REGIONAL_HIERARCHY[area][d]) {
      allClusters = allClusters.concat(Object.keys(REGIONAL_HIERARCHY[area][d]));
    }
  }
  return [...new Set(allClusters)].sort();
}

export function getLocationsByClusterLegacy(districtsArray, clustersArray) {
  let allLocations = [];
  const area = "REGIONAL SUMBAGSEL";
  const districts = districtsArray && districtsArray.length > 0 ? districtsArray : DISTRICT_LIST;

  for (const d of districts) {
    if (REGIONAL_HIERARCHY[area] && REGIONAL_HIERARCHY[area][d]) {
      const clustersInD = Object.keys(REGIONAL_HIERARCHY[area][d]);
      const targetClusters = clustersArray && clustersArray.length > 0
        ? clustersInD.filter(c => clustersArray.includes(c))
        : clustersInD;

      for (const c of targetClusters) {
        if (REGIONAL_HIERARCHY[area][d][c]) {
          allLocations = allLocations.concat(REGIONAL_HIERARCHY[area][d][c]);
        }
      }
    }
  }

  return [...new Set(allLocations)].sort();
}
