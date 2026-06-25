import { useState, useEffect, useMemo } from 'react';
import { isCatuDaya } from '../utils/parser';
import { getDistrictForLocation, getClusterForLocation } from '../utils/hierarchy';
import { generateTopologyLinks } from '../utils/topology';
import toast from 'react-hot-toast';
import { locationsAPI } from '../services/api';

// Flag untuk menggunakan API atau localStorage
const USE_API = import.meta.env.VITE_USE_API === 'true' || false;

export default function useMapData(filters) {
  const {
    filter, statusFilter, conditionFilter, brandFilter, search,
    districtFilter, clusterFilter, locationFilter,
    districtFilterParam, clusterFilterParam, locationFilterParam,
  } = filters;

  const [rawLocationsData, setRawLocationsData] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, catuDaya: 0, nonCatuDaya: 0, operational: 0, nonOperational: 0 });

  const [activeLocation, setActiveLocation] = useState(null);
  const [userGPSLocation, setUserGPSLocation] = useState(null);
  const [addressMap, setAddressMap] = useState(() => {
    try {
      const saved = localStorage.getItem('addressCache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { availableBrands, availableStatuses, availableConditions } = useMemo(() => {
    const brands = new Set();
    const statuses = new Set();
    const conditions = new Set();
    rawLocationsData.forEach(loc => {
      loc.devices.forEach(d => {
        const isCD = isCatuDaya(d.DEVICE_TYPE);
        if (filter === 'CATU_DAYA' && !isCD) return;
        if (filter === 'NON_CATU_DAYA' && isCD) return;
        if (d.BRAND) brands.add(d.BRAND);
        if (d.STATUS) statuses.add(d.STATUS);
        if (d.CONDITION) conditions.add(d.CONDITION);
      });
    });
    return {
      availableBrands: Array.from(brands).sort(),
      availableStatuses: Array.from(statuses).sort(),
      availableConditions: Array.from(conditions).sort()
    };
  }, [rawLocationsData, filter]);

  const topologyLinks = useMemo(() => {
    return generateTopologyLinks(locationsData);
  }, [locationsData]);

  // Load data on mount
  useEffect(() => {
    if (USE_API) {
      // Fetch data from the live backend API using central api service
      locationsAPI.getMapData()
        .then(res => {
          if (!res.data) throw new Error('API data not found');
          const mergedData = res.data.map(loc => ({
            ...loc,
            class_type: loc.class_type || 'BASIC',
            cluster: loc.cluster || 'TELKOM REGIONAL'
          }));
          setRawLocationsData(mergedData);
          setLoading(false);
        })
        .catch(err => {
          console.error("Gagal memuat data dari API", err);
          // Fallback ke static JSON
          loadStaticData();
        });
    } else {
      // Load dari static JSON file
      loadStaticData();
    }
  }, []);

  // Helper function untuk load static data
  const loadStaticData = () => {
    fetch('/DATA/data-location.json')
      .then(res => {
        if (!res.ok) throw new Error('Static data not found');
        return res.json();
      })
      .then(data => {
        const mergedData = data.map(loc => ({
          ...loc,
          class_type: loc.class_type || 'BASIC',
          cluster: loc.cluster || 'TELKOM REGIONAL'
        }));
        setRawLocationsData(mergedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat data static", err);
        toast.error("Gagal memuat data sistem!");
        setLoading(false);
      });
  };

  // Reverse geocode active location
  useEffect(() => {
    if (activeLocation) {
      const key = `${activeLocation[0]},${activeLocation[1]}`;
      if (!addressMap[key]) {
        const timeoutId = setTimeout(() => {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${activeLocation[0]}&lon=${activeLocation[1]}`)
            .then(res => res.json())
            .then(data => {
              const newAddr = data && data.display_name ? data.display_name : "Detail alamat tidak ditemukan di koordinat ini.";
              setAddressMap(prev => {
                let updated = { ...prev, [key]: newAddr };
                const keys = Object.keys(updated);
                if (keys.length > 200) {
                  const newUpdated = {};
                  keys.slice(50).forEach(k => newUpdated[k] = updated[k]);
                  updated = newUpdated;
                }
                localStorage.setItem('addressCache', JSON.stringify(updated));
                return updated;
              });
              if (data && data.display_name) toast.success("Alamat berhasil dimuat!");
              else toast.error("Detail alamat kosong.");
            })
            .catch(err => {
              console.error(err);
              setAddressMap(prev => ({ ...prev, [key]: "Gagal memuat alamat detail." }));
              toast.error("Gagal memuat alamat dari OpenStreetMap.");
            });
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [activeLocation, addressMap]);

  // Filter and compute stats
  useEffect(() => {
    if (!rawLocationsData.length) return;

    let totalDevs = 0;
    let cDaya = 0;
    let nonCDaya = 0;
    let op = 0;
    let nonOp = 0;

    const newLocations = rawLocationsData.map(loc => {
      if (districtFilter.length > 0 && !districtFilter.includes(getDistrictForLocation(loc.name))) return null;
      if (clusterFilter.length > 0 && !clusterFilter.includes(getClusterForLocation(loc.name))) return null;
      if (locationFilter.length > 0 && !locationFilter.includes(loc.name)) return null;

      const filteredDevices = loc.devices.filter(d => {
        const isCD = isCatuDaya(d.DEVICE_TYPE);
        if (filter === 'CATU_DAYA' && !isCD) return false;
        if (filter === 'NON_CATU_DAYA' && isCD) return false;

        if (statusFilter !== 'ALL' && d.STATUS !== statusFilter) return false;
        if (conditionFilter !== 'ALL' && d.CONDITION !== conditionFilter) return false;
        if (brandFilter !== 'ALL' && d.BRAND !== brandFilter) return false;

        if (search) {
          const q = search.toLowerCase();
          if (!d.LOCATION.toLowerCase().includes(q) &&
            !(d.DEVICE_CODE && d.DEVICE_CODE.toLowerCase().includes(q)) &&
            !(d.DEVICE_TYPE && d.DEVICE_TYPE.toLowerCase().includes(q)) &&
            !(d.BRAND && d.BRAND.toLowerCase().includes(q)) &&
            !(d.CONDITION && d.CONDITION.toLowerCase().includes(q))) {
            return false;
          }
        }
        return true;
      });

      let catuDayaCount = 0;
      let nonCatuDayaCount = 0;
      filteredDevices.forEach(d => {
        if (isCatuDaya(d.DEVICE_TYPE)) { catuDayaCount++; cDaya++; } else { nonCatuDayaCount++; nonCDaya++; }
        if (d.STATUS === 'OPERATIONAL') op++; else nonOp++;
      });

      totalDevs += filteredDevices.length;

      return {
        ...loc,
        devices: filteredDevices,
        catuDayaCount,
        nonCatuDayaCount
      };
    }).filter(loc => loc !== null && loc.devices.length > 0);

    setLocationsData(newLocations);
    setStats({ total: totalDevs, catuDaya: cDaya, nonCatuDaya: nonCDaya, operational: op, nonOperational: nonOp });
  }, [rawLocationsData, filter, statusFilter, conditionFilter, brandFilter, search, districtFilter, clusterFilter, locationFilter, districtFilterParam, clusterFilterParam, locationFilterParam]);

  return {
    rawLocationsData, setRawLocationsData,
    locationsData, loading, stats,
    activeLocation, setActiveLocation,
    userGPSLocation, setUserGPSLocation,
    addressMap,
    topologyLinks,
    availableBrands, availableStatuses, availableConditions,
  };
}
