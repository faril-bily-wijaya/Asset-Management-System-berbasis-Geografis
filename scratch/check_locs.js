import fs from 'fs';

const text = fs.readFileSync('./public/DATA/data-grouped.json', 'utf8');
const data = JSON.parse(text);

const allLocations = data.map(d => d.name);

console.log(`Total unique locations: ${allLocations.length}`);
console.log("List of all locations:");
console.log(JSON.stringify(allLocations, null, 2));
