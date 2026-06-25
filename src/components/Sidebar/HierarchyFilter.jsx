import React, { useMemo } from 'react';
import MultiSelect from '../MultiSelect';
import { getDistrictListLegacy, getClustersByDistrictLegacy, getLocationsByClusterLegacy, useDynamicHierarchy } from '../../utils/hierarchy';

export default function HierarchyFilter({
  districtFilter, setDistrictFilter,
  clusterFilter, setClusterFilter,
  locationFilter, setLocationFilter,
}) {
  // Subscribe to hierarchy updates
  const hierarchyTick = useDynamicHierarchy();

  // Recompute options when hierarchy changes
  const districtOptions = useMemo(() => {
    void hierarchyTick; // Force recompute on hierarchy update
    return getDistrictListLegacy();
  }, [hierarchyTick]);

  const clusterOptions = useMemo(() => {
    void hierarchyTick;
    return getClustersByDistrictLegacy(districtFilter);
  }, [hierarchyTick, districtFilter]);

  const locationOptions = useMemo(() => {
    void hierarchyTick;
    return getLocationsByClusterLegacy(districtFilter, clusterFilter);
  }, [hierarchyTick, districtFilter, clusterFilter]);

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Filter Hierarki Area</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Row 1: Area & Regional */}
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            disabled
            value="All Areas"
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed"
          />
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
            onChange={setDistrictFilter}
            placeholder="All Districts"
          />
        </div>
        <div className="flex flex-col gap-1.5 relative z-30">
          <MultiSelect
            options={clusterOptions}
            selected={clusterFilter}
            onChange={setClusterFilter}
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
