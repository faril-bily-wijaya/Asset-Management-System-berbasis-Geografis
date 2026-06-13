import fs from 'fs';
import https from 'https';

const text = fs.readFileSync('./public/DATA/data-grouped.json', 'utf8');
const data = JSON.parse(text);
const allLocations = data.map(d => d.name);

const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MapInventoryApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
};

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const result = {};
  for (const loc of allLocations) {
    let cleanLoc = loc.replace('MDF ', '').replace('U/ DLC ', '');
    
    // Try Telkomsel
    let query = encodeURIComponent(`Telkomsel ${cleanLoc}`);
    let data = await fetchUrl(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=id`);
    await delay(1000);
    
    // Try Telkom
    if (data.length === 0) {
      query = encodeURIComponent(`Telkom ${cleanLoc}`);
      data = await fetchUrl(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=id`);
      await delay(1000);
    }

    // Try Grapari
    if (data.length === 0) {
      query = encodeURIComponent(`Grapari ${cleanLoc}`);
      data = await fetchUrl(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=id`);
      await delay(1000);
    }
    
    // Try City Center
    if (data.length === 0) {
      query = encodeURIComponent(`${cleanLoc}, Indonesia`);
      data = await fetchUrl(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      await delay(1000);
    }

    if (data.length > 0) {
      result[loc] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      console.log(`[OK] ${loc} -> ${result[loc]}`);
    } else {
      console.log(`[FAIL] ${loc}`);
      // Fallback to random if entirely failed
      result[loc] = [-2.9909 + (Math.random() - 0.5) * 0.5, 104.7565 + (Math.random() - 0.5) * 0.5];
    }
  }

  // Generate parser.js content replacement
  const dictStr = JSON.stringify(result, null, 2);
  const parserPath = './src/utils/parser.js';
  let parserContent = fs.readFileSync(parserPath, 'utf8');
  
  // Replace the locationCoords block
  const startIdx = parserContent.indexOf('export const locationCoords = {');
  const endIdx = parserContent.indexOf('};', startIdx) + 2;
  
  const newBlock = `export const locationCoords = ${dictStr};`;
  parserContent = parserContent.substring(0, startIdx) + newBlock + parserContent.substring(endIdx);
  
  fs.writeFileSync(parserPath, parserContent);
  console.log('parser.js updated!');
}

main().catch(console.error);
