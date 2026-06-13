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

// Algoritma untuk men-generate relasi (Links) jaringan berdasarkan heuristik
export function generateTopologyLinks(locationsWithCoords, numHubs = 5) {
  if (!locationsWithCoords || locationsWithCoords.length === 0) return [];

  // 1. Hitung jumlah perangkat (kepadatan) tiap lokasi
  const locDensity = locationsWithCoords.map(loc => ({
    ...loc,
    lat: loc.coords[0],
    lng: loc.coords[1],
    totalDevices: loc.devices ? loc.devices.length : 0
  }));

  // 2. Tentukan Pusat Jaringan (Core Hubs) berdasarkan jumlah perangkat terbanyak
  // (Asumsi: kota besar punya perangkat paling banyak)
  locDensity.sort((a, b) => b.totalDevices - a.totalDevices);
  
  const coreHubs = locDensity.slice(0, numHubs);
  const spokes = locDensity.slice(numHubs);

  const links = [];

  // 3. Hubungkan antar Core Hubs (agar tulang punggung jaringan tersambung)
  // Menghubungkan Hub n dengan Hub n-1
  for (let i = 1; i < coreHubs.length; i++) {
    links.push({
      source: coreHubs[i-1],
      target: coreHubs[i],
      type: 'CORE_LINK',
      distance: getDistance(coreHubs[i-1].lat, coreHubs[i-1].lng, coreHubs[i].lat, coreHubs[i].lng)
    });
  }

  // 4. Hubungkan tiap Spoke (cabang) ke Core Hub terdekat
  spokes.forEach(spoke => {
    let nearestHub = null;
    let minDistance = Infinity;

    coreHubs.forEach(hub => {
      const dist = getDistance(spoke.lat, spoke.lng, hub.lat, hub.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestHub = hub;
      }
    });

    if (nearestHub) {
      links.push({
        source: nearestHub,
        target: spoke,
        type: 'DISTRIBUTION_LINK',
        distance: minDistance
      });
    }
  });

  return links;
}
