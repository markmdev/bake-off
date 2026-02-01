'use client';

import { useState, useRef, useEffect, forwardRef, InputHTMLAttributes } from 'react';

interface DateTimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ value, defaultValue, onChange, name, id, required, className = '', disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const currentValue = value !== undefined ? value : internalValue;

    // Parse current value into Date object
    const selectedDate = currentValue ? new Date(currentValue) : null;
    const [viewDate, setViewDate] = useState(() => {
      if (selectedDate) return new Date(selectedDate);
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      return d;
    });

    const [selectedTime, setSelectedTime] = useState(() => {
      if (selectedDate) {
        const h = selectedDate.getHours().toString().padStart(2, '0');
        const m = selectedDate.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
      return '12:00';
    });

    // Close on click outside
    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get calendar days for current view month
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => {
      setViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
      setViewDate(new Date(year, month + 1, 1));
    };

    const selectDay = (day: number) => {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDate = new Date(year, month, day, hours, minutes);
      // Format as datetime-local value: YYYY-MM-DDTHH:mm
      const formatted = formatDateTimeLocal(newDate);
      if (value === undefined) {
        setInternalValue(formatted);
      }
      onChange?.(formatted);
    };

    const handleTimeChange = (newTime: string) => {
      setSelectedTime(newTime);
      if (selectedDate) {
        const [hours, minutes] = newTime.split(':').map(Number);
        const newDate = new Date(selectedDate);
        newDate.setHours(hours, minutes);
        const formatted = formatDateTimeLocal(newDate);
        if (value === undefined) {
          setInternalValue(formatted);
        }
        onChange?.(formatted);
      }
    };

    const formatDateTimeLocal = (date: Date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const h = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      return `${y}-${m}-${d}T${h}:${min}`;
    };

    const formatDisplay = (val: string) => {
      if (!val) return '';
      const date = new Date(val);
      if (isNaN(date.getTime())) return '';
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      };
      return date.toLocaleDateString('en-US', options);
    };

    const isToday = (day: number) => {
      const today = new Date();
      return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number) => {
      if (!selectedDate) return false;
      return (
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear()
      );
    };

    // Generate time options (every 30 min)
    const timeOptions: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }

    const formatTimeDisplay = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
      <div ref={containerRef} className="relative">
        {/* Hidden input for form submission */}
        <input
          ref={(node) => {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
            (hiddenInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />

        {/* Display button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full
            px-4 py-3
            bg-white
            border border-(--text-sub)
            rounded-(--radius-md)
            text-base text-(--text-main) text-left
            outline-none
            transition-all duration-200
            focus:border-(--accent-orange)
            focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]
            disabled:bg-gray-100 disabled:cursor-not-allowed
            flex items-center justify-between
            ${className}
          `}
        >
          <span className={currentValue ? '' : 'text-(--text-sub) opacity-40'}>
            {currentValue ? formatDisplay(currentValue) : 'Select date & time'}
          </span>
          <svg
            className="w-5 h-5 text-(--text-sub) opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Calendar popup */}
        {isOpen && (
          <div className="absolute z-50 mt-2 p-4 bg-white border-2 border-(--text-sub) rounded-(--radius-md) shadow-[4px_4px_0px_var(--text-sub)] min-w-[320px]">
            {/* Month/Year header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 hover:bg-(--bg-cream) rounded-(--radius-sm) transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-bold text-(--text-main)">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-(--bg-cream) rounded-(--radius-sm) transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-(--text-sub) opacity-60 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first of month */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day buttons */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`
                      w-9 h-9 text-sm font-medium rounded-(--radius-sm)
                      transition-all duration-150
                      ${selected
                        ? 'bg-(--accent-orange) text-white shadow-[2px_2px_0px_var(--text-sub)]'
                        : today
                          ? 'bg-(--accent-yellow) text-(--text-main) font-bold'
                          : 'hover:bg-(--bg-cream) text-(--text-main)'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Time selector */}
            <div className="mt-4 pt-4 border-t border-(--text-sub) border-opacity-20">
              <label className="block text-sm font-semibold text-(--text-sub) mb-2">Time</label>
              <div className="flex gap-2 items-center">
                <select
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="
                    flex-1
                    px-3 py-2
                    bg-white
                    border border-(--text-sub)
                    rounded-(--radius-sm)
                    text-sm text-(--text-main)
                    outline-none
                    focus:border-(--accent-orange)
                    focus:shadow-[0_0_0_2px_rgba(255,127,50,0.1)]
                  "
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {formatTimeDisplay(time)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Done button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="
                w-full mt-4 px-4 py-2
                bg-(--accent-orange) text-white font-bold
                rounded-(--radius-sm)
                border-2 border-(--text-sub)
                shadow-[2px_2px_0px_var(--text-sub)]
                hover:shadow-[3px_3px_0px_var(--text-sub)]
                active:shadow-[1px_1px_0px_var(--text-sub)]
                active:translate-x-[1px] active:translate-y-[1px]
                transition-all duration-150
              "
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';
