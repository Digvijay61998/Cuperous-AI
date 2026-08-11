import { useEffect, useRef, useState } from 'react';
import { formatTimezone, getTimezoneList } from '../utils/timezone';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (tz: string) => void;
}

export function TimezoneSelector({ selectedTimezone, onTimezoneChange }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const timezones = getTimezoneList();
  const filtered = search
    ? timezones.filter((tz) => tz.toLowerCase().includes(search.toLowerCase()))
    : timezones;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input on open
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const handleSelect = (tz: string) => {
    onTimezoneChange(tz);
    setOpen(false);
    setSearch('');
  };

  return (
    <div
      ref={containerRef}
      className={`timezone-selector${open ? ' timezone-selector--open' : ''}`}
    >
      <button
        type="button"
        className="timezone-selector__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
      >
        <svg className="timezone-selector__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 8h14M8 1c2 2.5 2 10.5 0 14M8 1c-2 2.5-2 10.5 0 14" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span>{formatTimezone(selectedTimezone)}</span>
        <svg className="timezone-selector__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="timezone-selector__dropdown" role="listbox" aria-label="Select timezone">
          <input
            ref={searchRef}
            type="text"
            className="timezone-selector__search"
            placeholder="Search timezone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search timezones"
          />
          {filtered.map((tz) => (
            <button
              key={tz}
              type="button"
              role="option"
              className={`timezone-selector__option${tz === selectedTimezone ? ' timezone-selector__option--active' : ''}`}
              aria-selected={tz === selectedTimezone}
              onClick={() => handleSelect(tz)}
            >
              {formatTimezone(tz)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
