import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext';
import { MapProvider } from './contexts/MapContext';

import MainLayout from './layouts/MainLayout';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NetworkPage from './pages/NetworkPage';
import FilterPage from './pages/FilterPage';
import ManagementPage from './pages/ManagementPage';

function App() {
  return (
    <FilterProvider>
      <MapProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<MapPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="network" element={<NetworkPage />} />
            <Route path="filter" element={<FilterPage />} />
            <Route path="manajemen" element={<ManagementPage />} />
          </Route>
        </Routes>
      </MapProvider>
    </FilterProvider>
  );
}

export default App;
