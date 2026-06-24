import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = searchParams.get('filter') || 'ALL';
  const statusFilter = searchParams.get('status') || 'ALL';
  const conditionFilter = searchParams.get('condition') || 'ALL';
  const brandFilter = searchParams.get('brand') || 'ALL';
  const districtFilterParam = searchParams.get('district');
  const clusterFilterParam = searchParams.get('cluster');
  const locationFilterParam = searchParams.get('location');
  const search = searchParams.get('search') || '';

  const districtFilter = useMemo(() => districtFilterParam ? districtFilterParam.split(',').filter(Boolean) : [], [districtFilterParam]);
  const clusterFilter = useMemo(() => clusterFilterParam ? clusterFilterParam.split(',').filter(Boolean) : [], [clusterFilterParam]);
  const locationFilter = useMemo(() => locationFilterParam ? locationFilterParam.split(',').filter(Boolean) : [], [locationFilterParam]);

  const updateSearchParams = useCallback((key, val) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (Array.isArray(val)) {
        if (val.length > 0) newParams.set(key, val.join(','));
        else newParams.delete(key);
      } else {
        if (val && val !== 'ALL' && val !== '') newParams.set(key, val);
        else newParams.delete(key);
      }
      return newParams;
    });
  }, [setSearchParams]);

  const setFilter = useCallback((val) => updateSearchParams('filter', val), [updateSearchParams]);
  const setStatusFilter = useCallback((val) => updateSearchParams('status', val), [updateSearchParams]);
  const setConditionFilter = useCallback((val) => updateSearchParams('condition', val), [updateSearchParams]);
  const setBrandFilter = useCallback((val) => updateSearchParams('brand', val), [updateSearchParams]);

  const setDistrictFilter = useCallback((valArray) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (valArray.length > 0) newParams.set('district', valArray.join(','));
      else newParams.delete('district');
      newParams.delete('cluster');
      newParams.delete('location');
      return newParams;
    });
  }, [setSearchParams]);

  const setClusterFilter = useCallback((valArray) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (valArray.length > 0) newParams.set('cluster', valArray.join(','));
      else newParams.delete('cluster');
      newParams.delete('location');
      return newParams;
    });
  }, [setSearchParams]);

  const setLocationFilter = useCallback((valArray) => {
    updateSearchParams('location', valArray);
  }, [updateSearchParams]);

  const setSearch = useCallback((val) => updateSearchParams('search', val), [updateSearchParams]);

  return {
    filter, statusFilter, conditionFilter, brandFilter,
    districtFilter, clusterFilter, locationFilter, search,
    districtFilterParam, clusterFilterParam, locationFilterParam,
    setFilter, setStatusFilter, setConditionFilter, setBrandFilter,
    setDistrictFilter, setClusterFilter, setLocationFilter, setSearch,
  };
}
