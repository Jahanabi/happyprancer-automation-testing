import React from "react";

const ScheduleSkeleton = () => {
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-3 text-center font-semibold text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-7 gap-[1px] bg-gray-100">
        {[...Array(35)].map((_, index) => (
          <div
            key={index}
            className="min-h-[80px] bg-white p-3 flex flex-col items-start justify-start relative"
          >
            {/* Date Number Skeleton */}
            <div className="w-8 h-8 rounded-lg bg-gray-200 mb-2"></div>

            {/* Event Skeleton (randomly place some to look realistic) */}
            {index % 3 === 0 && (
              <div className="w-full h-4 bg-gray-200 rounded"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleSkeleton;
