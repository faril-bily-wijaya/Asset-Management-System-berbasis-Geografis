import fs from 'fs';
import Papa from 'papaparse';
import { isCatuDaya, locationCoords } from '../src/utils/parser.js';

const files = [
  './public/DATA/location_1-500.csv',
  './public/DATA/location_501-1000.csv',
  './public/DATA/location_1001-1500.csv',
  './public/DATA/location_1501-2000.csv',
  './public/DATA/location_2001-2128.csv'
];

let allDevices = [];

console.log("Mulai pre-processing CSV...");

const allDevicesMap = new Map();

for (const f of files) {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, 'utf-8');
    
    // Parse using PapaParse correctly
    const parsed = Papa.parse(text, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true
    });
    
    // Some lines only contain the UID because of the 2-line format
    // We filter out lines that don't have a valid DEVICE_CODE
    let countInFile = 0;
    parsed.data.forEach(device => {
      if (device.DEVICE_CODE && device.DEVICE_TYPE) {
        if (!allDevicesMap.has(device.DEVICE_CODE)) {
          allDevicesMap.set(device.DEVICE_CODE, device);
          countInFile++;
        }
      }
    });
    
    console.log(`Berhasil mengekstrak ${countInFile} data unik dari ${f}`);
  } else {
    console.warn(`File ${f} tidak ditemukan.`);
  }
}

allDevices = Array.from(allDevicesMap.values());
console.log(`Total data setelah deduplikasi: ${allDevices.length} perangkat.`);

const grouped = {};

allDevices.forEach(d => {
  if (!grouped[d.LOCATION]) {
    grouped[d.LOCATION] = {
      name: d.LOCATION,
      devices: [],
      catuDayaCount: 0,
      nonCatuDayaCount: 0,
      coords: locationCoords[d.LOCATION] || [-2.9909 + (Math.random() - 0.5) * 0.5, 104.7565 + (Math.random() - 0.5) * 0.5] 
    };
  }
  grouped[d.LOCATION].devices.push(d);
  if (isCatuDaya(d.DEVICE_TYPE)) {
    grouped[d.LOCATION].catuDayaCount++;
  } else {
    grouped[d.LOCATION].nonCatuDayaCount++;
  }
});

const output = Object.values(grouped);
fs.writeFileSync('./public/DATA/data-grouped.json', JSON.stringify(output, null, 2));

console.log(`Selesai! Data di-grouping menjadi ${output.length} titik lokasi.`);
console.log('File disimpan di ./public/DATA/data-grouped.json');
