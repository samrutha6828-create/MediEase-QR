"use client";

import { useState } from "react";

interface DatePickerProps {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (dateStr: string, displayLabel: string) => void;
}

export function DatePicker({ selectedDate, onSelectDate }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  maxDate.setHours(23, 59, 59, 999);

  // Month navigation state
  const initialDate = selectedDate ? new Date(selectedDate) : today;
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthStart = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = monthStart.getDay(); // 0 = Sun, 1 = Mon...

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Can we navigate backwards?
  const isCurrentMonthMin =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Can we navigate forwards?
  const isCurrentMonthMax =
    currentYear === maxDate.getFullYear() && currentMonth === maxDate.getMonth();

  const handleDateClick = (day: number) => {
    const targetDate = new Date(currentYear, currentMonth, day);
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    
    // Human readable format
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    const displayLabel = targetDate.toLocaleDateString("en-US", options);

    onSelectDate(dateStr, displayLabel);
  };

  return (
    <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isCurrentMonthMin}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
            isCurrentMonthMin
              ? "border-slate-200 text-slate-300 cursor-not-allowed"
              : "border-slate-300 text-slate-800 hover:bg-slate-100 active:scale-95 cursor-pointer"
          }`}
          aria-label="Previous Month"
        >
          Previous
        </button>

        <h4 className="text-xl sm:text-2xl font-black text-slate-900">
          {monthNames[currentMonth]} {currentYear}
        </h4>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isCurrentMonthMax}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
            isCurrentMonthMax
              ? "border-slate-200 text-slate-300 cursor-not-allowed"
              : "border-slate-300 text-slate-800 hover:bg-slate-100 active:scale-95 cursor-pointer"
          }`}
          aria-label="Next Month"
        >
          Next
        </button>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-500 text-sm py-1 border-b border-slate-200">
        {daysOfWeek.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Empty cells before first day */}
        {Array.from({ length: startDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-12 sm:h-14" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNumber = idx + 1;
          const dayDate = new Date(currentYear, currentMonth, dayNumber);
          dayDate.setHours(0, 0, 0, 0);

          const isPast = dayDate < today;
          const isTooFar = dayDate > maxDate;
          const isDisabled = isPast || isTooFar;

          const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`;
          const isSelected = selectedDate === dateStr;
          const isToday = dayDate.getTime() === today.getTime();

          return (
            <button
              key={dayNumber}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(dayNumber)}
              className={`h-12 sm:h-14 rounded-2xl font-black text-lg sm:text-xl transition-all flex flex-col items-center justify-center ${
                isDisabled
                  ? "text-slate-300 cursor-not-allowed bg-slate-50"
                  : isSelected
                  ? "bg-emerald-600 text-white shadow-md scale-105 cursor-pointer"
                  : isToday
                  ? "border-2 border-emerald-600 text-emerald-900 hover:bg-emerald-50 cursor-pointer"
                  : "text-slate-900 hover:bg-slate-100 active:scale-95 cursor-pointer"
              }`}
            >
              <span>{dayNumber}</span>
              {isToday && !isSelected && (
                <span className="text-[9px] uppercase font-bold text-emerald-700 -mt-1">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-center text-slate-500 font-medium pt-1">
        Booking available up to 6 months in advance
      </p>
    </div>
  );
}
