import React, { useState, useEffect } from "react";
import { FaUserTie, FaCalendarAlt, FaClock } from "react-icons/fa";
import { HiOutlineLink } from "react-icons/hi";
import { GrYoga } from "react-icons/gr";
import Context from "../../../../../Context/Context"; // Import Context
// import { API } from "../../../../../Context/ContextProvider";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";
import DateFormatter from "../../../../../common/utils/DateFormatter";
import { getTimezoneFromCountryCode } from "../../../../../utils/helpers";

// Helper function to convert epoch time to HH:MM format for HTML time inputs
const convertEpochToInputTime = (epochTime, timeZoneIdentifier) => {
  if (!epochTime) return "00:00";
  const date = new Date(epochTime);
  const timeZone = getTimezoneFromCountryCode(timeZoneIdentifier);

  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24-hour format for input
    timeZone: timeZone,
  };

  const timeString = date.toLocaleTimeString("en-GB", options); // en-GB gives HH:MM format
  return timeString;
};

// Helper function to create epoch time from date and time, accounting for timezone offset
const createEpochFromDateTimeAndTimezone = (
  dateStr,
  timeStr,
  timeZoneIdentifier,
) => {
  // Parse the date and time
  const [year, month, day] = dateStr.split("-");
  const [hours, minutes] = timeStr.split(":");

  const timeZone = getTimezoneFromCountryCode(timeZoneIdentifier);

  // Create a temporary date at midnight UTC
  const tempDate = new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      0,
    ),
  );

  // Get the offset by checking what time this date is in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timeZone,
  });

  const parts = formatter.formatToParts(tempDate);
  const tzYear = parseInt(parts.find((p) => p.type === "year").value);
  const tzMonth = parseInt(parts.find((p) => p.type === "month").value);
  const tzDay = parseInt(parts.find((p) => p.type === "day").value);
  const tzHour = parseInt(parts.find((p) => p.type === "hour").value);
  const tzMinute = parseInt(parts.find((p) => p.type === "minute").value);

  // Calculate the offset
  const offsetMs =
    tempDate.getTime() -
    new Date(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0).getTime();

  // Create the final epoch time adjusted for timezone
  const finalDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    0,
  );
  return finalDate.getTime() - offsetMs;
};

const ClassModal = ({
  isOpen,
  onClose,
  institutionData,
  classTypeNameArray,
  instructorList,
  userData,
  setUpcomingClasses,
  upcomingClasses,
  util,
  classData = null,
  readOnly = false, // null for create, object for edit
}) => {
  const isEditMode = !!classData;
  const [loading, setLoading] = useState(false);

  const { editScheduleName, addSchedule } = React.useContext(Context); // Destructure functions
  const canEditThisClass =
    !isEditMode ||
    userData?.userType !== "instructor" ||
    classData?.instructorId === userData?.cognitoId ||
    classData?.instructorEmailId === userData?.emailId ||
    classData?.instructorEmail === userData?.emailId;

  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(); // your submit function
  };
  const [classType, setClassType] = useState(classData?.classType || "");
  const [zoomLink, setZoomLink] = useState(classData?.zoomLink || "");
  const [selectedInstructor, setSelectedInstructor] = useState(
    classData
      ? {
          name: classData.instructorNames,
          instructorId: classData.instructorId,
        }
      : {},
  );
  const [datePicker, setDatePicker] = useState(
    classData?.date
      ? new Date(parseInt(classData.date)).toISOString().split("T")[0]
      : "",
  );
  const [time, setTime] = useState(
    classData?.date
      ? convertEpochToInputTime(
          parseInt(classData.date),
          localStorage.getItem("userTimeZone") ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        )
      : "00:00",
  );

  const userTimeZone =
    localStorage.getItem("userTimeZone") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (classData) {
      setClassType(classData.classType || "");
      setZoomLink(classData.zoomLink || "");
      setSelectedInstructor({
        name: classData.instructorNames,
        instructorId: classData.instructorId,
      });
      setDatePicker(
        classData.date
          ? new Date(parseInt(classData.date)).toISOString().split("T")[0]
          : "",
      );
      setTime(
        classData.date
          ? convertEpochToInputTime(parseInt(classData.date), userTimeZone)
          : "00:00",
      );
    }
  }, [classData, userTimeZone]);

  const getInstructor = (name) =>
    instructorList.find(
      (i) => i.name?.toString().trim() === name?.toString().trim(),
    );

  function canCreateClass(filteredClasses, newClass) {
    return !filteredClasses.some(
      (existingClass) =>
        existingClass.classType === newClass.classType &&
        existingClass.instructorId === newClass.instructorId &&
        existingClass.instructorNames === newClass.instructorNames &&
        existingClass.date === newClass.date &&
        existingClass.zoomLink === newClass.zoomLink,
    );
  }

  const onSubmit = async () => {
    try {
      // util.setLoader(true);
      setLoading(true);
      if (isEditMode && !canEditThisClass) {
        toast.error("You can only edit your own class.");
        return;
      }
      if (
        !classType ||
        !selectedInstructor.name ||
        !datePicker ||
        !time ||
        !zoomLink
      ) {
        toast.warn("Please fill in all sections.");
        return;
      }

      const selectedClassTime = createEpochFromDateTimeAndTimezone(
        datePicker,
        time,
        userTimeZone,
      );

      if (!isEditMode && selectedClassTime <= Date.now()) {
        toast.error(
          "You cannot create a class in the past. Please select a future date and time.",
        );
        return;
      }

      if (zoomLink) {
        try {
          new URL(zoomLink);
        } catch (error) {
          toast.warn("Invalid Zoom link. Please enter a valid URL.");
          return;
        }
      }
      const newClass = {
        classType: classType,
        instructorId: selectedInstructor.instructorId,
        instructorNames: selectedInstructor.name,
        date: createEpochFromDateTimeAndTimezone(
          datePicker,
          time,
          userTimeZone,
        ),
      };

      if (canCreateClass(upcomingClasses, newClass)) {
        console.log("✅ You can create the class");
      } else {
        toast.warn("Same schedule already exist!");
        return;
      }

      const classPayload = {
        classType,
        startTimeEst: createEpochFromDateTimeAndTimezone(
          datePicker,
          time,
          userTimeZone,
        ),
        instructorEmailId: userData.emailId,
        duration: 60,
        instructorId: selectedInstructor.instructorId,
        instructorNames: selectedInstructor.name,
        classDescription: "",
        zoomLink: zoomLink || "",
        date: createEpochFromDateTimeAndTimezone(
          datePicker,
          time,
          userTimeZone,
        ),
      };

      if (isEditMode) {
        // Edit existing class
        // Edit existing class
        await editScheduleName(institutionData.InstitutionId, {
          classId: classData.classId,
          ...classPayload,
        });
        const updatedClasses = upcomingClasses.map((c) =>
          c.classId === classData.classId
            ? { ...c, ...classPayload, classId: classData.classId }
            : c,
        );
        setUpcomingClasses(updatedClasses);
        toast.success("Class Updated");
      } else {
        // Create new class
        // Create new class
        const newClass = await addSchedule(
          institutionData.InstitutionId,
          classPayload,
        );
        toast.success("Class Added");
        setUpcomingClasses([...upcomingClasses, newClass]);
      }
      handleClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      // util.setLoader(false);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClassType("");
    setSelectedInstructor({});
    setZoomLink("");
    setDatePicker("");
    setTime("00:00");
    onClose();
  };

  if (!isOpen) return null;

  const formatForInput = (epochDate) => {
    if (!epochDate) return "";
    const date = new Date(epochDate);
    return date.toLocaleDateString("sv-SE"); // ✅ Proper "YYYY-MM-DD" for input
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 sm:mx-6 md:mx-8">
        {/* Header */}
        <div className="flex justify-between items-center p-2 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {readOnly
              ? "View Class"
              : isEditMode
                ? "Edit Class"
                : "Create Class"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 focus:outline-none">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            {/* Class Type */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Type
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <GrYoga />
                </span>
                <select
                  value={classType}
                  onChange={(e) => setClassType(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                  disabled={readOnly || !canEditThisClass}>
                  <option value="">Select Class Type</option>
                  {classTypeNameArray.map((classType) => (
                    <option key={classType} value={classType}>
                      {classType}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Instructor */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <FaUserTie />
                </span>
                <select
                  value={selectedInstructor.name || "none"}
                  onChange={(e) =>
                    setSelectedInstructor(getInstructor(e.target.value))
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                  disabled={readOnly || !canEditThisClass}>
                  <option value="none">Select Instructor</option>
                  {instructorList.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            {/* Date */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <FaCalendarAlt />
                </span>
                <input
                  type="date"
                  value={formatForInput(datePicker)}
                  min={new Date().toLocaleDateString("sv-SE")}
                  onChange={(e) => setDatePicker(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={readOnly || !canEditThisClass}
                />
              </div>
            </div>
            {/* Time */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <FaClock />
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={readOnly || !canEditThisClass}
                />
              </div>
              {/* <p className="text-xs text-gray-500 mt-1">
                {time &&
                  new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
              </p> */}
            </div>
          </div>
          {/* Zoom Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zoom Link
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <HiOutlineLink />
              </span>
              <input
                type="text"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                placeholder="Zoom Link"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={readOnly || !canEditThisClass}
              />
            </div>
          </div>
        </form>

        {/* Footer */}

        {!readOnly && (
          <div className="pb-3 px-4 flex justify-center">
            <button
              type="submit"
              onClick={handleClick}
              disabled={loading}
              style={{ backgroundColor: institutionData.PrimaryColor }}
              className="px-6 py-2 w-full flex items-center justify-center gap-2 text-sm text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70">
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Create"}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassModal;
