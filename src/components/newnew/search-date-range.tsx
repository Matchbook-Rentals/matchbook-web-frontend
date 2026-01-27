'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { add, Duration, endOfMonth, format, differenceInCalendarDays } from 'date-fns';

// ─── Types ─────────────────────────────────────────────────────────

interface SearchDateRangeProps {
  start: Date | null;
  end: Date | null;
  handleChange: (start: Date | null, end: Date | null) => void;
  minimumDateRange?: Duration | null;
  maximumDateRange?: Duration | null;
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
  const gridStart = new Date(year, month, 1 - leadingDays);

  return Array.from({ length: 42 }, (_, i) =>
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

// ─── Main Component ────────────────────────────────────────────────

export default function SearchDateRange({
  start,
  end,
  handleChange,
  minimumDateRange,
  maximumDateRange,
}: SearchDateRangeProps) {
  const today = normalizeDate(new Date());

  const [leftMonth, setLeftMonth] = useState(() => (start ? start.getMonth() : today.getMonth()));
  const [leftYear, setLeftYear] = useState(() => (start ? start.getFullYear() : today.getFullYear()));
  const [flexibility, setFlexibility] = useState<FlexibilityValue>('exact');

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

    if (start && !end) {
      const s = normalizeDate(start);
      if (d.getTime() === s.getTime()) return null;
      if (d < s) return 'End date cannot be before start date.';

      if (minimumDateRange) {
        const minEnd = normalizeDate(add(s, minimumDateRange));
        if (d < minEnd) return `Trips must be at least ${formatDuration(minimumDateRange)} long.`;
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

  const formatInputDate = (date: Date | null): string =>
    date ? format(date, 'MMM d, yyyy') : '';

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
    const isStart = start && isSameDate(date, start);
    const isEnd = end && isSameDate(date, end);
    const isSelected = isStart || isEnd;
    const disabledReason = isCurrentMonth ? getDisabledReason(date) : null;
    const isDisabled = !isCurrentMonth || !!disabledReason;
    const dateIsToday = isSameDate(date, today);

    const rangeBg = getRangeBgClass(date, gridIndex, monthNum);

    const textColor = isSelected
      ? 'text-white'
      : !isCurrentMonth
        ? 'text-[#667085]'
        : isDisabled
          ? 'text-[#d0d5dd]'
          : 'text-[#344054]';

    const circleClass = [
      'w-9 h-9 rounded-full flex items-center justify-center relative',
      isSelected && 'bg-[#3c8787]',
      !isSelected && !isDisabled && 'hover:bg-gray-100 cursor-pointer',
      isDisabled && !isSelected && 'cursor-default',
    ].filter(Boolean).join(' ');

    return (
      <div
        key={`${monthNum}-${gridIndex}`}
        className={`w-10 h-10 flex items-center justify-center ${rangeBg}`}
      >
        <button
          className={circleClass}
          onClick={() => !isDisabled && handleDateSelect(date)}
          disabled={isDisabled}
        >
          <span className={`text-sm ${textColor}`}>{date.getDate()}</span>
          {dateIsToday && (
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-[#98a1b2] rounded-full" />
          )}
        </button>
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
        <div className="flex flex-col items-center justify-center gap-3 w-full">
          {/* Month header */}
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
            <span className="text-base font-semibold text-[#3c8787]">
              {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}
            </span>
            {showNext ? (
              <Button variant="ghost" size="icon" className="p-2 rounded-lg" onClick={navigateNext}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>

          {/* Weekday headers + Day grid */}
          <div className="flex flex-wrap" style={{ width: '280px' }}>
            {WEEK_DAYS.map((day, i) => (
              <div key={`wk-${i}`} className="w-10 h-10 flex items-center justify-center">
                <span className="text-sm font-medium text-[#344054]">{day}</span>
              </div>
            ))}
            {grid.map((date, i) => renderDay(date, i, month))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render: Flexibility Bar ─────────────────────────────────────

  const renderFlexibilityBar = () => (
    <div className="flex items-center gap-3 p-4 w-full border-t border-[#eaecf0]">
      <div className="flex items-center gap-3 flex-1">
        {FLEXIBILITY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            className={`gap-1.5 px-4 py-2.5 rounded-lg border transition-colors
              ${flexibility === option.value
                ? 'bg-[#e7f0f0] border-[#3c8787]'
                : 'border-[#b3d1d1] hover:bg-[#f0f7f7]'
              }`}
            onClick={() => setFlexibility(option.value)}
          >
            {option.hasIcon && <PlusCircle className="w-5 h-5 text-[#3c8787]" />}
            <span className="font-semibold text-base text-[#3c8787]">{option.label}</span>
          </Button>
        ))}
      </div>

      {daysSelected > 0 && (
        <div className="inline-flex items-center px-[18px] py-3">
          <span className="font-semibold text-base text-[#475467]">
            {daysSelected} Days Selected
          </span>
        </div>
      )}
    </div>
  );

  // ── Main Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full max-w-[869px] items-center gap-6 p-6 bg-white rounded-xl overflow-hidden">
      {/* Move-in / Move-out inputs */}
      <div className="flex items-start gap-4 w-full">
        <div className="flex flex-col items-start gap-1.5 flex-1">
          <label className="font-medium text-[#344054] text-sm">Move in</label>
          <div className="h-12 w-full bg-white rounded-lg border border-[#d0d5dd] px-3 flex items-center">
            <span className={`text-sm ${start ? 'text-[#344054]' : 'text-[#667085]'}`}>
              {formatInputDate(start) || 'Add Date'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 flex-1">
          <label className="font-medium text-[#344054] text-sm">Move out</label>
          <div className="h-12 w-full bg-white rounded-lg border border-[#d0d5dd] px-3 flex items-center">
            <span className={`text-sm ${end ? 'text-[#344054]' : 'text-[#667085]'}`}>
              {formatInputDate(end) || 'Add Date'}
            </span>
          </div>
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

        {renderFlexibilityBar()}
      </div>
    </div>
  );
}
