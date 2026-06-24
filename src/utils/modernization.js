// Utility functions untuk modernisasi perangkat DEFA
// Kriteria prioritas modernisasi berdasarkan umur perangkat

/**
 * Kriteria Umur Perangkat DEFA yang prioritas dilakukan modernisasi:
 * a. AC untuk umur > 15 tahun
 * b. Rectifier untuk umur > 15 tahun
 * c. Battery :
 *    - VRLA untuk umur > 10 tahun (kering)
 *    - VLA untuk umur > 20 tahun (basah)
 * d. Genset untuk umur > 25 tahun
 */

// Konstanta batas umur (dalam tahun)
export const MODERNIZATION_THRESHOLDS = {
    AC: 15,              // AC > 15 tahun
    RECTIFIER: 15,       // Rectifier > 15 tahun
    BATTERY_VRLA: 10,    // VRLA > 10 tahun (kering)
    BATTERY_VLA: 20,     // VLA > 20 tahun (basah)
    GENSET: 25,           // Genset > 25 tahun
};

// Konstanta tipe perangkat
const DEVICE_TYPES = {
    AC: ['ACSPLIT', 'ACSTANDING', 'PAC', 'AC', 'ACPDBSTANDING'],
    RECTIFIER: ['RECTIFIER'],
    BATTERY_VRLA: ['BATTERE', 'BATBASAH', 'BATSTARTER', 'BATTERY'],
    BATTERY_VLA: ['BATBASAH'],
    GENSET: ['GENSET', 'GENSET MOBILE'],
};

/**
 * Hitung umur perangkat berdasarkan tahun operasi
 * @param {string|number} tahunOperasi - Tahun operasi perangkat
 * @returns {number} Umur dalam tahun
 */
export function calculateDeviceAge(tahunOperasi) {
    if (!tahunOperasi) return 0;
    const year = parseInt(tahunOperasi);
    if (isNaN(year)) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - year;
}

/**
 * Dapatkan threshold modernisasi berdasarkan tipe perangkat
 * @param {string} deviceType - Tipe perangkat
 * @returns {number|null} Threshold umur dalam tahun, atau null jika tidak ada
 */
export function getModernizationThreshold(deviceType) {
    if (!deviceType) return null;
    const type = deviceType.toUpperCase();

    // Check AC types
    if (DEVICE_TYPES.AC.some(t => type.includes(t))) {
        return MODERNIZATION_THRESHOLDS.AC;
    }

    // Check Rectifier types
    if (DEVICE_TYPES.RECTIFIER.some(t => type.includes(t))) {
        return MODERNIZATION_THRESHOLDS.RECTIFIER;
    }

    // Check Genset types
    if (DEVICE_TYPES.GENSET.some(t => type.includes(t))) {
        return MODERNIZATION_THRESHOLDS.GENSET;
    }

    // Check Battery types
    if (type.includes('VLA') || type.includes('BASAH')) {
        return MODERNIZATION_THRESHOLDS.BATTERY_VLA;
    }
    if (DEVICE_TYPES.BATTERY_VRLA.some(t => type.includes(t))) {
        return MODERNIZATION_THRESHOLDS.BATTERY_VRLA;
    }

    return null;
}

/**
 * Cek apakah perangkat perlu dimodernisasi
 * @param {object} device - Objek perangkat
 * @returns {object} { needsModernization: boolean, reason: string|null, age: number }
 */
export function checkModernizationNeed(device) {
    const tahunOperasi = device.YEAR || device.tahun_operasi || '';
    const age = calculateDeviceAge(tahunOperasi);
    const deviceType = device.DEVICE_TYPE || device.jenis || '';

    if (age <= 0) {
        return { needsModernization: false, reason: null, age };
    }

    const threshold = getModernizationThreshold(deviceType);

    if (threshold === null) {
        return { needsModernization: false, reason: null, age };
    }

    if (age > threshold) {
        let reason = '';
        if (DEVICE_TYPES.AC.some(t => deviceType.toUpperCase().includes(t))) {
            reason = `AC umur ${age} tahun (> ${threshold} tahun)`;
        } else if (DEVICE_TYPES.RECTIFIER.some(t => deviceType.toUpperCase().includes(t))) {
            reason = `Rectifier umur ${age} tahun (> ${threshold} tahun)`;
        } else if (deviceType.toUpperCase().includes('VLA') || deviceType.toUpperCase().includes('BASAH')) {
            reason = `Battery VLA umur ${age} tahun (> ${threshold} tahun)`;
        } else if (DEVICE_TYPES.BATTERY_VRLA.some(t => deviceType.toUpperCase().includes(t))) {
            reason = `Battery VRLA umur ${age} tahun (> ${threshold} tahun)`;
        } else if (DEVICE_TYPES.GENSET.some(t => deviceType.toUpperCase().includes(t))) {
            reason = `Genset umur ${age} tahun (> ${threshold} tahun)`;
        } else {
            reason = `Perangkat umur ${age} tahun (> ${threshold} tahun)`;
        }

        return { needsModernization: true, reason, age };
    }

    return { needsModernization: false, reason: null, age };
}

/**
 * Format kapasitas perangkat (point 1 sesuai requirement)
 * @param {string} capReal - Kapasitas real
 * @returns {string} Kapasitas yang diformat
 */
export function formatCapacity(capReal) {
    if (!capReal) return '-';
    return capReal;
}

/**
 * Group devices by room
 * @param {Array} devices - Array perangkat
 * @returns {object} Objek dengan key = room name, value = array devices
 */
export function groupDevicesByRoom(devices) {
    const grouped = {};

    devices.forEach(device => {
        const room = device.ROOM || device.ruangan_name || 'RUANGAN TIDAK DIKETAHUI';
        const roomKey = room.toUpperCase().trim();

        if (!grouped[roomKey]) {
            grouped[roomKey] = {
                roomName: room,
                roomKey: roomKey,
                devices: [],
            };
        }

        grouped[roomKey].devices.push(device);
    });

    // Sort rooms alphabetically
    const sortedKeys = Object.keys(grouped).sort();
    const sorted = {};
    sortedKeys.forEach(key => {
        sorted[key] = grouped[key];
    });

    return sorted;
}

/**
 * Format room name untuk display (R1 = Ruangan)
 * @param {string} roomName - Nama ruangan
 * @returns {string} Nama ruangan yang diformat
 */
export function formatRoomName(roomName) {
    if (!roomName) return '-';
    // Tambahkan prefix R. jika belum ada
    if (!roomName.startsWith('R.') && !roomName.startsWith('R1')) {
        return `R. ${roomName}`;
    }
    return roomName;
}

/**
 * Get modernization recommendation text
 * @param {object} device - Objek perangkat
 * @returns {string} Teks rekomendasi
 */
export function getModernizationRecommendation(device) {
    const { needsModernization, reason, age } = checkModernizationNeed(device);

    if (needsModernization) {
        return `⚠️ USULAN MODERNISASI - ${reason}`;
    }

    return null;
}

/**
 * Dapatkan ringkasan statistik modernisasi untuk sebuah lokasi
 * @param {Array} devices - Array perangkat di satu lokasi
 * @returns {object} Statistik modernisasi
 */
export function getModernizationStats(devices) {
    let needsModernization = 0;
    let acCount = 0;
    let rectifierCount = 0;
    let batteryVRLACount = 0;
    let batteryVLACount = 0;
    let gensetCount = 0;
    let devicesWithAge = 0;

    devices.forEach(device => {
        const { needsModernization: needs, age } = checkModernizationNeed(device);
        const type = (device.DEVICE_TYPE || device.jenis || '').toUpperCase();

        if (age > 0) devicesWithAge++;

        if (needs) needsModernization++;

        if (DEVICE_TYPES.AC.some(t => type.includes(t))) acCount++;
        if (DEVICE_TYPES.RECTIFIER.some(t => type.includes(t))) rectifierCount++;
        if (DEVICE_TYPES.GENSET.some(t => type.includes(t))) gensetCount++;
        if (type.includes('VLA') || type.includes('BASAH')) batteryVLACount++;
        else if (DEVICE_TYPES.BATTERY_VRLA.some(t => type.includes(t))) batteryVRLACount++;
    });

    return {
        totalDevices: devices.length,
        devicesWithKnownAge: devicesWithAge,
        needsModernization,
        breakdown: {
            ac: acCount,
            rectifier: rectifierCount,
            batteryVRLA: batteryVRLACount,
            batteryVLA: batteryVLACount,
            genset: gensetCount,
        },
    };
}
