import React, { useState, useEffect, useContext, useRef } from "react";
import { fetchStreakCount } from "./StreakFunctions";
import InstitutionContext from "../../../../Context/InstitutionContext";
import Context from "../../../../Context/Context";
// import { API } from "../../../../Context/ContextProvider";
import apiPaths from "../../../../utils/api-paths";
import StreakOnboardingTour from "./StreakOnboardingTour";

const Streak = () => {
  const [streakData, setStreakData] = useState({
    streakCount: 0,
    level: 0,
    attendance: 0,
    attendanceByClassTypes: {},
  });
  const [openModal, setOpenModal] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const userCtxHelper = useContext(Context);
  const userCtx = userCtxHelper.userData;
  const { getUserAttendanceList, updateAchievement, getStreak } = userCtxHelper;
  const RefCtx = useRef(useContext(Context));
  const modalRef = useRef(null);
  const isDashboardLocked =
    userCtx?.status === "Inactive" && userCtx?.userType === "member";

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isDashboardLocked) {
          setRunTour(false);
          return;
        }
        let data = await fetchStreakCount(
          InstitutionData.InstitutionId,
          getStreak,
        );
        const attendance = await getUserAttendanceList(
          InstitutionData.InstitutionId,
        );
        let attendanceByClassTypes = {};
        for (let classType of InstitutionData.ClassTypes) {
          attendanceByClassTypes[classType] = attendance.Items.reduce(
            (acc, item) => acc + (item.classType === classType ? 1 : 0),
            0,
          );
        }
        data.attendance = attendance.Count;
        data.attendanceByClassTypes = attendanceByClassTypes;

        RefCtx.current.setUserData((prev) => {
          return {
            ...prev,
            attendance: data.attendance,
          };
        });

        // This is to generate and provide the user a 100 hours joining certificate
        if (
          data.attendance >= 100 &&
          userCtx.userType === "member" &&
          !userCtx.hasOwnProperty("achievements")
        ) {
          // Call the API to update the user's achievements
          // Call the API to update the user's achievements
          await updateAchievement(InstitutionData.InstitutionId, {
            cognitoId: userCtx.cognitoId,
            achievement: "100 Hours Dance Journey",
            institutionPrimaryColor: InstitutionData.PrimaryColor,
          });
        }

        setStreakData(data);

        // Check if user is new (has subscription but no attendance/streak/level)
        const isNewUser =
          data.attendance === 0 &&
          data.streakCount === 0 &&
          data.level === 0 &&
          userCtx.userType === "member";

        // Check if tour has been shown before
        const tourShown = localStorage.getItem(
          `streakTourShown_${userCtx.cognitoId}`,
        );

        // Show tour for new users who haven't seen it yet
        if (isNewUser && !tourShown) {
          // Delay to ensure DOM is ready
          setTimeout(() => {
            setRunTour(true);
          }, 1000);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [userCtx.attendance, isDashboardLocked]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setOpenModal(false);
      }
    };

    if (openModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    const handleStartTour = () => {
      if (!isDashboardLocked) {
        setRunTour(true);
      }
    };
    window.addEventListener("start-streak-tour", handleStartTour);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("start-streak-tour", handleStartTour);
    };
  }, [openModal]);

  const handleTourFinish = () => {
    setRunTour(false);
    // Save to localStorage that tour has been shown
    localStorage.setItem(`streakTourShown_${userCtx.cognitoId}`, "true");
  };

  // Function to manually restart tour (can be triggered from a help button)
  const restartTour = () => {
    setRunTour(true);
  };

  return (
    <>
      {/* Onboarding Tour */}
      <StreakOnboardingTour
        run={runTour}
        onFinish={handleTourFinish}
        primaryColor={InstitutionData.PrimaryColor}
      />

      <div className="z-10 flex flex-col md:flex-row justify-between gap-2 mb-4 max800:px-6 max800:gap-1 max850:gap-1.5">
        {/* Attendance Card */}
        <div
          data-tour="attendance"
          className="w-full z-10 md:flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-3 transition-all duration-300 hover:shadow-md relative overflow-hidden mb-2 md:mb-0 max800:mb-1"
          style={{ borderTop: `4px solid ${InstitutionData.PrimaryColor}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">
              ATTENDANCE
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenModal(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
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
            </div>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-gray-900">
              {streakData.attendance}
            </p>
          </div>
          <div className="mt-1 pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Total classes attended
            </span>
          </div>
        </div>

        {/* Level Card */}
        <div
          data-tour="level"
          className="w-full md:flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-3 transition-all duration-300 hover:shadow-md relative overflow-hidden mb-2 md:mb-0 max800:mb-1"
          style={{ borderTop: `4px solid ${InstitutionData.PrimaryColor}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">LEVEL</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: InstitutionData.PrimaryColor,
                color: "white",
              }}>
              {streakData.level > 5
                ? "Expert"
                : streakData.level > 3
                  ? "Advanced"
                  : "Beginner"}
            </span>
          </div>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900">
              {streakData.level}
            </p>
          </div>
          <div className="mt-1 pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Current achievement level
            </span>
          </div>
        </div>

        {/* Streak Card */}
        <div
          data-tour="streak"
          className="w-full md:flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-3 transition-all duration-300 hover:shadow-md relative overflow-hidden mb-2 md:mb-0 max800:mb-1"
          style={{ borderTop: `4px solid ${InstitutionData.PrimaryColor}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">STREAK</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor:
                  streakData.streakCount > 5
                    ? InstitutionData.PrimaryColor
                    : "rgb(229, 231, 235)",
                color: streakData.streakCount > 5 ? "white" : "rgb(75, 85, 99)",
              }}>
              {streakData.streakCount > 5 ? "On fire!" : "Building up"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-gray-900">
              {streakData.streakCount}
            </p>
            <span className="text-base">🔥</span>
          </div>
          <div className="mt-1 pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">Consecutive classes</span>
          </div>
        </div>
      </div>

      {/* Modal for detailed attendance */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 sm:mx-6 md:mx-8 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Summary
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-4 py-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                Classes attended by type
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.getOwnPropertyNames(
                  streakData.attendanceByClassTypes,
                ).map((classType) => (
                  <div
                    key={classType}
                    className="bg-white border border-gray-100 rounded-lg p-3 transition-all duration-300 hover:border-gray-200">
                    <h5 className="font-medium text-gray-800 text-sm mb-2 truncate">
                      {classType}
                    </h5>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500">
                        Classes Attended
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: InstitutionData.PrimaryColor }}>
                        {streakData.attendanceByClassTypes[classType]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-1">
                      Total Classes Attended
                    </span>
                    <p
                      className="text-xl font-bold"
                      style={{ color: InstitutionData.PrimaryColor }}>
                      {streakData.attendance}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-500 block mb-1">
                      Current Streak
                    </span>
                    <div className="flex items-center gap-1">
                      <p className="text-xl font-bold text-gray-900">
                        {streakData.streakCount}
                      </p>
                      <span>🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Streak;
