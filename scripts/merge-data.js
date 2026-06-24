import fs from 'fs';
import Papa from 'papaparse';
import { isCatuDaya } from '../src/utils/parser.js';

// File paths
const FILE_SEMICOLON = './public/DATA_SECRET/Data-location-lengkap.csv';
const FILE_COMMA_1 = './public/DATA_SECRET/perangkat_lengkap.csv';
const FILE_COMMA_2 = './public/DATA_SECRET/perangkat_update.csv';
const FILE_LOKASI_AKURAT = './public/DATA_SECRET/data-lokasi-akurat.json';

let allDevices = [];

console.log("🚀 Starting data merge process...\n");

// ============== LOAD LOKASI AKURAT ==============
console.log("📍 Loading data-lokasi-akurat.json...");
let lokasiAkurat = {};
let lokasiMeta = {};

if (fs.existsSync(FILE_LOKASI_AKURAT)) {
    const data = JSON.parse(fs.readFileSync(FILE_LOKASI_AKURAT, 'utf-8'));
    if (data && data.data && data.data.data) {
        data.data.data.forEach(loc => {
            const name = loc.name.toUpperCase();
            lokasiAkurat[name] = {
                lat: parseFloat(loc.latitude),
                lng: parseFloat(loc.longitude)
            };
            lokasiMeta[name] = {
                class_type: loc.class_type || 'BASIC',
                organization_name: loc.organization_name || 'TELKOM REGIONAL',
                uuid: loc.uuid || '',
                sname: loc.sname || '',
                teknisi: loc.teknisi || []
            };
        });
        console.log(`   ✅ Loaded ${Object.keys(lokasiAkurat).length} locations with accurate coords`);
    }
} else {
    console.warn(`   ⚠️ File ${FILE_LOKASI_AKURAT} not found`);
}

// ============== PARSE SEMICOLON FILE ==============
console.log("\n📄 Parsing Data-location-lengkap.csv (semicolon format)...");
if (fs.existsSync(FILE_SEMICOLON)) {
    const text = fs.readFileSync(FILE_SEMICOLON, 'utf-8');

    const parsed = Papa.parse(text, {
        header: false,
        delimiter: ';',
        skipEmptyLines: false
    });

    let countSemicolon = 0;

    for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i];

        if (row[0] && row[0].toString().includes('DEVICE_CODE')) continue;
        if (!row[0] || row[0].toString().trim() === '') continue;

        const device = {
            DEVICE_CODE: row[0] || '',
            DEVICE_TYPE: row[1] || '',
            BRAND: row[2] || '',
            CONDITION: row[3] || '',
            STATUS: row[4] || '',
            CAP_REAL: row[5] || '',
            CAP_STATUS: row[6] || '',
            LOCATION: row[7] || '',
            ROOM: row[8] || '',
            YEAR: '',
            CODE: row[9] || '',
        };

        if (i + 1 < parsed.data.length) {
            const nextRow = parsed.data[i + 1];
            if (nextRow && nextRow[0] && !nextRow[0].toString().includes('R1.')) {
                device.UID = nextRow[0].toString().trim();
            }
        }

        if (device.DEVICE_CODE && device.LOCATION && device.DEVICE_TYPE) {
            allDevices.push(device);
            countSemicolon++;
        }
    }

    console.log(`   ✅ Extracted ${countSemicolon} devices from semicolon file`);
} else {
    console.warn(`   ⚠️ File ${FILE_SEMICOLON} not found`);
}

// ============== PARSE COMMA FILE 1 (perangkat_lengkap.csv) ==============
console.log("\n📄 Parsing perangkat_lengkap.csv (comma format - SUMSEL)...");
if (fs.existsSync(FILE_COMMA_1)) {
    const text = fs.readFileSync(FILE_COMMA_1, 'utf-8');

    const parsed = Papa.parse(text, {
        header: true,
        delimiter: ',',
        skipEmptyLines: true
    });

    let countComma1 = 0;

    parsed.data.forEach(row => {
        if (row.code && row.jenis && row.sites_name) {
            const device = {
                DEVICE_CODE: row.code || '',
                DEVICE_TYPE: row.jenis || '',
                BRAND: row.merk || '',
                CONDITION: row.kondisi || '',
                STATUS: row.status || '',
                CAP_REAL: (row.kapasitas ? row.kapasitas : '') + (row.satuan_kapasitas ? ' ' + row.satuan_kapasitas : ''),
                CAP_STATUS: '',
                LOCATION: row.sites_name || '',
                ROOM: row.ruangan_name || '-',
                YEAR: row.tahun_operasi || '',
                CODE: row.label_code || row.code || '',
                UID: row.label_code || '',
            };
            allDevices.push(device);
            countComma1++;
        }
    });

    console.log(`   ✅ Extracted ${countComma1} devices from perangkat_lengkap.csv`);
} else {
    console.warn(`   ⚠️ File ${FILE_COMMA_1} not found`);
}

// ============== PARSE COMMA FILE 2 (perangkat_update.csv) ==============
console.log("\n📄 Parsing perangkat_update.csv (comma format - LAMPUNG)...");
if (fs.existsSync(FILE_COMMA_2)) {
    const text = fs.readFileSync(FILE_COMMA_2, 'utf-8');

    const parsed = Papa.parse(text, {
        header: true,
        delimiter: ',',
        skipEmptyLines: true
    });

    let countComma2 = 0;

    parsed.data.forEach(row => {
        if (row.code && row.jenis && row.sites_name) {
            const device = {
                DEVICE_CODE: row.code || '',
                DEVICE_TYPE: row.jenis || '',
                BRAND: row.merk || '',
                CONDITION: row.kondisi || '',
                STATUS: row.status || '',
                CAP_REAL: (row.kapasitas ? row.kapasitas : '') + (row.satuan_kapasitas ? ' ' + row.satuan_kapasitas : ''),
                CAP_STATUS: '',
                LOCATION: row.sites_name || '',
                ROOM: row.ruangan_name || '-',
                YEAR: row.tahun_operasi || '',
                CODE: row.label_code || row.code || '',
                UID: row.label_code || '',
            };
            allDevices.push(device);
            countComma2++;
        }
    });

    console.log(`   ✅ Extracted ${countComma2} devices from perangkat_update.csv`);
} else {
    console.warn(`   ⚠️ File ${FILE_COMMA_2} not found`);
}

// ============== GROUP BY LOCATION ==============
console.log("\n📍 Grouping devices by location...");

const grouped = {};

allDevices.forEach(d => {
    const locName = d.LOCATION ? d.LOCATION.toUpperCase().trim() : 'UNKNOWN';
    const locNameUpper = locName.toUpperCase();

    // Get coords: priority 1 = lokasiAkurat, priority 2 = random
    let coords;
    if (lokasiAkurat[locNameUpper]) {
        coords = [lokasiAkurat[locNameUpper].lat, lokasiAkurat[locNameUpper].lng];
    } else {
        // Random coords as fallback
        coords = [
            -3.0 + (Math.random() - 0.5) * 2,
            104.5 + (Math.random() - 0.5) * 3
        ];
    }

    // Get meta: priority 1 = lokasiAkurat, priority 2 = default
    const meta = lokasiMeta[locNameUpper] || {
        class_type: 'BASIC',
        organization_name: 'TELKOM REGIONAL'
    };

    if (!grouped[locName]) {
        grouped[locName] = {
            name: d.LOCATION,
            devices: [],
            catuDayaCount: 0,
            nonCatuDayaCount: 0,
            coords: coords,
            class_type: meta.class_type,
            cluster: meta.organization_name
        };
    }

    grouped[locName].devices.push(d);

    if (isCatuDaya(d.DEVICE_TYPE)) {
        grouped[locName].catuDayaCount++;
    } else {
        grouped[locName].nonCatuDayaCount++;
    }
});

// ============== ADD LOCATIONS FROM LOKASI AKURAT (that don't have devices) ==============
const lokasiAkuratNames = Object.keys(lokasiAkurat);
lokasiAkuratNames.forEach(name => {
    if (!grouped[name] && lokasiMeta[name]) {
        grouped[name] = {
            name: lokasiMeta[name].sname || name,
            devices: [],
            catuDayaCount: 0,
            nonCatuDayaCount: 0,
            coords: [lokasiAkurat[name].lat, lokasiAkurat[name].lng],
            class_type: lokasiMeta[name].class_type,
            cluster: lokasiMeta[name].organization_name
        };
    }
});

const output = Object.values(grouped);

// ============== STATISTICS ==============
console.log("\n📊 Statistics:");
console.log(`   Total devices: ${allDevices.length}`);
console.log(`   Unique locations: ${output.length}`);
console.log(`   Locations with accurate coords: ${Object.keys(lokasiAkurat).length}`);

let catuDayaTotal = 0;
let nonCatuDayaTotal = 0;
let accurateCount = 0;
output.forEach(loc => {
    catuDayaTotal += loc.catuDayaCount;
    nonCatuDayaTotal += loc.nonCatuDayaCount;
    const locNameUpper = loc.name.toUpperCase();
    if (lokasiAkurat[locNameUpper]) accurateCount++;
});
console.log(`   Total Catu Daya: ${catuDayaTotal}`);
console.log(`   Total Non-Catu Daya: ${nonCatuDayaTotal}`);
console.log(`   Locations with accurate coords: ${accurateCount}/${output.length}`);

// ============== CREATE data-location.json ==============
const locationMetaData = {
    data: {
        data: output.map(loc => ({
            name: loc.name,
            class_type: loc.class_type || 'BASIC',
            organization_name: loc.cluster || 'TELKOM REGIONAL'
        }))
    }
};

const locationOutputPath = './public/DATA_SECRET/data-location.json';
const locationOutputPathPublic = './public/DATA/data-location.json';

fs.writeFileSync(locationOutputPath, JSON.stringify(locationMetaData, null, 2));
fs.writeFileSync(locationOutputPathPublic, JSON.stringify(locationMetaData, null, 2));

console.log(`\n✅ Successfully generated data-location.json`);
console.log(`   📁 Saved to: ${locationOutputPath}`);
console.log(`   📁 Also copied to: ${locationOutputPathPublic}`);

// ============== WRITE OUTPUT ==============
const outputPath = './public/DATA_SECRET/data-grouped.json';
const outputPathPublic = './public/DATA/data-grouped.json';

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
fs.writeFileSync(outputPathPublic, JSON.stringify(output, null, 2));

console.log(`\n✅ Successfully generated data-grouped.json`);
console.log(`   📁 Saved to: ${outputPath}`);
console.log(`   📁 Also copied to: ${outputPathPublic}`);

// ============== LIST LOCATIONS ==============
console.log("\n📍 Locations found:");
output.forEach((loc, i) => {
    const locNameUpper = loc.name.toUpperCase();
    const hasCoords = lokasiAkurat[locNameUpper] ? '✅' : '⚠️ (random coords)';
    console.log(`   ${i + 1}. ${loc.name} - ${loc.devices.length} devices ${hasCoords}`);
});

console.log("\n🎉 Merge complete!");
