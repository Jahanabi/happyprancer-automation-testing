import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { Table } from "flowbite-react";
import {
  IoMdSearch,
  IoMdCloseCircle,
  IoMdRefresh,
} from "react-icons/io";
import {
  FaCheckCircle,
  FaTimes,
  FaClock,
  FaUndoAlt,
  FaReceipt,
  FaUser,
  FaFilter,
  FaCopy,
  FaCheck,
  FaExclamationTriangle,
  FaShieldAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import {
  formatAmount,
  formatDisplayDateTime,
  RefundStatusBadge,
  ApproveRefundModal,
  RejectRefundModal,
} from "../../../../common/ConfirmRefundModal";

const AdminRefundRequestsSection = ({ onDataChanged }) => {
  const {
    userData,
    getPendingRefundRequests,
    approveRefundRequest,
    rejectRefundRequest,
    reloadRevenue,
    userList,
    getUserList,
  } = useContext(Context);

  const { institutionData } = useContext(InstitutionContext);
  const primaryColor = institutionData?.PrimaryColor || "#4F46E5";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  // Modal states
  const [selectedApproveRequest, setSelectedApproveRequest] = useState(null);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);

  const targetInstitution = userData?.institution || institutionData?.InstitutionId;

  // Fetch pending refund requests
  const fetchRequests = useCallback(
    async (isManualRefresh = false) => {
      if (!targetInstitution) return;
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        if (typeof getPendingRefundRequests === "function") {
          const res = await getPendingRefundRequests(targetInstitution);
          // Backend may return { success: true, requests: [...] } or an array
          const requestList =
            res?.requests ||
            res?.refundRequests ||
            res?.data ||
            (Array.isArray(res) ? res : []);
          setRequests(requestList);
        }
      } catch (err) {
        console.error("Failed to fetch refund requests:", err);
        toast.error(err?.message || "Failed to load refund requests.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [targetInstitution, getPendingRefundRequests]
  );

  useEffect(() => {
    fetchRequests();
    if (!userList || userList.length === 0) {
      if (typeof getUserList === "function") {
        getUserList();
      }
    }
  }, [fetchRequests, userList, getUserList]);

  // Copy helper
  const handleCopy = (text, idKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to resolve display member name
  const getMemberDisplayName = useCallback(
    (req) => {
      if (req.memberName && req.memberName !== "Unknown") return req.memberName;
      if (req.userName) return req.userName;
      if (req.name) return req.name;
      if (req.userDetails?.name) return req.userDetails.name;
      if (req.cognitoId && Array.isArray(userList)) {
        const matched = userList.find(
          (u) => u.cognitoId === req.cognitoId || u.userId === req.cognitoId
        );
        if (matched?.name) return matched.name;
      }
      return "Member";
    },
    [userList]
  );

  // Helper to resolve requester display
  const getRequesterDisplay = useCallback(
    (req) => {
      const role = req.requesterRole || req.refundRequesterRole || "Instructor";
      let name =
        req.requestedBy ||
        req.requesterName ||
        req.refundRequestedBy ||
        req.requesterId ||
        "Staff";

      if (name.startsWith("us-east-") || name.length > 20) {
        if (Array.isArray(userList)) {
          const matched = userList.find(
            (u) => u.cognitoId === req.requesterId || u.userId === req.requesterId
          );
          if (matched?.name) name = matched.name;
          else name = `${role} (${name.substring(0, 8)}...)`;
        } else {
          name = `${role} (${name.substring(0, 8)}...)`;
        }
      }

      return { name, role };
    },
    [userList]
  );

  // Counts for filter pills
  const counts = useMemo(() => {
    const pending = requests.filter(
      (r) =>
        String(r.status || "").toUpperCase() === "PENDING_APPROVAL" ||
        String(r.status || "").toUpperCase() === "PENDING"
    ).length;

    const refunded = requests.filter(
      (r) => String(r.status || "").toUpperCase() === "REFUNDED"
    ).length;

    const rejected = requests.filter(
      (r) => String(r.status || "").toUpperCase() === "REJECTED"
    ).length;

    const expiredOrFailed = requests.filter((r) => {
      const s = String(r.status || "").toUpperCase();
      return s === "EXPIRED" || s === "FAILED";
    }).length;

    return {
      all: requests.length,
      pending,
      refunded,
      rejected,
      expiredOrFailed,
    };
  }, [requests]);

  // Filter and search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Status Filter
      const reqStatus = String(req.status || "").toUpperCase();
      if (statusFilter === "PENDING_APPROVAL") {
        if (reqStatus !== "PENDING_APPROVAL" && reqStatus !== "PENDING") {
          return false;
        }
      } else if (statusFilter === "REFUNDED") {
        if (reqStatus !== "REFUNDED") return false;
      } else if (statusFilter === "REJECTED") {
        if (reqStatus !== "REJECTED") return false;
      } else if (statusFilter === "EXPIRED_OR_FAILED") {
        if (reqStatus !== "EXPIRED" && reqStatus !== "FAILED") return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const member = getMemberDisplayName(req).toLowerCase();
        const paymentId = String(req.paymentId || "").toLowerCase();
        const refundRequestId = String(req.refundRequestId || "").toLowerCase();
        const requester = String(
          req.requestedBy || req.requesterName || req.requesterId || ""
        ).toLowerCase();
        const reason = String(req.reason || "").toLowerCase();

        return (
          member.includes(query) ||
          paymentId.includes(query) ||
          refundRequestId.includes(query) ||
          requester.includes(query) ||
          reason.includes(query)
        );
      }

      return true;
    });
  }, [requests, statusFilter, searchQuery, getMemberDisplayName]);

  // Pagination
  const itemsPerPage = 8;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Refresh all dashboard data
  const refreshAll = async () => {
    await fetchRequests(true);
    if (typeof reloadRevenue === "function" && targetInstitution) {
      await reloadRevenue(targetInstitution);
    }
    if (typeof onDataChanged === "function") {
      onDataChanged();
    }
  };

  // Handle Approve Confirmation Submit
  const handleApproveSubmit = async (request, notes) => {
    if (typeof approveRefundRequest !== "function") {
      throw new Error("Refund approval service is not available.");
    }

    try {
      const res = await approveRefundRequest({
        institutionId: targetInstitution,
        refundRequestId: request.refundRequestId || request.id,
        reason: notes || "Approved by administrator",
      });

      toast.success("Refund processed successfully.");

      // Immediately update local item state so UI reflects approval instantly
      setRequests((prev) =>
        prev.map((r) =>
          r.refundRequestId === request.refundRequestId ||
          r.id === request.refundRequestId
            ? { ...r, status: "REFUNDED", refundId: res?.refundId }
            : r
        )
      );

      // Refresh both requests and revenue in the background
      await refreshAll();
      return res;
    } catch (err) {
      const msg = String(err?.message || err?.error || "").toLowerCase();
      const isExpired =
        err?.status === "EXPIRED" ||
        msg.includes("expired") ||
        msg.includes("72 hour") ||
        msg.includes("window");

      if (isExpired) {
        toast.error(
          "Refund period has expired. The 72-hour refund window has passed, so this refund cannot be processed.",
          { autoClose: 7000 }
        );
        // Backend marks request as EXPIRED; refresh the list
        await fetchRequests(true);
      }
      throw err;
    }
  };

  // Handle Reject Confirmation Submit
  const handleRejectSubmit = async (request, rejectionReason) => {
    if (typeof rejectRefundRequest !== "function") {
      throw new Error("Refund rejection service is not available.");
    }

    try {
      const res = await rejectRefundRequest({
        institutionId: targetInstitution,
        refundRequestId: request.refundRequestId || request.id,
        reason: rejectionReason || "Rejected by administrator",
      });

      toast.success("Refund request rejected successfully.");

      // Immediately update local item state so UI reflects rejection
      setRequests((prev) =>
        prev.map((r) =>
          r.refundRequestId === request.refundRequestId ||
          r.id === request.refundRequestId
            ? { ...r, status: "REJECTED", rejectionReason }
            : r
        )
      );

      // Refresh list in background
      await refreshAll();
      return res;
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <FaShieldAlt size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Refund Requests
                </h2>
                {counts.pending > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {counts.pending} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Review and approve refund requests submitted by instructors and
                administrators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchRequests(true)}
              disabled={refreshing || loading}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
              title="Refresh requests from server"
            >
              <IoMdRefresh
                size={16}
                className={refreshing ? "animate-spin text-indigo-600" : "text-gray-500"}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING_APPROVAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "PENDING_APPROVAL"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaClock size={11} />
              <span>Pending Approval</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === "PENDING_APPROVAL"
                    ? "bg-amber-700 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Requests ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("REFUNDED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "REFUNDED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaCheckCircle size={11} />
              <span>Refunded ({counts.refunded})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "REJECTED"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaTimes size={11} />
              <span>Rejected ({counts.rejected})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("EXPIRED_OR_FAILED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "EXPIRED_OR_FAILED"
                  ? "bg-gray-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Expired / Failed ({counts.expiredOrFailed})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <IoMdSearch className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, ID, requester, or reason..."
              className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
              >
                <IoMdCloseCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requests Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-3 text-xs text-gray-500 font-medium">
              Loading refund requests...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
              <FaReceipt size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {searchQuery
                ? "No matching refund requests found"
                : statusFilter === "PENDING_APPROVAL"
                ? "No pending refund requests"
                : "No refund requests found"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? "Try searching with a different term or clear your search query."
                : statusFilter === "PENDING_APPROVAL"
                ? "All refund requests have been reviewed and processed by administrators."
                : "No refund requests exist in this category yet."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs text-indigo-600 font-semibold hover:underline"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[980px]">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Identifiers</th>
                  <th className="px-4 py-3 font-semibold">Payment Date</th>
                  <th className="px-4 py-3 font-semibold">Requested By</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedRequests.map((req, index) => {
                  const reqId = req.refundRequestId || req.id || `req-${index}`;
                  const payId = req.paymentId || "-";
                  const memberName = getMemberDisplayName(req);
                  const requester = getRequesterDisplay(req);
                  const isPending =
                    String(req.status || "").toUpperCase() ===
                      "PENDING_APPROVAL" ||
                    String(req.status || "").toUpperCase() === "PENDING";

                  return (
                    <tr
                      key={reqId}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">
                              {memberName}
                            </div>
                            {req.cognitoId && (
                              <div
                                className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]"
                                title={req.cognitoId}
                              >
                                {req.cognitoId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount & Currency */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="font-extrabold text-sm text-gray-900">
                          {formatAmount(
                            req.paymentAmount ?? req.amount ?? 0,
                            req.currency || "INR"
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          Full Refund
                        </span>
                      </td>

                      {/* Identifiers (Payment ID & Request ID) */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          {/* Payment ID */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-gray-400 w-8">
                              Pay:
                            </span>
                            <span
                              className="font-mono text-[11px] font-medium text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[140px]"
                              title={payId}
                            >
                              {payId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(payId, `pay-${reqId}`)}
                              className="text-gray-400 hover:text-gray-700 p-0.5"
                              title="Copy Payment ID"
                            >
                              {copiedId === `pay-${reqId}` ? (
                                <FaCheck size={10} className="text-green-600" />
                              ) : (
                                <FaCopy size={10} />
                              )}
                            </button>
                          </div>

                          {/* Refund Request ID */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-gray-400 w-8">
                              Req:
                            </span>
                            <span
                              className="font-mono text-[11px] font-medium text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[140px]"
                              title={reqId}
                            >
                              {reqId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(reqId, `req-${reqId}`)}
                              className="text-gray-400 hover:text-gray-700 p-0.5"
                              title="Copy Refund Request ID"
                            >
                              {copiedId === `req-${reqId}` ? (
                                <FaCheck size={10} className="text-green-600" />
                              ) : (
                                <FaCopy size={10} />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Payment Date & Request Timestamp */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="text-gray-800 font-medium">
                          {formatDisplayDateTime(req.paymentDate)}
                        </div>
                        {(req.createdAt || req.requestTimestamp) && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Requested:{" "}
                            {formatDisplayDateTime(
                              req.createdAt || req.requestTimestamp
                            )}
                          </div>
                        )}
                      </td>

                      {/* Requested By & Role */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-semibold text-gray-900 truncate max-w-[140px]" title={requester.name}>
                          {requester.name}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                          {requester.role}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5 align-top max-w-[200px]">
                        <p
                          className="text-gray-700 text-xs italic line-clamp-2"
                          title={req.reason || req.refundReason || "No reason provided."}
                        >
                          "{req.reason || req.refundReason || "No reason specified"}"
                        </p>
                      </td>

                      {/* Current Status */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <RefundStatusBadge status={req.status} />
                        {req.refundId && (
                          <div
                            className="text-[10px] text-gray-400 font-mono mt-1 truncate max-w-[120px]"
                            title={`Gateway Ref: ${req.refundId}`}
                          >
                            Ref: {req.refundId}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedApproveRequest(req)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                              title="Approve refund and process gateway refund"
                            >
                              <FaCheckCircle size={11} />
                              <span>Approve Refund</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedRejectRequest(req)}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                              title="Reject refund request"
                            >
                              <FaTimes size={11} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredRequests.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredRequests.length
              )}{" "}
              to{" "}
              {Math.min(currentPage * itemsPerPage, filteredRequests.length)}{" "}
              of {filteredRequests.length} requests
            </div>
            <PaginationComponent
              showIcons={true}
              data={filteredRequests}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {selectedApproveRequest && (
        <ApproveRefundModal
          isOpen={!!selectedApproveRequest}
          onClose={() => setSelectedApproveRequest(null)}
          request={selectedApproveRequest}
          onConfirmApprove={handleApproveSubmit}
          primaryColor={primaryColor}
        />
      )}

      {selectedRejectRequest && (
        <RejectRefundModal
          isOpen={!!selectedRejectRequest}
          onClose={() => setSelectedRejectRequest(null)}
          request={selectedRejectRequest}
          onConfirmReject={handleRejectSubmit}
        />
      )}
    </div>
  );
};

export default AdminRefundRequestsSection;
