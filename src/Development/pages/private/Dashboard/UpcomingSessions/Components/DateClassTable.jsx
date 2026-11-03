import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Tooltip,
  Text,
  Flex,
  Box,
} from "@radix-ui/themes";
import {
  Eye,
  Pencil,
  HeartHandshake,
  Dumbbell,
  Music4,
  Sparkles,
  Radio,
  Flame,
} from "lucide-react";

// ---- class-type personality -------------------------------------------------
const CLASS_TYPE_META = {
  Yoga: {
    icon: <HeartHandshake size={16} />,
    tag: "Stretch, breathe & find your calm",
    color: "iris",
  },
  Zumba: {
    icon: <Music4 size={16} />,
    tag: "High-energy dance, all levels welcome",
    color: "crimson",
  },
  Bollywood: {
    icon: <Sparkles size={16} />,
    tag: "Bollywood-style dance fitness",
    color: "pink",
  },
  Bworkz: {
    icon: <Dumbbell size={16} />,
    tag: "High-energy dance fitness",
    color: "orange",
  },
  BWORKZ: {
    icon: <Dumbbell size={16} />,
    tag: "High-energy dance fitness",
    color: "orange",
  },
};
const FALLBACK_META = { icon: <Sparkles size={16} />, color: "gray" };

// One tint per day-of-week so consecutive day panels read as distinct without
// ever using a strong color — kept to a very light wash (~4% alpha).
const DAY_TINTS = [
  "rgba(239, 68, 68, 0.04)", // Sun  – blush
  "rgba(34, 197, 94, 0.04)", // Mon  – green
  "rgba(59, 130, 246, 0.04)", // Tue  – blue
  "rgba(234, 179, 8, 0.05)", // Wed  – beige/amber
  "rgba(168, 85, 247, 0.04)", // Thu  – violet
  "rgba(20, 184, 166, 0.04)", // Fri  – teal
  "rgba(249, 115, 22, 0.04)", // Sat  – peach
];

const formatClassDate = (epoch) => {
  const d = new Date(Number(epoch));
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    dayKey: d.toDateString(),
    dayOfWeek: d.getDay(),
    isToday: d.toDateString() === new Date().toDateString(),
  };
};

const getInitials = (name = "?") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

// A class is "live" while now falls inside [start, start+duration], "soon"
// when it starts within the next 15 minutes, otherwise "available".
const SOON_WINDOW_MS = 15 * 60 * 1000;
export const getClassStatus = (clas, now) => {
  const start = Number(clas.date);
  const durationMs = (Number(clas.duration) || 30) * 60 * 1000;
  const end = start + durationMs;
  if (now >= start && now <= end) return "live";
  if (start - now > 0 && start - now <= SOON_WINDOW_MS) return "soon";
  return "available";
};

const minutesUntil = (epoch, now) =>
  Math.max(0, Math.round((Number(epoch) - now) / 60000));

/**
 * DateRail — sticky left-hand date marker for a day group.
 * Shows "TODAY" in place of the weekday when the group is today, and a
 * fire-emoji class count instead of a plain number.
 */
const DateRail = ({ month, day, weekday, isToday, primaryColor, count }) => (
  <Box
    style={{
      position: "sticky",
      left: 0,
      width: 72,
      flexShrink: 0,
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid var(--gray-a5)",
      background: "var(--color-panel)",
      zIndex: 1,
    }}>
    <Box
      style={{
        background: primaryColor,
        color: "white",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textAlign: "center",
        padding: "4px 0",
      }}>
      {month}
    </Box>
    <Box style={{ textAlign: "center", padding: "6px 0 4px" }}>
      <Text as="div" size="6" weight="bold" style={{ lineHeight: 1 }}>
        {day}
      </Text>
      <Text
        as="div"
        size="1"
        mt="1"
        weight={isToday ? "bold" : "regular"}
        style={{
          color: isToday ? primaryColor : "var(--gray-a11)",
          letterSpacing: "0.03em",
        }}>
        {isToday ? "TODAY" : weekday}
      </Text>
    </Box>
    <Flex
      align="center"
      justify="center"
      gap="1"
      style={{
        fontSize: 10,
        color: "var(--gray-a11)",
        borderTop: "1px dashed var(--gray-a6)",
        padding: "3px 0",
      }}>
      <Flame size={10} color="var(--orange-9)" />
      {count} class{count === 1 ? "" : "es"}
    </Flex>
  </Box>
);

const STATUS_META = {
  live: { color: "red", label: "Live now", icon: <Radio size={11} /> },
  soon: { color: "amber", label: null, icon: null }, // label built dynamically
  available: { color: "green", label: "Available", icon: null },
};

const StatusBadge = ({ status, minutesLeft }) => {
  const meta = STATUS_META[status];
  const label = status === "soon" ? `Starts in ${minutesLeft} min` : meta.label;

  return (
    <Badge
      color={meta.color}
      variant="solid"
      radius="full"
      className={status === "live" ? "mct-pulse" : undefined}>
      {meta.icon} {label}
    </Badge>
  );
};

/**
 * ClassCard — one class, sized to sit in the horizontal strip.
 */
const ClassCard = ({
  clas,
  instructor,
  time,
  status,
  minutesLeft,
  showActionColumn,
  handleClassAction,
  primaryColor,
}) => {
  const meta = CLASS_TYPE_META[clas.classType] || {
    ...FALLBACK_META,
    tag: clas.classDescription || "Live online session",
  };

  const cardStyle =
    status === "live"
      ? { borderColor: "var(--red-8)", background: "var(--red-2)" }
      : status === "soon"
        ? { borderColor: "var(--amber-8)", background: "var(--amber-2)" }
        : { borderColor: "var(--gray-a5)", background: "var(--color-panel)" };

  const joinLabel =
    status === "live" ? "🎥 Join Live Class →" : "Enter Session →";

  return (
    <Flex
      direction="column"
      gap="3"
      className="mct-card"
      style={{
        position: "relative",
        minWidth: 288,
        maxWidth: 288,
        border: "1px solid",
        borderRadius: 16,
        padding: "1rem",
        flexShrink: 0,
        ...cardStyle,
      }}>
      <Box style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
        <StatusBadge status={status} minutesLeft={minutesLeft} />
      </Box>

      <Flex align="center" gap="3" minWidth="0">
        <Avatar
          src={instructor?.image}
          fallback={getInitials(clas.instructorNames)}
          radius="full"
          size="4"
          className="mct-avatar"
          style={{ flexShrink: 0 }}
        />
        <Box minWidth="0">
          <Text as="div" size="4" weight="bold" truncate>
            {clas.instructorNames}
          </Text>
          {instructor?.position && (
            <Text as="div" size="1" color="gray" truncate>
              {instructor.position}
            </Text>
          )}
        </Box>
      </Flex>

      <Flex align="center" gap="2">
        <Flex
          align="center"
          justify="center"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: `var(--${meta.color}-3)`,
            border: `1px solid var(--${meta.color}-7)`,
            color: `var(--${meta.color}-11)`,
            flexShrink: 0,
          }}>
          {meta.icon}
        </Flex>
        <Box minWidth="0">
          <Badge color={meta.color} variant="soft" radius="full" size="1">
            {clas.classType || "Session"}
          </Badge>
          <Text as="div" size="1" color="gray" mt="1" truncate>
            {meta.tag}
          </Text>
        </Box>
      </Flex>

      <Flex align="baseline" justify="between" mt="1">
        <Text size="3" weight="bold">
          {time}
        </Text>
        <Text size="1" color="gray">
          {30} min
        </Text>
      </Flex>

      <Flex align="center" justify="between" gap="2" mt="1">
        {clas.zoomLink ? (
          <Button
            asChild
            size="2"
            className="mct-join-btn"
            style={{
              backgroundColor: primaryColor,
              cursor: "pointer",
              flex: 1,
            }}>
            <a href={clas.zoomLink} target="_blank" rel="noreferrer">
              {joinLabel}
            </a>
          </Button>
        ) : (
          <Text size="1" color="gray">
            Link posted soon
          </Text>
        )}

        {showActionColumn && (
          <Flex gap="1">
            <Tooltip content="View class">
              <IconButton
                variant="soft"
                color="gray"
                size="2"
                onClick={() => handleClassAction(clas, "view")}>
                <Eye size={15} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Edit class">
              <IconButton
                variant="soft"
                color="gray"
                size="2"
                onClick={() => handleClassAction(clas, "edit")}>
                <Pencil size={15} />
              </IconButton>
            </Tooltip>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

/**
 * DateClassTable — day-timeline of classes.
 * Same prop contract as before (drop-in for UpcomingSessions.jsx):
 * classes, getInstructor, userType, primaryColor, lightestPrimaryColor,
 * userCountryCode, handleClassAction.
 */
const DateClassTable = ({
  classes,
  getInstructor,
  userType,
  primaryColor,
  lightestPrimaryColor,
  userCountryCode,
  handleClassAction,
}) => {
  const showActionColumn = userType !== "member";
  const accent = primaryColor || "var(--accent-9)";

  // Tick every 30s so "starts in Xm" / "live now" stay accurate without a
  // page refresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const dayGroups = useMemo(() => {
    const map = new Map();
    (classes || []).forEach((clas) => {
      const { dayKey } = formatClassDate(clas.date);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(clas);
    });
    return Array.from(map.entries())
      .map(([dayKey, list]) => ({
        dayKey,
        classes: list.sort((a, b) => Number(a.date) - Number(b.date)),
      }))
      .sort((a, b) => Number(a.classes[0].date) - Number(b.classes[0].date));
  }, [classes]);

  if (!classes?.length) {
    return (
      <Flex
        direction="column"
        align="center"
        gap="2"
        py="7"
        style={{
          border: "1px dashed var(--gray-a6)",
          borderRadius: 16,
          background: lightestPrimaryColor || "var(--gray-a2)",
        }}>
        <Sparkles size={22} color={accent} />
        <Text size="2" weight="medium" color="gray">
          No upcoming classes yet
        </Text>
        <Text size="1" color="gray">
          New sessions will show up here as soon as they're scheduled.
        </Text>
      </Flex>
    );
  }

  return (
    <Box data-tour="classes" className="mct-scope">
      <style>{`
        .mct-scope { min-width: 0; }
        .mct-scope .mct-day-row {
          border: 1px solid var(--gray-a5);
          border-radius: 16px;
          padding: 0.9rem;
          min-width: 0;
        }
        .mct-scope .mct-day-row + .mct-day-row { margin-top: 1rem; }

        .mct-scope .mct-slider {
          overflow-x: auto;
          scroll-snap-type: x proximity;
          padding-bottom: 4px;
        }
        .mct-scope .mct-slider::-webkit-scrollbar { height: 6px; }
        .mct-scope .mct-slider::-webkit-scrollbar-thumb {
          background: var(--gray-a6);
          border-radius: 999px;
        }

        .mct-scope .mct-card { scroll-snap-align: start; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .mct-scope .mct-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.10);
        }
        .mct-scope .mct-avatar { transition: transform 0.2s ease; }
        .mct-scope .mct-card:hover .mct-avatar { transform: scale(1.06); }

        .mct-scope .mct-join-btn { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .mct-scope .mct-join-btn:hover {
          transform: translateY(-2px) scale(1.02);
          filter: brightness(0.92);
          box-shadow: 0 6px 14px rgba(0,0,0,0.18);
        }

        .mct-pulse { animation: mct-pulse 1.6s ease-in-out infinite; }
        @keyframes mct-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        @media (max-width: 720px) {
          .mct-scope .mct-day-row {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .mct-scope .mct-day-row > div:first-child {
            position: static;
            width: auto;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.75rem;
            border-radius: 999px;
          }
        }
      `}</style>

      <Flex direction="column">
        {dayGroups.map(({ dayKey, classes: dayClasses }) => {
          const { month, day, weekday, dayOfWeek, isToday } = formatClassDate(
            dayClasses[0].date,
          );
          return (
            <Flex
              key={dayKey}
              className="mct-day-row"
              gap="3"
              align="stretch"
              style={{ background: DAY_TINTS[dayOfWeek] }}>
              <DateRail
                month={month}
                day={day}
                weekday={weekday}
                isToday={isToday}
                primaryColor={accent}
                count={dayClasses.length}
              />
              <Box className="mct-slider" style={{ flex: 1, minWidth: 0 }}>
                <Flex gap="3" wrap="nowrap">
                  {dayClasses.map((clas) => {
                    const { time } = formatClassDate(clas.date);
                    const instructor = getInstructor(clas.instructorNames);
                    const status = getClassStatus(clas, now);
                    const minutesLeft = minutesUntil(clas.date, now);

                    return (
                      <ClassCard
                        key={clas.classId}
                        clas={clas}
                        instructor={instructor}
                        time={time}
                        status={status}
                        minutesLeft={minutesLeft}
                        showActionColumn={showActionColumn}
                        handleClassAction={handleClassAction}
                        primaryColor={accent}
                      />
                    );
                  })}
                </Flex>
              </Box>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
};

export default DateClassTable;
