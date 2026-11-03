import React, { useState, useContext, useEffect } from "react";
import { Button } from "flowbite-react";
// import { API } from "../../Context/ContextProvider";
import Context from "../../Context/Context";
import { toast } from "react-toastify";
import { Loader, Loader2 } from "lucide-react";
import InstitutionContext from "../../Context/InstitutionContext";
import { deduplicateUserList } from "../../utils/userDeduplication";

const AttendanceModal = ({
  isOpen,
  onClose,
  classId,
  institutionId,
  scheduledInstructor,

  onInstructorMarked,
}) => {
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState({});
  const {
    userList = [],
    userData,
    util,
    instructorList: ctxInstructorList = [],
    upcomingClasses = [],
    fetchAttendance,
    getInstructorAttendance,
    markUserAttendance,
    updateScheduleInstructor,
    markInstructorAttendance,
  } = useContext(Context) || {};
  const InstitutionData = useContext(InstitutionContext).institutionData;
  console.log("Institution Data Primary Color:", InstitutionData.PrimaryColor);
  const [loading, setLoading] = useState(false); // for fetchAttendanceData
  const [toggling, setToggling] = useState({}); // per-user toggle loader
  const [instructorTook, setInstructorTook] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [instructorSubmitting, setInstructorSubmitting] = useState(false);
  const isAdminUser =
    String(userData?.userType || userData?.role || "")
      .toLowerCase()
      .trim() === "admin";
  // derive scheduled instructor id for easy comparisons
  const scheduledId =
    scheduledInstructor?.instructorId || scheduledInstructor?.id || null;
  // normalize an instructor's unique key for consistent comparisons/values
  const getInstKey = (inst) =>
    inst?.cognitoId ||
    inst?.instructorId ||
    inst?.id ||
    inst?.emailId ||
    inst?.email ||
    inst?.userId ||
    inst?.userName ||
    "";

  // compute a canonical key for the scheduled instructor (if provided)
  const scheduledKey = scheduledInstructor
    ? getInstKey(scheduledInstructor) || scheduledId
    : scheduledId;

  // Helper to normalize a date (seconds / milliseconds / ISO) -> milliseconds
  const toMs = (d) => {
    if (!d) return Date.now();
    const n = Number(d);
    if (!Number.isNaN(n)) {
      // if seconds (10 digits) convert to ms
      if (String(n).length === 10) return n * 1000;
      return n;
    }
    const parsed = Date.parse(d);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  };

  const normalizeKey = (value) =>
    value === null || value === undefined
      ? ""
      : String(value).trim().toLowerCase();

  const getUserLookupKeys = (user) =>
    [user?.cognitoId, user?.emailId, user?.email, user?.userId, user?.id]
      .map(normalizeKey)
      .filter(Boolean);

  const getAttendanceLookupKeys = (item) => {
    const keys = [
      item?.cognitoId,
      item?.emailId,
      item?.email,
      item?.userId,
      item?.id,
      item?.cognitoid,
    ];

    if (typeof item === "string") {
      keys.push(item);
    }

    if (item && typeof item === "object") {
      if (typeof item.emailIdAndStartTime === "string") {
        keys.push(item.emailIdAndStartTime.split(/[:|]/)[0]);
      }

      if (item.user && typeof item.user === "object") {
        keys.push(
          item.user.cognitoId,
          item.user.emailId,
          item.user.email,
          item.user.userId,
          item.user.id,
        );
      }
    }

    return keys.map(normalizeKey).filter(Boolean);
  };

  const deduplicatedUsers = React.useMemo(
    () => deduplicateUserList(userList || []),
    [userList],
  );

  const resolveAttendanceUserKey = (attendanceItem) => {
    const attendanceKeys = new Set(getAttendanceLookupKeys(attendanceItem));
    const matchedUser = deduplicatedUsers.find((user) => {
      const keys = getUserLookupKeys(user);
      if (Array.isArray(user._allAssociatedCognitoIds)) {
        user._allAssociatedCognitoIds.forEach((id) => keys.push(normalizeKey(id)));
      }
      return keys.some((key) => attendanceKeys.has(key));
    });

    return (
      matchedUser?.cognitoId ||
      attendanceItem?.cognitoId ||
      attendanceItem?.userId ||
      attendanceItem?.emailId ||
      attendanceItem?.email ||
      ""
    );
  };

  // Determine the scheduled class timestamp (ms) if available so we can
  // enforce same-day-only marking for instructor attendance.
  const scheduledMsGlobal = toMs(
    (upcomingClasses || []).find((c) => c.classId === classId)?.date ||
      scheduledInstructor?.date ||
      null,
  );

  // Compare scheduled date with today (UTC) — marking allowed only on the same day.
  const isScheduledSameDay = (() => {
    if (!scheduledMsGlobal) return false;
    const s = new Date(scheduledMsGlobal);
    const now = new Date();
    return (
      s.getUTCFullYear() === now.getUTCFullYear() &&
      s.getUTCMonth() === now.getUTCMonth() &&
      s.getUTCDate() === now.getUTCDate()
    );
  })();

  // helper to detect instructor objects (used to exclude instructors from the users list)
  const isInstructorUser = (u) => {
    if (!u) return false;
    if (u.role && typeof u.role === "string") return u.role === "Instructor";
    if (Array.isArray(u.roles)) return u.roles.includes("Instructor");
    if (u.userType) return u.userType === "Instructor";
    if (u.isInstructor) return true;
    // objects coming from ctxInstructorList may have instructorId but not roles
    if (u.instructorId || u.cognitoId?.startsWith?.("instr")) return true;
    return false;
  };

  const isEligibleForAttendance = (user) =>
    user?.status === "Active" ||
    user?.status === "GracePeriod" ||
    user?.isGracePeriod === true;

  // Filter users based on search term
  const filteredUsers = deduplicatedUsers
    .filter(isEligibleForAttendance)
    // hide instructors from the users card list - they belong in the instructor dropdown
    .filter((user) => !isInstructorUser(user))
    .filter((user) => {
      if (!attendanceSearchTerm) return true;
      return (
        user?.userName
          ?.toLowerCase()
          .includes(attendanceSearchTerm.toLowerCase()) ||
        user?.emailId
          ?.toLowerCase()
          .includes(attendanceSearchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Sort by attendance status (marked first)
      const aIsMarked = selectedUsers[a.cognitoId] || false;
      const bIsMarked = selectedUsers[b.cognitoId] || false;

      if (aIsMarked && !bIsMarked) return -1;
      if (!aIsMarked && bIsMarked) return 1;

      // If both have same attendance status, sort alphabetically by name
      return a.userName?.localeCompare(b.userName || "");
    });

  // Fetch attendance data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchAttendanceData();
    }

    // Cleanup function to reset state when component unmounts
    return () => {
      setSelectedUsers({});
      setAttendanceSearchTerm("");
    };
  }, [isOpen, classId]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetchAttendance(institutionId, classId);
      const attendedUsers = response.Items || [];
      const initialSelectedUsers = {};
      attendedUsers.forEach((user) => {
        const resolvedKey = resolveAttendanceUserKey(user);
        if (resolvedKey) {
          initialSelectedUsers[resolvedKey] = true;
        }
      });
      setSelectedUsers(initialSelectedUsers);
      // If API returns instructor attendance info, try to initialize it.
      // We defensively check several possible keys since API shape may vary.
      if (response.instructorAttendance) {
        const inst = response.instructorAttendance;
        // inst could be { cognitoId, took, classTaken, date }
        if (inst.took) setInstructorTook(true);
        if (inst.cognitoId) setSelectedInstructor(inst.cognitoId);
      } else if (response.instructor) {
        // fallback
        const inst = response.instructor;
        if (inst.took) setInstructorTook(true);
        if (inst.cognitoId) setSelectedInstructor(inst.cognitoId);
      }
      // Additionally, check the instructor-attendance table for the scheduled
      // instructor record so the UI reflects instructor attendance after a
      // full page refresh. The generic query-attendance endpoint returns
      // user attendance entries and may not include instructor attendance.
      try {
        const scheduledMs = toMs(
          (upcomingClasses || []).find((c) => c.classId === classId)?.date ||
            scheduledInstructor?.date ||
            null,
        );
        const month = new Date(scheduledMs).getUTCMonth() + 1;
        const year = new Date(scheduledMs).getUTCFullYear();
        if (scheduledKey) {
          const instRes = await getInstructorAttendance(
            institutionId,
            [scheduledKey],
            month,
            year,
          );
          const results = instRes && instRes.results ? instRes.results : [];
          if (results.length > 0) {
            const rec = results[0];
            const attendanceItems =
              rec.attendance ||
              rec.attendancePaged ||
              rec.attendanceByDay ||
              rec.attendanceList ||
              [];
            // attendanceItems can be different shapes depending on backend version.
            // Handle:
            // - legacy: array of strings (e.g. "Yoga: 1763317800000")
            // - modern: array of records where each record may have a classTaken array
            //   with objects like { classId, classType, timestampMs }
            const list = Array.isArray(attendanceItems)
              ? attendanceItems
              : [attendanceItems];
            let found = false;
            for (const item of list) {
              if (!item) continue;
              // legacy plain string entries
              if (typeof item === "string") {
                if (
                  item.includes(String(scheduledMs)) ||
                  (classId && item.includes(String(classId)))
                ) {
                  found = true;
                  break;
                }
                continue;
              }

              // If item has classTaken array, inspect each entry
              const classTakenArr = Array.isArray(item.classTaken)
                ? item.classTaken
                : null;
              if (classTakenArr) {
                for (const ct of classTakenArr) {
                  if (!ct) continue;
                  if (typeof ct === "string") {
                    if (
                      ct.includes(String(scheduledMs)) ||
                      (classId && ct.includes(String(classId)))
                    ) {
                      found = true;
                      break;
                    }
                  } else if (typeof ct === "object") {
                    if (
                      (ct.timestampMs &&
                        Number(ct.timestampMs) === Number(scheduledMs)) ||
                      (ct.classId &&
                        classId &&
                        String(ct.classId) === String(classId))
                    ) {
                      found = true;
                      break;
                    }
                  }
                }
                if (found) break;
              }

              // item might itself represent a classTaken object
              if (typeof item === "object") {
                if (
                  (item.timestampMs &&
                    Number(item.timestampMs) === Number(scheduledMs)) ||
                  (item.classId &&
                    classId &&
                    String(item.classId) === String(classId))
                ) {
                  found = true;
                  break;
                }
                if (item.classTaken && typeof item.classTaken === "string") {
                  if (
                    item.classTaken.includes(String(scheduledMs)) ||
                    (classId && item.classTaken.includes(String(classId)))
                  ) {
                    found = true;
                    break;
                  }
                }
              }
            }
            if (found) {
              setInstructorTook(true);
              setSelectedInstructor(scheduledKey);
            }
          }
        }
      } catch (instErr) {
        // non-fatal — log and continue
        console.warn(
          "Failed to fetch instructor-attendance for scheduled instructor:",
          instErr,
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (cognitoId, emailId) => {
    setToggling((prev) => ({ ...prev, [cognitoId]: true }));
    try {
      await markUserAttendance(institutionId, { classId, cognitoId, emailId });
      setSelectedUsers((prev) => ({
        ...prev,
        [cognitoId]: !prev[cognitoId],
      }));
      toast.success("Attendance updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update attendance");
    } finally {
      setToggling((prev) => ({ ...prev, [cognitoId]: false }));
    }
  };

  // Helper to normalize a date (seconds / milliseconds / ISO) -> milliseconds

  // Prefer instructor list from Context (fetched centrally). If that's empty,
  // fallback to inferring instructors from the userList shape.
  const instructorList =
    ctxInstructorList && ctxInstructorList.length
      ? ctxInstructorList
      : (userList || []).filter((u) => {
          // attempt to detect instructor users - support several possible shapes
          if (!u) return false;
          if (u.role && typeof u.role === "string")
            return u.role === "Instructor";
          if (Array.isArray(u.roles)) return u.roles.includes("Instructor");
          if (u.userType) return u.userType === "Instructor";
          // fallback: look for a boolean flag
          if (u.isInstructor) return true;
          return false;
        });

  // Merge scheduledInstructor (from parent) into the instructor list so it always appears
  const mergedInstructorList = React.useMemo(() => {
    const base = instructorList || [];
    if (!scheduledKey) return base;
    const exists = base.some((u) => getInstKey(u) === scheduledKey);
    if (exists) return base;
    const synthetic = {
      // include both id fields so getInstKey will pick them up consistently
      instructorId: scheduledKey,
      cognitoId: scheduledKey,
      userName:
        scheduledInstructor.userName ||
        scheduledInstructor.name ||
        scheduledInstructor.instructorNames ||
        "Instructor",
      emailId: scheduledInstructor.emailId || scheduledInstructor.email || "",
      isInstructor: true,
    };
    return [synthetic, ...base];
  }, [instructorList, scheduledInstructor]);

  // When modal opens, preselect the scheduled instructor if provided
  useEffect(() => {
    if (isOpen && scheduledKey) {
      // select the scheduled instructor in the dropdown/card by default,
      // but default the "took" toggle to OFF. Admin must explicitly confirm.
      setSelectedInstructor(scheduledKey);
      setInstructorTook(false);
    }
  }, [isOpen, scheduledKey]);
  const submitInstructorAttendance = async (instKey) => {
  // Final validation gate: instructor attendance can only be marked
  // on the scheduled day.
  if (!isScheduledSameDay) {
    toast.info(
      "Instructor attendance can only be marked on the scheduled day"
    );
    return;
  }

  setInstructorSubmitting(true);

  try {
      // If an instructor has already been marked for this class, do not allow
      // marking another instructor. This is a defensive UI check; server-side
      // validation is still recommended.
      if (
        instructorTook &&
        selectedInstructor &&
        selectedInstructor !== instKey
      ) {
        toast.info(
          "An instructor has already been marked for this class. Cannot mark another.",
        );
        return;
      }
      // Determine the scheduled class record (prefer full class info from
      // Context.upcomingClasses when available). This ensures fields like
      // zoomLink are preserved when we update the schedule.
      const scheduledClass =
        (upcomingClasses || []).find((c) => c.classId === classId) || null;

      // Determine classType and timestamp (prefer scheduledClass, then
      // scheduledInstructor prop). Use the class timestamp in milliseconds
      // for classTaken, and set `date` to epoch seconds (ms / 1000).
      const classType =
        scheduledClass?.classType ||
        scheduledInstructor?.classType ||
        scheduledInstructor?.className ||
        "";
      const ms = toMs(
        scheduledClass?.date || scheduledInstructor?.date || null,
      );
      const dateSeconds = Math.floor(ms / 1000);

      // Build a structured classTaken object (preferred). This makes the
      // backend record rich fields (classId, classType, timestampMs) instead
      // of fragile formatted strings and also allows querying by classId.
      const classTakenObj = {
        classId: classId || null,
        classType: classType || null,
        // include both ms and seconds to be defensive about backend expectations
        timestampMs: ms,
        timestamp: Math.floor(ms / 1000),
      };

      const payload = {
        institution: institutionId,
        cognitoId: instKey || "",
        // send the structured object; backend supports object shape and will
        // also remain compatible with older string-based entries.
        classTaken: classTakenObj,
        // keep the existing `date` (seconds) field for backward compatibility
        date: `${dateSeconds}`,
        // also send ms explicitly so consumers can use whichever they expect
        dateMs: ms,
      };

      // If the admin changed the instructor from the scheduled one,
      // update the schedule record first so the class points to the
      // new instructor. Only after a successful schedule update
      // should we call update-instructor-attendance.
      const didChangeInstructor =
        scheduledKey && instKey && instKey !== scheduledKey;
      if (didChangeInstructor) {
        try {
          // Resolve instructor display name if present in merged list
          const instObj =
            mergedInstructorList && mergedInstructorList.find
              ? mergedInstructorList.find((i) => getInstKey(i) === instKey)
              : null;
          const instName =
            instObj?.userName ||
            instObj?.name ||
            instObj?.instructorNames ||
            instKey ||
            "";

          // Prepare a full edit-schedule payload (match CreateEditClassModal)
          // so the schedule record is fully consistent after changing instructor.
          const instEmail =
            instObj?.emailId ||
            instObj?.email ||
            scheduledInstructor?.emailId ||
            "";
          const classTypeVal =
            scheduledClass?.classType ||
            scheduledInstructor?.classType ||
            scheduledInstructor?.className ||
            "";
          const dateMs =
            ms ||
            (scheduledClass?.date
              ? Number(scheduledClass.date)
              : scheduledInstructor?.date
                ? Number(scheduledInstructor.date)
                : Date.now());
          const durationVal =
            scheduledClass?.duration || scheduledInstructor?.duration || 60;
          const zoomVal =
            scheduledClass?.zoomLink ||
            scheduledClass?.zoom ||
            scheduledInstructor?.zoomLink ||
            scheduledInstructor?.zoom ||
            "";

          const editPayload = {
            classId: classId,
            classType: classTypeVal,
            startTimeEst: dateMs,
            instructorEmailId: instEmail,
            duration: durationVal,
            instructorId: instKey,
            instructorNames: instName,
            classDescription:
              scheduledClass?.classDescription ||
              scheduledInstructor?.classDescription ||
              "",
            zoomLink: zoomVal,
            date: dateMs,
          };

          console.log(
            "submitInstructorAttendance - updating schedule first with:",
            editPayload,
          );
          await updateScheduleInstructor(institutionId, editPayload);
          toast.success("Schedule updated with new instructor");
        } catch (editErr) {
          console.error(
            "Failed to update schedule before marking instructor attendance:",
            editErr,
          );
          const editErrMsg =
            editErr?.message ||
            JSON.stringify(editErr) ||
            "Failed to update schedule";
          toast.error(`Could not change scheduled instructor: ${editErrMsg}`);
          // Do not proceed to mark instructor attendance if schedule update failed
          return;
        }
      }

      // Log payload for debugging before the attendance request (include readable dates)
      console.log("submitInstructorAttendance - payload:", payload);
      console.log("submitInstructorAttendance - payload (readable):", {
        ...payload,
        readableDate: new Date(ms).toString(),
        readableTimestamp: new Date(classTakenObj.timestampMs).toString(),
      });
      const apiRes = await markInstructorAttendance(payload);
      // Log API response for debugging
      console.log("submitInstructorAttendance - apiRes:", apiRes);
      console.log(
        "submitInstructorAttendance - apiRes (check attendance fields):",
        {
          attendance: apiRes?.attendance || apiRes?.result || apiRes,
        },
      );
      toast.success("Instructor attendance submitted");
      setInstructorTook(true);
      // Notify parent (if provided) so it can update class state/UI (e.g. ClassTable)
      try {
        const instObj =
          mergedInstructorList && mergedInstructorList.find
            ? mergedInstructorList.find((i) => getInstKey(i) === instKey)
            : null;
        const instName =
          instObj?.userName ||
          instObj?.name ||
          instObj?.instructorNames ||
          instKey ||
          "";
        if (typeof onInstructorMarked === "function") {
          onInstructorMarked({
            classId,
            instructorId: instKey,
            instructorName: instName,
          });
        }
      } catch (notifyErr) {
        // non-fatal - just log
        console.warn("onInstructorMarked handler errored:", notifyErr);
      }
    } catch (err) {
      console.error("submitInstructorAttendance - error:", err);
      // Show more explicit error to help debugging (falls back to generic message)
      const errMsg =
        err?.message ||
        (err && JSON.stringify(err)) ||
        "Failed to submit instructor attendance";
      toast.error(`Failed to submit instructor attendance: ${errMsg}`);
      setInstructorTook(false);
    } finally {
      setInstructorSubmitting(false);
    }
  };

  // Removed unused handleInstructorSubmit function — instructor attendance is
  // submitted via the checkbox toggle which calls submitInstructorAttendance.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 attendance-modal-root">
      <div className="bg-white rounded-lg p-6 w-[600px] max-w-[95%] max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* inline styles for hiding and customizing scrollbars inside the modal */}
        <style>{`
          .attendance-modal-root .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .attendance-modal-root .hide-scrollbar::-webkit-scrollbar { display: none; }

          .attendance-modal-root .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
          .attendance-modal-root .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .attendance-modal-root .custom-scroll::-webkit-scrollbar-thumb { background: ${InstitutionData.PrimaryColor}; border-radius: 9999px; }
          .attendance-modal-root .custom-scroll { scrollbar-width: thin; scrollbar-color: ${InstitutionData.PrimaryColor} transparent; }
        `}</style>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Mark Attendance</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={attendanceSearchTerm}
            onChange={(e) => setAttendanceSearchTerm(e.target.value)}
          />
        </div>

        {isAdminUser && (
          <div className="instructor-block mb-6">
            <div className="mb-4 p-3 bg-white rounded-md border">
              <h4 className="text-sm font-medium mb-2">Instructor</h4>
              {loading ? (
                // show skeleton placeholder for the entire instructor area while loading
                <div className="space-y-3">
                  <div className="mb-3">
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-48" />
                      </div>
                      <div className="h-6 w-12 bg-gray-200 rounded" />
                    </div>
                  </div>
                  {/** small placeholder for instructor list / metadata */}
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              ) : (
                <>
                  {/* Dropdown to pick an instructor quickly - moved to top */}
                  <div className="mb-3">
                    <label className="block text-sm mb-1">
                      Choose instructor
                    </label>
                    <select
                      value={selectedInstructor}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Simply update the selected instructor and default the "took" toggle to OFF.
                        setSelectedInstructor(val);
                        setInstructorTook(false);
                      }}
                      // Only disable while actively submitting; other validations show a toast when clicked
                      disabled={instructorSubmitting}
                      onMouseDown={(e) => {
                        // Intercept attempts to open the dropdown and show a toast instead
                        if (instructorSubmitting) {
                          toast.info("Please wait — updating...");
                          e.preventDefault();
                          return;
                        }
                        if (instructorTook) {
                          toast.info(
                            "An instructor has already been marked for this class.",
                          );
                          e.preventDefault();
                          return;
                        }
                      }}
                      className="w-full p-2 border rounded">
                      <option value="">-- Select instructor --</option>
                      {mergedInstructorList.map((inst) => {
                        const instKey = getInstKey(inst);
                        // primary label prefers name fields; avoid showing email as primary
                        const primary =
                          inst.userName ||
                          inst.name ||
                          inst.instructorNames ||
                          inst.displayName ||
                          instKey;
                        return (
                          <option key={instKey || primary} value={instKey}>
                            {primary +
                              (instKey === scheduledKey ? " (scheduled)" : "")}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Single instructor card reflects the currently selected instructor (from dropdown). */}
                  {selectedInstructor
                    ? (() => {
                        const displayedInst =
                          mergedInstructorList.find(
                            (i) => getInstKey(i) === selectedInstructor,
                          ) || null;
                        const label = displayedInst
                          ? displayedInst.userName ||
                            displayedInst.name ||
                            displayedInst.instructorNames ||
                            displayedInst.displayName ||
                            selectedInstructor
                          : scheduledInstructor?.userName ||
                            scheduledInstructor?.name ||
                            selectedInstructor;
                        const email = displayedInst
                          ? displayedInst.emailId ||
                            displayedInst.email ||
                            displayedInst.cognitoId ||
                            displayedInst.instructorId ||
                            ""
                          : scheduledInstructor?.emailId ||
                            scheduledInstructor?.email ||
                            "";
                        const isSelected = instructorTook; // toggle represents whether instructor has taken the class
                        return (
                          <div key={"single-inst"} className="mb-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                              <div>
                                <p className="font-medium">{label}</p>
                                <p className="text-sm text-gray-600">{email}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={isSelected}
                                  onClick={(e) => {
                                    // Intercept clicks to show toast when marking is not allowed.
                                    if (instructorSubmitting) {
                                      toast.info("Please wait — updating...");
                                      e.preventDefault();
                                      return;
                                    }
                                    if (instructorTook && isSelected) {
                                      // already marked — inform the user
                                      toast.info(
                                        "An instructor has already been marked for this class.",
                                      );
                                      e.preventDefault();
                                      return;
                                    }
                                  }}
                                  onChange={async () => {
                                    // Only allow turning ON. Once marked as "took" the checkbox
                                    // becomes effectively final (disabled) to avoid accidental undo.
                                    if (!isSelected) {
                                      const confirmed = window.confirm(
                                        `Mark ${label} as the instructor who took the class?`,
                                      );
                                      if (!confirmed) return;
                                      // ensure selectedInstructor is the inst we're submitting
                                      // (it should already be set when admin chose from dropdown)
                                      await submitInstructorAttendance(
                                        selectedInstructor,
                                      );
                                    }
                                  }}
                                  // only disable while actively submitting
                                  disabled={instructorSubmitting}
                                />
                                <div
                                  className={`w-11 h-6 rounded-full peer
                ${isSelected ? "bg-blue-500" : "bg-gray-200"}
                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px]
                after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
                after:transition-all`}></div>
                              </label>
                            </div>
                          </div>
                        );
                      })()
                    : null}

                  {/* Instructors are selectable via the dropdown only. */}
                  {mergedInstructorList.length === 0 && (
                    <div className="py-2">
                      {/* Skeleton placeholder for missing instructors */}
                      <div className="h-4 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                    </div>
                  )}
                  {/* The standalone 'Submit Instructor Attendance' button has been removed; attendance is submitted when toggling ON. */}
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          /* Skeleton placeholders while attendance data is loading */
          <div className="space-y-4">
            {isAdminUser && (
              <div className="p-3 bg-white rounded-md border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-40" />
                    <div className="h-3 bg-gray-200 rounded w-48" />
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
              </div>
            )}

            {/* User list skeleton rows */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scroll">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-40" />
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto custom-scroll">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No users found</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.cognitoId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-gray-600">{user.emailId}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    {toggling[user.cognitoId] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedUsers[user.cognitoId] || false}
                        onChange={() =>
                          handleToggleAttendance(user.cognitoId, user.emailId)
                        }
                        disabled={selectedUsers[user.cognitoId] || false}
                        title={
                          selectedUsers[user.cognitoId] ? "Already marked" : ""
                        }
                      />
                    )}
                    {!toggling[user.cognitoId] && (
                      <div
                        className={`w-11 h-6 rounded-full peer
                ${selectedUsers[user.cognitoId] ? "bg-blue-500" : "bg-gray-200"}
                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px]
                after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
                after:transition-all`}></div>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button color="gray" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
