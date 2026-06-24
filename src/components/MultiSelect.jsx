import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, X, Check } from 'lucide-react';

export default function MultiSelect({ options, selected, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    if (containerRef.current && isOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (e, option) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  const dropdownMenu = isOpen && !disabled ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-1 text-xs"
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
      }}
    >
      {options.length === 0 ? (
        <div className="p-3 text-center text-slate-400 text-[10px]">Tidak ada opsi tersedia</div>
      ) : (
        options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <div
              key={option}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              onClick={() => toggleOption(option)}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {option}
              </span>
            </div>
          );
        })
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative w-full text-xs ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={containerRef}>
      <div
        className={`min-h-[42px] w-full p-2 rounded-xl border flex items-center justify-between transition-shadow ${disabled ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer hover:border-blue-400'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selected.length === 0 ? (
            <span className="text-slate-400 font-medium px-1">{placeholder}</span>
          ) : (
            selected.map(item => (
              <span key={item} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md font-semibold text-[10px]">
                {item}
                {!disabled && (
                  <button onClick={(e) => removeOption(e, item)} className="hover:text-red-500 transition-colors ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {dropdownMenu}
    </div>
  );
}
