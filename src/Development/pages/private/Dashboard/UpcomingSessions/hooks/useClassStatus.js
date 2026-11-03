import { useEffect, useState } from "react";
import { parseClassDate } from "../../../../../utils/helpers";

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

const getStatus = (startEpoch, durationMinutes = 30) => {
    const now = Date.now();
    const startDate = parseClassDate(startEpoch);
    const start = startDate ? startDate.getTime() : Number(startEpoch);
    if (!start || isNaN(start)) {
        return { status: "upcoming", canJoin: false, msToStart: 0 };
    }
    const end = start + durationMinutes * 60 * 1000;

    if (now >= start && now < end) {
        return { status: "live", canJoin: true, msToStart: 0 };
    }

    if (now >= end) {
        return { status: "ended", canJoin: false, msToStart: 0 };
    }

    const msToStart = start - now;

    if (msToStart <= FIFTEEN_MIN_MS) {
        return { status: "starting-soon", canJoin: true, msToStart };
    }

    return { status: "upcoming", canJoin: false, msToStart };
};

const formatCountdown = (ms) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${seconds}s`;
};

/**
 * useClassStatus
 * Ticks every second and reports where a class stands relative to "now":
 *  - "upcoming"      more than 15 min away — join disabled
 *  - "starting-soon" within 15 min of start — join enabled, shows countdown
 *  - "live"          between start and start+duration — join enabled
 *  - "ended"         after start+duration — join disabled
 *
 * @param {number|string} startEpoch  class start time (ms epoch)
 * @param {number} durationMinutes    class length in minutes (default 30)
 */
export const useClassStatus = (startEpoch, durationMinutes = 30) => {
    const [state, setState] = useState(() => getStatus(startEpoch, durationMinutes));

    useEffect(() => {
        setState(getStatus(startEpoch, durationMinutes));

        const interval = setInterval(() => {
            setState(getStatus(startEpoch, durationMinutes));
        }, 1000);

        return () => clearInterval(interval);
    }, [startEpoch, durationMinutes]);

    return {
        ...state,
        countdownLabel: formatCountdown(state.msToStart),
    };
};

export default useClassStatus;