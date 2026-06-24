import { getDistrictForLocation, DISTRICT_LIST, getClusterForLocation } from './hierarchy';
import { inferSiteRole } from './networkScoring';

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

// Algoritma untuk men-generate relasi (Links) jaringan mengikuti hierarki Regional -> District -> Cluster -> Location
export function generateTopologyLinks(locationsWithCoords) {
  if (!locationsWithCoords || locationsWithCoords.length === 0) return [];

  const locDensity = locationsWithCoords.map(loc => ({
    ...loc,
    lat: loc.coords[0],
    lng: loc.coords[1],
    totalDevices: loc.devices ? loc.devices.length : 0,
    district: getDistrictForLocation(loc.name),
    cluster: loc.cluster || getClusterForLocation(loc.name)
  }));

  const links = [];

  // 1. Tentukan Regional Hub (Pusat dari Regional Sumbagsel)
  // Prioritaskan Palembang, site terbesar atau PREMIUM/POP
  const palembangSites = locDensity.filter(loc => loc.district === 'PALEMBANG').sort((a, b) => b.totalDevices - a.totalDevices);
  let regionalHub = palembangSites.find(s => s.class_type === 'PREMIUM') || 
                    palembangSites.find(s => s.class_type === 'POP') || 
                    palembangSites[0];

  // Fallback jika tidak ada data Palembang
  if (!regionalHub) {
    regionalHub = locDensity.sort((a,b) => b.totalDevices - a.totalDevices)[0];
  }

  if (!regionalHub) return links;
  regionalHub.role = 'REGIONAL_HUB';

  // 2. Tentukan District Hub untuk setiap District
  const districts = [...new Set(locDensity.map(l => l.district))];
  const districtHubs = {}; // { districtName: siteObject }

  districts.forEach(district => {
    const sitesInDistrict = locDensity.filter(loc => loc.district === district).sort((a, b) => b.totalDevices - a.totalDevices);
    
    let dHub;
    if (district === regionalHub.district) {
      dHub = regionalHub;
    } else {
      const premiumSite = sitesInDistrict.find(s => s.class_type === 'PREMIUM');
      const popSite = sitesInDistrict.find(s => s.class_type === 'POP');
      const advanceSite = sitesInDistrict.find(s => s.class_type === 'ADVANCE');
      dHub = premiumSite || popSite || advanceSite || sitesInDistrict[0];
      dHub.role = 'DISTRICT_HUB';
    }

    districtHubs[district] = dHub;

    // Hubungkan District Hub ke Regional Hub (CORE LINK)
    if (dHub.name !== regionalHub.name) {
      links.push({
        source: regionalHub,
        target: dHub,
        type: 'CORE_LINK',
        distance: getDistance(regionalHub.lat, regionalHub.lng, dHub.lat, dHub.lng)
      });
    }
  });

  // 3. Tentukan Cluster Hub untuk setiap Cluster
  const clusters = [...new Set(locDensity.map(l => l.cluster))];
  const clusterHubs = {}; // { clusterName: siteObject }

  clusters.forEach(cluster => {
    const sitesInCluster = locDensity.filter(loc => loc.cluster === cluster).sort((a, b) => b.totalDevices - a.totalDevices);
    
    const premiumSite = sitesInCluster.find(s => s.class_type === 'PREMIUM');
    const popSite = sitesInCluster.find(s => s.class_type === 'POP');
    const advanceSite = sitesInCluster.find(s => s.class_type === 'ADVANCE');
    let cHub = premiumSite || popSite || advanceSite || sitesInCluster[0];

    // Cek apakah cHub ini sudah menjadi District Hub atau Regional Hub
    if (cHub.name === regionalHub.name) cHub = regionalHub;
    else if (Object.values(districtHubs).find(dh => dh.name === cHub.name)) cHub = Object.values(districtHubs).find(dh => dh.name === cHub.name);
    else cHub.role = 'DISTRIBUTION'; // Ini adalah titik distribusi / cluster hub

    clusterHubs[cluster] = cHub;

    // Hubungkan Cluster Hub ke District Hub (DISTRIBUTION LINK)
    const myDistrictHub = districtHubs[cHub.district];
    if (myDistrictHub && cHub.name !== myDistrictHub.name && cHub.name !== regionalHub.name) {
      links.push({
        source: myDistrictHub,
        target: cHub,
        type: 'DISTRIBUTION_LINK',
        distance: getDistance(myDistrictHub.lat, myDistrictHub.lng, cHub.lat, cHub.lng)
      });
    }
  });

  // 4. Hubungkan sisa Location ke Cluster Hub masing-masing (ACCESS LINK)
  locDensity.forEach(loc => {
    const myClusterHub = clusterHubs[loc.cluster];
    
    // Pastikan lokasi ini bukan hub yang sudah terhubung
    const isRegionalHub = loc.name === regionalHub.name;
    const isDistrictHub = Object.values(districtHubs).some(dh => dh.name === loc.name);
    const isClusterHub = Object.values(clusterHubs).some(ch => ch.name === loc.name);

    if (myClusterHub && !isRegionalHub && !isDistrictHub && !isClusterHub) {
      loc.role = 'ACCESS';
      links.push({
        source: myClusterHub,
        target: loc,
        type: 'ACCESS_LINK',
        distance: getDistance(myClusterHub.lat, myClusterHub.lng, loc.lat, loc.lng)
      });
    }
  });

  return links;
}
