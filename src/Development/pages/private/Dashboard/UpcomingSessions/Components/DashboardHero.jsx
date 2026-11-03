import React from "react";
import { Box, Flex, Text } from "@radix-ui/themes";

const getPeriod = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
};

const GREETING_LABELS = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
};

// Card background shifts subtly with the time of day — still light/airy at
// every stage so the dark-teal headline stays readable, but evening leans
// a touch cooler/dusk-toned instead of the warm morning mint.
const CARD_BACKGROUND = {
    morning: "linear-gradient(180deg, #FFFFFF 0%, #FBFDF9 55%, #F5FAEF 100%)",
    afternoon: "linear-gradient(180deg, #FFFFFF 0%, #F7FBFD 55%, #EAF6FB 100%)",
    evening: "linear-gradient(180deg, #F5F6FA 0%, #EEF0F8 55%, #E6E8F5 100%)",
};

/**
 * Sun/moon celestial body — swaps rendering by time of day.
 *  - morning:   warm sunrise, lower in the sky
 *  - afternoon: bright high sun
 *  - evening:   pale moon with a crescent shadow + a few scattered stars
 */
const Celestial = ({ period }) => {
    if (period === "evening") {
        return (
            <Box style={{ position: "absolute", right: 60, top: -10, width: 130, height: 130 }}>
                {/* soft glow */}
                <Box
                    style={{
                        position: "absolute",
                        inset: -20,
                        borderRadius: "50%",
                        background: "rgba(199, 210, 224, 0.35)",
                        filter: "blur(16px)",
                    }}
                />
                <svg viewBox="0 0 130 130" width="130" height="130">
                    <defs>
                        <radialGradient id="moonGradient" cx="35%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#F4F6FA" />
                            <stop offset="100%" stopColor="#C7D2E0" />
                        </radialGradient>
                        {/* crescent cutout */}
                        <mask id="moonMask">
                            <rect width="130" height="130" fill="white" />
                            <circle cx="78" cy="52" r="42" fill="black" />
                        </mask>
                    </defs>
                    <circle cx="65" cy="65" r="46" fill="url(#moonGradient)" mask="url(#moonMask)" />
                    {/* stars scattered around the moon */}
                    <circle cx="15" cy="20" r="2" fill="#D7DEEC" />
                    <circle cx="30" cy="95" r="1.6" fill="#D7DEEC" />
                    <circle cx="8" cy="70" r="1.4" fill="#D7DEEC" />
                    <circle cx="105" cy="100" r="1.8" fill="#D7DEEC" />
                    <circle cx="118" cy="60" r="1.4" fill="#D7DEEC" />
                </svg>
            </Box>
        );
    }

    if (period === "afternoon") {
        // High, bright sun — near the top edge, larger/whiter core.
        return (
            <Box style={{ position: "absolute", right: 55, top: -35, width: 160, height: 160 }}>
                <Box
                    style={{
                        position: "absolute",
                        inset: -28,
                        borderRadius: "50%",
                        background: "rgba(255, 214, 92, 0.28)",
                        filter: "blur(20px)",
                    }}
                />
                <svg viewBox="0 0 160 160" width="160" height="160">
                    <defs>
                        <radialGradient id="sunGradientNoon" cx="40%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#FFF7DD" />
                            <stop offset="100%" stopColor="#FCD34D" />
                        </radialGradient>
                    </defs>
                    <circle cx="80" cy="80" r="58" fill="url(#sunGradientNoon)" />
                </svg>
            </Box>
        );
    }

    // morning — lower in the sky, warm sunrise tones
    return (
        <Box style={{ position: "absolute", right: 60, top: 10, width: 140, height: 140 }}>
            <Box
                style={{
                    position: "absolute",
                    inset: -24,
                    borderRadius: "50%",
                    background: "rgba(246, 196, 69, 0.24)",
                    filter: "blur(18px)",
                }}
            />
            <svg viewBox="0 0 140 140" width="140" height="140">
                <defs>
                    <radialGradient id="sunGradientMorning" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#FFE29A" />
                        <stop offset="100%" stopColor="#F6C445" />
                    </radialGradient>
                </defs>
                <circle cx="70" cy="70" r="50" fill="url(#sunGradientMorning)" />
            </svg>
        </Box>
    );
};

/**
 * Decorative scenery layer — celestial body (top-right, time-aware), a
 * small leaf cluster tucked behind it, a branch-with-leaves anchored
 * bottom-left, and a soft hill wash along the bottom edge. Pure SVG/CSS so
 * no external image assets are required. If you already have illustrated
 * PNG/SVG assets for these (the old component referenced
 * /images/dashboard-hero.svg), swap the <svg> blocks below for <img> tags
 * at the same position/size values — everything here is positioned with
 * plain left/right/top/bottom so it's a drop-in swap.
 */
const HeroScenery = ({ period }) => (
    <Box
        aria-hidden
        style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
        }}>
        <Celestial period={period} />

        {/* LEAF CLUSTER — tucked behind/left of the celestial body */}
        <Box style={{ position: "absolute", right: 140, top: 10, width: 70, height: 70 }}>
            <svg viewBox="0 0 70 70" width="70" height="70">
                <ellipse cx="20" cy="35" rx="16" ry="9" fill="#7FA66B" transform="rotate(-25 20 35)" />
                <ellipse cx="40" cy="20" rx="13" ry="7" fill="#B7D6A0" transform="rotate(15 40 20)" />
                <ellipse cx="45" cy="45" rx="14" ry="8" fill="#4F7A4F" transform="rotate(45 45 45)" />
            </svg>
        </Box>

        {/* BRANCH + LEAVES — bottom-left corner */}
        <Box style={{ position: "absolute", left: -10, bottom: -10, width: 150, height: 150 }}>
            <svg viewBox="0 0 150 150" width="150" height="150">
                <path
                    d="M10 150 C 20 110, 15 90, 45 60 C 60 45, 70 40, 85 20"
                    stroke="#7FA66B"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
                <ellipse cx="30" cy="120" rx="18" ry="10" fill="#4F7A4F" transform="rotate(-40 30 120)" />
                <ellipse cx="48" cy="90" rx="16" ry="9" fill="#7FA66B" transform="rotate(-20 48 90)" />
                <ellipse cx="60" cy="60" rx="15" ry="8" fill="#B7D6A0" transform="rotate(10 60 60)" />
                <ellipse cx="78" cy="35" rx="13" ry="7" fill="#7FA66B" transform="rotate(35 78 35)" />
                <ellipse cx="88" cy="18" rx="11" ry="6" fill="#4F7A4F" transform="rotate(55 88 18)" />
            </svg>
        </Box>

        {/* HILL WASH — soft tint along the bottom edge */}
        <Box style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 50 }}>
            <svg viewBox="0 0 800 50" width="100%" height="50" preserveAspectRatio="none">
                <path
                    d="M0 30 C 150 5, 300 45, 450 20 C 600 -5, 700 35, 800 15 L 800 50 L 0 50 Z"
                    fill="rgba(215, 236, 194, 0.55)"
                />
            </svg>
        </Box>
    </Box>
);

/**
 * DashboardHero
 *
 * @param {string} firstName  shown as "{greeting}, {firstName}!"
 * @param {string} subtitle   defaults to "Ready for today's classes?"
 */
const DashboardHero = ({
                           firstName = "there",
                           subtitle = "Ready for today's classes?",
                       }) => {
    const period = getPeriod();
    const greeting = GREETING_LABELS[period];

    return (
        <Box
            style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 22,
                border: "1px solid var(--gray-a5)",
                background: CARD_BACKGROUND[period],
                padding: "2rem 2.25rem",
                marginBottom: "1.75rem",
                minHeight: 150,
            }}>
            <HeroScenery period={period} />

            <Flex direction="column" gap="1" style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
                <Text
                    as="div"
                    size="8"
                    weight="bold"
                    style={{ color: "#083F3B", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                    {greeting}, {firstName}!
                </Text>
                <Text as="div" size="4" style={{ color: "#66807D" }}>
                    {subtitle}
                </Text>
            </Flex>
        </Box>
    );
};

export default DashboardHero;