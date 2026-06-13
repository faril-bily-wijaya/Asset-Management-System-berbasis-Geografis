const fs = require('fs');

const data = fs.readFileSync('./DATA/location_1-500.csv', 'utf8');
const lines = data.split('\n');

const locations = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = line.split(';');
  const location = parts[7]; // DEVICE_CODE;DEVICE_TYPE;BRAND;CONDITION;STATUS;CAP_REAL;CAP_STATUS;LOCATION
  if (location) locations.add(location);
}

console.log(Array.from(locations));
