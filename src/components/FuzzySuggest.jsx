import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, Check, ChevronDown, X, Lightbulb } from 'lucide-react';

// Levenshtein distance algorithm for fuzzy matching
const levenshteinDistance = (str1, str2) => {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1,     // insertion
                    dp[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }

    return dp[m][n];
};

// Normalize room name for better matching
const normalizeRoomName = (name) => {
    if (!name) return '';
    return name
        .toUpperCase()
        .trim()
        .replace(/\s+/g, ' ')           // normalize spaces
        .replace(/[.,;:\-_]/g, ' ')     // standardize delimiters
        .replace(/\s+/g, ' ')           // remove extra spaces
        .trim();
};

// Calculate similarity score (0-100)
const calculateSimilarity = (input, existing) => {
    const normalizedInput = normalizeRoomName(input);
    const normalizedExisting = normalizeRoomName(existing);

    if (normalizedInput === normalizedExisting) return 100;

    const maxLen = Math.max(normalizedInput.length, normalizedExisting.length);
    if (maxLen === 0) return 0;

    const distance = levenshteinDistance(normalizedInput, normalizedExisting);
    return Math.round((1 - distance / maxLen) * 100);
};

// Check if input could be grouped with existing room
const couldGroupWith = (input, existing) => {
    const normalizedInput = normalizeRoomName(input);
    const normalizedExisting = normalizeRoomName(existing);

    // Exact match after normalization
    if (normalizedInput === normalizedExisting) return true;

    // Check prefix/suffix similarity
    if (normalizedExisting.startsWith(normalizedInput) ||
        normalizedInput.startsWith(normalizedExisting)) {
        return true;
    }

    // Check word overlap
    const words1 = normalizedInput.split(' ');
    const words2 = normalizedExisting.split(' ');
    const commonWords = words1.filter(w => words2.includes(w));

    if (commonWords.length > 0 && (commonWords.length >= Math.min(words1.length, words2.length) * 0.5)) {
        return true;
    }

    return false;
};

export default function FuzzySuggest({
    label,
    value,
    onChange,
    existingRooms = [],
    locationName = '',
    placeholder = 'Contoh: R. Server',
    required = false,
    className = '',
}) {
    const [inputValue, setInputValue] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [bestSuggestion, setBestSuggestion] = useState(null);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Filter rooms by location if provided
    const filteredRooms = useMemo(() => {
        if (!locationName) return existingRooms;
        return existingRooms.filter(room =>
            room.toLowerCase().includes(locationName.toLowerCase()) ||
            locationName.toLowerCase().includes(room.toLowerCase())
        );
    }, [existingRooms, locationName]);

    // Find similar rooms and best suggestion
    useEffect(() => {
        if (!inputValue.trim()) {
            setShowSuggestion(false);
            setBestSuggestion(null);
            return;
        }

        const similarRooms = filteredRooms
            .map(room => ({
                room,
                similarity: calculateSimilarity(inputValue, room),
                couldGroup: couldGroupWith(inputValue, room)
            }))
            .filter(item => item.similarity >= 50 || item.couldGroup)
            .sort((a, b) => b.similarity - a.similarity);

        if (similarRooms.length > 0) {
            setBestSuggestion(similarRooms[0]);
            setShowSuggestion(similarRooms[0].similarity < 100);
        } else {
            setBestSuggestion(null);
            setShowSuggestion(false);
        }
    }, [inputValue, filteredRooms]);

    // Sync with external value
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleSelect = (selectedValue) => {
        const normalizedValue = normalizeRoomName(selectedValue);
        setInputValue(selectedValue);
        onChange(normalizedValue);
        setIsOpen(false);
        setShowSuggestion(false);
    };

    const handleAcceptSuggestion = () => {
        if (bestSuggestion) {
            handleSelect(bestSuggestion.room);
        }
    };

    const handleKeepOriginal = () => {
        setShowSuggestion(false);
        // Keep the original input value (user's version)
    };

    const handleFocus = () => {
        setIsOpen(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Filter rooms based on input
    const displayedRooms = filteredRooms
        .filter(room => room.toLowerCase().includes(inputValue.toLowerCase()))
        .slice(0, 10);

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
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => { setInputValue(''); onChange(''); inputRef.current?.focus(); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Fuzzy Suggestion */}
            {showSuggestion && bestSuggestion && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                                Mungkin yang Anda maksud:
                            </p>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mt-1">
                                "{bestSuggestion.room}"
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                                Kemiripan: {bestSuggestion.similarity}%
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleAcceptSuggestion}
                            className="flex-1 py-1.5 px-3 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <Check className="w-3 h-3" />
                            Gunakan
                        </button>
                        <button
                            type="button"
                            onClick={handleKeepOriginal}
                            className="flex-1 py-1.5 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Tetap "{inputValue}"
                        </button>
                    </div>
                </div>
            )}

            {/* Room Preview Info */}
            {inputValue && !showSuggestion && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                    {couldGroupWith(inputValue, inputValue) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Ruangan akan dikelompokkan
                        </span>
                    ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Ruangan baru akan dibuat
                        </span>
                    )}
                </div>
            )}

            {/* Dropdown with existing rooms */}
            {isOpen && displayedRooms.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {displayedRooms.map((room, index) => (
                        <button
                            key={room}
                            type="button"
                            onClick={() => handleSelect(room)}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${index === 0 ? 'rounded-t-xl' : ''
                                } ${index === displayedRooms.length - 1 ? 'rounded-b-xl' : ''
                                }`}
                        >
                            <span className="text-slate-800 dark:text-white">{room}</span>
                            {couldGroupWith(inputValue, room) && (
                                <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                                    (akan digabung)
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
