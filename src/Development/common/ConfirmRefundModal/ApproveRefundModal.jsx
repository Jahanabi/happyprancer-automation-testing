import React, { useState } from "react";
import {
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaShieldAlt,
  FaUser,
  FaReceipt,
  FaCalendarAlt,
  FaTag,
} from "react-icons/fa";
import {
  formatAmount,
  formatDisplayDateTime,
  getApprovalErrorMessage,
} from "./shared";

/**
 * Approve Confirmation Modal for Admin review.
 * Strictly adheres to backend authoritative execution and duplicate prevention.
 */
const ApproveRefundModal = ({
  isOpen,
  onClose,
  request,
  onConfirmApprove,
  primaryColor = "#4F46E5",
}) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isExpiredError, setIsExpiredError] = useState(false);

  if (!isOpen || !request) return null;

  const memberName =
    request.memberName ||
    request.userName ||
    request.name ||
    request.userDetails?.name ||
    "Member";

  const paymentId = request.paymentId || "-";
  const refundRequestId = request.refundRequestId || request.id || "-";
  const amount = request.paymentAmount ?? request.amount ?? 0;
  const currency = request.currency || "INR";
  const paymentDate = request.paymentDate;
  const requestedBy =
    request.requestedBy ||
    request.requesterName ||
    request.requesterId ||
    "Staff";
  const requesterRole = request.requesterRole || "Instructor";
  const requestReason =
    request.reason ||
    request.refundReason ||
    request.requestReason ||
    "No specific reason provided.";
  const createdAt = request.createdAt || request.requestTimestamp;

  const handleApprove = async (e) => {
    e?.preventDefault();
    if (isProcessing) return; // Prevent duplicate clicks

    setIsProcessing(true);
    setErrorMessage(null);
    setIsExpiredError(false);

    try {
      await onConfirmApprove(request, adminNotes.trim());
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error("Refund approval failed:", err);
      const friendly = getApprovalErrorMessage(err);
      const isExp =
        err?.status === "EXPIRED" ||
        friendly.toLowerCase().includes("expired") ||
        friendly.toLowerCase().includes("72-hour");

      setErrorMessage(friendly);
      setIsExpiredError(isExp);
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-emerald-600 shadow-xs">
              <FaCheckCircle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Approve Refund Request
              </h3>
              <p className="text-xs text-gray-500">
                Authorize gateway refund for this transaction
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
          {/* Authoritative Gateway Warning Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <FaShieldAlt
              className="text-emerald-600 mt-0.5 shrink-0"
              size={18}
            />
            <div className="text-xs text-emerald-950">
              <p className="font-bold text-emerald-900">
                Authoritative Gateway Refund
              </p>
              <p className="mt-0.5 text-emerald-800 font-medium">
                This will process a full refund through the original payment
                gateway.
              </p>
              <p className="mt-0.5 text-emerald-700 text-[11px]">
                The backend will re-validate the 72-hour refund window before
                executing the gateway refund.
              </p>
            </div>
          </div>

          {/* Request Information Summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <FaUser size={11} className="text-gray-400" /> Member:
              </span>
              <span className="font-bold text-gray-900">{memberName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <FaReceipt size={11} className="text-gray-400" /> Payment ID:
              </span>
              <span
                className="font-mono text-[11px] font-semibold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 max-w-[240px] truncate"
                title={paymentId}
              >
                {paymentId}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <FaTag size={11} className="text-gray-400" /> Request ID:
              </span>
              <span
                className="font-mono text-[11px] font-semibold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 max-w-[240px] truncate"
                title={refundRequestId}
              >
                {refundRequestId}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <FaCalendarAlt size={11} className="text-gray-400" /> Payment Date:
              </span>
              <span className="text-gray-800 font-medium">
                {formatDisplayDateTime(paymentDate)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">Requested By:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-semibold truncate max-w-[170px]" title={requestedBy}>
                  {requestedBy}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700">
                  {requesterRole}
                </span>
              </div>
            </div>

            {createdAt && (
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-semibold text-gray-500">
                  Request Created:
                </span>
                <span className="text-gray-700 font-medium text-[11px]">
                  {formatDisplayDateTime(createdAt)}
                </span>
              </div>
            )}

            <div className="border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500 block mb-1">
                Reason for Refund:
              </span>
              <p className="bg-white p-2.5 rounded-lg border border-gray-200 text-gray-800 italic text-[11px] leading-relaxed">
                "{requestReason}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-semibold text-gray-700 block">
                  Refund Amount:
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                  <FaCheckCircle size={10} /> Full Gateway Refund
                </span>
              </div>
              <span className="text-2xl font-extrabold text-emerald-600">
                {formatAmount(amount, currency)}
              </span>
            </div>
          </div>

          {/* Optional Admin Approval Note */}
          <div>
            <label
              htmlFor="admin-approval-notes"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Approval Notes (Optional):
            </label>
            <input
              id="admin-approval-notes"
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={isProcessing}
              placeholder="e.g., Verified member request within refund window"
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
          </div>

          {/* Error Message Display if backend rejected or expired */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-fadeIn ${
                isExpiredError
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <FaExclamationTriangle
                className={`mt-0.5 shrink-0 ${
                  isExpiredError ? "text-amber-600" : "text-red-600"
                }`}
                size={16}
              />
              <div className="flex-1">
                <p className="font-bold">{errorMessage}</p>
                {isExpiredError && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    The 72-hour refund window has passed, so this refund cannot be processed.
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
            onClick={handleApprove}
            disabled={isProcessing || isExpiredError}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" size={12} />
                <span>Approving Refund...</span>
              </>
            ) : (
              <>
                <FaCheckCircle size={12} />
                <span>Approve Refund</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveRefundModal;
