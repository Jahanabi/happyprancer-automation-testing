import React, { useState } from "react";
import {
  FaTimes,
  FaUndoAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaClock,
} from "react-icons/fa";
import {
  getCurrencySymbol,
  formatAmount,
  parsePaymentTimestamp,
  formatDisplayDateTime,
  formatDisplayDate,
  getFriendlyRefundErrorMessage,
  getApprovalErrorMessage,
  RefundStatusBadge,
} from "./shared";
import ApproveRefundModal from "./ApproveRefundModal";
import RejectRefundModal from "./RejectRefundModal";

export {
  getCurrencySymbol,
  formatAmount,
  parsePaymentTimestamp,
  formatDisplayDateTime,
  formatDisplayDate,
  getFriendlyRefundErrorMessage,
  getApprovalErrorMessage,
  RefundStatusBadge,
  ApproveRefundModal,
  RejectRefundModal,
};

/**
 * Confirmation modal for submitting full refund requests for Admin approval.
 * Backward compatible with existing Instructor and Admin refund triggers.
 */
const ConfirmRefundModal = ({
  isOpen,
  onClose,
  payment,
  member,
  onConfirmRefund,
  primaryColor = "#4F46E5",
}) => {
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorType, setErrorType] = useState(null);

  if (!isOpen || !payment) return null;

  const memberName =
    member?.userName ||
    member?.name ||
    payment?.userDetails?.name ||
    payment?.userName ||
    "Member";

  const paymentId = payment?.paymentId || "-";
  const amount = payment?.amount;
  const currency = payment?.currency || member?.currency || "INR";
  const paymentDate = payment?.paymentDate;
  const paymentMode = payment?.paymentMode || payment?.provider || "Online";
  const paymentTimestamp = parsePaymentTimestamp(paymentDate);
  const refundDeadlineTimestamp = paymentTimestamp
    ? paymentTimestamp + 72 * 60 * 60 * 1000
    : null;

  const handleConfirm = async (e) => {
    e?.preventDefault();
    if (isProcessing) return; // Prevent duplicate submissions

    setIsProcessing(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      // Backend is authoritative. Only pass identifiers and optional audit reason.
      const result = await onConfirmRefund({
        paymentId: payment.paymentId,
        cognitoId: payment.cognitoId || member?.cognitoId,
        reason: reason.trim() || "Full refund requested from dashboard",
      });

      // Successful backend response
      setIsProcessing(false);
      onClose(result);
    } catch (err) {
      console.error("Refund request failed:", err);
      const friendly = getFriendlyRefundErrorMessage(err);
      setErrorMessage(friendly.message);
      setErrorType(friendly.type);
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={!isProcessing ? () => onClose() : undefined}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
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
              style={{ backgroundColor: "#DC2626" }}
            >
              <FaUndoAlt size={16} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Request Full Refund
              </h3>
              <p className="text-xs text-gray-500">
                Submit refund request for administrator review and approval
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !isProcessing && onClose()}
            disabled={isProcessing}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Approval Workflow Notice Banner */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <FaClock
              className="text-amber-600 mt-0.5 shrink-0"
              size={18}
            />
            <div className="text-xs text-amber-900">
              <p className="font-bold">Admin Approval Required</p>
              <p className="mt-0.5 text-amber-800">
                Submitting this request will create a pending refund request for{" "}
                <strong>{formatAmount(amount, currency)}</strong> (Payment:{" "}
                <span className="font-mono font-semibold">{paymentId}</span>).
                An administrator will review and authorize the payment gateway refund.
              </p>
            </div>
          </div>

          {/* Payment Summary Box */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs font-semibold text-gray-500">
                Member:
              </span>
              <span className="text-xs font-bold text-gray-900">
                {memberName}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs font-semibold text-gray-500">
                Payment ID:
              </span>
              <span
                className="font-mono text-[11px] font-semibold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 max-w-[240px] truncate"
                title={paymentId}
              >
                {paymentId}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs font-semibold text-gray-500">
                Payment Date/Time:
              </span>
              <span className="text-xs text-gray-800 font-medium">
                {formatDisplayDateTime(paymentDate)}
              </span>
            </div>

            {refundDeadlineTimestamp && (
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block">
                    Refund Deadline:
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Exact 72h window
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {formatDisplayDateTime(refundDeadlineTimestamp)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs font-semibold text-gray-500">
                Payment Method:
              </span>
              <span className="text-xs font-semibold text-gray-800 capitalize">
                {paymentMode}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-gray-700 block">
                  Requested Refund:
                </span>
                <span className="text-[11px] text-green-700 font-semibold inline-flex items-center gap-1">
                  <FaCheckCircle size={10} /> Full Refund Only
                </span>
              </div>
              <span className="text-xl font-extrabold text-red-600">
                {formatAmount(amount, currency)}
              </span>
            </div>
          </div>

          {/* Audit Reason Input (Optional) */}
          <div>
            <label
              htmlFor="refund-reason"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Reason / Notes (Optional):
            </label>
            <input
              id="refund-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
              placeholder="e.g., Member requested cancellation within 72 hours"
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
            />
          </div>

          {/* Error Message Display if backend rejected */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-fadeIn ${
                errorType === "EXPIRED"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : errorType === "ALREADY_REFUNDED"
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <FaExclamationTriangle
                className={`mt-0.5 shrink-0 ${
                  errorType === "EXPIRED"
                    ? "text-amber-600"
                    : errorType === "ALREADY_REFUNDED"
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
                size={14}
              />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                {errorType === "EXPIRED" && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Per policy, refund requests must be initiated within 72
                    hours of the original payment time.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 shadow-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              isProcessing ||
              errorType === "ALREADY_REFUNDED" ||
              errorType === "EXPIRED"
            }
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" size={12} />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <FaUndoAlt size={12} />
                <span>Submit Refund Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRefundModal;
