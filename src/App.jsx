import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FilterProvider } from './contexts/FilterContext';
import { MapProvider } from './contexts/MapContext';

import MainLayout from './layouts/MainLayout';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NetworkPage from './pages/NetworkPage';
import FilterPage from './pages/FilterPage';
import ManagementPage from './pages/ManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <MapProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<MapPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="filter" element={<FilterPage />} />
              <Route
                path="manajemen"
                element={<ManagementPage />}
              />
            </Route>
          </Routes>
        </MapProvider>
      </FilterProvider>
    </AuthProvider>
  );
}

export default App;
