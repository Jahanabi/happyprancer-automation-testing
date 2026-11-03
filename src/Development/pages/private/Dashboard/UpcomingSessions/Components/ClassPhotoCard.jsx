import React from "react";
import { Card, Flex, Box, Text, Button, IconButton } from "@radix-ui/themes";
import { Video, User, Pencil, ClipboardList } from "lucide-react";
import { useClassStatus } from "../hooks/useClassStatus";
import { parseClassDate } from "../../../../../utils/helpers";

const CLASS_TYPE_ICON = {
    Yoga: "🧘",
    Zumba: "💃",
    Bollywood: "🎬",
    Bworkz: "🕺",
    BWORKZ: "🕺",
};

const formatZoneTime = (epoch, timeZone) => {
    const d = parseClassDate(epoch);
    if (!d) return "—";
    return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone,
    });
};

const STATUS_STYLES = {
    live: {
        bg: "var(--red-a3)",
        color: "var(--red-11)",
        label: "LIVE NOW",
    },
    "starting-soon": {
        bg: "var(--amber-a3)",
        color: "var(--amber-11)",
    },
    upcoming: {
        bg: "var(--gray-a3)",
        color: "var(--gray-11)",
    },
    ended: {
        bg: "var(--gray-a3)",
        color: "var(--gray-9)",
        label: "Ended",
    },
};

/**
 * ClassPhotoCard
 *
 * Only the NEXT class (isNextClass=true, set by TodayDashboard for the
 * first class of today) shows the live/countdown status badge and gates
 * the "Join on Zoom" button to within 15 min of start / live. Every other
 * card keeps the button always clickable with no badge — matching the
 * original reference design.
 *
 * @param clas
 * @param instructor
 * @param {string} userType  "member" | "admin" | "instructor"
 * @param {(classId: string) => void} markAttendance
 *   Called for members when they click Join — marks them as attended.
 * @param {(classId: string) => void} handleAttendanceClick
 *   Called for admin/instructor via the clipboard icon — opens the
 *   attendance list for that class (e.g. UpcomingSessions' showMembersAttended).
 *   No longer tied to the Join button — see fix note below.
 * @param primaryColor
 * @param {boolean} showActions
 *   True for admin/instructor — shows the edit-class pencil button and the
 *   View Attendance clipboard button.
 * @param {(classData: object, mode: "edit"|"view") => void} handleClassAction
 *   Opens ClassModal for this class (UpcomingSessions.js's handleClassAction).
 */
const ClassPhotoCard = ({
                            clas,
                            instructor,
                            userType,
                            markAttendance,
                            handleAttendanceClick,
                            primaryColor = "#216B66",
                            showActions = false,
                            handleClassAction,
                        }) => {
    const icon = CLASS_TYPE_ICON[clas.classType] || "✨";

    const etTime = formatZoneTime(clas.date, "America/New_York");
    const istTime = formatZoneTime(clas.date, "Asia/Kolkata");
    const duration = clas.duration || 30;

    const { status, canJoin, countdownLabel } = useClassStatus(
        clas.date,
        duration,
    );

    // FIX: this used to only gate/badge the single "next" class of the day
    // (isNextClass) and leave every other card always-clickable regardless
    // of its own start time. Each class now gates independently — Zumba at
    // 11am shouldn't be joinable at 8am just because Yoga is the next one.
    const showGate = Boolean(clas.zoomLink) && status !== "ended";
    const statusStyle = STATUS_STYLES[status];
    const statusLabel =
        status === "live" || status === "ended"
            ? statusStyle.label
            : `Starts in ${countdownLabel}`;

    // FIX: this used to branch on userType and call handleAttendanceClick
    // instead of opening Zoom for admin/instructor, so "Join on Zoom" never
    // actually joined for them. Joining the call is the same action for
    // everyone now; only the post-join bookkeeping (markAttendance) is
    // member-specific. Viewing attendance is its own separate button below.
    const handleJoinClick = () => {
        if (clas.zoomLink) {
            window.open(clas.zoomLink, "_blank", "noreferrer");
        }
        if (userType === "member") {
            markAttendance?.(clas.classId);
        }
    };

    return (
        <Card size="2" style={{ borderRadius: 15, overflow: "hidden", padding: 0, height: "100%" }}>
            {status === "live" && (
                <style>{`
          @keyframes classLivePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
        `}</style>
            )}

            <Flex height="100%">
                {/* IMAGE */}
                <Box
                    position="relative"
                    style={{
                        flex: "0 0 42%",
                        minHeight: 220,
                        background: "var(--gray-a3)",
                    }}>
                    <Flex align="center" justify="center" height="100%">
                        {instructor?.image ? (
                            <img
                                src={instructor.image}
                                alt={clas.instructorNames || "Instructor"}
                                className="h-full"
                                style={{ width: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <User size={42} color="var(--gray-9)" />
                        )}
                    </Flex>

                    <Flex
                        align="center"
                        justify="center"
                        style={{
                            position: "absolute",
                            left: 13,
                            top: 13,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            fontSize: 17,
                        }}>
                        {icon}
                    </Flex>

                    {/* STATUS BADGE — every card now shows its own */}
                    <Flex
                        align="center"
                        gap="1"
                        style={{
                            position: "absolute",
                            right: 10,
                            top: 10,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            whiteSpace: "nowrap",
                        }}>
                        {status === "live" && (
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "var(--red-9)",
                                    display: "inline-block",
                                    animation: "classLivePulse 1.4s ease-in-out infinite",
                                }}
                            />
                        )}
                        {statusLabel}
                    </Flex>
                </Box>

                {/* CONTENT */}
                <Flex direction="column" p="4" flexGrow="1" gap="2" minWidth="0">
                    <Flex align="center" justify="between" gap="2">
                        <Text size="4" weight="bold" style={{ color: "var(--gray-12)" }}>
                            {clas.classType || "Class"}
                        </Text>

                        {/* Admin/instructor-only actions: view attendance + edit */}
                        {showActions && (
                            <Flex align="center" gap="1" flexShrink="0">
                                <IconButton
                                    variant="ghost"
                                    color="gray"
                                    size="1"
                                    aria-label="View attendance"
                                    onClick={() => handleAttendanceClick?.(clas.classId)}
                                    style={{ cursor: "pointer" }}>
                                    <ClipboardList size={14} />
                                </IconButton>
                                <IconButton
                                    variant="ghost"
                                    color="gray"
                                    size="1"
                                    aria-label="Edit class"
                                    onClick={() => handleClassAction?.(clas, "edit")}
                                    style={{ cursor: "pointer" }}>
                                    <Pencil size={14} />
                                </IconButton>
                            </Flex>
                        )}
                    </Flex>

                    <Flex direction="column" gap="1">
                        <Text size="1" color="gray">
                            ◷ {etTime} ET • {istTime} IST
                        </Text>
                    </Flex>

                    <Flex align="center" gap="2" mt="1">
                        <User size={14} color="var(--gray-10)" />
                        <Text size="1" color="gray">
                            {clas.instructorNames || "Instructor"}
                        </Text>
                    </Flex>

                    <Box flexGrow="1" />

                    {clas.zoomLink ? (
                        showGate && !canJoin ? (
                            <Box>
                                <Button
                                    size="2"
                                    disabled
                                    style={{ width: "100%", cursor: "not-allowed", opacity: 0.6 }}>
                                    <Video size={14} />
                                    Join on Zoom
                                </Button>
                                <Text as="div" size="1" color="gray" mt="1" align="center">
                                    Opens 15 min before start
                                </Text>
                            </Box>
                        ) : (
                            <Button
                                size="2"
                                onClick={handleJoinClick}
                                style={{
                                    width: "100%",
                                    backgroundColor: primaryColor,
                                    cursor: "pointer",
                                }}>
                                <Video size={14} />
                                Join on Zoom
                            </Button>
                        )
                    ) : (
                        <Text size="1" color="gray">
                            Link posted soon
                        </Text>
                    )}
                </Flex>
            </Flex>
        </Card>
    );
};

export default ClassPhotoCard;