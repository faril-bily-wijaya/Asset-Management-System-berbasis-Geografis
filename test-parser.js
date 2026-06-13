import fs from 'fs';

const data = fs.readFileSync('./DATA/location_1-500.csv', 'utf8');
const lines = data.split('\n');

const line2 = lines[1] || lines[0]; // If it's actually just one line
const parts = line2.split(';');

const records = [];
// Skip header parts if they are at the beginning
// The header has 10 fields: DEVICE_CODE;DEVICE_TYPE;BRAND;CONDITION;STATUS;CAP_REAL;CAP_STATUS;LOCATION;ROOM;CODE;
let startIndex = 0;
if (parts[0] === 'DEVICE_CODE') {
  startIndex = 10;
}

for (let i = startIndex; i < parts.length; i += 21) {
  if (!parts[i]) continue;
  
  const record = {
    DEVICE_CODE: parts[i],
    DEVICE_TYPE: parts[i+1],
    BRAND: parts[i+2],
    CONDITION: parts[i+3],
    STATUS: parts[i+4],
    CAP_REAL: parts[i+5],
    CAP_STATUS: parts[i+6],
    LOCATION: parts[i+7],
    ROOM: parts[i+8],
    CODE: parts[i+9],
    UID: parts[i+20]
  };
  records.push(record);
}

const locations = new Set(records.map(r => r.LOCATION).filter(Boolean));
console.log(`Found ${records.length} records.`);
console.log(`Locations:`, Array.from(locations));
