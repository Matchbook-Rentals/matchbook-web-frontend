'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { add, Duration, endOfMonth, differenceInCalendarDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────

interface SearchDateRangeProps {
  start: Date | null;
  end: Date | null;
  handleChange: (start: Date | null, end: Date | null) => void;
  minimumDateRange?: Duration | null;
  maximumDateRange?: Duration | null;
  singleMonth?: boolean;
  hideFlexibility?: boolean;
  unavailablePeriods?: Array<{ startDate: Date; endDate: Date }>;
}

type FlexibilityValue = 'exact' | 1 | 2 | 3 | 7;

// ─── Constants ─────────────────────────────────────────────────────

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const FLEXIBILITY_OPTIONS: { label: string; value: FlexibilityValue; hasIcon: boolean }[] = [
  { label: 'Exact Dates', value: 'exact', hasIcon: false },
  { label: '1', value: 1, hasIcon: true },
  { label: '2', value: 2, hasIcon: true },
  { label: '3', value: 3, hasIcon: true },
  { label: '7', value: 7, hasIcon: true },
];

// ─── Helpers ───────────────────────────────────────────────────────

const normalizeDate = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDate = (a: Date | null, b: Date | null): boolean => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const generateMonthGrid = (year: number, month: number): Date[] => {
  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7; // Monday-start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const gridStart = new Date(year, month, 1 - leadingDays);

  return Array.from({ length: totalCells }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
  );
};

const formatDuration = (duration: Duration): string => {
  const parts: string[] = [];
  if (duration.years && duration.years > 0) parts.push(`${duration.years} year${duration.years > 1 ? 's' : ''}`);
  if (duration.months && duration.months > 0) parts.push(`${duration.months} month${duration.months > 1 ? 's' : ''}`);
  if (duration.weeks && duration.weeks > 0) parts.push(`${duration.weeks} week${duration.weeks > 1 ? 's' : ''}`);
  if (duration.days && duration.days > 0) parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);
  return parts.join(', ');
};

// ─── Date Input Helpers ─────────────────────────────────────────────

/** Strip non-digits, cap at 6 chars, auto-insert slashes → MM/DD/YY */
const formatShortDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/** Parse MM/DD/YY → Date. Returns null if incomplete, invalid, or date rollover. */
const parseShortDate = (formatted: string): Date | null => {
  const digits = formatted.replace(/\D/g, '');
  if (digits.length !== 6) return null;
  const mm = parseInt(digits.slice(0, 2), 10);
  const dd = parseInt(digits.slice(2, 4), 10);
  const yy = parseInt(digits.slice(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const fullYear = 2000 + yy;
  const date = new Date(fullYear, mm - 1, dd);
  // Detect rollover (e.g. Feb 30 → Mar 2)
  if (date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Convert Date → MM/DD/YY display string */
const toShortDisplay = (date: Date | null): string => {
  if (!date) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  return `${mm}/${dd}/${yy}`;
};

// ─── Main Component ────────────────────────────────────────────────

export default function SearchDateRange({
  start,
  end,
  handleChange,
  minimumDateRange,
  maximumDateRange,
  singleMonth = false,
  hideFlexibility = false,
  unavailablePeriods,
}: SearchDateRangeProps) {
  const today = normalizeDate(new Date());

  const [leftMonth, setLeftMonth] = useState(() => (start ? start.getMonth() : today.getMonth()));
  const [leftYear, setLeftYear] = useState(() => (start ? start.getFullYear() : today.getFullYear()));
  const [flexibility, setFlexibility] = useState<FlexibilityValue>('exact');

  // ── Text Input State ──────────────────────────────────────────────
  const [startInputRaw, setStartInputRaw] = useState(() => toShortDisplay(start));
  const [endInputRaw, setEndInputRaw] = useState(() => toShortDisplay(end));
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  // Sync text inputs when props change externally (calendar clicks)
  useEffect(() => { setStartInputRaw(toShortDisplay(start)); setStartError(null); }, [start]);
  useEffect(() => { setEndInputRaw(toShortDisplay(end)); setEndError(null); }, [end]);

  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const leftGrid = useMemo(() => generateMonthGrid(leftYear, leftMonth), [leftYear, leftMonth]);
  const rightGrid = useMemo(() => generateMonthGrid(rightYear, rightMonth), [rightYear, rightMonth]);

  // ── Navigation ──────────────────────────────────────────────────

  const canGoPrev = !(leftMonth === today.getMonth() && leftYear === today.getFullYear());

  const navigatePrev = () => {
    if (!canGoPrev) return;
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear((y) => y - 1);
    } else {
      setLeftMonth((m) => m - 1);
    }
  };

  const navigateNext = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear((y) => y + 1);
    } else {
      setLeftMonth((m) => m + 1);
    }
  };

  // ── Disabled Date Logic ─────────────────────────────────────────

  const getDisabledReason = (date: Date): string | null => {
    const d = normalizeDate(date);
    if (d < today) return 'Trips cannot begin in the past.';

    if (unavailablePeriods) {
      for (const period of unavailablePeriods) {
        const pStart = normalizeDate(period.startDate);
        const pEnd = normalizeDate(period.endDate);
        if (d >= pStart && d <= pEnd) return 'This date is unavailable';
      }
    }

    if (start && !end) {
      const s = normalizeDate(start);
      if (d.getTime() === s.getTime()) return null;
      if (d < s) return 'End date cannot be before start date.';

      if (minimumDateRange) {
        const minEnd = normalizeDate(add(s, minimumDateRange));
        if (d < minEnd) return 'Searches must be for at least one month.';
      }

      if (maximumDateRange) {
        let maxEnd: Date;
        if (maximumDateRange.days === null || maximumDateRange.days === undefined) {
          maxEnd = endOfMonth(add(s, {
            years: maximumDateRange.years,
            months: maximumDateRange.months,
            weeks: maximumDateRange.weeks,
          }));
        } else {
          maxEnd = add(s, maximumDateRange);
        }
        maxEnd = normalizeDate(maxEnd);
        if (d > maxEnd) return `Trips cannot be longer than ${formatDuration(maximumDateRange)}.`;
      }
    }
    return null;
  };

  // ── Date Selection ──────────────────────────────────────────────

  const handleDateSelect = (date: Date) => {
    const selected = normalizeDate(date);

    if (start && isSameDate(start, selected)) return handleChange(end, null);
    if (end && isSameDate(end, selected)) return handleChange(start, null);

    if (start && end) {
      if (selected > normalizeDate(start) && selected < normalizeDate(end)) return handleChange(selected, null);
      if (selected < normalizeDate(start)) return handleChange(selected, end);
      if (selected > normalizeDate(end)) return handleChange(start, selected);
    }

    if (start && !end) {
      return selected < normalizeDate(start)
        ? handleChange(selected, start)
        : handleChange(start, selected);
    }

    return handleChange(selected, null);
  };

  // ── Computed Values ─────────────────────────────────────────────

  const daysSelected = start && end ? differenceInCalendarDays(end, start) : 0;

  const isRangeValid = (s: Date, e: Date): boolean => {
    if (e <= s) return false;
    if (minimumDateRange && normalizeDate(add(s, minimumDateRange)) > e) return false;
    if (maximumDateRange) {
      const maxEnd = maximumDateRange.days === null || maximumDateRange.days === undefined
        ? endOfMonth(add(s, { years: maximumDateRange.years, months: maximumDateRange.months, weeks: maximumDateRange.weeks }))
        : add(s, maximumDateRange);
      if (e > normalizeDate(maxEnd)) return false;
    }
    return true;
  };

  // ── Text Input Handlers ───────────────────────────────────────────

  const applyParsedDate = (date: Date, field: 'start' | 'end') => {
    // Set the display value directly — don't rely on useEffect round-trip
    const display = toShortDisplay(date);
    if (field === 'start') setStartInputRaw(display);
    else setEndInputRaw(display);

    setLeftMonth(date.getMonth());
    setLeftYear(date.getFullYear());
    if (field === 'start') {
      const keepEnd = end && isRangeValid(date, normalizeDate(end));
      handleChange(date, keepEnd ? end : null);
    } else {
      const keepStart = start && isRangeValid(normalizeDate(start), date);
      handleChange(keepStart ? start : null, date);
    }
  };

  const validateDate = (formatted: string, field: 'start' | 'end'): string | null => {
    const digits = formatted.replace(/\D/g, '');
    if (digits.length < 6) return null; // still typing
    const parsed = parseShortDate(formatted);
    if (!parsed) return 'Invalid date';
    const normalizedParsed = normalizeDate(parsed);
    if (normalizedParsed < today) return 'Date must be in the future';
    if (field === 'end' && start) {
      const s = normalizeDate(start);
      if (normalizedParsed <= s) return 'Must be after move-in date';
      if (minimumDateRange) {
        const minEnd = normalizeDate(add(s, minimumDateRange));
        if (normalizedParsed < minEnd) return `Must be at least ${formatDuration(minimumDateRange)} after move-in`;
      }
      if (maximumDateRange) {
        const maxEnd = maximumDateRange.days === null || maximumDateRange.days === undefined
          ? normalizeDate(endOfMonth(add(s, { years: maximumDateRange.years, months: maximumDateRange.months, weeks: maximumDateRange.weeks })))
          : normalizeDate(add(s, maximumDateRange));
        if (normalizedParsed > maxEnd) return `Must be within ${formatDuration(maximumDateRange)} of move-in`;
      }
    }
    if (field === 'start' && end) {
      const e = normalizeDate(end);
      if (normalizedParsed >= e) return 'Must be before move-out date';
      if (minimumDateRange) {
        const minEnd = normalizeDate(add(normalizedParsed, minimumDateRange));
        if (e < minEnd) return `Must be at least ${formatDuration(minimumDateRange)} before move-out`;
      }
      if (maximumDateRange) {
        const maxEnd = maximumDateRange.days === null || maximumDateRange.days === undefined
          ? normalizeDate(endOfMonth(add(normalizedParsed, { years: maximumDateRange.years, months: maximumDateRange.months, weeks: maximumDateRange.weeks })))
          : normalizeDate(add(normalizedParsed, maximumDateRange));
        if (e > maxEnd) return `Must be within ${formatDuration(maximumDateRange)} of move-out`;
      }
    }
    return null;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'start' | 'end') => {
    const formatted = formatShortDateInput(e.target.value);
    if (field === 'start') { setStartInputRaw(formatted); setStartError(null); }
    else { setEndInputRaw(formatted); setEndError(null); }

    const parsed = parseShortDate(formatted);
    if (!parsed || parsed < today) {
      // If input is cleared, set to null
      if (formatted === '') {
        if (field === 'start') handleChange(null, end);
        else handleChange(start, null);
      }
      return;
    }

    // Check ordering
    const error = validateDate(formatted, field);
    if (error) {
      if (field === 'start') setStartError(error);
      else setEndError(error);
      return;
    }

    applyParsedDate(parsed, field);
  };

  const handleTextBlur = (e: React.FocusEvent<HTMLInputElement>, field: 'start' | 'end') => {
    const raw = e.currentTarget.value;
    if (raw === '') {
      if (field === 'start') { setStartError(null); handleChange(null, end); }
      else { setEndError(null); handleChange(start, null); }
      return;
    }
    const error = validateDate(raw, field);
    if (!error) {
      const parsed = parseShortDate(raw)!;
      if (field === 'start') setStartError(null);
      else setEndError(null);
      applyParsedDate(parsed, field);
    } else {
      if (field === 'start') setStartError(error);
      else setEndError(error);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'start' | 'end') => {
    const input = e.currentTarget;
    const pos = input.selectionStart ?? 0;
    // Smart backspace: if cursor is right after a slash, skip over it
    if (e.key === 'Backspace' && (pos === 3 || pos === 6)) {
      e.preventDefault();
      const raw = field === 'start' ? startInputRaw : endInputRaw;
      // Remove the digit before the slash
      const digits = raw.replace(/\D/g, '');
      const digitIndex = pos === 3 ? 1 : 3; // which digit to remove (0-indexed)
      const newDigits = digits.slice(0, digitIndex) + digits.slice(digitIndex + 1);
      const formatted = formatShortDateInput(newDigits);
      if (field === 'start') setStartInputRaw(formatted);
      else setEndInputRaw(formatted);
      // Set cursor position after React re-render
      requestAnimationFrame(() => {
        input.setSelectionRange(pos - 1, pos - 1);
      });
    }
  };

  const handleTextPaste = (e: React.ClipboardEvent<HTMLInputElement>, field: 'start' | 'end') => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const formatted = formatShortDateInput(pasted);
    if (field === 'start') { setStartInputRaw(formatted); setStartError(null); }
    else { setEndInputRaw(formatted); setEndError(null); }

    const error = validateDate(formatted, field);
    if (error) {
      if (field === 'start') setStartError(error);
      else setEndError(error);
      return;
    }

    const parsed = parseShortDate(formatted);
    if (parsed && parsed >= today) {
      applyParsedDate(parsed, field);
    }
  };

  // ── Range Background Class ──────────────────────────────────────

  const getRangeBgClass = (date: Date, gridIndex: number, monthNum: number): string => {
    if (!start || !end) return '';
    if (date.getMonth() !== monthNum) return '';

    const d = normalizeDate(date);
    const s = normalizeDate(start);
    const e = normalizeDate(end);

    const isStart = isSameDate(d, s);
    const isEnd = isSameDate(d, e);
    const inRange = d > s && d < e;
    const isRowStart = gridIndex % 7 === 0;
    const isRowEnd = gridIndex % 7 === 6;

    if (isStart && isEnd) return '';

    if (isStart) {
      return isRowEnd ? 'bg-[#e7f0f0] rounded-full' : 'bg-[#e7f0f0] rounded-l-full';
    }
    if (isEnd) {
      return isRowStart ? 'bg-[#e7f0f0] rounded-full' : 'bg-[#e7f0f0] rounded-r-full';
    }

    if (inRange) {
      const rounding = [
        isRowStart && 'rounded-l-xl',
        isRowEnd && 'rounded-r-xl',
      ].filter(Boolean).join(' ');
      return `bg-[#e7f0f0] ${rounding}`;
    }

    return '';
  };

  // ── Render: Day Cell ────────────────────────────────────────────

  const renderDay = (date: Date, gridIndex: number, monthNum: number) => {
    const isCurrentMonth = date.getMonth() === monthNum;

    if (!isCurrentMonth) {
      return <div key={`${monthNum}-${gridIndex}`} className="w-10 h-10" />;
    }

    const isStart = start && isSameDate(date, start);
    const isEnd = end && isSameDate(date, end);
    const isSelected = isStart || isEnd;
    const disabledReason = getDisabledReason(date);
    const isDisabled = !!disabledReason;
    const dateIsToday = isSameDate(date, today);

    const rangeBg = getRangeBgClass(date, gridIndex, monthNum);

    const textColor = isSelected
      ? 'text-white'
      : isDisabled
        ? 'text-[#d0d5dd]'
        : 'text-[#344054]';

    const circleClass = [
      'w-9 h-9 rounded-full flex items-center justify-center relative',
      isSelected && 'bg-[#3c8787]',
      !isSelected && !isDisabled && 'hover:bg-gray-100 cursor-pointer',
      isDisabled && !isSelected && 'cursor-default',
    ].filter(Boolean).join(' ');

    const dayButton = (
      <button
        className={circleClass}
        onClick={() => isCurrentMonth && !isDisabled && handleDateSelect(date)}
        disabled={!isCurrentMonth || isDisabled}
      >
        <span className={`text-sm ${textColor}`}>{date.getDate()}</span>
        {dateIsToday && (
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-[#98a1b2] rounded-full" />
        )}
      </button>
    );

    return (
      <div
        key={`${monthNum}-${gridIndex}`}
        className={`w-10 h-10 flex items-center justify-center ${rangeBg}`}
      >
        {isDisabled && disabledReason ? (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
              <TooltipContent>
                <p>{disabledReason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          dayButton
        )}
      </div>
    );
  };

  // ── Render: Calendar Month ──────────────────────────────────────

  const renderMonth = (
    year: number,
    month: number,
    grid: Date[],
    showPrev: boolean,
    showNext: boolean,
  ) => (
    <div className="flex flex-col items-center flex-1">
      <div className="flex flex-col items-center gap-4 px-6 py-5 w-full">
        <div className="flex w-[280px] items-center justify-between">
          {showPrev ? (
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-lg"
              onClick={navigatePrev}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10 h-10" />
          )}
          <AnimatePresence mode="wait">
            <motion.span
              key={`${year}-${month}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-base font-semibold text-[#3c8787]"
            >
              {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}
            </motion.span>
          </AnimatePresence>
          {showNext ? (
            <Button variant="ghost" size="icon" className="p-2 rounded-lg" onClick={navigateNext}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>

        <div className="flex flex-wrap" style={{ width: '280px' }}>
          {WEEK_DAYS.map((day, i) => (
            <div key={`wk-${i}`} className="w-10 h-10 flex items-center justify-center">
              <span className="text-sm font-medium text-[#344054]">{day}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap"
            style={{ width: '280px' }}
          >
            {grid.map((date, i) => renderDay(date, i, month))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // ── Render: Flexibility Bar ─────────────────────────────────────

  const renderFlexibilityBar = () => (
    <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 w-full border-t border-[#eaecf0]">
      <div className="flex items-center gap-1.5 md:gap-3 flex-1 min-w-0">
        {FLEXIBILITY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            className={`gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-2.5 rounded-lg border transition-colors flex-shrink min-w-0
              ${flexibility === option.value
                ? 'bg-[#e7f0f0] border-[#3c8787]'
                : 'border-[#b3d1d1] hover:bg-[#f0f7f7]'
              }`}
            onClick={() => setFlexibility(option.value)}
          >
            {option.hasIcon && (
              <span className="flex flex-col items-center text-xl md:text-2xl text-[#3c8787] font-light mt-1">
                <span className="leading-[0.4]">+</span>
                <span className="leading-[0.3]">−</span>
              </span>
            )}
            <span className="font-semibold text-sm md:text-base text-[#3c8787] whitespace-nowrap">{option.label}</span>
          </Button>
        ))}
      </div>

      {daysSelected > 0 && !singleMonth && (
        <div className="inline-flex items-center px-[18px] py-3">
          <span className="font-semibold text-base text-[#475467]">
            {daysSelected} Days Selected
          </span>
        </div>
      )}
    </div>
  );

  // ── Main Render ─────────────────────────────────────────────────

  if (singleMonth) {
    return (
      <div className="flex flex-col w-full items-center bg-background rounded-xl">
        <div className="w-full rounded-xl border border-[#eaecf0] overflow-hidden">
          <div className="flex items-start w-full">
            <div className="flex-1">
              {renderMonth(leftYear, leftMonth, leftGrid, true, true)}
            </div>
          </div>
          {!hideFlexibility && renderFlexibilityBar()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[869px] items-center gap-6 p-6 bg-background rounded-xl">
      {/* Move-in / Move-out inputs */}
      <div className="flex items-start gap-4 w-full">
        <div className="flex flex-col items-start gap-1.5 flex-1">
          <label className="font-medium text-[#344054] text-sm">Move in</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="mm/dd/yy"
            value={startInputRaw}
            className={`h-12 w-full bg-background rounded-lg border px-3 text-base text-[#344054] outline-none focus:ring-2 ${startError ? 'border-red-500 focus:ring-red-300 focus:border-red-500' : 'border-[#d0d5dd] focus:ring-[#3c8787] focus:border-[#3c8787]'}`}
            onChange={(e) => handleTextChange(e, 'start')}
            onBlur={(e) => handleTextBlur(e, 'start')}
            onKeyDown={(e) => handleTextKeyDown(e, 'start')}
            onPaste={(e) => handleTextPaste(e, 'start')}
          />
          {startError && <span className="text-red-500 text-xs">{startError}</span>}
        </div>
        <div className="flex flex-col items-start gap-1.5 flex-1">
          <label className="font-medium text-[#344054] text-sm">Move out</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="mm/dd/yy"
            value={endInputRaw}
            className={`h-12 w-full bg-background rounded-lg border px-3 text-base text-[#344054] outline-none focus:ring-2 ${endError ? 'border-red-500 focus:ring-red-300 focus:border-red-500' : 'border-[#d0d5dd] focus:ring-[#3c8787] focus:border-[#3c8787]'}`}
            onChange={(e) => handleTextChange(e, 'end')}
            onBlur={(e) => handleTextBlur(e, 'end')}
            onKeyDown={(e) => handleTextKeyDown(e, 'end')}
            onPaste={(e) => handleTextPaste(e, 'end')}
          />
          {endError && <span className="text-red-500 text-xs">{endError}</span>}
        </div>
      </div>

      {/* Calendar card */}
      <div className="w-full rounded-xl border border-[#eaecf0] overflow-hidden">
        <div className="flex items-start w-full">
          <div className="flex-1 border-r border-[#eaecf0]">
            {renderMonth(leftYear, leftMonth, leftGrid, true, false)}
          </div>
          <div className="flex-1">
            {renderMonth(rightYear, rightMonth, rightGrid, false, true)}
          </div>
        </div>

        {!hideFlexibility && renderFlexibilityBar()}
      </div>
    </div>
  );
}
