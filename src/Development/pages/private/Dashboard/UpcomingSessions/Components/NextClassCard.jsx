import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Text, Flex, Box } from "@radix-ui/themes";
import { Radio, Video, Clock } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * NextClassCard — a dedicated "what's next" widget, separate from the day
 * timeline so it can live in a sidebar and always reflect the single
 * soonest class regardless of which page of days is currently showing.
 *
 * Pass the FULL unpaginated class list here (not the current page's slice),
 * otherwise "next class" could point at something that's not on screen yet
 * skip something that already scrolled off page 1.
 */
const NextClassCard = ({ classes, getInstructor, primaryColor }) => {
  const [now, setNow] = useState(() => Date.now());

  // Tick every second — this is the one place a fast tick is worth it,
  // since a live HH:MM:SS countdown is the whole point of the widget.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    return (classes || [])
      .filter((c) => {
        const start = Number(c.date);
        const durationMs = (Number(c.duration) || 30) * 60 * 1000;
        return now <= start + durationMs;
      })
      .sort((a, b) => Number(a.date) - Number(b.date))[0];
  }, [classes, now]);

  const accent = primaryColor || "var(--accent-9)";

  if (!next) {
    return (
      <Box
        className="ncw-card"
        style={{
          border: "1px solid var(--gray-a5)",
          borderRadius: 16,
          padding: "1.1rem",
          background: "var(--color-panel)",
        }}>
        <Text
          size="1"
          weight="bold"
          color="gray"
          style={{ letterSpacing: "0.04em" }}>
          NEXT CLASS
        </Text>
        <Text as="div" size="2" color="gray" mt="2">
          Nothing scheduled right now — check back soon.
        </Text>
      </Box>
    );
  }

  const start = Number(next.date);
  const durationMs = (Number(next.duration) || 30) * 60 * 1000;
  const isLive = now >= start && now <= start + durationMs;
  const instructor = getInstructor?.(next.instructorNames);

  return (
    <Box
      className={`ncw-card${isLive ? " ncw-live" : ""}`}
      style={{
        border: "1px solid",
        borderColor: isLive ? "var(--red-8)" : "var(--gray-a5)",
        background: isLive ? "var(--red-2)" : "var(--color-panel)",
        borderRadius: 16,
        padding: "1.1rem",
      }}>
      <style>{`
        .ncw-live { animation: ncw-glow 2s ease-in-out infinite; }
        @keyframes ncw-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(239,68,68,0); }
          50% { box-shadow: 0 0 14px rgba(239,68,68,0.18); }
        }
        .ncw-countdown { font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
      `}</style>

      <Flex align="center" justify="between" mb="2">
        <Text
          size="1"
          weight="bold"
          color="gray"
          style={{ letterSpacing: "0.04em" }}>
          NEXT CLASS
        </Text>
        {isLive && (
          <Badge
            color="red"
            variant="solid"
            radius="full"
            className="mct-pulse">
            <Radio size={11} /> Live now
          </Badge>
        )}
      </Flex>

      <Text as="div" size="4" weight="bold">
        {next.classType} with {next.instructorNames}
      </Text>
      {instructor?.position && (
        <Text as="div" size="1" color="gray" mt="1">
          {instructor.position}
        </Text>
      )}

      {!isLive && (
        <Box mt="3">
          <Flex align="center" gap="1" mb="1">
            <Clock size={12} color="var(--gray-a11)" />
            <Text size="1" color="gray">
              Starts in
            </Text>
          </Flex>
          <Text as="div" size="7" weight="bold" className="ncw-countdown">
            {formatCountdown(start - now)}
          </Text>
        </Box>
      )}

      {next.zoomLink && (
        <Button
          asChild
          size="3"
          mt="4"
          style={{ width: "100%", backgroundColor: accent, cursor: "pointer" }}>
          <a href={next.zoomLink} target="_blank" rel="noreferrer">
            <Video size={15} />
            {isLive ? "Join Live Class" : "Join When Ready"}
          </a>
        </Button>
      )}
    </Box>
  );
};

export default NextClassCard;
