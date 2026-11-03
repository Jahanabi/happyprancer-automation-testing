import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

export const getCurrencySymbol = (currency = "") => {
  const upper = String(currency || "").toUpperCase();
  if (upper === "INR") return "₹";
  if (upper === "USD") return "$";
  if (upper === "EUR") return "€";
  if (upper === "GBP") return "£";
  return upper ? `${upper} ` : "";
};

export const formatAmount = (amount, currency = "INR") => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${getCurrencySymbol(currency)}0`;
  }
  const symbol = getCurrencySymbol(currency);
  const num = Number(amount);
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const parsePaymentTimestamp = (rawDate) => {
  if (!rawDate) return null;
  if (typeof rawDate === "number") {
    return rawDate < 1e11 ? rawDate * 1000 : rawDate;
  }
  const num = Number(rawDate);
  if (!isNaN(num) && num > 0) {
    return num < 1e11 ? num * 1000 : num;
  }
  const parsed = new Date(rawDate).getTime();
  return isNaN(parsed) ? null : parsed;
};

export const formatDisplayDateTime = (rawDate) => {
  if (!rawDate) return "N/A";
  try {
    const num = Number(rawDate);
    const date =
      !isNaN(num) && num > 1000000000
        ? new Date(num < 1000000000000 ? num * 1000 : num)
        : new Date(rawDate);
    if (isNaN(date.getTime())) return String(rawDate);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(rawDate);
  }
};

export const formatDisplayDate = formatDisplayDateTime;

/**
 * Maps raw backend rejection messages into user-friendly guidance
 * for refund request submission.
 */
export const getFriendlyRefundErrorMessage = (rawError) => {
  const msg = String(
    rawError?.message || rawError?.error || rawError || ""
  ).toLowerCase();

  // 1. 72-hour window expired
  if (
    msg.includes("72 hour") ||
    msg.includes("refund window expired") ||
    msg.includes("window expired") ||
    msg.includes("hours ago")
  ) {
    return {
      type: "EXPIRED",
      message:
        "Refund period has expired. The 72-hour refund window has passed, so this refund cannot be processed.",
    };
  }

  // 2. Ineligible payment method / offline
  if (
    msg.includes("offline") ||
    msg.includes("manual") ||
    msg.includes("unsupported payment provider") ||
    msg.includes("not eligible") ||
    msg.includes("cannot be refunded through payment gateways")
  ) {
    return {
      type: "INELIGIBLE_MODE",
      message: "This payment is not eligible for an online refund.",
    };
  }

  // 3. Already refunded
  if (
    msg.includes("already been refunded") ||
    msg.includes("already refunded") ||
    msg.includes("already processed")
  ) {
    return {
      type: "ALREADY_REFUNDED",
      message: "This refund request has already been processed.",
    };
  }

  // 4. Currently pending or processing lock
  if (
    msg.includes("pending_approval") ||
    msg.includes("pending approval") ||
    msg.includes("already has a pending")
  ) {
    return {
      type: "PENDING_APPROVAL",
      message: "A refund request for this payment is already pending admin approval.",
    };
  }

  if (msg.includes("currently processing") || msg.includes("in progress")) {
    return {
      type: "PROCESSING",
      message:
        "A refund is currently processing for this payment. Please wait.",
    };
  }

  // 5. Missing gateway transaction/capture ID
  if (
    msg.includes("missing gateway transaction") ||
    msg.includes("missing capture id")
  ) {
    return {
      type: "MISSING_GATEWAY_ID",
      message:
        "Missing gateway transaction/capture ID. Cannot issue online refund.",
    };
  }

  // 6. Generic or gateway failure
  return {
    type: "GATEWAY_ERROR",
    message:
      rawError?.message ||
      rawError?.error ||
      "The refund could not be processed by the payment gateway. Please try again or review the request status.",
  };
};

/**
 * Maps approval/rejection errors into specific user guidance.
 */
export const getApprovalErrorMessage = (err) => {
  const msg = String(err?.message || err?.error || err || "").toLowerCase();
  if (
    err?.status === "EXPIRED" ||
    msg.includes("expired") ||
    msg.includes("72 hour") ||
    msg.includes("window")
  ) {
    return "Refund period has expired. The 72-hour refund window has passed, so this refund cannot be processed.";
  }
  if (
    msg.includes("already processed") ||
    msg.includes("already refunded") ||
    msg.includes("already been processed")
  ) {
    return "This refund request has already been processed.";
  }
  if (
    msg.includes("no longer pending") ||
    msg.includes("not pending") ||
    msg.includes("rejected")
  ) {
    return "This refund request is no longer pending.";
  }
  if (
    msg.includes("gateway") ||
    msg.includes("razorpay") ||
    msg.includes("paypal") ||
    msg.includes("capture") ||
    msg.includes("insufficient")
  ) {
    return "The refund could not be processed by the payment gateway. Please try again or review the request status.";
  }
  return (
    err?.message ||
    err?.error ||
    "An error occurred while processing the refund request."
  );
};

/**
 * Visual badge for Refund Request statuses matching HappyPrancer theme.
 * PENDING_APPROVAL: Yellow/orange
 * PROCESSING: Blue/in-progress
 * REFUNDED: Green/success
 * REJECTED: Red
 * EXPIRED: Gray
 * FAILED: Red/error
 */
export const RefundStatusBadge = ({ status }) => {
  const norm = String(status || "").toUpperCase();

  switch (norm) {
    case "PENDING_APPROVAL":
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Approval
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <FaSpinner className="animate-spin text-blue-500" size={10} />
          Processing
        </span>
      );
    case "REFUNDED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FaCheckCircle size={10} className="text-emerald-600" />
          Refunded
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          <FaTimesCircle size={10} className="text-red-500" />
          Rejected
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <FaClock size={10} className="text-gray-500" />
          Expired
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <FaExclamationTriangle size={10} className="text-rose-500" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          {status || "Unknown"}
        </span>
      );
  }
};
