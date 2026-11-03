import React from "react";
import { Card, Flex, Box, Text, Button, IconButton } from "@radix-ui/themes";
import { Video, User, Pencil, ClipboardList } from "lucide-react";
import { useClassStatus } from "../hooks/useClassStatus";
import { parseClassDate } from "../../../../../utils/helpers";

const STATUS_STYLES = {
    live: { bg: "var(--red-a3)", color: "var(--red-11)", label: "LIVE NOW" },
    "starting-soon": { bg: "var(--amber-a3)", color: "var(--amber-11)" },
    upcoming: { bg: "var(--gray-a3)", color: "var(--gray-11)" },
    ended: { bg: "var(--gray-a3)", color: "var(--gray-9)", label: "Ended" },
};

/**
 * @param {boolean} showActions
 *   True for admin/instructor — shows the View Attendance and edit-class
 *   buttons.
 * @param {(classData: object, mode: "edit"|"view") => void} handleClassAction
 *   Opens ClassModal for this class (UpcomingSessions.js's handleClassAction).
 */
const CompactClassCard = ({
                              clas,
                              instructor,
                              userType,
                              markAttendance,
                              handleAttendanceClick,
                              primaryColor = "#216B66",
                              showActions = false,
                              handleClassAction,
                          }) => {
    const formatTime = (epoch) => {
        const d = parseClassDate(epoch);
        if (!d) return "—";
        return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const duration = clas.duration || 30;
    const { status, canJoin, countdownLabel } = useClassStatus(
        clas.date,
        duration,
    );

    // FIX: this used to only gate/badge the single "next" class of the day
    // (isNextClass) and leave every other card always-clickable regardless
    // of its own start time. Each class now gates independently.
    const showGate = Boolean(clas.zoomLink) && status !== "ended";
    const statusStyle = STATUS_STYLES[status];
    const statusLabel =
        status === "live" || status === "ended"
            ? statusStyle.label
            : `Starts in ${countdownLabel}`;

    // FIX: previously branched on userType and called handleAttendanceClick
    // instead of opening Zoom for admin/instructor — "Join on Zoom" never
    // joined for them. Joining is now the same for everyone; markAttendance
    // stays member-only bookkeeping. Viewing attendance is its own button.
    const handleJoinClick = () => {
        if (clas.zoomLink) {
            window.open(clas.zoomLink, "_blank", "noreferrer");
        }
        if (userType === "member") {
            markAttendance?.(clas.classId);
        }
    };

    return (
        <Card size="2" style={{ borderRadius: 12 }}>
            {status === "live" && (
                <style>{`
          @keyframes classLivePulseCompact {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
        `}</style>
            )}

            <Flex direction="column" gap="3">
                <Flex align="center" gap="3">
                    <Flex
                        align="center"
                        justify="center"
                        style={{
                            width: 64,
                            height: 64,
                            flex: "0 0 64px",
                            borderRadius: 10,
                            background: "var(--gray-a3)",
                            overflow: "hidden",
                        }}>
                        {instructor?.image ? (
                            <img
                                src={instructor.image}
                                alt={clas.instructorNames}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <User size={25} color="var(--gray-9)" />
                        )}
                    </Flex>

                    <Box minWidth="0" flexGrow="1">
                        <Flex align="center" justify="between" gap="2">
                            <Text as="div" size="3" weight="bold" style={{ color: "var(--gray-12)" }}>
                                {clas.classType || "Class"}
                            </Text>
                            <Flex align="center" gap="2" flexShrink="0">
                                <Flex
                                    align="center"
                                    gap="1"
                                    style={{
                                        padding: "3px 8px",
                                        borderRadius: 20,
                                        background: statusStyle.bg,
                                        color: statusStyle.color,
                                        fontSize: 9,
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                    }}>
                                    {status === "live" && (
                                        <span
                                            style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: "50%",
                                                background: "var(--red-9)",
                                                display: "inline-block",
                                                animation: "classLivePulseCompact 1.4s ease-in-out infinite",
                                            }}
                                        />
                                    )}
                                    {statusLabel}
                                </Flex>

                                {/* Admin/instructor-only actions */}
                                {showActions && (
                                    <>
                                        <IconButton
                                            variant="ghost"
                                            color="gray"
                                            size="1"
                                            aria-label="View attendance"
                                            onClick={() => handleAttendanceClick?.(clas.classId)}
                                            style={{ cursor: "pointer" }}>
                                            <ClipboardList size={13} />
                                        </IconButton>
                                        <IconButton
                                            variant="ghost"
                                            color="gray"
                                            size="1"
                                            aria-label="Edit class"
                                            onClick={() => handleClassAction?.(clas, "edit")}
                                            style={{ cursor: "pointer" }}>
                                            <Pencil size={13} />
                                        </IconButton>
                                    </>
                                )}
                            </Flex>
                        </Flex>
                        <Text as="div" size="1" color="gray">
                            {formatTime(clas.date)}
                        </Text>
                        <Text as="div" size="1" color="gray">
                            {clas.instructorNames}
                        </Text>
                    </Box>
                </Flex>

                {clas.zoomLink &&
                    (showGate && !canJoin ? (
                        <Box>
                            <Button
                                size="2"
                                disabled
                                style={{ width: "100%", cursor: "not-allowed", opacity: 0.6 }}>
                                <Video size={13} />
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
                            <Video size={13} />
                            Join on Zoom
                        </Button>
                    ))}
            </Flex>
        </Card>
    );
};

export default CompactClassCard;