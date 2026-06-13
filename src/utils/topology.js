import { getDistrictForLocation, DISTRICT_LIST } from './hierarchy';

// Rumus Haversine untuk menghitung jarak antara dua titik koordinat (dalam Kilometer)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// Algoritma untuk men-generate relasi (Links) jaringan berdasarkan Hierarki District Enterprise
export function generateTopologyLinks(locationsWithCoords) {
  if (!locationsWithCoords || locationsWithCoords.length === 0) return [];

  const locDensity = locationsWithCoords.map(loc => ({
    ...loc,
    lat: loc.coords[0],
    lng: loc.coords[1],
    totalDevices: loc.devices ? loc.devices.length : 0,
    district: getDistrictForLocation(loc.name)
  }));

  const links = [];
  const districtHubs = {}; // Menyimpan Hub untuk tiap District

  // 1. Tentukan District Hub untuk setiap District (Site dengan perangkat terbanyak di wilayah tersebut)
  DISTRICT_LIST.forEach(district => {
    const sitesInDistrict = locDensity.filter(loc => loc.district === district);
    if (sitesInDistrict.length > 0) {
      // Urutkan berdasarkan total devices
      sitesInDistrict.sort((a, b) => b.totalDevices - a.totalDevices);
      const hub = sitesInDistrict[0];
      districtHubs[district] = hub;

      // 2. Buat Distribution Link (Spoke ke Hub dalam 1 District yang sama)
      sitesInDistrict.forEach(site => {
        if (site.name !== hub.name) {
          links.push({
            source: hub,
            target: site,
            type: 'DISTRIBUTION_LINK',
            distance: getDistance(hub.lat, hub.lng, site.lat, site.lng)
          });
        }
      });
    }
  });

  // 3. Buat Core Link (Menghubungkan antar District Hub)
  // Palembang adalah Regional Center (Ibukota Sumbagsel), jadi kita hubungkan semua Hub Provinsi ke Palembang
  const regionalCenter = districtHubs["PALEMBANG"];
  if (regionalCenter) {
    Object.keys(districtHubs).forEach(district => {
      if (district !== "PALEMBANG" && districtHubs[district]) {
        const hub = districtHubs[district];
        links.push({
          source: regionalCenter,
          target: hub,
          type: 'CORE_LINK',
          distance: getDistance(regionalCenter.lat, regionalCenter.lng, hub.lat, hub.lng)
        });
      }
    });
  }

  return links;
}
