import React, { useMemo, useState } from "react";
import { convertEpochToTime } from "../../utils/helpers";

// Small month-view calendar that lists classes per day.
// Props:
// - classes: array of class objects with at least { classId, classType, date (ms), instructorNames, zoomLink }
// - onClassClick(classObj): called when a class item is clicked (e.g. open attendance modal)
// - onJoin(classObj): optional, called when join action clicked
const Calendar = ({
  classes = [],
  
  onClassClick = () => {},
  onJoin = () => {},
  // called as onViewChange(month, year) where month is 1-12
  onViewChange = () => {},
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // build a calendar matrix for the current view month (weeks x days)
  const monthMatrix = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDay = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const matrix = [];
    let week = new Array(7).fill(null);
    // Fill leading nulls
    let dayCounter = 1;
    for (let i = 0; i < startDay; i++) week[i] = null;

    for (let i = startDay; i < 7; i++) {
      week[i] = new Date(viewYear, viewMonth, dayCounter++);
    }
    matrix.push(week);

    while (dayCounter <= daysInMonth) {
      const wk = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        wk[i] = new Date(viewYear, viewMonth, dayCounter++);
      }
      matrix.push(wk);
    }
    return matrix;
  }, [viewYear, viewMonth]);

  // Group classes by yyyy-mm-dd string (local date) for quick lookup
  const classesByDate = useMemo(() => {
    const map = {};
    classes.forEach((c) => {
      const ms = Number(c.date) || 0;
      const d = new Date(ms);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [classes]);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
    month: "long",
  });

  const prevMonth = () => {
    let newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    let newYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    setViewYear(newYear);
    setViewMonth(newMonth);
    try {
      onViewChange(newMonth + 1, newYear);
    } catch (e) {
      // swallowing callback errors
    }
  };
  const nextMonth = () => {
    let newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    let newYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    setViewYear(newYear);
    setViewMonth(newMonth);
    try {
      onViewChange(newMonth + 1, newYear);
    } catch (e) {
      // swallowing callback errors
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1 rounded hover:bg-gray-100">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="font-semibold text-lg">
            {monthName} {viewYear}
          </div>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1 rounded hover:bg-gray-100">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <div className="text-sm text-gray-600">{classes.length} classes</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1 border-b">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mt-2">
        {monthMatrix.map((week, wi) =>
          week.map((day, di) => {
            const key = day
              ? `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(day.getDate()).padStart(2, "0")}`
              : `empty-${wi}-${di}`;
            const dayClasses = day ? classesByDate[key] || [] : [];
            return (
              <div
                key={key}
                className={`min-h-[96px] p-2 rounded border bg-white text-left flex flex-col`}>
                {day ? (
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">{day.getDate()}</div>
                    <div className="text-xs text-gray-400">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-2 space-y-1 flex-1 overflow-hidden">
                  {dayClasses.length === 0 ? (
                    <div className="text-xs text-gray-300">No classes</div>
                  ) : (
                    dayClasses.slice(0, 3).map((c) => {
                      return (
                        <div
                          key={c.classId}
                          onClick={() => onClassClick(c)}
                          className="cursor-pointer p-1 rounded border bg-primaryColor text-white">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold">
                              {c.classType}
                            </div>
                            <div className="text-xs opacity-90">
                              {(() => {
                                try {
                                  const t = new Date(Number(c.date));
                                  return t.toLocaleTimeString(undefined, {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  });
                                } catch (e) {
                                  return "";
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {dayClasses.length > 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{dayClasses.length - 3} more
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Calendar;
