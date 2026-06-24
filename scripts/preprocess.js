import fs from 'fs';
import Papa from 'papaparse';
import { isCatuDaya, locationCoords } from '../src/utils/parser.js';

const file = './public/DATA_SECRET/perangkat_lengkap.csv';

let allDevices = [];

console.log("Mulai pre-processing CSV...");

if (fs.existsSync(file)) {
  const text = fs.readFileSync(file, 'utf-8');
  
  const parsed = Papa.parse(text, {
    header: true,
    delimiter: ',', // New CSV is comma-separated
    skipEmptyLines: true
  });
  
  let countInFile = 0;
  parsed.data.forEach(row => {
    // Check if the row has a valid code
    if (row.code && row.jenis) {
      const device = {
        DEVICE_CODE: row.code,
        DEVICE_TYPE: row.jenis,
        BRAND: row.merk,
        CONDITION: row.kondisi,
        STATUS: row.status,
        CAP_REAL: (row.kapasitas ? row.kapasitas : '') + (row.satuan_kapasitas ? ' ' + row.satuan_kapasitas : ''),
        CAP_STATUS: '', // Not strictly needed based on current UI, but keeping for compatibility
        LOCATION: row.sites_name,
        ROOM: row.ruangan_name || '-',
        YEAR: row.tahun_operasi,
        CODE: row.label_code || row.code,
      };
      allDevices.push(device);
      countInFile++;
    }
  });
  
  console.log(`Berhasil mengekstrak ${countInFile} data dari ${file}`);
} else {
  console.warn(`File ${file} tidak ditemukan.`);
}

console.log(`Total data: ${allDevices.length} perangkat.`);

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
fs.writeFileSync('./public/DATA_SECRET/data-grouped.json', JSON.stringify(output, null, 2));
// Also write to old location so frontend finds it if it points there
fs.writeFileSync('./public/DATA/data-grouped.json', JSON.stringify(output, null, 2));

console.log(`Selesai! Data di-grouping menjadi ${output.length} titik lokasi.`);
console.log('File disimpan di ./public/DATA/data-grouped.json');
