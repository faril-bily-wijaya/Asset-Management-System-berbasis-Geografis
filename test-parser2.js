import fs from 'fs';

const data = fs.readFileSync('./DATA/location_1-500.csv', 'utf8');
// Fix the flat CSV by replacing `;R1.` with `\nR1.`
const fixedData = data.replace(/;R1\./g, '\nR1.');

const lines = fixedData.split('\n');
console.log(`Total rows after split: ${lines.length}`);

const records = [];
for(let i=1; i<lines.length; i++) {
  const parts = lines[i].split(';');
  records.push({
    DEVICE_CODE: parts[0],
    DEVICE_TYPE: parts[1],
    BRAND: parts[2],
    CONDITION: parts[3],
    STATUS: parts[4],
    CAP_REAL: parts[5],
    CAP_STATUS: parts[6],
    LOCATION: parts[7],
    ROOM: parts[8],
    CODE: parts[9],
  });
}

const locations = new Set(records.map(r => r.LOCATION).filter(Boolean));
console.log(`Found ${records.length} records.`);
console.log(`Unique Locations:`, Array.from(locations));
