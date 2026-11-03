// UpcomingSessionsMobile.js (Mobile Component)
import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import AttendanceModal from "../../../../common/AttendanceModal";
import ClassModal from "./Components/CreateEditClassModal";
import { onJoinClass } from "./StreakFunctions";
import Skeleton from "react-loading-skeleton";
import { convertEpochToTime, parseClassDate, isSameCalendarDay } from "../../../../utils/helpers";
import { useClassStatus } from "./hooks/useClassStatus";
import { HiFilter, HiChevronDown, HiPencil } from "react-icons/hi";
import { FaFire, FaStar, FaCalendarCheck, FaGem, FaGift } from "react-icons/fa";
import NoticesList from "./Components/NoticesList";
import InstructorActivityTabs from "../InstructorActivityTabs";

/**
 * SessionSignUpButton
 * Matches the desktop ClassPhotoCard/CompactClassCard pattern: only the
 * NEXT class (isNextClass — today's earliest upcoming session) shows a
 * live/countdown badge and gets its button actually disabled until it's
 * live or within 15 min of starting. Every other class's button stays
 * plain and always-clickable, same as desktop.
 * NOTE: there's no real "booking" API behind this — if you want an actual
 * sign-up/RSVP flow distinct from joining, that needs a backend endpoint.
 */
const SessionSignUpButton = ({
                                 session,
                                 userType,
                                 markAttendance,
                                 institutionId,
                                 cognitoId,
                                 getStreak,
                                 updateStreak,
                             }) => {
    const duration = session.duration || 30;
    const { status, canJoin, countdownLabel } = useClassStatus(session.date, duration);

    // Every class gates on its own status now — previously only the single
    // "next" class of the day was disabled/badged and every other card was
    // always clickable regardless of how far off it was, which was wrong:
    // each class has its own independent 15-minute join window.
    const isDisabled = status === "ended" || !canJoin;

    const buttonLabel =
        status === "live"
            ? "Join Now"
            : status === "ended"
                ? "Ended"
                : userType === "member"
                    ? "Sign Up"
                    : "Join";

    const handleClick = () => {
        if (isDisabled) return;

        if (userType === "member") {
            if (session.zoomLink) {
                const meetingNumberRegex = /(?:https?:\/\/)?(?:www\.)?zoom\.us\/j\/(\d+)/;
                const meetingNumberMatch = session.zoomLink.match(meetingNumberRegex);
                const meetingNumber = meetingNumberMatch ? meetingNumberMatch[1] : "";
                if (meetingNumberMatch) {
                    const passwordRegex = /[?&]pwd=([^&]+)/;
                    const passwordMatch = session.zoomLink.match(passwordRegex);
                    const password = passwordMatch ? passwordMatch[1] : "";

                    window.open(
                        `https://live.awsaiapp.com/?institution=${institutionId}&cognitoId=${cognitoId}&instructorId=${session.instructorId}&classId=${session.classId}&meetingNumber=${meetingNumber}&password=${password}`,
                        "_blank",
                    );
                } else {
                    window.open(session.zoomLink, "_blank", "noreferrer");
                }
            }
        } else {
            window.open(session.zoomLink, "_blank");
        }
        // Marking attendance is a member-only concept; admin/instructor already
        // have their own "View Attendance" button to see who showed up.
        if (userType === "member") {
            markAttendance(session.classId);
        }
        // FIX: onJoinClass's real signature is
        // (institutionid, getStreakFn, updateStreakFn) — it was being called
        // with only institutionId, so getStreakFn (and updateStreakFn) were
        // undefined inside it, causing "getStreakFn is not a function".
        // Confirmed against StreakFunctions.jsx; both come from Context, same
        // as the desktop parent's destructured { getStreak, updateStreak }.
        onJoinClass(institutionId, getStreak, updateStreak);
    };

    return (
        <div className="flex flex-col items-end gap-1">
      <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
              status === "live"
                  ? "bg-red-100 text-red-700"
                  : status === "ended"
                      ? "bg-gray-100 text-gray-400"
                      : "bg-amber-100 text-amber-700"
          }`}
      >
        {status === "live" && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
        )}
          {status === "live"
              ? "LIVE NOW"
              : status === "ended"
                  ? "Ended"
                  : `Starts in ${countdownLabel}`}
      </span>
            <button
                onClick={handleClick}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-full text-sm font-semibold text-white whitespace-nowrap ${
                    isDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-[#7A1F2B] active:opacity-80"
                }`}
            >
                {buttonLabel}
            </button>
            {status !== "ended" && !canJoin && (
                <span className="text-[10px] text-gray-400">Opens 15 min before start</span>
            )}
        </div>
    );
};

const UpcomingSessionsMobile = ({
                                    filteredClasses, // Full filtered array from the parent (already excludes classes >1hr past)
                                    userType,
                                    markAttendance,
                                    handleAttendanceClick,
                                    primaryColor,
                                    // Filter props
                                    classTypeFilter,
                                    setClassTypeFilter,
                                    instructorTypeFilter,
                                    setInstructorTypeFilter,
                                    classTypes,
                                    instructors,
                                    lightestPrimaryColor,
                                    userCountryCode,
                                    // Stats — computed in the desktop parent (UpcomingSessions.js), passed
                                    // through so mobile shows the same Daily Streak / Level / Classes
                                    // Attended / Z Points / Next Reward info as the desktop stats strip.
                                    showStats = false,
                                    stats = {},
                                }) => {
    const navigate = useNavigate();
    const InstitutionData = useContext(InstitutionContext).institutionData;
    const Ctx = useContext(Context);
    const UtilCtx = useContext(Context).util;
    const { loadingUpcoming } = useContext(Context);

    const {
        dailyStreak = 0,
        levelStreak = 0,
        classesAttended = 0,
        zPoints = 0,
        nextRewardPoints = 500,
    } = stats;
    const rewardProgressPct = Math.min(
        100,
        Math.round((zPoints / Math.max(nextRewardPoints, 1)) * 100),
    );

    const itemsPerPage = 4;

    // "classes" | "notices" — see the tab row in the header below.
    const [activeTab, setActiveTab] = useState("classes");

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [showFilterSheet, setShowFilterSheet] = useState(false);

    // Modal states
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
    const [showClassModal, setShowClassModal] = useState(false);
    const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);

    const canInstructorEditClass = (session) => {
        if (userType !== "instructor") return true;
        const currentInstructorId = Ctx.userData?.cognitoId;
        const currentEmail = Ctx.userData?.emailId?.toLowerCase?.();
        const classInstructorId = session?.instructorId;
        const classInstructorEmail =
            session?.instructorEmailId?.toLowerCase?.() || session?.instructorEmail?.toLowerCase?.();

        return Boolean(
            (currentInstructorId && classInstructorId === currentInstructorId) ||
            (currentEmail && classInstructorEmail === currentEmail),
        );
    };

    const safeClasses = Array.isArray(filteredClasses) ? filteredClasses : [];

    // ---- Week strip: current calendar week (Sun–Sat), today labeled "Today" ----
    const weekDays = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(today.getDate() - today.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });
    }, []);

    const isSameDay = (a, b) => a.toDateString() === b.toDateString();
    const monthLabel = selectedDate.toLocaleString("default", { month: "short", year: "numeric" });

    // ---- Classes on the selected day only, sorted by time ----
    const classesForSelectedDay = useMemo(() => {
        return safeClasses
            .filter((c) => isSameCalendarDay(c.date, selectedDate))
            .sort((a, b) => {
                const timeA = parseClassDate(a.date)?.getTime() || 0;
                const timeB = parseClassDate(b.date)?.getTime() || 0;
                return timeA - timeB;
            });
    }, [safeClasses, selectedDate]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClasses = classesForSelectedDay.slice(startIndex, endIndex);

    const activeFilterCount =
        (classTypeFilter ? 1 : 0) + (instructorTypeFilter ? 1 : 0);

    const handleSelectDay = (day) => {
        setSelectedDate(day);
        setCurrentPage(1);
    };

    const handleEditClick = (session) => {
        setSelectedClassForEdit(session);
        setShowClassModal(true);
    };

    const handleViewAttendance = (classId) => {
        setSelectedClassForAttendance(classId);
        setShowAttendanceModal(true);
        if (handleAttendanceClick) handleAttendanceClick(classId);
    };

    const handleFilterChange = (filterType, value) => {
        setCurrentPage(1);
        if (filterType === "classType") setClassTypeFilter(value);
        else if (filterType === "instructor") setInstructorTypeFilter(value);
    };

    return (
        <div className="flex flex-col w-full inter pb-24">
            {/* ---- Header ---- */}
            <div className="w-full px-4 pt-6 mb-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
                    {activeTab === "classes" && (userType === "instructor" || userType === "admin") && (
                        <button
                            className="text-white rounded-full px-3 py-2 text-xs font-semibold"
                            style={{ backgroundColor: primaryColor || "#7A1F2B" }}
                            onClick={() => {
                                setSelectedClassForEdit(null);
                                setShowClassModal(true);
                            }}
                        >
                            + Create
                        </button>
                    )}
                </div>

                {/* Classes / Notices tabs */}
                <div className="flex items-center gap-5 mt-4 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab("classes")}
                        className="pb-2"
                        style={{
                            borderBottom: activeTab === "classes" ? `2px solid ${primaryColor || "#7A1F2B"}` : "2px solid transparent",
                        }}
                    >
            <span
                className={`text-base ${activeTab === "classes" ? "font-semibold text-gray-900" : "font-medium text-gray-400"}`}
            >
              Classes
            </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("notices")}
                        className="pb-2"
                        style={{
                            borderBottom: activeTab === "notices" ? `2px solid ${primaryColor || "#7A1F2B"}` : "2px solid transparent",
                        }}
                    >
            <span
                className={`text-base ${activeTab === "notices" ? "font-semibold text-gray-900" : "font-medium text-gray-400"}`}
            >
              Notices
            </span>
                    </button>
                </div>
            </div>

            {activeTab === "notices" ? (
                <div className="w-full px-4">
                    <NoticesList userType={userType} />
                </div>
            ) : (
                <>
                    {/* ---- Month label ---- */}
                    <div className="text-center text-sm font-semibold text-gray-700 mb-2">{monthLabel}</div>

                    {/* ---- Week day strip ---- */}
                    <div className="flex justify-between px-4 mb-4">
                        {weekDays.map((day) => {
                            const today = isSameDay(day, new Date());
                            const selected = isSameDay(day, selectedDate);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => handleSelectDay(day)}
                                    className="flex flex-col items-center gap-1 flex-1"
                                >
              <span className="text-[11px] text-gray-400">
                {today ? "Today" : day.toLocaleString("default", { weekday: "short" })}
              </span>
                                    <span
                                        className={`h-8 w-8 flex items-center justify-center rounded-full text-sm ${
                                            selected ? "font-semibold text-gray-900" : "text-gray-700"
                                        }`}
                                        style={
                                            selected
                                                ? { backgroundColor: lightestPrimaryColor || "#F7D9DC" }
                                                : undefined
                                        }
                                    >
                {day.getDate()}
              </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ---- Filter chip row ---- */}
                    <div className="flex items-center gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setShowFilterSheet((prev) => !prev)}
                            className="flex items-center gap-1 border border-gray-200 rounded-full px-3 py-2 text-sm text-gray-600 whitespace-nowrap"
                        >
                            <HiFilter size={14} />
                            {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
                        </button>

                        {/* "Instructor" stands in for the reference's location chip — this
            app doesn't have a venue/location field on classes. */}
                        <div className="relative">
                            <select
                                value={instructorTypeFilter}
                                onChange={(e) => handleFilterChange("instructor", e.target.value)}
                                className={`appearance-none pr-7 pl-3 py-2 rounded-full text-sm border whitespace-nowrap ${
                                    instructorTypeFilter
                                        ? "border-[#7A1F2B] text-[#7A1F2B]"
                                        : "border-gray-200 text-gray-600"
                                }`}
                            >
                                <option value="">All Instructors</option>
                                {instructors.map((instructor) => (
                                    <option key={instructor} value={instructor}>
                                        {instructor}
                                    </option>
                                ))}
                            </select>
                            <HiChevronDown
                                size={14}
                                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={classTypeFilter}
                                onChange={(e) => handleFilterChange("classType", e.target.value)}
                                className={`appearance-none pr-7 pl-3 py-2 rounded-full text-sm border whitespace-nowrap ${
                                    classTypeFilter ? "border-[#7A1F2B] text-[#7A1F2B]" : "border-gray-200 text-gray-600"
                                }`}
                            >
                                <option value="">Category</option>
                                {classTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <HiChevronDown
                                size={14}
                                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* ---- Class cards ---- */}
                    <div className="w-full px-4 space-y-3">
                        {loadingUpcoming ? (
                            Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="w-full bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                                    <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                                    <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                                    <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                                    <div className="h-4 w-28 bg-gray-200 rounded" />
                                </div>
                            ))
                        ) : paginatedClasses.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No classes scheduled for this day
                            </div>
                        ) : (
                            paginatedClasses.map((session) => (
                                <div
                                    key={session.classId}
                                    className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            {/* Placeholder for a real venue/location field — see note
                      in the response above SessionSignUpButton. */}
                                            <p className="text-xs text-gray-400 truncate">
                                                {session.location || "Online Class"}
                                            </p>
                                            {(userType === "admin" ||
                                                (userType === "instructor" && canInstructorEditClass(session))) && (
                                                <button onClick={() => handleEditClick(session)} className="text-gray-300">
                                                    <HiPencil size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900 truncate">{session.classType}</h4>
                                        <p className="text-sm text-gray-700 mt-0.5">
                                            {userCountryCode
                                                ? convertEpochToTime(session.date, userCountryCode)
                                                : convertEpochToTime(session.date)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">w/ {session.instructorNames}</p>

                                        {(userType === "instructor" || userType === "admin") && (
                                            <button
                                                className="text-xs font-medium mt-2"
                                                style={{ color: primaryColor || "#7A1F2B" }}
                                                onClick={() => handleViewAttendance(session.classId)}
                                            >
                                                View Attendance
                                            </button>
                                        )}
                                    </div>

                                    <SessionSignUpButton
                                        session={session}
                                        userType={Ctx.userData.userType}
                                        markAttendance={markAttendance}
                                        institutionId={InstitutionData.InstitutionId}
                                        cognitoId={Ctx.userData.cognitoId}
                                        getStreak={Ctx.getStreak}
                                        updateStreak={Ctx.updateStreak}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {/* ---- Stats strip (members only) ---- */}
                    {showStats && (
                        <div className="w-full px-4 mt-5 grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <FaFire size={15} />
            </span>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{dailyStreak}</p>
                                    <p className="text-xs text-gray-500">Daily Streak</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <FaStar size={14} />
            </span>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{levelStreak}</p>
                                    <p className="text-xs text-gray-500">Level Streak</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <FaCalendarCheck size={14} />
            </span>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{classesAttended}</p>
                                    <p className="text-xs text-gray-500">Classes Attended</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <FaGem size={14} />
            </span>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{zPoints}</p>
                                    <p className="text-xs text-gray-500">Z Points</p>
                                </div>
                            </div>

                            <div className="col-span-2 bg-white rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
              <span className="h-9 w-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <FaGift size={14} />
              </span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Next Reward</p>
                                        <p className="text-xs text-gray-500">
                                            {Math.max(nextRewardPoints - zPoints, 0)} points needed
                                        </p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${rewardProgressPct}%`,
                                            backgroundColor: primaryColor || "#7A1F2B",
                                        }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 text-right mt-1">
                                    {zPoints} / {nextRewardPoints}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Pagination — only if this day has more than one page of classes */}
                    {classesForSelectedDay.length > itemsPerPage && (
                        <div className="mt-4 px-4">
                            <PaginationComponent
                                showIcons={true}
                                data={classesForSelectedDay}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={(page) => setCurrentPage(page)}
                                hideResultsText={true}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Instructor Dashboard Section */}
            {userType === "instructor" && (
                <div id="instructor-dashboard" className="w-full px-4 mt-6 pt-6 border-t border-gray-200 pb-12">
                    <InstructorActivityTabs />
                </div>
            )}

            {/* Modals */}
            <ClassModal
                isOpen={showClassModal}
                onClose={() => {
                    setShowClassModal(false);
                    setSelectedClassForEdit(null);
                }}
                institutionData={InstitutionData}
                classTypeNameArray={InstitutionData.ClassTypes}
                instructorList={Ctx.instructorList}
                userData={Ctx.userData}
                setUpcomingClasses={Ctx.setUpcomingClasses}
                upcomingClasses={Ctx.upcomingClasses}
                util={UtilCtx}
                classData={selectedClassForEdit}
            />

            <AttendanceModal
                isOpen={showAttendanceModal}
                onClose={() => {
                    setShowAttendanceModal(false);
                    setSelectedClassForAttendance(null);
                }}
                classId={selectedClassForAttendance}
                institutionId={InstitutionData.InstitutionId}
            />
        </div>
    );
};

export default UpcomingSessionsMobile;