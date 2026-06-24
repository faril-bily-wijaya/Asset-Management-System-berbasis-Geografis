import React, { createContext, useContext } from 'react';
import useFilters from '../hooks/useFilters';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const filters = useFilters();
  return (
    <FilterContext.Provider value={filters}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
