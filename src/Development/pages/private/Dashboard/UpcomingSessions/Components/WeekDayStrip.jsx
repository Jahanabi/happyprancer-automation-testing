import React, { useMemo } from "react";
import { Grid, Text } from "@radix-ui/themes";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WeekDayStrip = ({
                          selectedDate,
                          onSelectDate,
                          primaryColor = "#2D5A27",
                      }) => {
    const days = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            return date;
        });
    }, []);

    const sameDay = (a, b) => a.toDateString() === b.toDateString();

    return (
        <Grid columns={{ initial: "4", sm: "7" }} gap="3">
            {days.map((day) => {
                const isToday = sameDay(day, new Date());
                const isSelected = sameDay(day, selectedDate);

                return (
                    <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => onSelectDate(day)}
                        style={{
                            minHeight: 76,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            padding: "8px 4px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? primaryColor : "var(--us-border, #E3ECE9)"}`,
                            background: isSelected ? primaryColor : "#FFFFFF",
                            cursor: "pointer",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            boxShadow: isSelected
                                ? "0 5px 16px rgba(45, 90, 39, 0.2)"
                                : "0 2px 6px rgba(45, 90, 39, 0.06)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                        }}>
                        <Text
                            size="1"
                            weight="bold"
                            style={{
                                color: isSelected ? "white" : primaryColor,
                                opacity: isToday ? 1 : 0,
                                height: 12,
                                lineHeight: "12px",
                            }}>
                            Today
                        </Text>

                        <Text
                            size="1"
                            weight="medium"
                            style={{
                                color: isSelected ? "white" : "var(--us-muted, #66807D)",
                            }}>
                            {DAY_LABELS[day.getDay()]}
                        </Text>

                        <Text
                            size="5"
                            weight="bold"
                            style={{
                                color: isSelected ? "white" : "var(--us-ink, #2D5A27)",
                            }}>
                            {day.getDate()}
                        </Text>
                    </button>
                );
            })}
        </Grid>
    );
};

export default WeekDayStrip;
