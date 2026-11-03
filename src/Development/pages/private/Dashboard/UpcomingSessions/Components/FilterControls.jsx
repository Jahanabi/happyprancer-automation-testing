import React from "react";
import { Button } from "flowbite-react";

const TourInfoButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Show tutorial"
    className="w-8 h-8 flex-shrink-0 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 shadow-sm transition-colors">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </button>
);

const FilterControls = ({
  userType,
  primaryColor,
  showFilters,
  setShowFilters,
  instructorTypeFilter,
  setInstructorTypeFilter,
  classTypeFilter,
  setClassTypeFilter,
  classTypes,
  instructors,
  lightestPrimaryColor,
  setCurrentPage,
  onAction,
  onShowTour, // NEW: pass Ctx-driven tour trigger from UpcomingSessions
}) => {
  return (
    <div className="flex flex-col">
      {/* Top buttons — left slot (Create Class) and right slot (tour info + Filters)
          are always both rendered so justify-between keeps the right slot pinned
          to the right edge whether or not the left slot has content. */}
      <div className="flex justify-between items-center mb-2 gap-2">
        <div>
          {(userType === "admin" || userType === "instructor") && (
            <Button
              style={{ backgroundColor: primaryColor }}
              onClick={() => onAction(null, "create")}>
              Create Class
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userType === "member" && onShowTour && (
            <TourInfoButton onClick={onShowTour} />
          )}
          <Button
            style={{ backgroundColor: primaryColor }}
            onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
        </div>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="w-full py-3 px-2 my-3 border border-gray rounded">
          <div className="w-[95%] flex justify-end items-center gap-6">
            {/* Instructor filter */}
            <div className="flex items-center gap-2">
              <label className="font-bold" htmlFor="instructorTypeFilter">
                Instructor:
              </label>
              <select
                className="rounded-[0.51rem] px-4 py-1"
                style={{ backgroundColor: lightestPrimaryColor }}
                id="instructorTypeFilter"
                value={instructorTypeFilter}
                onChange={(e) => {
                  setInstructorTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}>
                <option value="">All</option>
                {instructors.map((instructor) => (
                  <option key={instructor} value={instructor}>
                    {instructor}
                  </option>
                ))}
              </select>
            </div>

            {/* Class filter */}
            <div className="flex items-center gap-2">
              <label className="font-bold" htmlFor="classTypeFilter">
                Classes:
              </label>
              <select
                className="rounded-[0.51rem] px-4 py-1"
                style={{ backgroundColor: lightestPrimaryColor }}
                id="classTypeFilter"
                value={classTypeFilter}
                onChange={(e) => {
                  setClassTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}>
                <option value="">All</option>
                {classTypes.map((classType) => (
                  <option key={classType} value={classType}>
                    {classType}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;
