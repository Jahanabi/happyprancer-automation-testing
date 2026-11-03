/**
 * Grace Period Utility Functions for Member Subscriptions
 *
 * Business Rules:
 * 1. When a Razorpay payment fails, the member remains ACTIVE until their contractual
 *    plan end date (renewDate).
 * 2. Grace Period begins ONLY AFTER the renewDate has expired (the next calendar day).
 * 3. Total Grace Period duration is strictly 7 calendar days.
 * 4. Grace Period end date = renewDate + 7 calendar days.
 *    For example: Renew Date = 25/09/2026 -> Grace Period End Date = 02/10/2026.
 * 5. All day and date calculations are calendar-based (not 24h millisecond blocks)
 *    to avoid timezone and time-of-day discrepancies.
 * 6. Date formatting is consistently DD/MM/YYYY.
 */

export const resolveEpochMs = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Formats epoch timestamp strictly as DD/MM/YYYY.
 */
export const formatDateString = (epochMs) => {
  const ms = resolveEpochMs(epochMs);
  if (!ms) return "N/A";
  const date = new Date(ms);
  if (isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Computes authoritative grace period calculations for display across dashboard UI.
 *
 * @param {Object} user - User record containing renewDate, status, payment info, etc.
 * @param {Date|number|string} [currentDate=new Date()] - Reference date (defaults to now).
 * @returns {Object} Comprehensive grace period metadata and indicators.
 */
export const getMemberGracePeriodInfo = (user, currentDate = new Date()) => {
  const TOTAL_GRACE_DAYS = 7;

  if (!user) {
    return {
      isGracePeriod: false,
      isExpired: false,
      elapsedDays: 0,
      currentGraceDay: 0,
      totalGraceDays: TOTAL_GRACE_DAYS,
      remainingDays: 0,
      remainingGraceDays: 0,
      progressText: `0/${TOTAL_GRACE_DAYS}`,
      renewDateMs: null,
      gracePeriodEndMs: null,
      formattedRenewDate: "N/A",
      formattedGraceEndDate: "N/A",
      rawPaymentStatus: "",
    };
  }

  const renewDateMs = resolveEpochMs(user.renewDate);

  // Normalize renewDate to start of calendar day in local time
  let renewCalendar = null;
  if (renewDateMs) {
    const rDate = new Date(renewDateMs);
    renewCalendar = new Date(
      rDate.getFullYear(),
      rDate.getMonth(),
      rDate.getDate(),
    );
  }

  // Normalize current date to start of calendar day in local time
  const todayDate =
    currentDate instanceof Date ? currentDate : new Date(currentDate);
  const todayCalendar = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate(),
  );

  // Grace Period End Date = renewDate + 7 calendar days
  let gracePeriodEndMs = null;
  let formattedGraceEndDate = "N/A";
  if (renewCalendar) {
    const endCalendar = new Date(
      renewCalendar.getFullYear(),
      renewCalendar.getMonth(),
      renewCalendar.getDate() + TOTAL_GRACE_DAYS,
    );
    gracePeriodEndMs = endCalendar.getTime();
    formattedGraceEndDate = formatDateString(gracePeriodEndMs);
  } else if (user.gracePeriodEndDate) {
    gracePeriodEndMs = resolveEpochMs(user.gracePeriodEndDate);
    formattedGraceEndDate = formatDateString(gracePeriodEndMs);
  }

  const rawPaymentStatus = (
    user?.payment?.paymentStatus ||
    user?.paymentStatus ||
    ""
  )
    .toString()
    .toLowerCase();

  const isFailedOrUnpaid =
    rawPaymentStatus === "failed" ||
    rawPaymentStatus === "unpaid" ||
    rawPaymentStatus === "unpaid_grace";

  const isNormalizedActive = (user.status || "").toLowerCase() === "active";
  const isStatusGrace = (user.status || "").toLowerCase() === "graceperiod";
  const isStatusInactive = (user.status || "").toLowerCase() === "inactive";
  const isExplicitGrace =
    user.isGracePeriod !== undefined && user.isGracePeriod !== null
      ? Boolean(user.isGracePeriod)
      : false;

  // Calendar difference in days between today and renewDate
  // 0 on renewDate, 1 on renewDate + 1 day, 2 on renewDate + 2 days, etc.
  let diffCalendarDays = 0;
  if (renewCalendar) {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    diffCalendarDays = Math.round(
      (todayCalendar.getTime() - renewCalendar.getTime()) / ONE_DAY_MS,
    );
  }

  const isGraceCandidate =
    isExplicitGrace ||
    isStatusGrace ||
    (isNormalizedActive && isFailedOrUnpaid) ||
    isFailedOrUnpaid;

  let isGracePeriod = false;
  let isExpired = false;
  let elapsedDays = 0;
  let remainingDays = 0;

  if (!renewCalendar) {
    // If renewDate is unavailable, rely on explicit status flags
    isGracePeriod = isGraceCandidate && !isStatusInactive;
    elapsedDays = 0;
    remainingDays = TOTAL_GRACE_DAYS;
  } else if (diffCalendarDays <= 0) {
    // Case 3: Renewal date has not expired yet. Grace period starts ONLY after renewDate.
    isGracePeriod = false;
    isExpired = false;
    elapsedDays = 0;
    remainingDays = TOTAL_GRACE_DAYS;
  } else if (diffCalendarDays <= TOTAL_GRACE_DAYS) {
    // Within 7-day grace period
    isGracePeriod = isGraceCandidate && !isStatusInactive;
    elapsedDays = diffCalendarDays;
    remainingDays = Math.max(0, TOTAL_GRACE_DAYS - elapsedDays);
    isExpired = false;
  } else {
    // Case 5: Today is after Grace Period End Date (expired)
    isGracePeriod = false;
    isExpired = isGraceCandidate && !isStatusInactive;
    elapsedDays = TOTAL_GRACE_DAYS;
    remainingDays = 0;
  }

  const progressText = `${elapsedDays}/${TOTAL_GRACE_DAYS}`;

  let effectiveStatus = user.status || "";
  if (isGracePeriod) {
    effectiveStatus = "GracePeriod";
  } else if (isExpired) {
    effectiveStatus = "Inactive";
  }

  return {
    isGracePeriod,
    isExpired,
    effectiveStatus,
    elapsedDays,
    currentGraceDay: elapsedDays,
    totalGraceDays: TOTAL_GRACE_DAYS,
    remainingDays,
    remainingGraceDays: remainingDays,
    progressText,
    renewDateMs,
    gracePeriodEndMs,
    formattedRenewDate: formatDateString(renewDateMs),
    formattedGraceEndDate,
    rawPaymentStatus,
  };
};
