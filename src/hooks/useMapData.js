import { useState, useEffect, useMemo } from 'react';
import { isCatuDaya } from '../utils/parser';
import { getDistrictForLocation, getClusterForLocation, getAreaForLocation } from '../utils/hierarchy';
import { generateTopologyLinks } from '../utils/topology';
import toast from 'react-hot-toast';
import { locationsAPI } from '../services/api';

// Flag untuk menggunakan API atau localStorage
const USE_API = import.meta.env.VITE_USE_API === 'true' || false;

// Storage key for custom devices
const CUSTOM_DEVICES_KEY = 'map_inventory_custom_devices';

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

  // Track custom devices for reactivity
  const [customDevicesVersion, setCustomDevicesVersion] = useState(0);

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

  // Listen for custom devices updates
  useEffect(() => {
    const handleCustomDevicesUpdate = () => {
      setCustomDevicesVersion(v => v + 1);
    };
    window.addEventListener('custom_devices_updated', handleCustomDevicesUpdate);
    return () => window.removeEventListener('custom_devices_updated', handleCustomDevicesUpdate);
  }, []);

  // Load custom devices from localStorage - using useState and useEffect pattern
  const [customDevices, setCustomDevices] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DEVICES_KEY);
      if (stored) {
        setCustomDevices(JSON.parse(stored));
      } else {
        setCustomDevices([]);
      }
    } catch (e) {
      console.error('Failed to load custom devices', e);
      setCustomDevices([]);
    }
  }, [customDevicesVersion]);

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

  // Group custom devices by location name
  const customDevicesByLocation = useMemo(() => {
    const grouped = {};
    customDevices.forEach(device => {
      const locName = device.LOCATION || device.location;
      if (locName) {
        if (!grouped[locName]) {
          grouped[locName] = [];
        }
        grouped[locName].push(device);
      }
    });
    return grouped;
  }, [customDevices]);

  // Filter and compute stats - NOW INTEGRATES CUSTOM DEVICES
  useEffect(() => {
    if (!rawLocationsData.length) return;

    let totalDevs = 0;
    let cDaya = 0;
    let nonCDaya = 0;
    let op = 0;
    let nonOp = 0;

    const newLocations = rawLocationsData.map(loc => {
      // Get hierarchy info
      const locDistrict = getDistrictForLocation(loc.name);
      const locCluster = getClusterForLocation(loc.name);
      const locArea = getAreaForLocation(loc.name);

      // Apply hierarchy filters
      if (districtFilter.length > 0 && !districtFilter.includes(locDistrict)) return null;
      if (clusterFilter.length > 0 && !clusterFilter.includes(locCluster)) return null;
      if (locationFilter.length > 0 && !locationFilter.includes(loc.name)) return null;

      // Get custom devices for this location
      const customDevicesHere = customDevicesByLocation[loc.name] || [];

      // Combine static devices with custom devices
      const allDevices = [...loc.devices, ...customDevicesHere];

      // Apply filters to all devices
      const filteredDevices = allDevices.filter(d => {
        const deviceType = d.DEVICE_TYPE || d.device_type || '';
        const isCD = isCatuDaya(deviceType);

        // Category filter
        if (filter === 'CATU_DAYA' && !isCD) return false;
        if (filter === 'NON_CATU_DAYA' && isCD) return false;

        // Status filter - normalize status value
        const deviceStatus = (d.STATUS || d.status || '').toUpperCase();
        const targetStatus = statusFilter.toUpperCase();
        if (targetStatus !== 'ALL' && deviceStatus !== targetStatus) return false;

        // Condition filter
        const deviceCondition = d.CONDITION || d.condition || '';
        if (conditionFilter !== 'ALL' && deviceCondition !== conditionFilter) return false;

        // Brand filter - check both BRAND and MERK
        const deviceBrand = d.BRAND || d.MERK || d.brand || '';
        if (brandFilter !== 'ALL' && deviceBrand !== brandFilter) return false;

        // Search filter - search by device name, type, brand, location, and merk
        if (search) {
          const q = search.toLowerCase();
          const deviceName = (d.DEVICE_NAME || d.device_name || d.name || '').toLowerCase();
          const deviceCode = (d.DEVICE_CODE || d.device_code || '').toLowerCase();
          const deviceTypeLower = deviceType.toLowerCase();
          const deviceBrandLower = deviceBrand.toLowerCase();
          const deviceLocation = (d.LOCATION || d.location || loc.name || '').toLowerCase();
          const deviceMerk = (d.MERK || '').toLowerCase();

          const matchesSearch =
            deviceName.includes(q) ||
            deviceLocation.includes(q) ||
            deviceCode.includes(q) ||
            deviceTypeLower.includes(q) ||
            deviceBrandLower.includes(q) ||
            deviceMerk.includes(q);

          if (!matchesSearch) return false;
        }
        return true;
      });

      // Calculate counts
      let catuDayaCount = 0;
      let nonCatuDayaCount = 0;
      filteredDevices.forEach(d => {
        const deviceType = d.DEVICE_TYPE || d.device_type || '';
        if (isCatuDaya(deviceType)) {
          catuDayaCount++;
          cDaya++;
        } else {
          nonCatuDayaCount++;
          nonCDaya++;
        }

        const deviceStatus = (d.STATUS || d.status || '').toUpperCase();
        if (deviceStatus === 'OPERATIONAL') op++; else nonOp++;
      });

      totalDevs += filteredDevices.length;

      return {
        ...loc,
        devices: filteredDevices,
        catuDayaCount,
        nonCatuDayaCount,
        // Mark if has custom devices
        hasCustomDevices: customDevicesHere.length > 0
      };
    }).filter(loc => loc !== null && loc.devices.length > 0);

    setLocationsData(newLocations);
    setStats({ total: totalDevs, catuDaya: cDaya, nonCatuDaya: nonCDaya, operational: op, nonOperational: nonOp });
  }, [rawLocationsData, filter, statusFilter, conditionFilter, brandFilter, search, districtFilter, clusterFilter, locationFilter, districtFilterParam, clusterFilterParam, locationFilterParam, customDevicesByLocation]);

  return {
    rawLocationsData, setRawLocationsData,
    locationsData, loading, stats,
    activeLocation, setActiveLocation,
    userGPSLocation, setUserGPSLocation,
    addressMap,
    topologyLinks,
    availableBrands, availableStatuses, availableConditions,
    customDevices,
  };
}
