import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  IconButton,
  Dialog,
  Table,
  Badge,
} from "@radix-ui/themes";
import { ChevronLeft, ChevronRight } from "lucide-react";

import DashboardHero from "./DashboardHero";
import WeekDayStrip from "./WeekDayStrip";
import ClassPhotoCard from "./ClassPhotoCard";
import CompactClassCard from "./CompactClassCard";
import DashboardStatsStrip from "./DashboardStatsStrip";
import NoticesList from "./NoticesList";
import Streak from "../Streak";
import { parseClassDate, isSameCalendarDay } from "../../../../../utils/helpers";

const CARD_WIDTH = 400;

const formatClassDate = (epochMs) => {
  if (!epochMs) return "—";
  const d = parseClassDate(epochMs);
  if (!d) return "—";
  try {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatClassTime = (epochMs) => {
  if (!epochMs) return "—";
  const d = parseClassDate(epochMs);
  if (!d) return "—";
  try {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const TodayDashboard = ({
  classes = [],
  getInstructor,
  markAttendance,
  handleAttendanceClick,
  firstName,
  primaryColor = "#216B66",
  stats,
  userType,
  handleClassAction,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const [viewAllClassesOpen, setViewAllClassesOpen] = useState(false);

  const scrollerRef = useRef(null);

  const classesForSelectedDay = useMemo(() => {
    return classes.filter((item) => {
      return isSameCalendarDay(item.date, selectedDate);
    });
  }, [classes, selectedDate]);

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // The "next" class only makes sense for today's list — classes[] arrives
  // pre-sorted ascending by date from UpcomingSessions, so the first item
  // in today's filtered list is the next one coming up. Only that one card
  // shows the live/countdown badge and gates its Join button; every other
  // class stays plain and always-clickable.
  const nextClassId =
    isToday && classesForSelectedDay.length > 0
      ? classesForSelectedDay[0].classId
      : null;

  const showActions = userType === "admin" || userType === "instructor";

  const scrollByAmount = (direction) => {
    scrollerRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + 16),
      behavior: "smooth",
    });
  };

  // classes[] is already sorted ascending by date (see comment above), so
  // it can be handed to the table as-is.
  const getClassName = (clas) =>
    clas.className || clas.title || clas.name || "Class";
  const getInstructorLabel = (clas) => {
    const instructor = clas.instructor || getInstructor?.(clas.instructorNames);
    if (!instructor) return "—";
    return typeof instructor === "string"
      ? instructor
      : instructor.name || instructor.fullName || "—";
  };

  return (
    <Box
      p={{ initial: "4", md: "6" }}
      style={{ maxWidth: 1800, margin: "0 auto" }}>
      {/* HERO */}
      <DashboardHero firstName={firstName} primaryColor={primaryColor} />

      {/* DAYS */}
      <WeekDayStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        primaryColor={primaryColor}
      />

      {/* MAIN LAYOUT — classes+stats on the left, notices on the right (lg+) */}
      <Grid columns={{ initial: "1", lg: "3" }} gap="5" mt="5">
        {/* LEFT COLUMN */}
        <Box style={{ gridColumn: "span 2" }}>
          {/* CLASSES */}
          <Box mb="5" data-tour="classes">
            <Flex align="center" justify="between" mb="3">
              <Text size="5" weight="bold" style={{ color: "var(--gray-12)" }}>
                {isToday ? "Today's Classes" : "Classes"}
              </Text>
              <Text
                size="2"
                weight="bold"
                onClick={() => setViewAllClassesOpen(true)}
                style={{ color: "var(--accent-9)", cursor: "pointer" }}>
                View all →
              </Text>
            </Flex>

            {classesForSelectedDay.length === 0 ? (
              <Flex
                align="center"
                justify="center"
                style={{
                  minHeight: 100,
                  border: "1px dashed var(--gray-a6)",
                  borderRadius: 14,
                  background: "var(--gray-a2)",
                }}>
                <Text size="2" color="gray">
                  No classes scheduled for this day.
                </Text>
              </Flex>
            ) : (
              <>
                {/* DESKTOP — horizontal scroll-snap row */}
                <Box
                  display={{ initial: "none", sm: "block" }}
                  style={{ position: "relative" }}>
                  <style>{`
                    .classes-scroller::-webkit-scrollbar { display: none; }
                    .classes-scroller { scrollbar-width: none; -ms-overflow-style: none; }
                  `}</style>

                  <Flex
                    ref={scrollerRef}
                    gap="4"
                    className="classes-scroller"
                    style={{
                      overflowX: "auto",
                      scrollSnapType: "x mandatory",
                      paddingBottom: 4,
                    }}>
                    {classesForSelectedDay.map((clas) => (
                      <Box
                        key={clas.classId}
                        style={{
                          flex: `0 0 ${CARD_WIDTH}px`,
                          maxWidth: CARD_WIDTH,
                          scrollSnapAlign: "start",
                        }}>
                        <ClassPhotoCard
                          clas={clas}
                          instructor={
                            clas.instructor ||
                            getInstructor?.(clas.instructorNames)
                          }
                          userType={userType}
                          markAttendance={markAttendance}
                          handleAttendanceClick={handleAttendanceClick}
                          primaryColor={primaryColor}
                          isNextClass={clas.classId === nextClassId}
                          showActions={showActions}
                          handleClassAction={handleClassAction}
                        />
                      </Box>
                    ))}
                  </Flex>

                  {/* Nav arrows — only worth showing once there's enough to scroll */}
                  {classesForSelectedDay.length > 2 && (
                    <>
                      <IconButton
                        variant="surface"
                        radius="full"
                        size="2"
                        onClick={() => scrollByAmount(-1)}
                        aria-label="Scroll left"
                        style={{
                          position: "absolute",
                          left: -16,
                          top: "40%",
                          transform: "translateY(-50%)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",
                        }}>
                        <ChevronLeft size={16} />
                      </IconButton>
                      <IconButton
                        variant="surface"
                        radius="full"
                        size="2"
                        onClick={() => scrollByAmount(1)}
                        aria-label="Scroll right"
                        style={{
                          position: "absolute",
                          right: -16,
                          top: "40%",
                          transform: "translateY(-50%)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",
                        }}>
                        <ChevronRight size={16} />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* MOBILE (sm breakpoint) — vertical list */}
                <Box display={{ initial: "block", sm: "none" }}>
                  <Flex direction="column" gap="3">
                    {classesForSelectedDay.map((clas) => (
                      <CompactClassCard
                        key={clas.classId}
                        clas={clas}
                        instructor={
                          clas.instructor ||
                          getInstructor?.(clas.instructorNames)
                        }
                        userType={userType}
                        markAttendance={markAttendance}
                        handleAttendanceClick={handleAttendanceClick}
                        primaryColor={primaryColor}
                        isNextClass={clas.classId === nextClassId}
                        showActions={showActions}
                        handleClassAction={handleClassAction}
                      />
                    ))}
                  </Flex>
                </Box>
              </>
            )}
          </Box>

          {/* STATS */}
          <DashboardStatsStrip stats={stats} primaryColor={primaryColor} />
          {/*<Streak />*/}
        </Box>

        {/* RIGHT COLUMN — notices */}
        <Box>
          <NoticesList userType={userType} />
        </Box>
      </Grid>

      {/* VIEW ALL CLASSES — table modal, reuses the same `classes` prop */}
      <Dialog.Root
        open={viewAllClassesOpen}
        onOpenChange={setViewAllClassesOpen}>
        <Dialog.Content style={{ maxWidth: 720 }}>
          <Dialog.Title>All Classes</Dialog.Title>
          <Box style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {classes.length === 0 ? (
              <Flex align="center" justify="center" p="5">
                <Text size="2" color="gray">
                  No classes scheduled.
                </Text>
              </Flex>
            ) : (
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Class</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Instructor</Table.ColumnHeaderCell>
                    {isToday && (
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    )}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {classes.map((clas) => (
                    <Table.Row key={clas.classId}>
                      <Table.Cell>{formatClassDate(clas.date)}</Table.Cell>
                      <Table.Cell>{formatClassTime(clas.date)}</Table.Cell>
                      <Table.Cell>{getClassName(clas)}</Table.Cell>
                      <Table.Cell>{getInstructorLabel(clas)}</Table.Cell>
                      {isToday && (
                        <Table.Cell>
                          {clas.classId === nextClassId ? (
                            <Badge color="green">Next up</Badge>
                          ) : (
                            "—"
                          )}
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
          <Flex justify="end" mt="4">
            <Dialog.Close>
              <Text
                size="2"
                weight="bold"
                style={{ color: "var(--accent-9)", cursor: "pointer" }}>
                Close
              </Text>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default TodayDashboard;
