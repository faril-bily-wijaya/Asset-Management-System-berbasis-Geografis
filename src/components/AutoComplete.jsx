import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, X, Check, Search } from 'lucide-react';

export default function AutoComplete({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Ketik untuk mencari...',
    required = false,
    allowAddNew = true,
    addNewLabel = 'Tambah baru',
    className = '',
    inputClassName = '',
    showAllOnFocus = true, // NEW: Show all options on focus
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Sync input value with external value
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on input - show all if focused and no input
    const getFilteredOptions = () => {
        if (!inputValue.trim() && showAllOnFocus && isFocused) {
            return options.slice(0, 20); // Limit to 20 when showing all
        }
        return options.filter(opt =>
            opt.toLowerCase().includes(inputValue.toLowerCase())
        );
    };

    const filteredOptions = getFilteredOptions();

    // Check if exact match exists
    const exactMatch = options.find(opt => opt.toLowerCase() === inputValue.toLowerCase());
    const showAddNewOption = allowAddNew && inputValue.trim() && !exactMatch;
    const showDropdown = isOpen && (filteredOptions.length > 0 || showAddNewOption || (!inputValue.trim() && showAllOnFocus && isFocused));

    const handleSelect = (selectedValue) => {
        onChange(selectedValue);
        setInputValue(selectedValue);
        setIsOpen(false);
        setIsFocused(false);
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleAddNew = () => {
        const trimmedValue = inputValue.trim().toUpperCase();
        if (trimmedValue) {
            onChange(trimmedValue);
            setInputValue(trimmedValue);
        }
        setIsOpen(false);
        setIsFocused(false);
    };

    const handleFocus = () => {
        setIsFocused(true);
        setIsOpen(true);
    };

    const handleBlur = () => {
        // Delay to allow click on option
        setTimeout(() => {
            setIsFocused(false);
        }, 200);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10 ${inputClassName}`}
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => { setInputValue(''); onChange(''); inputRef.current?.focus(); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {/* Header indicator */}
                    {!inputValue.trim() && showAllOnFocus && isFocused && filteredOptions.length > 0 && (
                        <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            Klik untuk pilih atau ketik untuk mencari...
                        </div>
                    )}

                    {filteredOptions.length === 0 && !showAddNewOption && inputValue.trim() && (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                            Tidak ada hasil untuk "{inputValue}"
                        </div>
                    )}

                    {filteredOptions.map((option, index) => (
                        <button
                            key={option}
                            type="button"
                            data-autocomplete-option
                            onClick={() => handleSelect(option)}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-between ${index === 0 && !(!inputValue.trim() && showAllOnFocus && isFocused) ? 'rounded-t-xl' : ''
                                } ${index === filteredOptions.length - 1 && !showAddNewOption ? 'rounded-b-xl' : ''
                                } ${option.toLowerCase() === value?.toLowerCase() ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''
                                }`}
                        >
                            <span className="text-slate-800 dark:text-white">{option}</span>
                            {option.toLowerCase() === value?.toLowerCase() && (
                                <Check className="w-4 h-4 text-indigo-600" />
                            )}
                        </button>
                    ))}

                    {/* Add New Option */}
                    {showAddNewOption && (
                        <button
                            type="button"
                            onClick={handleAddNew}
                            className={`w-full px-4 py-2.5 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-2 rounded-b-xl border-t border-slate-100 dark:border-slate-700 ${filteredOptions.length === 0 ? 'rounded-t-xl' : ''
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            <span>{addNewLabel} "{inputValue.trim().toUpperCase()}"</span>
                        </button>
                    )}
                </div>
            )}

            {/* Selected indicator */}
            {value && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Tersimpan
                </p>
            )}

            {/* Options count hint */}
            {options.length > 0 && !value && (
                <p className="text-[10px] text-slate-400 mt-1">
                    {options.length} opsi tersedia
                </p>
            )}
        </div>
    );
}
