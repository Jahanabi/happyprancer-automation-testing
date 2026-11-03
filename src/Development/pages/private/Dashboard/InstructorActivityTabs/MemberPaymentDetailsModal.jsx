import React, { useState, useContext, useEffect } from "react";
import {
  FaTimes,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCalendarAlt,
  FaUser,
  FaReceipt,
  FaShieldAlt,
  FaExclamationTriangle,
  FaLayerGroup,
  FaDumbbell,
  FaInfoCircle,
  FaUndoAlt,
} from "react-icons/fa";
import { getMemberGracePeriodInfo } from "../../../../utils/gracePeriod.js";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import ConfirmRefundModal from "../../../../common/ConfirmRefundModal";

const getCurrencySymbol = (currency = "") => {
  const upper = String(currency || "").toUpperCase();
  if (upper === "INR") return "₹";
  if (upper === "USD") return "$";
  if (upper === "EUR") return "€";
  if (upper === "GBP") return "£";
  return upper ? `${upper} ` : "";
};

const formatAmount = (amount, currency = "INR") => {
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

const formatDisplayDate = (rawDate, epoch) => {
  if (epoch && !isNaN(epoch) && Number(epoch) > 0) {
    try {
      const date = new Date(Number(epoch));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch {}
  }
  if (!rawDate) return "N/A";
  try {
    const num = Number(rawDate);
    const date =
      !isNaN(num) && num > 1000000000
        ? new Date(num < 1000000000000 ? num * 1000 : num)
        : new Date(rawDate);
    if (isNaN(date.getTime())) return String(rawDate);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(rawDate);
  }
};

const MemberPaymentDetailsModal = ({
  isOpen,
  onClose,
  member,
  initialTab = "overview",
  primaryColor = "#4F46E5",
  onPaymentRefunded,
}) => {
  const { userData, processRefundPayment } = useContext(Context);
  const institutionCtx = useContext(InstitutionContext);
  const institutionId =
    institutionCtx?.institutionData?.InstitutionId ||
    member?.institution ||
    userData?.institution;

  const [activeTab, setActiveTab] = useState(initialTab || "overview");
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedRefundPayment, setSelectedRefundPayment] = useState(null);
  const [refundedPaymentIds, setRefundedPaymentIds] = useState(new Set());
  const [pendingRefundPaymentIds, setPendingRefundPaymentIds] = useState(new Set());
  const [expiredPaymentIds, setExpiredPaymentIds] = useState(new Set());

  // Reset local state when member changes
  useEffect(() => {
    setRefundedPaymentIds(new Set());
    setPendingRefundPaymentIds(new Set());
    setExpiredPaymentIds(new Set());
  }, [member?.cognitoId]);

  const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

  const parsePaymentTimestamp = (rawDate) => {
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

  const isWithin72Hours = (paymentDate) => {
    const ts = parsePaymentTimestamp(paymentDate);
    if (!ts) return false;
    const now = Date.now();
    const diff = now - ts;
    // Exact rule: currentTime - paymentDate < 72 hours
    return diff < SEVENTY_TWO_HOURS_MS;
  };

  const isPaymentRefunded = (p) => {
    if (!p) return false;
    if (p.paymentId && refundedPaymentIds.has(p.paymentId)) return true;
    const statusLower = String(p.status || "").toLowerCase();
    const refundStatusLower = String(p.refundStatus || "").toLowerCase();
    return (
      refundStatusLower === "refunded" ||
      statusLower === "refunded" ||
      Boolean(p.refundId)
    );
  };

  const getPaymentRefundInfo = (p) => {
    if (!p) return { status: "none", label: "N/A", refundable: false, isOnline: false };

    // 1. Check if refunded
    if (isPaymentRefunded(p)) {
      return { status: "refunded", label: "Refunded", refundable: false, isOnline: true };
    }

    // 2. Check if pending approval
    const refundStatusLower = String(p.refundStatus || "").toLowerCase();
    if (
      pendingRefundPaymentIds.has(p.paymentId) ||
      refundStatusLower === "pending_approval" ||
      refundStatusLower === "pending"
    ) {
      return {
        status: "pending_approval",
        label: "Pending Admin Approval",
        refundable: false,
        isOnline: true,
      };
    }

    // 3. Check if processing
    const statusLower = String(p.status || "").toLowerCase();
    if (refundStatusLower === "processing" || statusLower === "processing") {
      return {
        status: "processing",
        label: "Refund Processing",
        refundable: false,
        isOnline: true,
      };
    }

    // 4. Check if rejected
    if (refundStatusLower === "rejected") {
      return {
        status: "rejected",
        label: "Refund Rejected",
        refundable: false,
        isOnline: true,
      };
    }

    // 5. Check if expired from backend
    if (refundStatusLower === "expired") {
      return {
        status: "expired",
        label: "Refund Expired",
        refundable: false,
        isOnline: true,
      };
    }

    // 6. Offline / manual payment check
    const mode = String(p.paymentMode || "").toLowerCase();
    const method = String(p.paymentMethod || "").toLowerCase();
    const provider = String(p.provider || "").toLowerCase();
    if (
      mode === "offline" ||
      mode === "manual" ||
      method === "offline" ||
      method === "manual" ||
      provider === "offline"
    ) {
      return {
        status: "offline",
        label: "Offline Payment",
        refundable: false,
        isOnline: false,
      };
    }

    if (!p.paymentId || p.refundable === false || p.isRefundable === false) {
      return {
        status: "unavailable",
        label: "Refund Not Available",
        refundable: false,
        isOnline: false,
      };
    }

    // 7. 72-hour eligibility window check or backend expired rejection
    const isExpired =
      expiredPaymentIds.has(p.paymentId) || !isWithin72Hours(p.paymentDate);
    if (isExpired) {
      return {
        status: "expired",
        label: "Refund window expired",
        refundable: false,
        isOnline: true,
      };
    }

    // 8. Eligible online gateway payment within 72 hours
    return {
      status: "available",
      label: "Refund Payment",
      refundable: true,
      isOnline: true,
    };
  };

  // Backwards compatibility alias
  const isOnlineGatewayPayment = (p) => getPaymentRefundInfo(p).refundable;

  const handleInitiateRefund = (payment) => {
    setSelectedRefundPayment(payment);
    setRefundModalOpen(true);
  };

  const handleConfirmRefundSubmit = async ({ paymentId, cognitoId, reason }) => {
    if (typeof processRefundPayment !== "function") {
      throw new Error("Refund service is not available.");
    }

    try {
      const res = await processRefundPayment({
        institutionId,
        paymentId,
        cognitoId: cognitoId || member?.cognitoId,
        reason,
      });

      setPendingRefundPaymentIds((prev) => new Set([...prev, paymentId]));
      toast.success("Refund request submitted for admin approval.");

      if (typeof onPaymentRefunded === "function") {
        onPaymentRefunded(res, paymentId);
      }

      return res;
    } catch (err) {
      const msg = String(err?.message || err?.error || err || "").toLowerCase();
      if (
        msg.includes("72 hour") ||
        msg.includes("refund window expired") ||
        msg.includes("window expired") ||
        msg.includes("hours ago")
      ) {
        setExpiredPaymentIds((prev) => new Set([...prev, paymentId]));
      }
      throw err;
    }
  };

  if (!isOpen || !member) return null;

  // Authoritative grace period resolution
  const graceInfo = getMemberGracePeriodInfo({
    ...member,
    status: member.membershipStatus || member.status,
    renewDate: member.membershipValidity || member.renewDateEpoch,
    isGracePeriod: member.isGracePeriod,
  });

  const isGracePeriod =
    member.isGracePeriod !== undefined
      ? Boolean(member.isGracePeriod)
      : graceInfo.isGracePeriod;

  const remainingGraceDays =
    member.remainingGraceDays !== undefined
      ? member.remainingGraceDays
      : graceInfo.remainingGraceDays;

  const statusStr = String(
    member.membershipStatus || member.status || "Unknown"
  );
  const isStatusActive = statusStr.toLowerCase() === "active";

  const recentPayments = Array.isArray(member.recentPayments)
    ? member.recentPayments
    : [];
  const latestPayment = recentPayments.length > 0 ? recentPayments[0] : null;

  const balanceNum = Number(member.balance || 0);

  // Multi-currency handling for member payments
  const isPeriodMixed =
    member.currency === "MIXED" &&
    member.totalAmountPaidInPeriodByCurrency &&
    Object.keys(member.totalAmountPaidInPeriodByCurrency).length > 0;

  const isLifetimeMixed =
    member.currency === "MIXED" &&
    member.totalAmountPaidByCurrency &&
    Object.keys(member.totalAmountPaidByCurrency).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white"
          style={{ borderTop: `4px solid ${primaryColor}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {(member.userName || "M").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {member.userName || "Member"}
                </h3>
                {/* Status Badges */}
                {isGracePeriod ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <FaExclamationTriangle size={10} className="text-amber-600" />
                    Grace Period ({remainingGraceDays}d left)
                  </span>
                ) : isStatusActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                    <FaCheckCircle size={10} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    <FaTimesCircle size={10} /> {statusStr}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {member.emailId || "No email"}
                {member.phoneNumber && <> &bull; {member.phoneNumber}</>}
                {member.planName && (
                  <>
                    {" "}
                    &bull;{" "}
                    <span className="font-medium text-gray-700">
                      {member.planName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Top 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 pb-3 bg-gray-50/70 border-b border-gray-100">
          {/* Card 1: Balance */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <span
              className={`text-base font-bold mt-0.5 block ${
                balanceNum > 0 ? "text-amber-600" : "text-gray-700"
              }`}
            >
              {formatAmount(balanceNum, member.currency)}
            </span>
          </div>

          {/* Card 2: In Period */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Paid in Period
            </span>
            <div className="mt-0.5">
              {isPeriodMixed ? (
                Object.entries(member.totalAmountPaidInPeriodByCurrency).map(
                  ([curr, amt]) => (
                    <div
                      key={curr}
                      className="text-xs font-bold text-green-700"
                    >
                      {curr} {formatAmount(amt, curr)}
                    </div>
                  )
                )
              ) : (
                <span className="text-base font-bold text-green-700 block">
                  {formatAmount(
                    member.totalAmountPaidInPeriod ?? 0,
                    member.currency
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Total Lifetime */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Lifetime Paid
            </span>
            <div className="mt-0.5">
              {isLifetimeMixed ? (
                Object.entries(member.totalAmountPaidByCurrency).map(
                  ([curr, amt]) => (
                    <div
                      key={curr}
                      className="text-xs font-bold text-gray-800"
                    >
                      {curr} {formatAmount(amt, curr)}
                    </div>
                  )
                )
              ) : (
                <span className="text-base font-bold text-gray-800 block">
                  {formatAmount(
                    member.totalAmountPaid ?? 0,
                    member.currency
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Attendance (Backend authoritative) */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Classes Attended
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-gray-900">
                {member.classesAttended ?? 0}
              </span>
              <span className="text-xs text-gray-400">
                / {member.classesMissed ?? 0} missed
              </span>
            </div>
          </div>
        </div>

        {/* Modal Tab Switcher */}
        <div className="px-6 border-b border-gray-200 bg-white flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 -mb-[1px] ${
              activeTab === "overview"
                ? "border-current"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
            style={activeTab === "overview" ? { color: primaryColor } : undefined}
          >
            <FaUser size={12} />
            Subscription & Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 -mb-[1px] ${
              activeTab === "payments"
                ? "border-current"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
            style={activeTab === "payments" ? { color: primaryColor } : undefined}
          >
            <FaReceipt size={12} />
            Payment History ({recentPayments.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Grace Period Banner if active */}
              {isGracePeriod && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" size={16} />
                  <div className="text-xs text-amber-800">
                    <p className="font-bold">Subscription in Grace Period</p>
                    <p className="mt-0.5">
                      This member's renewal date has passed. There are{" "}
                      <strong>{remainingGraceDays} calendar days</strong> remaining in the grace window before membership cancellation.
                    </p>
                  </div>
                </div>
              )}

              {/* Subscription & Plan Information Grid */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <FaLayerGroup style={{ color: primaryColor }} />
                  Plan & Subscription Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block font-medium">Assigned Plan:</span>
                    <strong className="text-gray-900 text-sm">
                      {member.planName || "Assigned Plan"}
                    </strong>
                    {member.planDetails?.durationText && (
                      <span className="text-gray-500 block capitalize">
                        Billing: {member.planDetails.durationText}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">Subscription ID:</span>
                    <span className="font-mono text-gray-800 font-semibold bg-gray-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                      {member.subscriptionId || member.productId || member.planId || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">Membership Status:</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {member.membershipStatus || member.status || "Unknown"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">Subscription Type:</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {member.subscriptionType ||
                        member.planDetails?.subscriptionType ||
                        "Recurring"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">Joining Date:</span>
                    <span className="font-semibold text-gray-800">
                      {formatDisplayDate(member.joiningDate, member.joiningDateEpoch)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">
                      Membership Validity / Renewal Date:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatDisplayDate(
                        member.membershipValidity,
                        member.renewDateEpoch
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">Product ID:</span>
                    <span className="font-mono text-gray-600 text-[11px]">
                      {member.productId || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-medium">Plan ID:</span>
                    <span className="font-mono text-gray-600 text-[11px]">
                      {member.planId || member.planDetails?.planId || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Breakdown Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <FaDumbbell style={{ color: primaryColor }} />
                  Class Attendance Record
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                  <div className="p-3 rounded-lg bg-green-50/60 border border-green-100">
                    <span className="text-gray-500 block">Classes Attended:</span>
                    <span className="text-xl font-bold text-green-700">
                      {member.classesAttended ?? 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-red-50/60 border border-red-100">
                    <span className="text-gray-500 block">Classes Missed:</span>
                    <span className="text-xl font-bold text-red-600">
                      {member.classesMissed ?? 0}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-2">
                  <FaInfoCircle size={10} />
                  Attendance metrics are calculated strictly by the backend based on conducted sessions, joining date eligibility, and plan class-type rules.
                </p>
              </div>

              {/* Latest Payment Highlight Box (Requirement 4) */}
              {latestPayment && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <FaReceipt style={{ color: primaryColor }} />
                      Latest Payment Summary
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {(() => {
                        const info = getPaymentRefundInfo(latestPayment);
                        if (!info.isOnline && info.status !== "refunded") {
                          return null;
                        }
                        if (info.status === "refunded") {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <FaUndoAlt size={10} />
                              Refunded
                            </span>
                          );
                        }
                        if (info.status === "processing") {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <FaClock size={10} />
                              Refund Processing
                            </span>
                          );
                        }
                        if (info.refundable) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleInitiateRefund(latestPayment)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-xs"
                              title="Initiate full gateway refund"
                            >
                              <FaUndoAlt size={10} />
                              <span>Refund Payment</span>
                            </button>
                          );
                        }
                        if (info.status === "expired") {
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed opacity-75"
                                title="Refund window expired (exceeded 72 hours from payment timestamp)"
                              >
                                <FaUndoAlt size={10} className="text-gray-400" />
                                <span>Refund Payment</span>
                              </button>
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Refund window expired
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 capitalize">
                        <FaCheckCircle size={10} />
                        {isPaymentRefunded(latestPayment) ? "Refunded" : latestPayment.status || "Completed"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Amount:</span>
                      <strong className="text-sm font-bold text-green-700">
                        {formatAmount(
                          latestPayment.amount,
                          latestPayment.currency || member.currency
                        )}
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-medium">Payment Date:</span>
                      <strong className="text-gray-800">
                        {formatDisplayDate(latestPayment.paymentDate)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-medium">Payment Mode:</span>
                      <span className="text-gray-800 capitalize font-medium">
                        {latestPayment.paymentMode || "Online"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-medium">Renewal Date:</span>
                      <span className="text-gray-800 font-medium">
                        {formatDisplayDate(
                          member.membershipValidity,
                          member.renewDateEpoch
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Latest Payment Card */}
              {latestPayment && (
                <div
                  className="p-4 rounded-xl border bg-gradient-to-r from-gray-50 to-white shadow-xs"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Most Recent Transaction
                    </span>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {(() => {
                        const info = getPaymentRefundInfo(latestPayment);
                        if (!info.isOnline && info.status !== "refunded") {
                          return null;
                        }
                        if (info.status === "refunded") {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <FaUndoAlt size={9} />
                              Refunded
                            </span>
                          );
                        }
                        if (info.status === "pending_approval") {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <FaClock size={9} />
                              Pending Admin Approval
                            </span>
                          );
                        }
                        if (info.status === "processing") {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <FaClock size={9} />
                              Refund Processing
                            </span>
                          );
                        }
                        if (info.status === "rejected") {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                              Refund Rejected
                            </span>
                          );
                        }
                        if (info.refundable) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleInitiateRefund(latestPayment)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-xs"
                              title="Initiate full gateway refund"
                            >
                              <FaUndoAlt size={10} />
                              <span>Refund Payment</span>
                            </button>
                          );
                        }
                        if (info.status === "expired") {
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed opacity-75"
                                title="Refund window expired (exceeded 72 hours from payment timestamp)"
                              >
                                <FaUndoAlt size={10} className="text-gray-400" />
                                <span>Refund Payment</span>
                              </button>
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Refund window expired
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 capitalize">
                        <FaCheckCircle size={9} />
                        {isPaymentRefunded(latestPayment) ? "Refunded" : latestPayment.status || "Completed"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <div className="text-2xl font-extrabold text-green-700">
                        {formatAmount(
                          latestPayment.amount,
                          latestPayment.currency || member.currency
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Paid on {formatDisplayDate(latestPayment.paymentDate)} via{" "}
                        <span className="font-semibold text-gray-700 capitalize">
                          {latestPayment.paymentMode || "Online"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-500">
                      <div>
                        Plan:{" "}
                        <strong className="text-gray-800">
                          {latestPayment.planId || member.planName || "Assigned Plan"}
                        </strong>
                      </div>
                      <div>
                        Next Renewal:{" "}
                        <strong className="text-gray-800">
                          {formatDisplayDate(
                            member.membershipValidity,
                            member.renewDateEpoch
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  All Recent Transactions ({recentPayments.length})
                </h4>

                {recentPayments.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <FaReceipt size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      No payment records found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Verified payments made by this member will be listed here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xs">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
                        <tr>
                          <th className="px-3.5 py-2.5 font-semibold">Date</th>
                          <th className="px-3.5 py-2.5 font-semibold">Amount</th>
                          <th className="px-3.5 py-2.5 font-semibold">Mode</th>
                          <th className="px-3.5 py-2.5 font-semibold">Subscription / Plan</th>
                          <th className="px-3.5 py-2.5 font-semibold">Status</th>
                          <th className="px-3.5 py-2.5 font-semibold">Payment ID</th>
                          <th className="px-3.5 py-2.5 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentPayments.map((p, idx) => {
                          const statusLower = String(p.status || "").toLowerCase();
                          const isSuccess =
                            statusLower === "completed" ||
                            statusLower === "success";
                          const isPending = statusLower === "pending";

                          return (
                            <tr
                              key={p.paymentId || idx}
                              className="hover:bg-gray-50/80 transition-colors"
                            >
                              <td className="px-3.5 py-2.5 text-gray-800 whitespace-nowrap">
                                {formatDisplayDate(p.paymentDate)}
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-gray-900 whitespace-nowrap">
                                {formatAmount(
                                  p.amount,
                                  p.currency || member.currency
                                )}
                              </td>
                              <td className="px-3.5 py-2.5 text-gray-600 capitalize whitespace-nowrap">
                                {p.paymentMode || "Online"}
                              </td>
                              <td className="px-3.5 py-2.5 text-gray-600 whitespace-nowrap">
                                <div>
                                  {p.subscriptionType ||
                                    member.subscriptionType ||
                                    "Recurring"}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  {p.planId || member.productId || "-"}
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                    isSuccess
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : isPending
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                                  }`}
                                >
                                  {isSuccess ? (
                                    <FaCheckCircle size={9} />
                                  ) : isPending ? (
                                    <FaClock size={9} />
                                  ) : (
                                    <FaTimesCircle size={9} />
                                  )}
                                  {p.status || "Completed"}
                                </span>
                              </td>
                              <td
                                className="px-3.5 py-2.5 text-gray-400 font-mono text-[11px] whitespace-nowrap max-w-[130px] truncate"
                                title={p.paymentId}
                              >
                                {p.paymentId || "-"}
                              </td>
                              <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                                {(() => {
                                  const info = getPaymentRefundInfo(p);
                                  if (!info.isOnline && info.status !== "refunded") {
                                    return <span className="text-gray-400 text-xs">—</span>;
                                  }
                                  if (info.status === "refunded") {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                        <FaUndoAlt size={9} />
                                        Refunded
                                      </span>
                                    );
                                  }
                                  if (info.status === "pending_approval") {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                        <FaClock size={8} />
                                        Pending Approval
                                      </span>
                                    );
                                  }
                                  if (info.status === "processing") {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <FaClock size={9} />
                                        Processing
                                      </span>
                                    );
                                  }
                                  if (info.status === "rejected") {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">
                                        Refund Rejected
                                      </span>
                                    );
                                  }
                                  if (info.refundable) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => handleInitiateRefund(p)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-xs"
                                        title="Initiate full gateway refund"
                                      >
                                        <FaUndoAlt size={9} />
                                        <span>Refund Payment</span>
                                      </button>
                                    );
                                  }
                                  if (info.status === "expired") {
                                    return (
                                      <div className="flex flex-col items-center">
                                        <button
                                          type="button"
                                          disabled
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed opacity-75"
                                          title="Refund window expired (exceeded 72 hours from payment timestamp)"
                                        >
                                          <FaUndoAlt size={9} className="text-gray-400" />
                                          <span>Refund Payment</span>
                                        </button>
                                        <span className="text-[10px] text-amber-700 font-medium mt-0.5 whitespace-nowrap">
                                          Refund window expired
                                        </span>
                                      </div>
                                    );
                                  }
                                  return <span className="text-gray-400 text-xs">—</span>;
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Cognito ID: {member.cognitoId || "-"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Online Gateway Refund */}
      {refundModalOpen && selectedRefundPayment && (
        <ConfirmRefundModal
          isOpen={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedRefundPayment(null);
          }}
          payment={selectedRefundPayment}
          member={member}
          onConfirmRefund={handleConfirmRefundSubmit}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
};

export default MemberPaymentDetailsModal;
