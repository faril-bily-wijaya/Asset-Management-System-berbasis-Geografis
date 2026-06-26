import React, { useMemo, useState } from 'react';
import MultiSelect from '../MultiSelect';
import {
  getAreas,
  getDistrictsByArea,
  getClustersByDistrict,
  getLocationsByCluster,
  useDynamicHierarchy
} from '../../utils/hierarchy';

export default function HierarchyFilter({
  districtFilter, setDistrictFilter,
  clusterFilter, setClusterFilter,
  locationFilter, setLocationFilter,
}) {
  // Subscribe to hierarchy updates
  const hierarchyTick = useDynamicHierarchy();

  // Local state for area selection (to properly separate regions)
  const [selectedArea, setSelectedArea] = useState('REGIONAL SUMBAGSEL');

  // Get all available areas
  const areaOptions = useMemo(() => {
    void hierarchyTick;
    return getAreas();
  }, [hierarchyTick]);

  // Recompute options when hierarchy changes or area selection changes
  const districtOptions = useMemo(() => {
    void hierarchyTick;
    return getDistrictsByArea(selectedArea);
  }, [hierarchyTick, selectedArea]);

  const clusterOptions = useMemo(() => {
    void hierarchyTick;
    // If no district filter, get all clusters from all districts in selected area
    if (!districtFilter || districtFilter.length === 0) {
      const allClusters = [];
      districtOptions.forEach(district => {
        const clusters = getClustersByDistrict(selectedArea, district);
        allClusters.push(...clusters);
      });
      return [...new Set(allClusters)].sort();
    }
    // If district filter is set, get clusters only from those districts
    const allClusters = [];
    districtFilter.forEach(district => {
      const clusters = getClustersByDistrict(selectedArea, district);
      allClusters.push(...clusters);
    });
    return [...new Set(allClusters)].sort();
  }, [hierarchyTick, selectedArea, districtFilter, districtOptions]);

  const locationOptions = useMemo(() => {
    void hierarchyTick;
    // If no cluster filter, get all locations
    if (!clusterFilter || clusterFilter.length === 0) {
      const allLocations = [];
      districtFilter.forEach(district => {
        const clusters = getClustersByDistrict(selectedArea, district);
        clusters.forEach(cluster => {
          const locs = getLocationsByCluster(selectedArea, district, cluster);
          allLocations.push(...locs);
        });
      });
      // If no district filter either, get all locations in area
      if (!districtFilter || districtFilter.length === 0) {
        districtOptions.forEach(district => {
          const clusters = getClustersByDistrict(selectedArea, district);
          clusters.forEach(cluster => {
            const locs = getLocationsByCluster(selectedArea, district, cluster);
            allLocations.push(...locs);
          });
        });
      }
      return [...new Set(allLocations)].sort();
    }
    // Get locations for selected clusters
    const allLocations = [];
    clusterFilter.forEach(cluster => {
      // Find which district this cluster belongs to
      districtOptions.forEach(district => {
        const clusters = getClustersByDistrict(selectedArea, district);
        if (clusters.includes(cluster)) {
          const locs = getLocationsByCluster(selectedArea, district, cluster);
          allLocations.push(...locs);
        }
      });
    });
    return [...new Set(allLocations)].sort();
  }, [hierarchyTick, selectedArea, districtFilter, clusterFilter, districtOptions]);

  // Handle district filter change - reset cluster and location
  const handleDistrictChange = (selected) => {
    setDistrictFilter(selected);
    // Clusters and locations will be reset by the useFilters hook
  };

  // Handle cluster filter change - reset location
  const handleClusterChange = (selected) => {
    setClusterFilter(selected);
  };

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Filter Hierarki Area</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Row 1: Area & Regional */}
        <div className="flex flex-col gap-1.5">
          <select
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedArea}
            onChange={(e) => {
              setSelectedArea(e.target.value);
              // Reset all filters when area changes
              setDistrictFilter([]);
              setClusterFilter([]);
            }}
          >
            {areaOptions.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <select
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-default appearance-none focus:outline-none"
            value="SUMBAGSEL"
            readOnly
          >
            <option value="SUMBAGSEL">REGIONAL SUMBAGSEL</option>
          </select>
        </div>

        {/* Row 2: District & Cluster */}
        <div className="flex flex-col gap-1.5 relative z-40">
          <MultiSelect
            options={districtOptions}
            selected={districtFilter}
            onChange={handleDistrictChange}
            placeholder="All Districts"
          />
        </div>
        <div className="flex flex-col gap-1.5 relative z-30">
          <MultiSelect
            options={clusterOptions}
            selected={clusterFilter}
            onChange={handleClusterChange}
            placeholder="All Clusters"
          />
        </div>

        {/* Row 3: Location */}
        <div className="col-span-2 flex flex-col gap-1.5 relative z-20">
          <MultiSelect
            options={locationOptions}
            selected={locationFilter}
            onChange={setLocationFilter}
            placeholder="All Locations"
          />
        </div>
      </div>
    </div>
  );
}
