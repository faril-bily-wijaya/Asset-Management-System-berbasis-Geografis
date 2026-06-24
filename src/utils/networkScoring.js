import { isCatuDaya } from './parser';

// Komponen power chain yang ideal di sebuah site telko
const POWER_CHAIN = ['GENSET', 'ATS', 'MDP', 'RECTIFIER', 'BATTERE'];
const COOLING_TYPES = ['AC SPLIT', 'AC PRESISI', 'AC FLOOR STANDING', 'AC PDB'];
const CRITICAL_TYPES = ['GENSET', 'RECTIFIER', 'BATTERE', 'MDP', 'ATS', 'INVERTER'];

/**
 * Menghitung Site Health Score (0-100) berdasarkan data perangkat
 */
export function calculateSiteHealth(devices) {
  if (!devices || devices.length === 0) return 0;

  const total = devices.length;
  const operational = devices.filter(d => d.STATUS === 'OPERATIONAL').length;
  const normal = devices.filter(d => d.CONDITION === 'NORMAL').length;

  // 1. Rasio operational (40% weight)
  const operationalRatio = total > 0 ? operational / total : 0;

  // 2. Rasio kondisi normal (25% weight)
  const conditionRatio = total > 0 ? normal / total : 0;

  // 3. Power chain completeness (20% weight)
  const powerChainScore = calculatePowerChainScore(devices);

  // 4. Cooling availability (10% weight)
  const coolingScore = calculateCoolingScore(devices);

  // 5. Redundancy bonus (5% weight)
  const redundancyScore = calculateRedundancyScore(devices);

  const healthScore = Math.round(
    operationalRatio * 40 +
    conditionRatio * 25 +
    powerChainScore * 20 +
    coolingScore * 10 +
    redundancyScore * 5
  );

  return Math.min(100, Math.max(0, healthScore));
}

/**
 * Menghitung kelengkapan power chain (0-1)
 */
export function calculatePowerChainScore(devices) {
  const deviceTypes = devices.map(d => d.DEVICE_TYPE.toUpperCase());
  let found = 0;
  POWER_CHAIN.forEach(type => {
    if (deviceTypes.some(dt => dt.includes(type))) found++;
  });
  return found / POWER_CHAIN.length;
}

/**
 * Menghitung ketersediaan cooling (0-1)
 */
export function calculateCoolingScore(devices) {
  const coolingDevices = devices.filter(d =>
    COOLING_TYPES.some(type => d.DEVICE_TYPE.toUpperCase().includes(type))
  );
  if (coolingDevices.length === 0) return 0;

  const operationalCooling = coolingDevices.filter(d => d.STATUS === 'OPERATIONAL').length;
  return operationalCooling / coolingDevices.length;
}

/**
 * Menghitung redundancy score (0-1)
 */
export function calculateRedundancyScore(devices) {
  let score = 0;
  let checks = 0;

  // Check for multiple rectifiers
  const rectifiers = devices.filter(d => d.DEVICE_TYPE.toUpperCase().includes('RECTIFIER'));
  if (rectifiers.length > 0) {
    checks++;
    if (rectifiers.length >= 2) score++;
  }

  // Check for multiple battery banks
  const batteries = devices.filter(d => d.DEVICE_TYPE.toUpperCase().includes('BATTERE'));
  if (batteries.length > 0) {
    checks++;
    if (batteries.length >= 2) score++;
  }

  // Check for multiple AC units
  const acs = devices.filter(d => COOLING_TYPES.some(type => d.DEVICE_TYPE.toUpperCase().includes(type)));
  if (acs.length > 0) {
    checks++;
    if (acs.length >= 2) score++;
  }

  return checks > 0 ? score / checks : 0;
}

/**
 * Menentukan risk level berdasarkan health score dan kondisi perangkat
 */
export function getSiteRiskLevel(healthScore, devices) {
  const hasCriticalDown = devices.some(d =>
    CRITICAL_TYPES.some(type => d.DEVICE_TYPE.toUpperCase().includes(type)) &&
    d.STATUS !== 'OPERATIONAL'
  );

  if (healthScore < 50 || hasCriticalDown) return 'CRITICAL';
  if (healthScore < 70) return 'WARNING';
  if (healthScore < 85) return 'STABLE';
  return 'HEALTHY';
}

/**
 * Menentukan role site berdasarkan perangkat yang dimiliki
 */
export function inferSiteRole(devices) {
  const types = devices.map(d => d.DEVICE_TYPE.toUpperCase());
  const totalDevices = devices.length;

  const hasRectifier = types.some(t => t.includes('RECTIFIER'));
  const hasBattery = types.some(t => t.includes('BATTERE'));
  const hasGenset = types.some(t => t.includes('GENSET'));
  const acCount = types.filter(t => COOLING_TYPES.some(ct => t.includes(ct))).length;

  // Hub utama: lengkap infrastruktur + banyak perangkat
  if (hasRectifier && hasBattery && hasGenset && totalDevices >= 15 && acCount >= 3) {
    return 'REGIONAL_HUB';
  }
  // Sub-hub: infrastruktur cukup lengkap
  if (hasRectifier && hasBattery && hasGenset && totalDevices >= 8) {
    return 'DISTRICT_HUB';
  }
  // Distribution node
  if ((hasRectifier || hasBattery) && totalDevices >= 5) {
    return 'DISTRIBUTION';
  }
  // Access node
  return 'ACCESS';
}

/**
 * Analisis power chain — identifikasi komponen mana yang ada/tidak ada
 */
export function analyzePowerChain(devices) {
  const deviceTypes = devices.map(d => d.DEVICE_TYPE.toUpperCase());

  return POWER_CHAIN.map(component => {
    const matching = devices.filter(d => d.DEVICE_TYPE.toUpperCase().includes(component));
    const operational = matching.filter(d => d.STATUS === 'OPERATIONAL');
    return {
      name: component,
      exists: matching.length > 0,
      count: matching.length,
      operational: operational.length,
      status: matching.length === 0 ? 'MISSING' :
              operational.length === matching.length ? 'OK' :
              operational.length > 0 ? 'DEGRADED' : 'DOWN'
    };
  });
}

/**
 * Estimasi backup duration berdasarkan keberadaan genset dan battery
 */
export function estimateBackupDuration(devices) {
  const hasGenset = devices.some(d =>
    d.DEVICE_TYPE.toUpperCase().includes('GENSET') && d.STATUS === 'OPERATIONAL'
  );
  const batteryCount = devices.filter(d =>
    d.DEVICE_TYPE.toUpperCase().includes('BATTERE') && d.STATUS === 'OPERATIONAL'
  ).length;

  if (hasGenset && batteryCount > 0) return '8-24 jam (Genset + Battery)';
  if (hasGenset) return '8-12 jam (Genset saja)';
  if (batteryCount >= 2) return '4-8 jam (Battery redundan)';
  if (batteryCount === 1) return '2-4 jam (Battery tunggal)';
  return 'Tidak ada backup power';
}

/**
 * Generate rekomendasi otomatis berdasarkan analisis site
 */
export function generateRecommendations(devices, healthScore) {
  const recommendations = [];
  const powerChain = analyzePowerChain(devices);
  const types = devices.map(d => d.DEVICE_TYPE.toUpperCase());

  // Check missing power components
  powerChain.forEach(comp => {
    if (comp.status === 'MISSING') {
      recommendations.push({
        priority: 'HIGH',
        text: `Perlu penambahan ${comp.name} untuk kelengkapan power chain`,
        icon: '🔴'
      });
    } else if (comp.status === 'DOWN') {
      recommendations.push({
        priority: 'CRITICAL',
        text: `${comp.name} tidak berfungsi — perbaikan segera diperlukan`,
        icon: '🚨'
      });
    } else if (comp.status === 'DEGRADED') {
      recommendations.push({
        priority: 'MEDIUM',
        text: `${comp.name}: ${comp.operational}/${comp.count} unit operational — perlu perbaikan`,
        icon: '⚠️'
      });
    }
  });

  // Check cooling
  const coolingDevices = devices.filter(d =>
    COOLING_TYPES.some(type => d.DEVICE_TYPE.toUpperCase().includes(type))
  );
  const brokenCooling = coolingDevices.filter(d => d.STATUS !== 'OPERATIONAL');
  if (coolingDevices.length === 0) {
    recommendations.push({
      priority: 'HIGH',
      text: 'Tidak ada unit AC — risiko overheat tinggi',
      icon: '🔥'
    });
  } else if (brokenCooling.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      text: `${brokenCooling.length} unit AC tidak berfungsi — risiko overheat`,
      icon: '🌡️'
    });
  }

  // Check redundancy
  const rectifiers = devices.filter(d => d.DEVICE_TYPE.toUpperCase().includes('RECTIFIER'));
  if (rectifiers.length === 1) {
    recommendations.push({
      priority: 'LOW',
      text: 'Hanya 1 RECTIFIER — tambahkan untuk redundansi',
      icon: '💡'
    });
  }

  const batteries = devices.filter(d => d.DEVICE_TYPE.toUpperCase().includes('BATTERE'));
  if (batteries.length === 1) {
    recommendations.push({
      priority: 'LOW',
      text: 'Hanya 1 bank BATTERY — tambahkan untuk redundansi',
      icon: '💡'
    });
  }

  // Sort by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Risk level config for UI styling
 */
export const RISK_COLORS = {
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  WARNING: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  STABLE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  HEALTHY: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
};
