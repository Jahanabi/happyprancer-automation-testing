import React from "react";
import {
    Table,
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
  Video,
  HeartHandshake,
  Dumbbell,
  Music4,
  Sparkles,
} from "lucide-react";

// ---- class-type personality -------------------------------------------------
// Each class type gets an icon + a Radix accent color, so the badge carries
// meaning (what kind of class this is) instead of decorating for its own sake.
const CLASS_TYPE_META = {
  Yoga: {
    icon: <HeartHandshake size={18} />,
    tag: "Stretch, breathe & find your calm",
    color: "iris",
  },
  Zumba: {
    icon: <Music4 size={18} />,
    tag: "High-energy dance, all levels welcome",
    color: "crimson",
  },
  Bollywood: {
    icon: <Sparkles size={18} />,
    tag: "Bollywood-style dance fitness",
    color: "pink",
  },
  Bworkz: {
    icon: <Dumbbell size={18} />,
    tag: "High-energy dance fitness",
    color: "orange",
  },
  BWORKZ: {
    icon: <Dumbbell size={18} />,
    tag: "High-energy dance fitness",
    color: "orange",
  },
};
const FALLBACK_META = { icon: "✨", color: "gray" };

const formatClassDate = (epoch) => {
    const d = new Date(Number(epoch));
    return {
        month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
        day: d.getDate(),
        weekday: d.toLocaleString("en-US", { weekday: "short" }),
        time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
};

const getInitials = (name = "?") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

/**
 * DateStub — the signature element of this redesign.
 * Modeled after a torn class-pass stub: a stamped month/day block with a
 * perforated edge, evoking "you're booked in" rather than a plain calendar
 * icon. Built with plain markup (Radix has no ticket primitive) but themed
 * entirely off the institution's primary color.
 */
const DateStub = ({ month, day, weekday, primaryColor }) => (
    <Box
        style={{
            position: "relative",
            width: 58,
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid var(--gray-a5)",
            background: "var(--color-panel)",
            flexShrink: 0,
        }}
    >
        <Box
            style={{
                background: primaryColor,
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textAlign: "center",
                padding: "3px 0",
            }}
        >
            {month}
        </Box>
        <Box style={{ textAlign: "center", padding: "4px 0 2px" }}>
            <Text as="div" size="5" weight="bold" style={{ lineHeight: 1 }}>
                {day}
            </Text>
            <Text as="div" size="1" color="gray" mt="1">
                {weekday}
            </Text>
        </Box>
        {/* perforation */}
        <Box
            style={{
                position: "absolute",
                left: -4,
                right: -4,
                bottom: 18,
                borderTop: "1px dashed var(--gray-a6)",
            }}
        />
    </Box>
);

const InstructorCell = ({ name, instructor }) => (
    <Flex align="center" gap="2" minWidth="0">
        <Avatar
            src={instructor?.image}
            fallback={getInitials(name)}
            radius="full"
            size="3"
        />
        <Box minWidth="0">
            <Text as="div" size="2" weight="bold" truncate>
                {name}
            </Text>
            {instructor?.position && (
                <Badge color="gray" variant="soft" size="1" mt="1">
                    {instructor.position}
                </Badge>
            )}
        </Box>
    </Flex>
);

const ClassBadge = ({ classType, description }) => {
  const meta = CLASS_TYPE_META[classType] || {
    ...FALLBACK_META,
    tag: description || "Live online session",
  };

  const isBworkz = classType?.toLowerCase() === "bworkz";

  return (
    <Flex align="center" gap="3">
      {/* Circular Icon */}
      <Flex
        align="center"
        justify="center"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `var(--${meta.color}-3)`,
          border: `1px solid var(--${meta.color}-7)`,
          color: `var(--${meta.color}-11)`,
          flexShrink: 0,
        }}>
        {isBworkz ? (
          <img
            src="/images/bworkz.svg"
            alt="BWORKZ"
            style={{
              width: 18,
              height: 18,
            }}
          />
        ) : (
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
        )}
      </Flex>

      {/* Text */}
      <Flex direction="column" gap="1">
        <Badge
          color={meta.color}
          variant="soft"
          radius="full"
          size="2"
          style={{
            width: "fit-content",
            fontWeight: 500,
          }}>
          {classType || "Session"}
        </Badge>

        <Text size="1" color="gray">
          {meta.tag}
        </Text>
      </Flex>
    </Flex>
  );
};

const RowActions = ({ clas, userCountryCode, handleClassAction, showActionColumn, primaryColor }) => (
    <Flex align="center" gap="3" wrap="wrap">
        {clas.zoomLink ? (
            <Button asChild size="2" style={{ backgroundColor: primaryColor, cursor: "pointer" }}>
                <a href={clas.zoomLink} target="_blank" rel="noreferrer">
                    <Video size={14} /> Join
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
                        onClick={() => handleClassAction(clas, "view")}
                    >
                        <Eye size={15} />
                    </IconButton>
                </Tooltip>
                <Tooltip content="Edit class">
                    <IconButton
                        variant="soft"
                        color="gray"
                        size="2"
                        onClick={() => handleClassAction(clas, "edit")}
                    >
                        <Pencil size={15} />
                    </IconButton>
                </Tooltip>
            </Flex>
        )}
    </Flex>
);

/**
 * ModifiedClassTable — Radix UI Themes rebuild.
 * Same prop contract as before (drop-in for UpcomingSessions.jsx):
 * classes, getInstructor, userType, primaryColor, lightestPrimaryColor,
 * userCountryCode, handleClassAction.
 *
 * Desktop: a Radix Table with a signature "ticket stub" date cell.
 * Mobile (<720px): rows fold into stacked cards — the table head hides and
 * each Table.Row becomes a bordered card via CSS, so no separate mobile
 * component tree is needed.
 */
const ModifiedClassTable = ({
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
                }}
            >
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
        .mct-scope .mct-table { border-radius: 16px; overflow: hidden; }
        .mct-scope .rt-TableRoot { --table-row-background: transparent; }
        .mct-scope .rt-TableRow:hover .rt-TableCell { background: var(--gray-a2); }

        @media (max-width: 720px) {
          .mct-scope .rt-TableHeader { display: none; }
          .mct-scope .rt-TableRow {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
            border: 1px solid var(--gray-a5);
            border-radius: 16px;
            padding: 1rem;
            margin-bottom: 0.85rem;
            background: var(--color-panel);
          }
          .mct-scope .rt-TableRow:hover .rt-TableCell { background: transparent; }
          .mct-scope .rt-TableCell {
            display: flex;
            width: 100%;
            padding: 0 !important;
            border-top: none !important;
          }
          .mct-scope .rt-TableCell:nth-child(3) { border-top: 1px dashed var(--gray-a5) !important; padding-top: 0.6rem !important; }
          .mct-scope .rt-TableCell:nth-child(4) { border-top: 1px dashed var(--gray-a5) !important; padding-top: 0.6rem !important; }
          .mct-scope .rt-TableCell:last-child { border-top: 1px solid var(--gray-a5) !important; padding-top: 0.65rem !important; }
        }
      `}</style>

            <Table.Root variant="surface" className="mct-table">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell width="70px">Date</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Instructor</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Class</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{showActionColumn ? "Join / Manage" : "Join"}</Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {classes.map((clas) => {
                        const { month, day, weekday, time } = formatClassDate(clas.date);
                        const instructor = getInstructor(clas.instructorNames);

                        return (
                            <Table.Row key={clas.classId} align="center">
                                <Table.Cell>
                                    <DateStub month={month} day={day} weekday={weekday} primaryColor={accent} />
                                </Table.Cell>

                                <Table.Cell>
                                    <InstructorCell name={clas.instructorNames} instructor={instructor} />
                                </Table.Cell>

                                <Table.Cell>
                                    <ClassBadge classType={clas.classType} description={clas.classDescription} />
                                </Table.Cell>

                                <Table.Cell>
                                    <Text as="div" size="2" weight="medium">
                                        {time}
                                    </Text>
                                </Table.Cell>

                                <Table.Cell>
                                    <RowActions
                                        clas={clas}
                                        userCountryCode={userCountryCode}
                                        handleClassAction={handleClassAction}
                                        showActionColumn={showActionColumn}
                                        primaryColor={accent}
                                    />
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table.Root>
        </Box>
    );
};

export default ModifiedClassTable;