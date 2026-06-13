import fs from 'fs';

const inputPath = './public/DATA_SECRET/data-grouped.json';
const outputPath = './public/DATA/data-grouped.json';

if (!fs.existsSync(inputPath)) {
  console.error("Data sumber rahasia tidak ditemukan di:", inputPath);
  process.exit(1);
}

const rawText = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawText);

let devCounter = 1;

data.forEach(location => {
  if (location.devices) {
    location.devices.forEach(device => {
      // Anonymize Device Code & internal CODE
      const id = String(devCounter).padStart(4, '0');
      device.DEVICE_CODE = `DEV-${id}`;
      if (device.CODE) {
        device.CODE = `SYS-${id}`;
      }
      
      // Anonymize UID (IP or MAC)
      if (device.UID) {
        device.UID = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      }
      
      devCounter++;
    });
  }
});

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log(`Berhasil membuat data anonim untuk ${devCounter - 1} perangkat.`);
console.log(`Data tersimpan di ${outputPath}`);
