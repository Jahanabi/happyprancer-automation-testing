import React from "react";
import { Text, Flex, Box } from "@radix-ui/themes";
import { Quote, CalendarHeart, Target } from "lucide-react";

/**
 * ProgressBar — small reusable bar for "X of Y complete" style widgets.
 * Percent is clamped 0-100. Color inherits from the institution's accent by
 * default but can be overridden per widget.
 */
export const ProgressBar = ({ percent, color }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <Box
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        background: "var(--gray-a4)",
        overflow: "hidden",
      }}>
      <Box
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: color || "var(--accent-9)",
          borderRadius: 999,
          transition: "width 0.3s ease",
        }}
      />
    </Box>
  );
};

const WidgetShell = ({ icon, label, children }) => (
  <Box
    style={{
      border: "1px solid var(--gray-a5)",
      borderRadius: 16,
      padding: "1.1rem",
      background: "var(--color-panel)",
    }}>
    <Flex align="center" gap="2" mb="2">
      {icon}
      <Text
        size="1"
        weight="bold"
        color="gray"
        style={{ letterSpacing: "0.04em" }}>
        {label}
      </Text>
    </Flex>
    {children}
  </Box>
);

/**
 * QuoteWidget — static rotating-quote card. Swap `quote`/`author` for a
 * real quote source (API, CMS, rotation list) whenever you have one; this
 * ships with a single fixed quote so the widget isn't empty by default.
 */
export const QuoteWidget = ({
  quote = "Take care of your body. It's the only place you have to live.",
  author = "Jim Rohn",
}) => (
  <WidgetShell
    icon={<Quote size={14} color="var(--gray-a11)" />}
    label="TODAY'S QUOTE">
    <Text as="div" size="2" style={{ fontStyle: "italic", lineHeight: 1.5 }}>
      "{quote}"
    </Text>
    {author && (
      <Text as="div" size="1" color="gray" mt="2">
        — {author}
      </Text>
    )}
  </WidgetShell>
);

/**
 * EventWidget — highlights one upcoming institution event.
 * NOTE: date/title are placeholder props — there's no events data source
 * wired up yet. Pass real values in, or hide this widget until there is one.
 */
export const EventWidget = ({
  title = "International Yoga Day",
  dateLabel = "Aug 12",
  primaryColor,
}) => (
  <WidgetShell
    icon={<CalendarHeart size={14} color="var(--gray-a11)" />}
    label="UPCOMING EVENT">
    <Text as="div" size="3" weight="bold">
      {title}
    </Text>
    <Text
      as="div"
      size="1"
      weight="bold"
      mt="1"
      style={{ color: primaryColor || "var(--accent-9)" }}>
      {dateLabel}
    </Text>
  </WidgetShell>
);

/**
 * ChallengeWidget — weekly attendance-goal progress.
 * NOTE: `completed`/`goal` are placeholder-friendly props, not wired to a
 * real "classes attended this week" figure yet — Ctx.userData.attendance is
 * a lifetime total, not a weekly count, so plug in the right source before
 * shipping this for real; until then it defaults to 0/5.
 */
export const ChallengeWidget = ({ completed = 0, goal = 5, primaryColor }) => {
  const percent = goal > 0 ? (completed / goal) * 100 : 0;
  return (
    <WidgetShell
      icon={<Target size={14} color="var(--gray-a11)" />}
      label="WEEKLY CHALLENGE">
      <Text as="div" size="3" weight="bold" mb="2">
        Complete {goal} classes this week
      </Text>
      <ProgressBar percent={percent} color={primaryColor} />
      <Flex justify="between" mt="2">
        <Text size="1" color="gray">
          {completed} of {goal} done
        </Text>
        <Text
          size="1"
          weight="bold"
          style={{ color: primaryColor || "var(--accent-9)" }}>
          {Math.round(percent)}%
        </Text>
      </Flex>
    </WidgetShell>
  );
};

/**
 * DashboardWidgetStack — convenience wrapper rendering all three widgets
 * stacked, for dropping straight into a sidebar column.
 */
const DashboardWidgetStack = ({
  quote,
  author,
  eventTitle,
  eventDateLabel,
  challengeCompleted,
  challengeGoal,
  primaryColor,
}) => (
  <Flex direction="column" gap="3">
    <QuoteWidget quote={quote} author={author} />
    <EventWidget
      title={eventTitle}
      dateLabel={eventDateLabel}
      primaryColor={primaryColor}
    />
    <ChallengeWidget
      completed={challengeCompleted}
      goal={challengeGoal}
      primaryColor={primaryColor}
    />
  </Flex>
);

export default DashboardWidgetStack;
