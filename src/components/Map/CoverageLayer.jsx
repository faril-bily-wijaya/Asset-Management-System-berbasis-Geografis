import React, { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import { convex, featureCollection, point } from '@turf/turf';
import { getDistrictForLocation, getClusterForLocation } from '../../utils/hierarchy';

export default function CoverageLayer({ locationsData, districtFilter, clusterFilter }) {
  const coveragePolygons = useMemo(() => {
    if (!locationsData || locationsData.length === 0) return [];
    
    // Group locations by cluster or district
    // If no filter, group by District. If District filter, group by Cluster.
    const groups = {};
    
    locationsData.forEach(loc => {
      let groupKey;
      if (districtFilter.length === 0) {
        groupKey = `DISTRICT_${getDistrictForLocation(loc.name)}`;
      } else {
        groupKey = `CLUSTER_${getClusterForLocation(loc.name)}`;
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      // Leaflet uses [lat, lng], but Turf uses [lng, lat]
      groups[groupKey].push(point([loc.coords[1], loc.coords[0]]));
    });

    const polygons = [];
    
    // Base colors for mapping
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    
    Object.keys(groups).forEach((key, i) => {
      const points = groups[key];
      // Convex hull needs at least 3 points.
      if (points.length >= 3) {
        const fc = featureCollection(points);
        const hull = convex(fc);
        if (hull) {
          // Convert back to [lat, lng] for Leaflet
          const leafletCoords = hull.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
          polygons.push({
            id: key,
            coords: leafletCoords,
            color: colors[i % colors.length]
          });
        }
      }
    });

    return polygons;
  }, [locationsData, districtFilter, clusterFilter]);

  return (
    <>
      {coveragePolygons.map(poly => (
        <Polygon 
          key={poly.id} 
          positions={poly.coords} 
          pathOptions={{ 
            color: poly.color, 
            fillColor: poly.color, 
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5, 10'
          }} 
        />
      ))}
    </>
  );
}
