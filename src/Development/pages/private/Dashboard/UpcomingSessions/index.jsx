// UpcomingSessions.js (Desktop Component)
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { useNavigate } from "react-router-dom";
// import { API } from "../../../../Context/ContextProvider";
import { FaEdit } from "react-icons/fa";
import { Table, Pagination, Button, Select, Label } from "flowbite-react";
import {
  useMediaQuery,
  calculateUserPoints,
  parseClassDate,
  isSameCalendarDay,
  convertEpochToTime,
} from "../../../../utils/helpers";
import UpcomingSessionsMobile from "./UpcomingSessionsMobile";
// import { onJoinClass } from "./StreakFunctions";
import { fetchStreakCount } from "./StreakFunctions";
import { toast } from "react-toastify";
import DateFormatter from "../../../../common/utils/DateFormatter";
import PaginationComponent from "../../../../common/Pagination";
import AttendanceModal from "../../../../common/AttendanceModal";
import formatTime from "../../../../common/utils/format-time";
import FilterControls from "./Components/FilterControls";
import ClassModal from "./Components/CreateEditClassModal";
import TodayDashboard from "./Components/TodayDashboard";
import DashboardHero from "./Components/DashboardHero";
import StreakOnboardingTour from "./StreakOnboardingTour";
import { deduplicateUserList } from "../../../../utils/userDeduplication";
import InstructorActivityTabs from "../InstructorActivityTabs";
import { Box } from "@radix-ui/themes";
import "./index.css";

const UpcomingSessions = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const UserCtx = useContext(Context);
  const Ctx = useContext(Context);
  const UtilCtx = useContext(Context).util;
  const {
    userAttendance,
    userList,
    userData,
    getInstructorProfileByReferral,
    getGenericInstructorList,
    getUserAttendanceList,
    queryAttendance,
    editScheduleName,
    putAttendance,
    getStreak,
    updateStreak,
  } = Ctx;
  const Navigate = useNavigate();
  const isMobileScreen = useMediaQuery("(max-width: 600px)");

  // State for filters
  const [classTypeFilter, setClassTypeFilter] = useState("");
  const [instructorTypeFilter, setInstructorTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(false);

  // State for attendance
  const [attendanceList, setAttendanceList] = useState(false);
  const [attendedUsers, setAttendedUsers] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [activeUsers, setActiveUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [classId, setClassId] = useState("");
  const [currentPageAttendance, setCurrentPageAttendance] = useState(1);
  const [cognitoIds, setCognitoIds] = useState("");
  const [emailIds, setEmailIds] = useState("");

  // State for instructor data
  const [instructorClassTypes, setInstructorClassTypes] = useState([]);
  const [instructorName, setInstructorName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State for attendance modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] =
      useState(null);

  const [selectedClass, setSelectedClass] = useState(null);
  const [modalMode, setModalMode] = useState("edit");

  // Real streak/attendance data for the stats strip — now fetched for every
  // user type (previously member-only) so admin/instructor also see Daily
  // Streak / Classes Attended instead of stale zeros. Point values
  // (zPoints/totalRewardPoints below) already came from userData directly
  // and were never gated, so this just brings streak/attendance in line.
  const [dashboardStats, setDashboardStats] = useState({
    streakCount: 0,
    level: 0,
    attendance: 0,
  });

  const [runTour, setRunTour] = useState(false);
  const isDashboardLocked =
      Ctx.userData?.status === "Inactive" &&
      Ctx.userData?.userType === "member";

  const handleStartTour = useCallback(() => {
    if (!isDashboardLocked) {
      setRunTour(true);
    }
  }, [isDashboardLocked]);

  const handleTourFinish = useCallback(() => {
    setRunTour(false);
    if (Ctx.userData?.cognitoId) {
      localStorage.setItem(`streakTourShown_${Ctx.userData.cognitoId}`, "true");
    }
  }, [Ctx.userData?.cognitoId]);

  useEffect(() => {
    const onTourEvent = () => handleStartTour();
    window.addEventListener("start-streak-tour", onTourEvent);
    return () => window.removeEventListener("start-streak-tour", onTourEvent);
  }, [handleStartTour]);

  // Add ref to prevent infinite loops
  const isFetchingAttendance = useRef(false);
  const lastFetchedClasses = useRef(new Set());

  // Memoize filtered classes to prevent infinite re-renders
  const filteredClasses = useMemo(() => {
    return (Ctx.upcomingClasses || [])
        .filter(
            (clas) =>
                (instructorTypeFilter === "" ||
                    clas.instructorNames === instructorTypeFilter) &&
                (classTypeFilter === "" || clas.classType === classTypeFilter),
        )
        .filter((clas) => {
          const classDate = parseClassDate(clas.date);
          if (!classDate) return false;
          // Keep all classes for today and future days
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return classDate.getTime() >= startOfToday.getTime();
        })
        .sort((a, b) => {
          const timeA = parseClassDate(a.date)?.getTime() || 0;
          const timeB = parseClassDate(b.date)?.getTime() || 0;
          return timeA - timeB;
        });
  }, [Ctx.upcomingClasses, instructorTypeFilter, classTypeFilter]);

  const classTypes = useMemo(
      () => Array.from(new Set(filteredClasses.map((clas) => clas.classType))),
      [filteredClasses],
  );

  function removeDuplicateClasses(filteredClasses) {
    const uniqueMap = new Map();
    filteredClasses.forEach((item) => {
      const key = `${item.date}|${item.instructorNames}|${item.classType}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });
    return Array.from(uniqueMap.values());
  }

  const uniqueClasses = removeDuplicateClasses(filteredClasses);

  // Classes happening today (used for the hero's "Today's classes" stat)
  const todaysClassCount = useMemo(() => {
    const today = new Date();
    return uniqueClasses.filter(
        (c) => isSameCalendarDay(c.date, today),
    ).length;
  }, [uniqueClasses]);

  const instructorDetails = async (referral) => {
    try {
      const response = await getInstructorProfileByReferral(
          InstitutionData.InstitutionId,
          referral,
      );
      return response;
    } catch (error) {
      console.error("Error fetching instructor details:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (
        UserCtx.userData.userType === "member" &&
        UserCtx.userData.hybridPageUser
    ) {
      instructorDetails(UserCtx.userData.referred_code)
          .then((data) => {
            setInstructorName(data?.userProfile?.userName);
          })
          .catch((error) => {
            console.error("Error fetching instructor details:", error);
          });
    }
  }, [UserCtx.userData.userType, UserCtx.userData.hybridPageUser]);

  // Fetch instructor data
  useEffect(() => {
    const fetchInstructorData = async () => {
      if (Ctx.userData.userType === "instructor") {
        try {
          const response = await getGenericInstructorList(
              InstitutionData.InstitutionId,
          );
          const instructor = response.find(
              (inst) => inst.instructorId === Ctx.userData.cognitoId,
          );
          setInstructorClassTypes(instructor?.classType || []);
        } catch (error) {
          console.error("Error fetching instructor data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchInstructorData();
  }, [
    Ctx.userData.userType,
    Ctx.userData.cognitoId,
    InstitutionData.InstitutionId,
  ]);

  // Fetch real streak/attendance data for the stats strip — mirrors what
  // Streak.jsx does internally, since that component (and its data) is no
  // longer mounted here. Runs for every logged-in user type now (was
  // member-only) so admin/instructor get real numbers instead of zeros.
  // NOTE: fetchStreakCount/getUserAttendanceList were written with members
  // in mind — if the backend rejects or returns nonsense for admin/
  // instructor cognitoIds, the existing try/catch below just leaves the
  // stats at 0 rather than breaking the page, but it's worth confirming
  // those endpoints actually support non-member callers.
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (isDashboardLocked) return;

      try {
        if (Ctx.getUserProfile && InstitutionData.InstitutionId) {
          await Ctx.getUserProfile(InstitutionData.InstitutionId);
        }
        const streak = await fetchStreakCount(
            InstitutionData.InstitutionId,
            getStreak,
        );
        const attendance = await getUserAttendanceList(
            InstitutionData.InstitutionId,
        );
        const newStats = {
          streakCount: streak?.streakCount || 0,
          level: streak?.level || 0,
          attendance: attendance?.Count || 0,
        };
        setDashboardStats(newStats);
        Ctx.setUserData((prev) => ({
          ...prev,
          attendance: attendance?.Count || 0,
        }));

        // Show tour for new members who haven't seen it yet (unchanged —
        // still member-only, this is a member onboarding flow).
        const isNewUser =
            newStats.attendance === 0 &&
            newStats.streakCount === 0 &&
            newStats.level === 0 &&
            Ctx.userData?.userType === "member";
        const tourShown = Ctx.userData?.cognitoId
            ? localStorage.getItem(`streakTourShown_${Ctx.userData.cognitoId}`)
            : null;
        if (isNewUser && !tourShown && !isDashboardLocked) {
          setRunTour(true);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchDashboardStats();
  }, [Ctx.userData.userType, InstitutionData.InstitutionId]);

  // Fetch attendance with strict controls to prevent infinite loops
  useEffect(() => {
    const fetchAttendance = async () => {
      if (isFetchingAttendance.current) return;
      if (
          !UserCtx.userData.institution ||
          !UserCtx.userData.cognitoId ||
          !uniqueClasses.length
      ) {
        return;
      }

      const today = new Date();
      const classesForToday = uniqueClasses.filter(({ date }) => {
        return isSameCalendarDay(date, today);
      });

      if (classesForToday.length === 0) return;

      const currentClassIds = new Set(classesForToday.map((c) => c.classId));
      const hasNewClasses = [...currentClassIds].some(
          (id) => !lastFetchedClasses.current.has(id),
      );

      if (!hasNewClasses && lastFetchedClasses.current.size > 0) return;

      isFetchingAttendance.current = true;
      lastFetchedClasses.current = currentClassIds;

      try {
        const attendanceData = {};
        for (const { classId } of classesForToday) {
          try {
            const response = await queryAttendance(
                UserCtx.userData.institution,
                classId,
                UserCtx.userData.cognitoId,
            );
            if (
                response.Items.length > 0 &&
                response.Items[0].cognitoId === UserCtx.userData.cognitoId
            ) {
              attendanceData[classId] = "Attended";
            } else {
              attendanceData[classId] = "Mark Attendance";
            }
          } catch (error) {
            console.error(
                `Error fetching attendance for class ${classId}:`,
                error,
            );
            attendanceData[classId] = "Mark Attendance";
          }
        }
        if (Object.keys(attendanceData).length > 0) {
          setAttendanceStatus((prev) => ({ ...prev, ...attendanceData }));
        }
      } finally {
        isFetchingAttendance.current = false;
      }
    };

    const timeoutId = setTimeout(fetchAttendance, 500);
    return () => clearTimeout(timeoutId);
  }, [
    UserCtx.userData.institution,
    UserCtx.userData.cognitoId,
    uniqueClasses.length,
    JSON.stringify(uniqueClasses.map((c) => c.classId)),
  ]);

  useEffect(() => {
    if (!userList.length) return;

    const deduplicated = deduplicateUserList(userList);
    const activeUsers = deduplicated
        .filter(
            (user) =>
                user.status === "Active" ||
                user.status === "GracePeriod" ||
                user.isGracePeriod === true,
        )
        .sort(
            (a, b) =>
                (userAttendance[b.cognitoId] || 0) -
                (userAttendance[a.cognitoId] || 0),
        );

    setActiveUsers(activeUsers);

    if (attendedUsers.length > 0) {
      const attendedIds = new Set(attendedUsers.map((user) => user.cognitoId));
      const updatedStatus = {};
      activeUsers.forEach((user) => {
        const isAttended =
          attendedIds.has(user.cognitoId) ||
          (Array.isArray(user._allAssociatedCognitoIds) &&
            user._allAssociatedCognitoIds.some((id) => attendedIds.has(id)));
        updatedStatus[user.cognitoId] = isAttended
            ? "Attended"
            : "Not Attended";
      });

      setAttendanceStatus((prev) => {
        const newStatus = { ...prev };
        Object.keys(updatedStatus).forEach((key) => {
          if (!key.startsWith("100")) {
            newStatus[key] = updatedStatus[key];
          }
        });
        return newStatus;
      });
    }
  }, [userList, attendedUsers, userAttendance]);

  useEffect(() => {
    lastFetchedClasses.current.clear();
    isFetchingAttendance.current = false;
  }, [UserCtx.userData.institution, UserCtx.userData.cognitoId]);

  const instructors = useMemo(
      () =>
          Array.from(
              new Set(Ctx.upcomingClasses.map((clas) => clas.instructorNames)),
          ),
      [Ctx.upcomingClasses],
  );

  const getInstructor = useCallback(
      (name) =>
          Ctx.instructorList.find(
              (i) => i.name?.toString().trim() === name?.toString().trim(),
          ),
      [Ctx.instructorList],
  );

  const onClassUpdated = useCallback(
      async (
          classId,
          editedInstructorNames,
          editedClassType,
          instructorId,
          date,
      ) => {
        UtilCtx.setLoader(true);
        try {
          if (!instructorId || !editedClassType) {
            toast.warn(
                !instructorId
                    ? "Please select an instructor."
                    : "Please select a Class Type.",
            );
            return;
          }
          const updatedClasses = Ctx.upcomingClasses.map((c) =>
              c.classId === classId
                  ? {
                    ...c,
                    instructorNames: editedInstructorNames,
                    instructorId,
                    classType: editedClassType,
                    date,
                  }
                  : c,
          );
          await editScheduleName(InstitutionData.InstitutionId, {
            classId,
            instructorNames: editedInstructorNames,
            instructorId,
            classType: editedClassType,
            date,
          });
          Ctx.setUpcomingClasses(updatedClasses);
          toast.success("Class updated successfully");
        } catch (e) {
          toast.error(e.message);
        } finally {
          UtilCtx.setLoader(false);
        }
      },
      [
        Ctx.upcomingClasses,
        Ctx.setUpcomingClasses,
        InstitutionData.InstitutionId,
        UtilCtx,
      ],
  );

  const showMembersAttended = useCallback(
      async (classId) => {
        try {
          const response = await queryAttendance(
              UserCtx.userData.institution,
              classId,
          );
          setAttendedUsers(response.Items);
          setAttendanceList(true);
          setClassId(classId);
          const updatedStatus = {};
          activeUsers.forEach((user) => {
            updatedStatus[user.cognitoId] = response.Items.some(
                (attendedUser) => attendedUser.cognitoId === user.cognitoId,
            )
                ? "Attended"
                : "Not Attended";
          });
          setAttendanceStatus(updatedStatus);
        } catch (error) {
          console.log(error);
        }
      },
      [UserCtx.userData.institution, activeUsers],
  );

  const markAttendance = useCallback(
      async (ChoosenClassId) => {
        try {
          const res = await putAttendance(UserCtx.userData.institution, {
            classId: ChoosenClassId,
            emailId: UserCtx.userData.emailId,
          });
          toast.success("Attendance Marked Successfully");
          setAttendanceStatus((prev) => ({
            ...prev,
            [ChoosenClassId]: "Attended",
          }));
          Ctx.setUserData((prev) => ({
            ...prev,
            attendance: prev.attendance + 1,
          }));
        } catch (error) {
          toast.error(
              error.response?.data?.message ||
              "An error occurred while marking attendance",
          );
        }
      },
      [UserCtx.userData.institution, UserCtx.userData.emailId],
  );

  function capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const handleClassAction = (classData = null, mode) => {
    setSelectedClass(classData);
    setModalMode(mode);
    setModal(true);
  };

  const userCountryCode =
      Ctx.userData?.location?.countryCode || localStorage.getItem("userLocation");

  const firstName = (Ctx.userData?.userName || Ctx.userData?.name || "there")
      .toString()
      .split(" ")[0];

  const referralCount = Number(Ctx.userData?.referral_count ?? 0);
  const referralPoints = Number(
      Ctx.userData?.referral_points ?? referralCount * 100,
  );
  const zPoints = Number(Ctx.userData?.zPoints ?? 0);
  const ratingPoints = Number(Ctx.userData?.rating_points ?? 0);
  const totalRewardPoints = referralPoints + zPoints + ratingPoints;
  const rewardThresholds = [500, 10000];
  const nextRewardPoints =
      rewardThresholds.find((points) => totalRewardPoints < points) ||
      rewardThresholds[rewardThresholds.length - 1] + 1000;

  if (isMobileScreen) {
    return (
        <UpcomingSessionsMobile
            filteredClasses={uniqueClasses}
            userType={Ctx.userData.userType}
            markAttendance={markAttendance}
            handleAttendanceClick={showMembersAttended}
            attendanceStatus={attendanceStatus}
            primaryColor={InstitutionData.PrimaryColor}
            classTypeFilter={classTypeFilter}
            setClassTypeFilter={setClassTypeFilter}
            instructorTypeFilter={instructorTypeFilter}
            setInstructorTypeFilter={setInstructorTypeFilter}
            classTypes={classTypes}
            instructors={instructors}
            lightestPrimaryColor={InstitutionData.LightestPrimaryColor}
            userCountryCode={userCountryCode}
            showStats={true}
            stats={{
              dailyStreak: dashboardStats.streakCount,
              levelStreak: dashboardStats.level,
              classesAttended: dashboardStats.attendance,
              zPoints: totalRewardPoints,
              nextRewardPoints,
            }}
        />
    );
  }

  return (
      <div
          className="us-page no-scrollbar"
          style={{
            "--us-primary": InstitutionData.PrimaryColor || "#2D5A27",
            "--us-primary-light": InstitutionData.LightestPrimaryColor || "#E8F5E9",
          }}>
        <StreakOnboardingTour
            run={runTour}
            onFinish={handleTourFinish}
            primaryColor={InstitutionData.PrimaryColor}
        />
        <style>{`
        .us-page {
          position: relative;
          background-color: var(--us-bg, #F8F9FA);
          /* Dot grid on the scroll surface; full-page PNG sits on a fixed
             ::before layer at low opacity so content stays readable. */
          background-image: radial-gradient(
            circle at 6px 6px,
            var(--gray-a4) 1px,
            transparent 0
          );
          background-size: 28px 28px;
          background-position: 0 0;
          background-repeat: repeat;
          overflow-x: hidden;
          max-width: 100vw;
        }

        .us-page::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: url("/images/dashboard-bg.png") center top / cover no-repeat;
          opacity: 0.7;
        }

        .us-shell {
          position: relative;
          z-index: 1;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Floating glow orbs — soft, blurred, drifting slowly in the
           background behind everything. Institution-aware colors so it
           matches whatever brand palette is active. */
        .us-bg-glow {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .us-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.42;
          will-change: transform;
        }

        .us-glow-orb--one {
          width: 340px;
          height: 340px;
          left: -100px;
          top: 8%;
          background: radial-gradient(
            circle,
            ${InstitutionData.LightestPrimaryColor || "#CFE9DC"} 0%,
            transparent 70%
          );
          animation: usGlowDriftOne 20s ease-in-out infinite;
        }

        .us-glow-orb--two {
          width: 280px;
          height: 280px;
          right: -80px;
          top: 42%;
          background: radial-gradient(
            circle,
            rgba(246, 196, 69, 0.5) 0%,
            transparent 70%
          );
          animation: usGlowDriftTwo 24s ease-in-out infinite;
        }

        .us-glow-orb--three {
          width: 240px;
          height: 240px;
          left: 18%;
          bottom: -80px;
          background: radial-gradient(
            circle,
            ${InstitutionData.PrimaryColor || "#216B66"}55 0%,
            transparent 70%
          );
          animation: usGlowDriftThree 28s ease-in-out infinite;
        }

        @keyframes usGlowDriftOne {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 70px) scale(1.15); }
        }

        @keyframes usGlowDriftTwo {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-60px, -40px) scale(1.1); }
        }

        @keyframes usGlowDriftThree {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -50px) scale(1.2); }
        }

        @media (prefers-reduced-motion: reduce) {
          .us-glow-orb {
            animation: none;
          }
        }
      `}</style>

        {/* Decorative background layer — sits behind everything, doesn't
          intercept clicks, and stays fixed while the page scrolls. */}
        <div className="us-bg-glow" aria-hidden>
          <span className="us-glow-orb us-glow-orb--one" />
          <span className="us-glow-orb us-glow-orb--two" />
          <span className="us-glow-orb us-glow-orb--three" />
        </div>

        <div className="us-shell">
          <FilterControls
              userType={Ctx.userData.userType}
              primaryColor={InstitutionData.PrimaryColor}
              setModal={setModal}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              instructorTypeFilter={instructorTypeFilter}
              setInstructorTypeFilter={setInstructorTypeFilter}
              classTypeFilter={classTypeFilter}
              setClassTypeFilter={setClassTypeFilter}
              classTypes={classTypes}
              institutionData={InstitutionData}
              instructors={instructors}
              lightestPrimaryColor={InstitutionData.LightestPrimaryColor}
              setCurrentPage={setCurrentPage}
              onAction={handleClassAction}
              onShowTour={() => {
                handleStartTour();
                window.dispatchEvent(new CustomEvent("start-streak-tour"));
              }}
          />

          {UserCtx &&
              UserCtx?.userData?.userType === "member" &&
              UserCtx?.userData?.hybridPageUser === true && (
                  <div className="us-notice">
                    You have access to every class taught by{" "}
                    <b
                        onClick={() =>
                            Navigate(
                                `/hybrid?institution=${InstitutionData.InstitutionId}&referral=${UserCtx.userData.referred_code}`,
                            )
                        }>
                      {capitalizeWords(instructorName)}
                    </b>
                    , as well as all other online classes at{" "}
                    <b onClick={() => Navigate(`/`)}>
                      {capitalizeWords(InstitutionData.InstitutionId)}
                    </b>
                    .
                  </div>
              )}

          {/* DashboardHero above already carries the "Welcome back" greeting,
            so the dashboard's own greeting is suppressed here. Stats row
            now shows for every user type — see the note by dashboardStats
            above about admin/instructor gating being lifted. */}
          <TodayDashboard
              classes={uniqueClasses}
              markAttendance={markAttendance}
              getInstructor={getInstructor}
              firstName={firstName}
              primaryColor={InstitutionData.PrimaryColor}
              showGreeting={false}
              handleAttendanceClick={(classId) => {
                setSelectedClassForAttendance(classId);
                setShowAttendanceModal(true);
              }}
              showStats={true}
              stats={{
                dailyStreak: dashboardStats.streakCount,
                classesAttended: dashboardStats.attendance,
                zPoints: totalRewardPoints,
                nextRewardPoints,
              }}
              userType={Ctx.userData.userType}
              handleClassAction={handleClassAction}
          />

          {Ctx.userData?.userType === "instructor" && (
            <Box
              id="instructor-dashboard"
              p={{ initial: "4", md: "6" }}
              style={{ maxWidth: 1800, margin: "0 auto" }}>
              <div className="border-t border-gray-200/80 pt-8 pb-12 w-full">
                <InstructorActivityTabs />
              </div>
            </Box>
          )}
        </div>

        <ClassModal
            isOpen={modal}
            onClose={() => {
              setModal(false);
              setSelectedClass(null);
            }}
            institutionData={InstitutionData}
            classTypeNameArray={InstitutionData.ClassTypes}
            instructorList={Ctx.instructorList}
            userData={Ctx.userData}
            setUpcomingClasses={Ctx.setUpcomingClasses}
            upcomingClasses={Ctx.upcomingClasses}
            util={UtilCtx}
            classData={selectedClass}
            readOnly={modalMode === "view"}
        />

        {(() => {
          const scheduledClass = uniqueClasses.find(
              (c) => c.classId === selectedClassForAttendance,
          );
          return (
              <AttendanceModal
                  isOpen={showAttendanceModal}
                  onClose={() => {
                    setShowAttendanceModal(false);
                    setSelectedClassForAttendance(null);
                  }}
                  classId={selectedClassForAttendance}
                  institutionId={InstitutionData.InstitutionId}
                  scheduledInstructor={
                    scheduledClass
                        ? {
                          instructorId: scheduledClass.instructorId,
                          userName: scheduledClass.instructorNames,
                          emailId: scheduledClass.instructorEmail || "",
                          date: scheduledClass.date,
                          classType: scheduledClass.classType || "",
                        }
                        : null
                  }
              />
          );
        })()}
      </div>
  );
};

export default UpcomingSessions;