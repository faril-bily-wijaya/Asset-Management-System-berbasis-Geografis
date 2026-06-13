import fs from 'fs';
import readline from 'readline';

async function main() {
  const result = {};
  
  const fileStream = fs.createReadStream('./public/DATA/data-location.json', { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentName = null;
  let currentLat = null;
  let currentLon = null;
  let inTeknisi = false;

  for await (const line of rl) {
    if (line.includes('"teknisi"')) {
      inTeknisi = true;
    }
    if (inTeknisi && line.includes(']')) {
      inTeknisi = false;
    }

    if (!inTeknisi) {
      const nameMatch = line.match(/"name"\s*:\s*"([^"]+)"/);
      if (nameMatch && !line.includes('organization_name')) {
        currentName = nameMatch[1];
      }

      const latMatch = line.match(/"latitude"\s*:\s*"?([^",\s]+)"?/);
      if (latMatch && latMatch[1] !== 'null') {
        currentLat = latMatch[1];
      }

      const lonMatch = line.match(/"longitude"\s*:\s*"?([^",\s]+)"?/);
      if (lonMatch && lonMatch[1] !== 'null') {
        currentLon = lonMatch[1];
      }
    }

    // if we have all three, save and reset
    if (currentName && currentLat && currentLon) {
      result[currentName] = [parseFloat(currentLat), parseFloat(currentLon)];
      currentName = null;
      currentLat = null;
      currentLon = null;
    }
  }

  const numFound = Object.keys(result).length;
  console.log(`Berhasil mengekstrak ${numFound} koordinat asli dari file data-location.json menggunakan parser baris`);

  if (numFound > 0) {
    const dictStr = JSON.stringify(result, null, 2);
    const parserPath = './src/utils/parser.js';
    let parserContent = fs.readFileSync(parserPath, 'utf8');

    const startIdx = parserContent.indexOf('export const locationCoords = {');
    const endIdx = parserContent.indexOf('};', startIdx) + 2;

    if (startIdx !== -1 && endIdx !== -1) {
      const newBlock = `export const locationCoords = ${dictStr};`;
      parserContent = parserContent.substring(0, startIdx) + newBlock + parserContent.substring(endIdx);
      fs.writeFileSync(parserPath, parserContent);
      console.log('Kamus koordinat di parser.js berhasil diperbarui!');
    }
  }
}

main().catch(console.error);
