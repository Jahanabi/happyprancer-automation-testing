import React, { useState } from "react";
import { getCountry } from "countries-and-timezones";
import { getCountryCodeFromValue } from "./country-mapping";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  React.useEffect(() => {
    const matchQueryList = window.matchMedia(query);
    function handleChange(e) {
      setMatches(e.matches);
    }
    matchQueryList.addEventListener("change", handleChange);

    return () => {
      matchQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

export function htmlToPlainText(html) {
  if (!html) return "";
  // Replace <br> and <br/> with newlines
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  // Replace block-level tags with newlines
  text = text.replace(/<\/(h[1-6]|p|div|li|ul|ol|strong|em|u|b|i)>/gi, "\n");
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Replace multiple newlines with a single newline
  text = text.replace(/\n{2,}/g, "\n");
  return text.trim();
}

export const plainTextToHtml = (text) => {
  return text
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");
};

/**
 * Get timezone from country code
 * @param {string} countryCode - Country code (e.g., "US", "IN", "GB")
 * @returns {string} - Timezone identifier
 */
export function getTimezoneFromCountryCode(countryCode) {
  if (!countryCode) return Intl.DateTimeFormat().resolvedOptions().timeZone;
  const trimmedCode = countryCode.trim();

  if (trimmedCode.includes("/")) return trimmedCode;

  const numericCode = trimmedCode.replace(/^\+/, "");
  const mappedCode = /^\d+$/.test(numericCode)
    ? getCountryCodeFromValue(numericCode)
    : null;
  const normalizedCode = (mappedCode || trimmedCode).toUpperCase();

  if (normalizedCode === "IN") return "Asia/Kolkata";
  if (normalizedCode === "US") return "America/New_York";
  if (normalizedCode === "CA") return "America/Toronto";
  if (normalizedCode === "AE") return "Asia/Dubai";

  const country = getCountry(normalizedCode);
  if (country?.timezones?.length) {
    return country.timezones[0];
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Safely parse any class date representation (epoch ms number, epoch seconds number,
 * numeric string, ISO 8601 string, or Date instance) into a valid Date object.
 * Returns null if invalid or missing, avoiding NaN or 1970 timestamp bugs.
 *
 * @param {number|string|Date} dateVal - Raw date value
 * @returns {Date|null}
 */
export const parseClassDate = (dateVal) => {
  if (dateVal === null || dateVal === undefined || dateVal === "") return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === "number") {
    if (isNaN(dateVal) || dateVal <= 0) return null;
    return new Date(dateVal > 1e11 ? dateVal : dateVal * 1000);
  }
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (isNaN(num) || num <= 0) return null;
      return new Date(num > 1e11 ? num : num * 1000);
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/**
 * Checks whether two date representations fall on the same calendar day.
 *
 * @param {number|string|Date} date1
 * @param {number|string|Date} date2
 * @returns {boolean}
 */
export const isSameCalendarDay = (date1, date2) => {
  const d1 = parseClassDate(date1);
  const d2 = parseClassDate(date2);
  if (!d1 || !d2) return false;
  return d1.toDateString() === d2.toDateString();
};

/**
 * Converts epoch time to time format in user's timezone based on country code
 * @param {number|string|Date} epochTime - The epoch time in milliseconds or ISO string
 * @param {string} countryCode - Country code (e.g., "US", "IN", "GB")
 * @returns {string} - The formatted time string
 */
export function convertEpochToTime(epochTime, countryCode) {
  if (!epochTime) return "";
  const date = parseClassDate(epochTime);
  if (!date) return "";

  // Get timezone based on country code
  const timeZone = countryCode
    ? getTimezoneFromCountryCode(countryCode)
    : Intl.DateTimeFormat().resolvedOptions().timeZone;

  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timeZone,
  };
  return date.toLocaleTimeString("en-US", options);
}

// Generates initials from a name, e.g. "Madan Mohan" -> "MM"
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Picks a consistent background color based on the name
// (so the same name always gets the same color)
const getColorFromName = (name = "") => {
  const colors = [
    "#03413A",
    "#B45309",
    "#7C3AED",
    "#DB2777",
    "#0369A1",
    "#B91C1C",
    "#047857",
    "#4338CA",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Duplicate items for seamless looping
// const items = [...testimonials, ...testimonials, ...testimonials];
// const testimonials = items.filter((_, i) => i % 2 === 0);
// const testimonials = items.filter((_, i) => i % 2 !== 0);

export const InitialsAvatar = ({ name, className }) => {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <div
      className={`flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor: bgColor }}
      aria-label={name}
      title={name}>
      {initials}
    </div>
  );
};

export const productCurrencySymbol = (currency) => {
  switch ((currency || "").toUpperCase()) {
    case "USD":
      return "$";
    case "CAD":
      return "CA$";
    case "INR":
      return "₹";
    default:
      return "₹";
  }
};

/**
 * Calculate user points / zPoints consistently across the application.
 * Authoritative formula:
 * referral_points (or referral_count * 100) + zPoints + rating_points.
 * If totalPoints is explicitly present and greater, totalPoints is respected.
 *
 * @param {object} userData - User profile object from Context or API
 * @returns {number} - Total points
 */
export const calculateUserPoints = (userData) => {
  if (!userData) return 0;
  const referralsCount = Number(userData?.referral_count) || 0;
  const referralPoints =
    userData?.referral_points != null && !isNaN(Number(userData.referral_points))
      ? Number(userData.referral_points)
      : referralsCount * 100;
  const zPoints = Number(userData?.zPoints) || 0;
  const ratingPoints = Number(userData?.rating_points) || 0;
  const calculatedPoints = referralPoints + zPoints + ratingPoints;

  if (
    userData?.totalPoints != null &&
    !isNaN(Number(userData.totalPoints)) &&
    Number(userData.totalPoints) > calculatedPoints
  ) {
    return Number(userData.totalPoints);
  }
  return calculatedPoints;
};

/**
 * Extract timezone information with DST-aware formatting.
 * Uses native Intl.DateTimeFormat (no hardcoded offsets).
 *
 * @param {string} timeZone - IANA timezone identifier (e.g. "America/New_York", "Asia/Kolkata")
 * @param {Date|number} [referenceDate=new Date()] - Reference date for DST detection
 * @returns {object} { timeZone, shortName, offset, longName, formattedLabel }
 */
export function getTimezoneInfo(timeZone, referenceDate = new Date()) {
  const refDate =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  let validTz = timeZone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: validTz });
  } catch (e) {
    validTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }

  let shortName = "";
  let offset = "";
  let longName = validTz;

  try {
    const shortFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: validTz,
      timeZoneName: "short",
    });
    const shortParts = shortFormatter.formatToParts(refDate);
    shortName =
      shortParts.find((p) => p.type === "timeZoneName")?.value || "";

    try {
      const offsetFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: validTz,
        timeZoneName: "shortOffset",
      });
      const offsetParts = offsetFormatter.formatToParts(refDate);
      offset =
        offsetParts.find((p) => p.type === "timeZoneName")?.value || "";
    } catch {
      offset = "";
    }

    const longFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: validTz,
      timeZoneName: "long",
    });
    const longParts = longFormatter.formatToParts(refDate);
    longName =
      longParts.find((p) => p.type === "timeZoneName")?.value || validTz;
  } catch (e) {
    console.error("Error retrieving timezone info:", e);
  }

  // Friendly short label mapping where en-US returns raw GMT offset instead of local acronym
  const friendlyShortMap = {
    "Asia/Kolkata": "IST",
    "Asia/Calcutta": "IST",
    "Europe/London":
      refDate.getMonth() >= 2 && refDate.getMonth() <= 9 ? "BST" : "GMT",
  };

  const effectiveShort =
    friendlyShortMap[validTz] ||
    (shortName.startsWith("GMT") ? null : shortName);

  let formattedLabel = "";
  if (effectiveShort && offset && effectiveShort !== offset) {
    formattedLabel = `${effectiveShort} (${offset})`;
  } else if (effectiveShort) {
    formattedLabel = effectiveShort;
  } else if (offset) {
    formattedLabel = offset;
  } else {
    formattedLabel = shortName || validTz;
  }

  return {
    timeZone: validTz,
    shortName: effectiveShort || shortName,
    offset,
    longName,
    formattedLabel,
  };
}

/**
 * Format date and time parts for an epoch timestamp in an IANA timezone.
 * Handles DST automatically according to timezone rules.
 *
 * @param {number|Date} dateOrTimestamp - Milliseconds epoch or Date
 * @param {string} timeZone - IANA timezone
 * @returns {object} { year, month (0-indexed), day, hour, minute, dayPeriod, timeString, tzShort }
 */
export function formatDatePartsInTimezone(dateOrTimestamp, timeZone) {
  const d =
    dateOrTimestamp instanceof Date
      ? dateOrTimestamp
      : new Date(dateOrTimestamp);

  let validTz = timeZone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: validTz });
  } catch {
    validTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: validTz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  const parts = formatter.formatToParts(d);
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let hour = "12";
  let minute = "00";
  let dayPeriod = "AM";
  let tzShort = "";

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.type === "year") year = parseInt(p.value, 10);
    else if (p.type === "month") month = parseInt(p.value, 10);
    else if (p.type === "day") day = parseInt(p.value, 10);
    else if (p.type === "hour") hour = p.value;
    else if (p.type === "minute") minute = p.value;
    else if (p.type === "dayPeriod") dayPeriod = p.value;
    else if (p.type === "timeZoneName") tzShort = p.value;
  }

  if (validTz === "Asia/Kolkata" || validTz === "Asia/Calcutta") {
    tzShort = "IST";
  } else if (validTz === "Europe/London" && month >= 3 && month <= 10) {
    tzShort = "BST";
  }

  return {
    year,
    month: month - 1, // 0-indexed for Date consistency
    day,
    hour,
    minute,
    dayPeriod,
    timeString: `${hour}:${minute} ${dayPeriod}`,
    tzShort,
  };
}
