/**
 * Revenue Service Utilities for HappyPrancer (HP289)
 *
 * Implements strict currency isolation, payment status checks,
 * refund segregation, subscription deduplication, and amount conversions.
 */

/**
 * Normalizes payment currency to uppercase trimmed string.
 * Supports passing a payment object or a raw currency string.
 * Missing, empty, or UNKNOWN values are strictly returned as 'UNKNOWN'.
 * Never defaults or falls back to INR.
 */
export function getNormalizedCurrency(paymentOrCurrency) {
  if (!paymentOrCurrency) return "UNKNOWN";

  if (typeof paymentOrCurrency === "string") {
    const c = paymentOrCurrency.toUpperCase().trim();
    if (c === "₹" || c === "RS" || c === "INR") return "INR";
    if (c === "$" || c === "USD") return "USD";
    if (c.length > 0 && c !== "UNKNOWN") return c;
    return "UNKNOWN";
  }

  if (typeof paymentOrCurrency === "object") {
    const raw =
      paymentOrCurrency.currency ||
      paymentOrCurrency.currencyCode ||
      paymentOrCurrency.currency_code ||
      "";
    return getNormalizedCurrency(raw);
  }

  return "UNKNOWN";
}

/**
 * Normalizes payment mode to 'offline' or 'online'.
 * Supports passing a payment object or a raw mode string.
 */
export function getNormalizedPaymentMode(paymentOrMode) {
  if (!paymentOrMode) return "offline";

  let raw = "";
  if (typeof paymentOrMode === "string") {
    raw = paymentOrMode;
  } else if (typeof paymentOrMode === "object") {
    raw =
      paymentOrMode.paymentMode ||
      paymentOrMode.mode ||
      paymentOrMode.payment_method ||
      paymentOrMode.provider ||
      "";
  }

  const mode = String(raw).toLowerCase().trim();
  if (
    mode === "razorpay" ||
    mode.includes("razorpay") ||
    mode === "stripe" ||
    mode === "upi" ||
    mode === "card" ||
    mode === "netbanking" ||
    mode === "online"
  ) {
    return "online";
  }

  return "offline";
}

/**
 * Checks whether a payment is confirmed refunded (full refund).
 */
export function isPaymentRefunded(payment) {
  if (!payment || typeof payment !== "object") return false;
  if (payment.isRefunded === true || payment.refunded === true) return true;

  const statusLower = String(payment.status || "").toLowerCase().trim();
  const subStatusLower = String(
    payment.subscriptionStatus?.status || ""
  ).toLowerCase().trim();
  const refundStatusLower = String(payment.refundStatus || "").toLowerCase().trim();

  return (
    refundStatusLower === "refunded" ||
    refundStatusLower === "full" ||
    statusLower === "refunded" ||
    subStatusLower === "refunded" ||
    Boolean(payment.refundId)
  );
}

/**
 * Checks whether a payment is verified as a successful completed collection.
 * Pending, unverified, halted, or failed payments return false.
 */
export function isPaymentVerified(payment) {
  if (!payment || typeof payment !== "object") return false;
  const status = String(payment.status || "").toLowerCase().trim();

  // Explicitly unverified / pending / failed collections
  if (
    status === "pending_collection" ||
    status === "failed" ||
    status === "unverified" ||
    status === "halted" ||
    status === "pending" ||
    status === "created" ||
    status === "authorized"
  ) {
    return false;
  }
  if (payment.paid_count === 0) {
    return false;
  }
  if (payment.isVerified === false || payment.isVerified === "false") {
    return false;
  }
  if (payment.verified === false || payment.verified === "false") {
    return false;
  }
  if (
    payment.isVerified === true ||
    payment.isVerified === "true" ||
    payment.verified === true ||
    payment.verified === "true"
  ) {
    return true;
  }
  if (
    status === "completed" ||
    status === "captured" ||
    status === "paid" ||
    status === "successful" ||
    status === "transferred"
  ) {
    return true;
  }
  return false;
}

/**
 * Deduplicates subscription container records ('sub_...') when individual
 * payment records ('pay_...') already represent the transaction.
 * Also deduplicates identical paymentId records.
 */
export function deduplicateSubscriptionPayments(payments = []) {
  if (!Array.isArray(payments)) return [];

  const confirmedSubscriptionIds = new Set();
  for (const p of payments) {
    if (p && p.paymentId && String(p.paymentId).startsWith("pay_")) {
      if (p.subscriptionId) confirmedSubscriptionIds.add(String(p.subscriptionId).trim());
      if (p.orderId && String(p.orderId).startsWith("sub_")) confirmedSubscriptionIds.add(String(p.orderId).trim());
    }
  }

  const seenPaymentIds = new Set();
  const deduplicated = [];

  for (const p of payments) {
    if (!p) continue;
    const pid = String(p.paymentId || "").trim();

    // Skip duplicate paymentId
    if (pid && seenPaymentIds.has(pid)) continue;

    // Skip sub_... container record if individual payment pay_... already recorded this subscription collection
    if (pid && pid.startsWith("sub_") && confirmedSubscriptionIds.has(pid)) {
      continue;
    }

    if (pid) seenPaymentIds.add(pid);
    deduplicated.push(p);
  }

  return deduplicated;
}

/**
 * Aggregates revenue statistics strictly grouped by currency and payment mode.
 * Segregates offline payments, INR online, and USD online.
 * Excludes unverified/pending and (for net revenue) refunded payments.
 * Does not combine INR with USD or UNKNOWN currencies.
 */
export function calculateRevenueStats(payments = [], optionsOrCurrency = {}) {
  const options =
    typeof optionsOrCurrency === "string"
      ? { currency: optionsOrCurrency, isNet: true }
      : optionsOrCurrency || {};

  const { isNet = true, currency: targetCurrency = null } = options;

  if (!Array.isArray(payments) || payments.length === 0) {
    return {
      totalOnline: 0,
      totalOffline: 0,
      netRevenue: 0,
      grossRevenue: 0,
      totalCount: 0,
      inr: { total: 0, count: 0, amounts: [] },
      usd: { total: 0, count: 0, amounts: [] },
      offline: { total: 0, count: 0, amounts: [] },
      unknown: { total: 0, count: 0, amounts: [] },
    };
  }

  // Deduplicate subscription container records first
  const cleanPayments = deduplicateSubscriptionPayments(payments);

  const inrStats = { total: 0, count: 0, amounts: [] };
  const usdStats = { total: 0, count: 0, amounts: [] };
  const offlineStats = { total: 0, count: 0, amounts: [] };
  const unknownStats = { total: 0, count: 0, amounts: [] };

  let totalOnline = 0;
  let totalOffline = 0;
  let netRevenue = 0;
  let grossRevenue = 0;
  let totalCount = 0;

  const normalizedTargetCurrency = targetCurrency ? getNormalizedCurrency(targetCurrency) : null;

  for (const payment of cleanPayments) {
    if (!payment) continue;
    const amount = Number(payment.amount) || 0;
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const mode = getNormalizedPaymentMode(payment);
    const paymentCurr = getNormalizedCurrency(payment);
    const verified = isPaymentVerified(payment);
    const refunded = isPaymentRefunded(payment);

    // Grouping by currency buckets (for verified payments)
    if (verified) {
      if (mode === "offline") {
        offlineStats.total += amount;
        offlineStats.count += 1;
        offlineStats.amounts.push(amount);
      } else if (paymentCurr === "INR") {
        inrStats.total += amount;
        inrStats.count += 1;
        inrStats.amounts.push(amount);
      } else if (paymentCurr === "USD") {
        usdStats.total += amount;
        usdStats.count += 1;
        usdStats.amounts.push(amount);
      } else {
        unknownStats.total += amount;
        unknownStats.count += 1;
        unknownStats.amounts.push(amount);
      }
    }

    // Top-level aggregates for target currency (or overall if no target currency)
    const matchesCurrency = !normalizedTargetCurrency || paymentCurr === normalizedTargetCurrency;

    if (matchesCurrency) {
      if (verified || refunded) {
        grossRevenue += amount;
      }
      if (verified && !refunded) {
        netRevenue += amount;
        totalCount += 1;
        if (mode === "offline") {
          totalOffline += amount;
        } else {
          totalOnline += amount;
        }
      }
    }
  }

  return {
    totalOnline,
    totalOffline,
    netRevenue,
    grossRevenue,
    totalCount,
    inr: inrStats,
    usd: usdStats,
    offline: offlineStats,
    unknown: unknownStats,
  };
}

/**
 * Formats an amount with the correct currency symbol.
 * Does not convert UNKNOWN or missing currency into INR.
 */
export function formatCurrencyAmount(rawAmount, currency, options = {}) {
  const {
    subunit = false,
    minimumFractionDigits,
    maximumFractionDigits,
    dateLocale = undefined,
  } = options;

  const num = subunit ? (Number(rawAmount) || 0) / 100 : Number(rawAmount) || 0;
  const c = getNormalizedCurrency(currency);

  const minFrac =
    minimumFractionDigits !== undefined
      ? minimumFractionDigits
      : num % 1 === 0
      ? 0
      : 2;
  const maxFrac =
    maximumFractionDigits !== undefined ? maximumFractionDigits : 2;

  const formattedNum = num.toLocaleString(dateLocale, {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  });

  if (c === "INR") return `₹${formattedNum}`;
  if (c === "USD") return `$${formattedNum}`;
  if (c && c !== "UNKNOWN") return `${formattedNum} ${c}`;
  return `${formattedNum} UNKNOWN`;
}
