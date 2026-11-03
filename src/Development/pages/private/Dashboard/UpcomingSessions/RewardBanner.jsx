import React from "react";
import { Flex, Text, Button, Box } from "@radix-ui/themes";
import { Star, Gift } from "lucide-react";

/**
 * RewardsBanner — Radix version of the (currently commented-out) reward
 * strip at the bottom of UpcomingSessions.js. Only rendered for members.
 */
const RewardsBanner = ({
  primaryColor = "#215A55",
  lightestPrimaryColor = "#E6F2F0",
  onViewRewards,
}) => (
  <Box
    style={{
      marginTop: "1.5rem",
      borderRadius: 16,
      border: "1px solid var(--gray-a5)",
      background: `linear-gradient(120deg, ${lightestPrimaryColor} 0%, var(--color-panel) 85%)`,
      padding: "1.1rem 1.4rem",
    }}>
    <Flex align="center" justify="between" gap="4" wrap="wrap">
      <Flex align="center" gap="3">
        <Flex
          align="center"
          justify="center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "var(--color-panel)",
            border: "1px solid var(--gray-a5)",
          }}>
          <Gift size={20} color={primaryColor} />
        </Flex>
        <Flex direction="column">
          <Text size="3" weight="bold" style={{ color: "var(--gray-12)" }}>
            Consistency builds magic! 🎯
          </Text>
          <Text size="2" color="gray">
            Attend regularly, earn rewards &amp; stay happy!
          </Text>
        </Flex>
      </Flex>

      <Button
        variant="outline"
        size="2"
        radius="full"
        style={{
          borderColor: primaryColor,
          color: primaryColor,
          cursor: "pointer",
        }}
        onClick={onViewRewards}>
        <Star size={15} /> View Rewards
      </Button>
    </Flex>
  </Box>
);

export default RewardsBanner;
