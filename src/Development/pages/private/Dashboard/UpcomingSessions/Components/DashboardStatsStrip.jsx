import React from "react";
import { Grid, Card, Flex, Box, Text } from "@radix-ui/themes";
import { FaFire, FaStar, FaCalendarCheck, FaGem, FaGift } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const DashboardStatsStrip = ({ stats = {}, primaryColor = "#2D5A27" }) => {
  const dailyStreak = stats.dailyStreak ?? 0;
  const allClassStreak = stats.allClassStreak ?? 0;
  const classesAttended = stats.classesAttended ?? 0;
  const zPoints = stats.zPoints ?? 0;
  const nextRewardPoints = stats.nextRewardPoints ?? 2000;
  const navigate = useNavigate();
  const pointsNeeded = Math.max(nextRewardPoints - zPoints, 0);
  const progress =
    nextRewardPoints > 0
      ? Math.min((zPoints / nextRewardPoints) * 100, 100)
      : 0;

  const greenStyle = {
    iconBg: "var(--us-primary-light, #E8F5E9)",
    iconColor: primaryColor,
    valueColor: primaryColor,
  };

  const goldStyle = {
    iconBg: "var(--us-gold-light, #FFF6D9)",
    iconColor: "var(--us-gold, #E2A900)",
    valueColor: "var(--us-gold, #E2A900)",
  };

    const items = [
        {
            icon: <FaFire />,
            value: dailyStreak,
            suffix: "days",
            label: "Daily Streak",
            tourId: "streak",
            ...greenStyle,
        },
        {
            icon: <FaStar />,
            value: allClassStreak,
            suffix: "level",
            label: "Level Streak",
            tourId: "level",
            ...greenStyle,
        },
        {
            icon: <FaCalendarCheck />,
            value: classesAttended,
            suffix: "",
            label: "Classes Attended",
            tourId: "attendance",
            ...greenStyle,
        },
        {
            icon: <FaGem />,
            value: zPoints.toLocaleString(),
            suffix: "",
            label: "Z Points",
            ...goldStyle,
        },
    ];

  return (
    <Grid columns={{ initial: "2", sm: "3" }} gap="3">
      {items.map((item, index) => (
        <Card
          key={index}
          size="2"
          data-tour={item.tourId}
          style={{
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid var(--us-border, #E3ECE9)",
            boxShadow: "0 2px 10px rgba(45, 90, 39, 0.06)",
          }}
        >
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 44,
                height: 44,
                flex: "0 0 44px",
                borderRadius: "50%",
                background: item.iconBg,
                color: item.iconColor,
                fontSize: 18,
              }}
            >
              {item.icon}
            </Flex>

            <Box minWidth="0">
              <Flex align="baseline" gap="1">
                <Text size="5" weight="bold" style={{ color: item.valueColor }}>
                  {item.value}
                </Text>
                {item.suffix && (
                  <Text size="1" style={{ color: "var(--us-muted, #66807D)" }}>
                    {item.suffix}
                  </Text>
                )}
              </Flex>
              <Text
                as="div"
                size="1"
                style={{ color: "var(--us-muted, #66807D)" }}
              >
                {item.label}
              </Text>
            </Box>
          </Flex>
        </Card>
      ))}

      <Card
        size="2"
        onClick={() => navigate("/reward")}
        style={{
          borderRadius: 14,
          gridColumn: "span 2",
          background: "#FFFFFF",
          border: "1px solid var(--us-border, #E3ECE9)",
          boxShadow: "0 2px 10px rgba(45, 90, 39, 0.06)",
          cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(45, 90, 39, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(45, 90, 39, 0.06)";
        }}
      >
        <Flex align="center" gap="3">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 44,
              height: 44,
              flex: "0 0 44px",
              borderRadius: "50%",
              background: "var(--us-gold-light, #FFF6D9)",
              color: "var(--us-gold, #E2A900)",
              fontSize: 18,
            }}
          >
            <FaGift />
          </Flex>

          <Box flexGrow="1" minWidth="0">
            <Text
              as="div"
              size="2"
              weight="bold"
              style={{ color: "var(--us-ink, #2D5A27)" }}
            >
              Next Reward
            </Text>
            <Text
              as="div"
              size="1"
              mb="1"
              style={{ color: "var(--us-muted, #66807D)" }}
            >
              {pointsNeeded.toLocaleString()} points needed
            </Text>

            <Box
              style={{
                width: "100%",
                height: 7,
                borderRadius: 10,
                background: "#E8F5E9",
                overflow: "hidden",
              }}
            >
              <Box
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: primaryColor,
                  borderRadius: "inherit",
                  transition: "width 0.5s ease",
                }}
              />
            </Box>

            <Text
              as="div"
              size="1"
              align="right"
              mt="1"
              style={{ color: "var(--us-muted, #66807D)" }}
            >
              {zPoints.toLocaleString()} / {nextRewardPoints.toLocaleString()}
            </Text>
          </Box>
        </Flex>
      </Card>
    </Grid>
  );
};

export default DashboardStatsStrip;
