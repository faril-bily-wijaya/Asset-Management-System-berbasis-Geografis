import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const REQUIRED_FIELDS = ['LOCATION', 'DEVICE_TYPE', 'DEVICE_NAME'];
const OPTIONAL_FIELDS = ['MERK', 'MODEL', 'KAPASITAS', 'YEAR', 'ROOM', 'STATUS', 'SERIAL_NUMBER'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const TEMPLATE_CSV = `LOCATION,DEVICE_TYPE,DEVICE_NAME,MERK,MODEL,KAPASITAS,YEAR,ROOM,STATUS
PALEMBANG,ACSPLIT,AC RUANG SERVER,DAIKIN,FTKC25,2.5PK,2020,R. SERVER,Operational
PALEMBANG,RECTIFIER,RECTIFIER UTAMA,ABB,UC100,100A,2018,R.RECTIFIER,Operational
BATURAJA,GENSET,GENSET CADANGAN,CATERPILLAR,C15,500KVA,2015,R.GENSET,Operational`;

const validateRow = (row, rowIndex, existingLocations = []) => {
    const errors = [];

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
            errors.push(`Row ${rowIndex + 1}: Field "${field}" wajib diisi`);
        }
    });

    // Validate YEAR if present
    if (row.YEAR) {
        const year = parseInt(row.YEAR);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1990 || year > currentYear) {
            errors.push(`Row ${rowIndex + 1}: Tahun harus antara 1990-${currentYear}`);
        }
    }

    // Validate STATUS if present
    const validStatuses = ['Operational', 'Maintenance', 'Fault', 'Standby', 'Decommissioned'];
    if (row.STATUS && !validStatuses.includes(row.STATUS)) {
        errors.push(`Row ${rowIndex + 1}: Status harus salah satu dari: ${validStatuses.join(', ')}`);
    }

    return errors;
};

const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV harus memiliki header dan minimal 1 data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        rows.push(row);
    }

    return { headers, rows };
};

export default function UploadCSVModal({ isOpen, onClose, onImport, existingLocations = [] }) {
    const [csvData, setCsvData] = useState(null);
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [selectedRows, setSelectedRows] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const fileInputRef = useRef(null);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Hanya file CSV yang didukung');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const { headers, rows } = parseCSV(event.target.result);

                // Check for required fields
                const missingRequired = REQUIRED_FIELDS.filter(field =>
                    !headers.map(h => h.toUpperCase()).includes(field)
                );

                if (missingRequired.length > 0) {
                    toast.error(`Field wajib tidak ditemukan: ${missingRequired.join(', ')}`);
                    return;
                }

                // Validate all rows
                const allErrors = [];
                const allWarnings = [];
                const rowValidation = rows.map((row, index) => {
                    const rowErrors = validateRow(row, index, existingLocations);
                    const rowWarnings = [];

                    // Check if location exists
                    if (row.LOCATION && !existingLocations.includes(row.LOCATION)) {
                        rowWarnings.push(`Lokasi "${row.LOCATION}" tidak ditemukan dalam sistem`);
                    }

                    allErrors.push(...rowErrors);
                    allWarnings.push(...rowWarnings);

                    return {
                        row,
                        errors: rowErrors,
                        warnings: rowWarnings,
                        valid: rowErrors.length === 0
                    };
                });

                setCsvData({ headers, rows, rowValidation });
                setErrors(allErrors);
                setWarnings(allWarnings);
                setSelectedRows(
                    rows.reduce((acc, _, i) => {
                        acc[i] = true;
                        return acc;
                    }, {})
                );

                if (allErrors.length > 0) {
                    setShowErrors(true);
                    toast.error(`Ditemukan ${allErrors.length} error dalam CSV`);
                } else {
                    toast.success(`Berhasil parse ${rows.length} data`);
                }
            } catch (err) {
                toast.error(`Gagal parse CSV: ${err.message}`);
            }
        };
        reader.readAsText(file);
    }, [existingLocations]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
            handleFileSelect({ target: { files: [file] } });
        } else {
            toast.error('Hanya file CSV yang didukung');
        }
    }, [handleFileSelect]);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const toggleRow = (index) => {
        setSelectedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleSelectAll = () => {
        if (!csvData) return;
        const allSelected = csvData.rows.every((_, i) => selectedRows[i]);
        if (allSelected) {
            setSelectedRows({});
        } else {
            setSelectedRows(
                csvData.rows.reduce((acc, _, i) => {
                    acc[i] = true;
                    return acc;
                }, {})
            );
        }
    };

    const toggleExpandRow = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleImport = () => {
        if (!csvData) return;

        const selectedData = csvData.rows.filter((_, i) => selectedRows[i]);

        if (selectedData.length === 0) {
            toast.error('Pilih minimal 1 data untuk diimport');
            return;
        }

        onImport(selectedData);
        handleClose();
        toast.success(`Berhasil import ${selectedData.length} perangkat`);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_devices.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Template berhasil didownload');
    };

    const handleClose = () => {
        setCsvData(null);
        setErrors([]);
        setWarnings([]);
        setSelectedRows({});
        setShowErrors(false);
        setExpandedRows({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    if (!isOpen) return null;

    const validRows = csvData?.rowValidation?.filter(r => r.valid).length || 0;
    const invalidRows = csvData?.rowValidation?.filter(r => !r.valid).length || 0;

    return (
        <div className="fixed inset-0 z-[4200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Upload CSV</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Import data perangkat dari file CSV</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {!csvData ? (
                        // Upload Area
                        <div className="flex-1 p-6 flex flex-col">
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                    Drag & Drop file CSV di sini
                                </p>
                                <p className="text-sm text-slate-400 mt-1">atau klik untuk pilih file</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {/* Template Download */}
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                            Butuh template?
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                            Download template CSV dengan format yang benar
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Preview Area
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {/* Stats */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            Total: <strong>{csvData.rows.length}</strong> rows
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                                            Valid: <strong>{validRows}</strong>
                                        </span>
                                    </div>
                                    {invalidRows > 0 && (
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-sm text-red-600 dark:text-red-400">
                                                Error: <strong>{invalidRows}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Error Summary */}
                                {(errors.length > 0 || warnings.length > 0) && (
                                    <div className="mt-3">
                                        <button
                                            onClick={() => setShowErrors(!showErrors)}
                                            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                                        >
                                            {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            {showErrors ? 'Sembunyikan' : 'Tampilkan'} error & warning ({errors.length + warnings.length})
                                        </button>

                                        {showErrors && (
                                            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                                                {errors.map((error, i) => (
                                                    <div key={`error-${i}`} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                        <span>{error}</span>
                                                    </div>
                                                ))}
                                                {warnings.map((warning, i) => (
                                                    <div key={`warning-${i}`} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                        <span>{warning}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={csvData.rows.every((_, i) => selectedRows[i])}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">#</th>
                                            {csvData.headers.slice(0, 5).map(header => (
                                                <th key={header} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                                                    {header}
                                                    {REQUIRED_FIELDS.includes(header) && <span className="text-red-500 ml-1">*</span>}
                                                </th>
                                            ))}
                                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Status</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvData.rows.map((row, index) => {
                                            const validation = csvData.rowValidation[index];
                                            const isSelected = selectedRows[index];
                                            const isExpanded = expandedRows[index];

                                            return (
                                                <React.Fragment key={index}>
                                                    <tr className={`border-b border-slate-100 dark:border-slate-800 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''} ${!validation.valid ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected || false}
                                                                onChange={() => toggleRow(index)}
                                                                className="rounded border-slate-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                                                        {csvData.headers.slice(0, 5).map(header => (
                                                            <td key={header} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                                {row[header] || '-'}
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2">
                                                            {validation.valid ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Valid
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Error
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                onClick={() => toggleExpandRow(index)}
                                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                                            >
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                                            <td colSpan={7} className="px-3 py-2">
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                                    {csvData.headers.slice(5).map(header => (
                                                                        <div key={header}>
                                                                            <span className="text-slate-500">{header}: </span>
                                                                            <span className="text-slate-700 dark:text-slate-300">{row[header] || '-'}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {validation.errors.length > 0 && (
                                                                    <div className="mt-2 space-y-1">
                                                                        {validation.errors.map((err, i) => (
                                                                            <p key={i} className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                                                                <AlertCircle className="w-3 h-3" />
                                                                                {err}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                                <button
                                    onClick={() => setCsvData(null)}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus & Upload Ulang
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={Object.values(selectedRows).filter(Boolean).length === 0}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Import {Object.values(selectedRows).filter(Boolean).length} Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
