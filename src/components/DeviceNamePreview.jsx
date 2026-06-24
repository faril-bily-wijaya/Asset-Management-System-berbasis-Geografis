import React, { useMemo } from 'react';
import { Lightbulb, Link2, Layers, Check, AlertCircle } from 'lucide-react';

// Device type prefixes for grouping
const DEVICE_PREFIXES = {
    'AC ': 'AC (Air Conditioner)',
    'RECTIFIER': 'Rectifier',
    'RECT': 'Rectifier',
    'GENSET': 'Genset',
    'GENSET MOBILE': 'Genset Mobile',
    'BATTERY': 'Battery',
    'BAT': 'Battery',
    'PLN': 'PLN (Listrik)',
    'INVERTER': 'Inverter',
    'UPS': 'UPS',
    'PDU': 'PDU',
    'RECTIFIER': 'Rectifier',
};

// Device name suffixes that indicate role
const ROLE_SUFFIXES = ['UTAMA', 'CADANGAN', 'BACKUP', 'UTAMA', 'BACKUP', '1', '2', 'A', 'B', 'C', 'D'];

// Normalize device name
const normalizeDeviceName = (name) => {
    if (!name) return '';
    return name
        .toUpperCase()
        .trim()
        .replace(/\s+/g, ' ');
};

// Extract prefix from device name
const extractPrefix = (deviceName) => {
    const normalized = normalizeDeviceName(deviceName);

    for (const [prefix, label] of Object.entries(DEVICE_PREFIXES)) {
        if (normalized.startsWith(prefix)) {
            return { prefix, label };
        }
    }

    // If no known prefix, extract first word
    const firstWord = normalized.split(' ')[0];
    return { prefix: firstWord, label: firstWord };
};

// Extract role from device name
const extractRole = (deviceName) => {
    const normalized = normalizeDeviceName(deviceName);

    for (const suffix of ROLE_SUFFIXES) {
        if (normalized.includes(suffix)) {
            return suffix;
        }
    }

    return null;
};

// Find similar device names from existing devices
const findSimilarDevices = (deviceName, existingDevices = [], currentId = null) => {
    if (!deviceName.trim()) return [];

    const normalizedInput = normalizeDeviceName(deviceName);
    const { prefix: inputPrefix } = extractPrefix(deviceName);

    return existingDevices
        .filter(d => d.id !== currentId)
        .filter(d => {
            const normalizedExisting = normalizeDeviceName(d.DEVICE_NAME || '');
            const { prefix: existingPrefix } = extractPrefix(d.DEVICE_NAME || '');

            // Same prefix (e.g., both are AC)
            if (inputPrefix === existingPrefix) return true;

            // Contains same words
            const words1 = normalizedInput.split(' ');
            const words2 = normalizedExisting.split(' ');
            const commonWords = words1.filter(w => words2.includes(w));

            return commonWords.length > 0 && commonWords.length >= Math.min(words1.length, words2.length) * 0.5;
        })
        .slice(0, 5);
};

// Calculate group preview info
const calculateGroupPreview = (deviceName, existingDevices = [], currentId = null) => {
    if (!deviceName.trim()) {
        return { hasGroup: false, groupLabel: '', similarCount: 0, similarDevices: [] };
    }

    const { prefix, label } = extractPrefix(deviceName);
    const similarDevices = findSimilarDevices(deviceName, existingDevices, currentId);
    const sameGroupDevices = similarDevices.filter(d => {
        const { prefix: existingPrefix } = extractPrefix(d.DEVICE_NAME || '');
        return existingPrefix === prefix;
    });

    return {
        hasGroup: true,
        groupLabel: label,
        groupPrefix: prefix,
        similarCount: sameGroupDevices.length,
        similarDevices: sameGroupDevices,
    };
};

export default function DeviceNamePreview({
    value,
    existingDevices = [],
    currentId = null,
    location = '',
    onSelectSuggestion,
    className = '',
}) {
    const preview = useMemo(() => {
        return calculateGroupPreview(value, existingDevices, currentId);
    }, [value, existingDevices, currentId]);

    if (!value || !preview.hasGroup) {
        return null;
    }

    return (
        <div className={`mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    Preview Pengelompokan
                </span>
            </div>

            {/* Group Info */}
            <div className="space-y-2">
                {/* Main Group */}
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">
                                {preview.groupPrefix.slice(0, 2)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {preview.groupLabel}
                            </p>
                            <p className="text-xs text-slate-500">
                                {preview.similarCount} perangkat lain di grup ini
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-4 h-4" />
                        <span className="text-xs">Akan dikelompokkan</span>
                    </div>
                </div>

                {/* Similar Devices List */}
                {preview.similarDevices.length > 0 && (
                    <div className="pl-2 border-l-2 border-indigo-200 dark:border-indigo-700">
                        <p className="text-[10px] text-slate-500 mb-1">Perangkat serupa:</p>
                        <div className="space-y-1">
                            {preview.similarDevices.map((device, index) => (
                                <div key={device.id || index} className="flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {device.DEVICE_NAME}
                                    </span>
                                    {device.LOCATION && (
                                        <span className="text-slate-400">@ {device.LOCATION}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Role Detection */}
                {extractRole(value) && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900 rounded flex items-center justify-center">
                            <span className="text-[10px] font-bold text-amber-600">
                                {extractRole(value).slice(0, 2)}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                Role: {extractRole(value)}
                            </p>
                            <p className="text-[10px] text-amber-600">
                                {['UTAMA', 'CADANGAN', 'BACKUP'].includes(extractRole(value))
                                    ? 'Perangkat utama/cadangan'
                                    : 'Urutan dalam grup'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Location hint */}
                {location && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>Akan disimpan di: {location}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export helper functions for reuse
export { extractPrefix, extractRole, findSimilarDevices, calculateGroupPreview };
