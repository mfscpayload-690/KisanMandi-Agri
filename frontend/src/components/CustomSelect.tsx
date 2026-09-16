import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  icon,
  searchable = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Filter options if searchable
  const filteredOptions = searchable && search.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all text-left cursor-pointer select-none ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 shadow-2xs'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="shrink-0 text-emerald-600">{icon}</span>}
          <span className={`text-sm font-medium truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-xs text-slate-400 truncate hidden sm:inline">
              ({selectedOption.sublabel})
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Overlay Menu */}
      {isOpen && (
        <>
          {/* Mobile backdrop scrim for focus */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/10 sm:hidden backdrop-blur-2xs"
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
          />

          {/* Menu popup */}
          <div
            className={`absolute z-50 mt-1.5 w-full min-w-[220px] max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${dropdownClassName}`}
          >
            {/* Search Box if list is long/searchable */}
            {searchable && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
