import React, { useState } from "react";
import {
  FaTimes,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaUser,
  FaReceipt,
  FaTag,
} from "react-icons/fa";
import {
  formatAmount,
  getApprovalErrorMessage,
} from "./shared";

/**
 * Reject Confirmation Modal for Admin review.
 * Allows entering an optional rejection reason and declining the request without gateway interaction.
 */
const RejectRefundModal = ({
  isOpen,
  onClose,
  request,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
  const requestedBy =
    request.requestedBy ||
    request.requesterName ||
    request.requesterId ||
    "Staff";
  const originalReason =
    request.reason || request.refundReason || "No reason specified";

  const handleReject = async (e) => {
    e?.preventDefault();
    if (isProcessing) return; // Prevent duplicate clicks

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onConfirmReject(request, reason.trim() || "Rejected by administrator");
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error("Refund rejection failed:", err);
      const friendly = getApprovalErrorMessage(err);
      setErrorMessage(friendly);
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
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white border-t-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-red-600 shadow-xs">
              <FaTimesCircle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Reject Refund Request
              </h3>
              <p className="text-xs text-gray-500">
                Decline refund request and preserve original transaction
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
          {/* Question / Prompt Banner */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <FaExclamationTriangle
              className="text-red-600 mt-0.5 shrink-0"
              size={18}
            />
            <div className="text-xs text-red-950">
              <p className="font-bold text-red-900 text-sm">
                Are you sure you want to reject this refund request?
              </p>
              <p className="mt-0.5 text-red-800">
                Rejecting this request will mark it as REJECTED. No funds will
                be refunded via the payment gateway.
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
              <span className="font-semibold text-gray-500">Requested By:</span>
              <span className="text-gray-900 font-semibold">{requestedBy}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">
                Requested Amount:
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatAmount(amount, currency)}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-500 block mb-1">
                Requester's Reason:
              </span>
              <p className="bg-white p-2.5 rounded-lg border border-gray-200 text-gray-700 italic text-[11px]">
                "{originalReason}"
              </p>
            </div>
          </div>

          {/* Rejection Reason Input */}
          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Reason for Rejection:
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
              placeholder="Provide a reason for rejecting this refund request (e.g., Outside refund window or member attended classes)..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 resize-none"
            />
          </div>

          {/* Error Message Display if backend rejected */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border bg-red-50 border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" size={16} />
              <div className="flex-1 font-semibold">{errorMessage}</div>
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
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" size={12} />
                <span>Rejecting Request...</span>
              </>
            ) : (
              <>
                <FaTimes size={12} />
                <span>Reject Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRefundModal;
