import { Button } from "flowbite-react";
import React from "react";

const FilterSection = ({
  showFilters,
  setShowFilters,
  classTypeFilter,
  setClassTypeFilter,
  instructorTypeFilter,
  setInstructorTypeFilter,
  classTypes,
  instructors,
  institutionData,
  setCurrentPage,
}) => (
  <>
    <div className="w-[75%] flex justify-end">
      <Button
        style={{
          backgroundColor: institutionData.LightPrimaryColor,
        }}
        onClick={() => setShowFilters(!showFilters)}
      >
        Filter
      </Button>
    </div>
    <div className={`flex flex-col-reverse w-[75%]`}>
      <div className={`filters ${showFilters ? "show" : ""}`}>
        <div className={`w-[95%] flex justify-end m-[0.8rem] gap-3`}>
          <label className={`font-bold`} htmlFor="instructorTypeFilter">
            Instructor:{" "}
          </label>
          <select
            className={`rounded-[0.51rem] px-4`}
            style={{
              backgroundColor: institutionData.LightestPrimaryColor,
            }}
            id="instructorTypeFilter"
            value={instructorTypeFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setInstructorTypeFilter(e.target.value);
            }}
          >
            <option value="">All</option>
            {instructors.map((instructorNames) => (
              <option key={instructorNames} value={instructorNames}>
                {instructorNames}
              </option>
            ))}
          </select>
        </div>
        <div className={`w-[95%] flex justify-end m-[0.8rem] gap-3`}>
          <label className={`font-bold`} htmlFor="classTypeFilter">
            Classes:{" "}
          </label>
          <select
            className={`rounded-[0.51rem] px-4 `}
            style={{
              backgroundColor: institutionData.LightestPrimaryColor,
            }}
            id="classTypeFilter"
            value={classTypeFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setClassTypeFilter(e.target.value);
            }}
          >
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
  </>
);

export default FilterSection;