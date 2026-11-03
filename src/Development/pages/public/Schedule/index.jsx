"use client";

import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Globe,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Video,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../../components/Header";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import Footer from "../../../components/Footer";
import ScheduleSkeleton from "./ScheduleSkeleton";
import {
  getTimezoneInfo,
  formatDatePartsInTimezone,
} from "../../../utils/helpers";
import "./Schedule.css";

const Calendar = ({ scheduleData = [], institutionData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isAuth } = useContext(Context);
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState([]);
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleTodayMonth = () => {
    setCurrentDate(new Date());
  };

  // Detect user local timezone
  const userLocalTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  // Check if an official studio timezone is configured in institutionData or query param for testing
  const studioTz = useMemo(() => {
    let queryTz = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      queryTz = params.get("studioTz") || params.get("tz");
    }
    return (
      queryTz ||
      institutionData?.scheduleTimezone ||
      institutionData?.timezone ||
      null
    );
  }, [institutionData?.scheduleTimezone, institutionData?.timezone]);

  // Selected timezone mode: default to studio if studioTz is configured, else local
  const [selectedTzMode, setSelectedTzMode] = useState(() =>
    studioTz ? "studio" : "local",
  );

  useEffect(() => {
    if (studioTz && selectedTzMode === "local") {
      try {
        if (!localStorage.getItem("hp_user_tz_preference")) {
          setSelectedTzMode("studio");
        }
      } catch {}
    }
  }, [studioTz, selectedTzMode]);

  const activeTimezone = useMemo(() => {
    if (selectedTzMode === "studio" && studioTz) {
      return studioTz;
    }
    return userLocalTz;
  }, [selectedTzMode, studioTz, userLocalTz]);

  const activeTzInfo = useMemo(
    () => getTimezoneInfo(activeTimezone, currentDate),
    [activeTimezone, currentDate],
  );

  const studioTzInfo = useMemo(
    () => (studioTz ? getTimezoneInfo(studioTz, currentDate) : null),
    [studioTz, currentDate],
  );

  const localTzInfo = useMemo(
    () => getTimezoneInfo(userLocalTz, currentDate),
    [userLocalTz, currentDate],
  );

  const timezoneDisplayLabel = useMemo(() => {
    if (selectedTzMode === "studio" && studioTz) {
      return `Studio Time — ${activeTzInfo.formattedLabel}`;
    }
    if (studioTz) {
      return `My Local Time — ${activeTzInfo.formattedLabel}`;
    }
    return `Local Time — ${activeTzInfo.formattedLabel}`;
  }, [selectedTzMode, studioTz, activeTzInfo]);

  // Compute month parts and month label in active timezone
  const currentMonthParts = useMemo(() => {
    return formatDatePartsInTimezone(currentDate, activeTimezone);
  }, [currentDate, activeTimezone]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: activeTimezone,
      month: "long",
      year: "numeric",
    }).format(currentDate);
  }, [currentDate, activeTimezone]);

  // Map each schedule item to its calendar date and formatted time in the active timezone
  const eventsInTz = useMemo(() => {
    if (!scheduleData || scheduleData.length === 0) return [];
    return scheduleData.map((event) => {
      const parts = formatDatePartsInTimezone(event.startTime, activeTimezone);
      return {
        ...event,
        tzYear: parts.year,
        tzMonth: parts.month,
        tzDay: parts.day,
        formattedTime: parts.timeString,
        tzShort: parts.tzShort,
      };
    });
  }, [scheduleData, activeTimezone]);

  useEffect(() => {
    const year = currentMonthParts.year;
    const month = currentMonthParts.month;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    let day = 1;

    for (let i = 0; i < 42; i++) {
      if (i < startingDay || day > totalDays) {
        days.push(null);
      } else {
        const currentDayNumber = day;
        const eventsForDay = eventsInTz.filter((event) => {
          return (
            event.tzYear === year &&
            event.tzMonth === month &&
            event.tzDay === currentDayNumber
          );
        });

        // Ensure chronological order
        eventsForDay.sort((a, b) => a.startTime - b.startTime);

        days.push({
          day,
          year,
          month,
          events: eventsForDay,
        });
        day++;
      }
    }

    setCalendar(days);
  }, [currentMonthParts, eventsInTz]);

  const todayInTz = useMemo(() => {
    return formatDatePartsInTimezone(new Date(), activeTimezone);
  }, [activeTimezone]);

  const isCurrentDay = (dayData) => {
    if (!dayData) return false;
    return (
      dayData.year === todayInTz.year &&
      dayData.month === todayInTz.month &&
      dayData.day === todayInTz.day
    );
  };

  const primaryColor = institutionData?.PrimaryColor || "#03413A";
  const primaryColorLight = `${primaryColor}14`;

  const activeDaysCount = useMemo(() => {
    const activeDaysSet = new Set();
    eventsInTz.forEach((event) => {
      if (
        event.tzYear === currentMonthParts.year &&
        event.tzMonth === currentMonthParts.month
      ) {
        activeDaysSet.add(event.tzDay);
      }
    });
    return activeDaysSet.size;
  }, [eventsInTz, currentMonthParts]);

  const monthEventsCount = useMemo(() => {
    return eventsInTz.filter(
      (e) =>
        e.tzYear === currentMonthParts.year &&
        e.tzMonth === currentMonthParts.month,
    ).length;
  }, [eventsInTz, currentMonthParts]);

  const upcomingClasses = useMemo(() => {
    const nowEpoch = Date.now();
    const sorted = [...eventsInTz].sort(
      (a, b) => (a.startTime || a.date || 0) - (b.startTime || b.date || 0),
    );
    const future = sorted.filter(
      (ev) => (ev.startTime || ev.date || 0) >= nowEpoch,
    );
    if (future.length > 0) return future.slice(0, 6);
    return sorted
      .filter(
        (ev) =>
          ev.tzYear === currentMonthParts.year &&
          ev.tzMonth === currentMonthParts.month,
      )
      .slice(0, 6);
  }, [eventsInTz, currentMonthParts]);

  const getClassAccent = (classType = "", index = 0) => {
    const palette = [
      { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
      { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
      { bg: "#DCFCE7", text: "#166534", dot: "#22C55E" },
      { bg: "#FCE7F3", text: "#9D174D", dot: "#EC4899" },
    ];

    const hash =
      classType.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) +
      index;

    return palette[hash % palette.length];
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-white/70 overflow-hidden w-full">
      {/* Month & Stats Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold">
                Monthly Rhythm
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight chelsea-market-regular">
                {monthLabel}
              </h2>
            </div>
            {/* Month Navigation Controls (HP-024) */}
            <div className="flex items-center gap-1.5 sm:ml-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleTodayMonth}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer shadow-2xs"
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <div className="rounded-xl px-3 py-2 border border-gray-200 bg-gray-50">
              <p className="text-[11px] text-gray-500">Classes This Month</p>
              <p className="text-lg font-bold text-gray-800">
                {monthEventsCount}
              </p>
            </div>

            <div
              className="rounded-xl px-3 py-2 border"
              style={{
                borderColor: `${primaryColor}30`,
                backgroundColor: primaryColorLight,
              }}>
              <p className="text-[11px] text-gray-600">Active Days</p>
              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                {activeDaysCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timezone Indicator and Conversion Controls */}
      <div className="px-4 sm:px-6 py-2.5 bg-gray-50/90 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Globe className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            Schedule Timezone:
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-gray-800 shadow-2xs">
            {timezoneDisplayLabel}
          </span>
          {!studioTz && (
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md font-medium">
              Studio source timezone pending approval · Viewing in local time
            </span>
          )}
          {studioTz && studioTzInfo?.timeZone === localTzInfo?.timeZone && (
            <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
              Matches your local timezone
            </span>
          )}
        </div>

        {studioTz && studioTzInfo?.timeZone !== localTzInfo?.timeZone && (
          <div className="flex items-center gap-1 self-start sm:self-auto bg-gray-200/70 p-0.5 rounded-lg border border-gray-300/70">
            <button
              type="button"
              id="hp-tz-toggle-studio"
              onClick={() => {
                setSelectedTzMode("studio");
                try {
                  localStorage.setItem("hp_user_tz_preference", "studio");
                } catch {}
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedTzMode === "studio"
                  ? "bg-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                selectedTzMode === "studio"
                  ? { color: primaryColor, fontWeight: 700 }
                  : {}
              }>
              Studio Time ({studioTzInfo.shortName})
            </button>
            <button
              type="button"
              id="hp-tz-toggle-local"
              onClick={() => {
                setSelectedTzMode("local");
                try {
                  localStorage.setItem("hp_user_tz_preference", "local");
                } catch {}
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedTzMode === "local"
                  ? "bg-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                selectedTzMode === "local"
                  ? { color: primaryColor, fontWeight: 700 }
                  : {}
              }>
              My Local Time ({localTzInfo.shortName})
            </button>
          </div>
        )}
      </div>

      {/* Weekdays Strip */}
      <div
        className="grid grid-cols-7 border-b border-gray-200"
        style={{ backgroundColor: primaryColorLight }}>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="py-2 text-center text-[11px] sm:text-sm font-bold tracking-wide"
            style={{ color: primaryColor }}>
            {day}
          </div>
        ))}
      </div>

      {/* 42-cell Monthly Calendar Grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-gray-100 p-[1px]">
        {calendar.map((dayData, index) => (
          <div
            key={index}
            className={`min-h-[92px] sm:min-h-[108px] bg-white p-1.5 sm:p-2 flex flex-col items-start justify-start relative transition-all ${
              isCurrentDay(dayData)
                ? "ring-1 ring-blue-300 bg-blue-50/60"
                : "hover:bg-gray-50"
            }`}>
            {dayData && (
              <>
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all mb-1 ${
                    isCurrentDay(dayData) ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}>
                  <span
                    className={`text-sm sm:text-base ${
                      isCurrentDay(dayData)
                        ? "font-bold text-blue-600"
                        : "text-gray-700"
                    }`}>
                    {dayData.day}
                  </span>
                </div>

                {dayData.events.length > 0 && (
                  <div className="space-y-1 w-full">
                    {dayData.events.map((event, eventIndex) => {
                      const accent = getClassAccent(
                        event.classType,
                        eventIndex,
                      );

                      return (
                        <div
                          key={eventIndex}
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for ${event.classType} at ${event.formattedTime}`}
                          onClick={() => setSelectedEvent(event)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedEvent(event);
                            }
                          }}
                          className="text-[10px] sm:text-[11px] rounded-md px-1.5 py-1 w-full break-words border font-medium cursor-pointer hover:opacity-90 hover:shadow-xs transition focus:outline-none focus:ring-1 focus:ring-emerald-700"
                          style={{
                            backgroundColor: accent.bg,
                            borderColor: `${accent.dot}40`,
                            color: accent.text,
                          }}>
                          <span className="inline-flex items-center gap-1 font-bold">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: accent.dot }}></span>
                            <span>{event.formattedTime}</span>
                            {event.tzShort && (
                              <span className="hidden sm:inline text-[9px] font-normal opacity-75">
                                {event.tzShort}
                              </span>
                            )}
                          </span>
                          <span className="block font-semibold leading-tight mt-0.5">
                            {event.classType}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dayData.events.length === 0 && (
                  <div className="mt-auto mb-1 ml-0.5 h-1.5 w-1.5 rounded-full bg-gray-200"></div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Calendar Footnote */}
      <div className="px-4 py-2 bg-gray-50/70 border-t border-gray-200/70 text-[11px] text-gray-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <span>* Class times and calendar dates automatically adjust to your selected timezone.</span>
        <span>All sessions conducted live via Zoom</span>
      </div>

      {/* Upcoming Classes Section (HP-024) */}
      <div className="p-4 sm:p-6 bg-gray-50/60 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Upcoming Classes Preview
            </h3>
            <p className="text-xs text-gray-500">
              Future and upcoming sessions scheduled in your active timezone
            </p>
          </div>
        </div>

        {upcomingClasses.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-xl border border-gray-200/80 p-4">
            <p className="text-sm font-medium text-gray-600">
              No upcoming classes found for this month view.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Use the month navigation buttons above to view other months or check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingClasses.map((item, idx) => {
              const accent = getClassAccent(item.classType, idx);
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3.5 border border-gray-200/90 shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: accent.bg,
                          color: accent.text,
                        }}
                      >
                        {item.classType}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {item.formattedTime} {item.tzShort}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      📅 Day {item.tzDay} · {monthLabel}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Instructor: {item.instructorNames || item.instructorName || "HappyPrancer Certified"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(item)}
                    className="w-full py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accessible Class Details Modal (HP-023) */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-2">
                  Live Online Session
                </span>
                <h3 id="class-details-title" className="text-2xl font-bold text-gray-900">
                  {selectedEvent.classType}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close class details"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-gray-700 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>
                  <strong>Time:</strong> {selectedEvent.formattedTime} ({selectedEvent.tzShort || activeTimezone})
                  {selectedEvent.duration ? ` · ${selectedEvent.duration} mins` : " · 45–60 mins"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>
                  <strong>Instructor:</strong> {selectedEvent.instructorNames || selectedEvent.instructorName || "HappyPrancer Certified Instructor"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>
                  <strong>Delivery Mode:</strong> Live Online via Zoom
                </span>
              </div>
              {selectedEvent.classDescription && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                  {selectedEvent.classDescription}
                </div>
              )}
              <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 text-xs text-emerald-950">
                🔒 Live class Zoom links are provided securely to enrolled members in their dashboard prior to each class.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
              {isAuth ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate("/dashboard");
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-900 text-white font-semibold hover:bg-emerald-800 transition text-center text-sm cursor-pointer"
                >
                  Go to Member Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null);
                      navigate("/login");
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-900 text-white font-semibold hover:bg-emerald-800 transition text-center text-sm cursor-pointer"
                  >
                    Sign In to Join
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null);
                      navigate("/#subscription-section");
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-emerald-900 text-emerald-900 font-semibold hover:bg-emerald-50 transition text-center text-sm cursor-pointer"
                  >
                    View Membership Plans
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const { institutionData } = useContext(InstitutionContext);
  const { getSchedule } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getSchedule(institutionData.InstitutionId);
      setSchedule(response || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setIsLoading(false);
    }
  }, [institutionData.InstitutionId, getSchedule]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const pagePrimaryColor = institutionData?.PrimaryColor || "#03413A";

  return (
    <>
      <NavBar />
      <div
        className="min-h-screen"
        style={{
          background: `radial-gradient(circle at 12% 12%, ${pagePrimaryColor}22, transparent 36%),
            radial-gradient(circle at 88% 18%, ${pagePrimaryColor}18, transparent 40%),
            linear-gradient(155deg, #f4fffd 0%, #e9fbf7 48%, #f8fcff 100%)`,
        }}>
        <div className="container mx-auto px-4 pt-10 pb-10">
          <div className="text-center">

            <div className="relative w-full text-center mt-1 mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-3 chelsea-market-regular">
                Class Schedule
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Stay energized with your upcoming sessions and build a weekly
                rhythm that keeps you improving.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <ScheduleSkeleton />
            ) : schedule.length === 0 ? (
              <div className="flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white shadow-xl">
                <p className="text-xl sm:text-2xl text-center text-gray-700 font-medium">
                  No classes scheduled for this month
                </p>
                <p className="text-gray-500 mt-2">
                  Check back later for updated schedules
                </p>
              </div>
            ) : (
              <Calendar
                scheduleData={schedule}
                institutionData={institutionData}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Schedule;
