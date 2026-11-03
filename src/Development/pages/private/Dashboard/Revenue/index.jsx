import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Pagination, Table, Dropdown } from "flowbite-react";
// import { API } from "../../../../Context/ContextProvider";
import {
  IoMdArrowDropup,
  IoMdArrowDropdown,
  IoMdPause,
  IoMdCloseCircle,
  IoMdSearch,
} from "react-icons/io";
import { FaUndoAlt, FaReceipt, FaClock } from "react-icons/fa";
import ConfirmRefundModal from "../../../../common/ConfirmRefundModal";
import AdminRefundRequestsSection from "./AdminRefundRequestsSection";
import Context from "../../../../Context/Context";
import RevenueSection from "./RevenueCard";
import { toast } from "react-toastify";

import DateFormatter from "../../../../common/utils/DateFormatter";
import PaginationComponent from "../../../../common/Pagination";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { getCanonicalUser } from "../../../../utils/userDeduplication";
import {
  getNormalizedPaymentMode,
  isPaymentRefunded as isPaymentRefundedUtil,
  isPaymentVerified,
  deduplicateSubscriptionPayments,
  formatCurrencyAmount,
} from "../../../../utils/revenueService";
function PaymentDetails() {
  const [currentPage, setCurrentPage] = useState(1);
  const [cashoutAmount, setCashoutAmount] = useState(null);
  const {
    userData,
    revenue,
    setRevenue,
    cancelSubscriptionAdmin,
    pauseSubscriptionAdmin,
    processRefundPayment,
    getPendingRefundRequests,
    reloadRevenue,
    getCashCollected,
    userList,
    getUserList,
  } = useContext(Context);
  const { institutionData } = useContext(InstitutionContext);

  useEffect(() => {
    if (!userList || userList.length === 0) {
      getUserList();
    }
  }, []);
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  });
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [expiredPaymentIds, setExpiredPaymentIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("revenue"); // "revenue" | "refunds"
  const [pendingRefundCount, setPendingRefundCount] = useState(0);

  const isAdmin = String(userData?.userType || "").toLowerCase() === "admin";

  const fetchPendingRefundCount = useCallback(async () => {
    if (!isAdmin) return;
    const instId = userData?.institution || institutionData?.InstitutionId;
    if (!instId || typeof getPendingRefundRequests !== "function") return;
    try {
      const res = await getPendingRefundRequests(instId);
      const list =
        res?.requests ||
        res?.refundRequests ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      const pending = list.filter(
        (r) =>
          String(r.status || "").toUpperCase() === "PENDING_APPROVAL" ||
          String(r.status || "").toUpperCase() === "PENDING"
      ).length;
      setPendingRefundCount(pending);
    } catch (err) {
      console.warn("Could not check pending refund requests count:", err);
    }
  }, [isAdmin, userData?.institution, institutionData?.InstitutionId, getPendingRefundRequests]);

  useEffect(() => {
    fetchPendingRefundCount();
  }, [fetchPendingRefundCount]);

  const months = useMemo(
    () => [
      "All time",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    [],
  );

  const [selectedMonth, setSelectedMonth] = useState(months[currentMonth]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const SortIcon = React.memo(({ isActive, direction }) => (
    <span className="inline-flex flex-col ml-1 relative h-4 w-3">
      <IoMdArrowDropup
        className={`absolute top-0 ${
          isActive && direction === "ascending"
            ? "text-blue-600"
            : "text-gray-400"
        }`}
        size={12}
      />
      <IoMdArrowDropdown
        className={`absolute bottom-0 ${
          isActive && direction === "descending"
            ? "text-blue-600"
            : "text-gray-400"
        }`}
        size={12}
      />
    </span>
  ));

  useEffect(() => {
    const fetchCashoutAmount = async () => {
      if (!userData?.institution) return;

      try {
        const response = await getCashCollected(userData.institution);
        if (response) {
          const clientData = response.client || [];
          setCashoutAmount({
            client: Array.isArray(clientData) ? clientData : [clientData].filter(Boolean),
            payments: response.payments || null,
            paymentDate:
              (Array.isArray(clientData)
                ? clientData[0]?.lastUpdated
                : clientData?.lastUpdated) || null,
          });
        }
      } catch (error) {
        console.error("Error fetching cashout amount:", error);
        setCashoutAmount(null);
      }
    };

    fetchCashoutAmount();
  }, [userData?.institution]);

  const getUserDetails = useCallback(
    (payment) => {
      if (!payment) return { name: "N/A", phoneNumber: "N/A" };

      const name = payment.name || payment.userDetails?.userName || payment.userName;
      const phoneNumber = payment.phoneNumber || payment.userDetails?.phoneNumber;

      if (name && phoneNumber) {
        return { name, phoneNumber };
      }

      const matchedUser = userList?.find(
        (u) =>
          (payment.cognitoId && u.cognitoId === payment.cognitoId) ||
          (payment.emailId && u.emailId === payment.emailId)
      );

      const canonicalUser = getCanonicalUser(userList || [], {
        cognitoId: payment.cognitoId,
        email: payment.emailId || payment.email,
      });

      return {
        name: name || canonicalUser?.userName || payment.emailId || "N/A",
        phoneNumber: phoneNumber || canonicalUser?.phoneNumber || "N/A",
      };
    },
    [userList]
  );

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      key = null;
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || !revenue) return revenue;

    return [...revenue].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "userName":
          aValue = getUserDetails(a).name.toLowerCase();
          bValue = getUserDetails(b).name.toLowerCase();
          break;
        case "phoneNumber":
          aValue = getUserDetails(a).phoneNumber;
          bValue = getUserDetails(b).phoneNumber;
          break;
        case "products":
          aValue = a.userDetails?.products?.length || 0;
          bValue = b.userDetails?.products?.length || 0;
          break;
        case "amount":
          aValue = Number(a.amount) || 0;
          bValue = Number(b.amount) || 0;
          break;
        case "paymentDate":
          aValue = new Date(a.paymentDate || 0).getTime();
          bValue = new Date(b.paymentDate || 0).getTime();
          break;
        default:
          aValue = (
            a[sortConfig.key]?.toLowerCase?.() ||
            a[sortConfig.key] ||
            ""
          ).toString();
          bValue = (
            b[sortConfig.key]?.toLowerCase?.() ||
            b[sortConfig.key] ||
            ""
          ).toString();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === "ascending"
        ? aValue - bValue
        : bValue - aValue;
    });
  }, [revenue, sortConfig, userList, getUserDetails]);

  const filteredPayments = useMemo(() => {
    if (!revenue) return [];

    let filtered = sortData;

    // Filter by year and month
    if (selectedYear !== "All time") {
      filtered = sortData?.filter((payment) => {
        const date = new Date(payment.paymentDate);
        const paymentYear = date.getFullYear();
        const paymentMonth = date.getMonth() + 1;

        const isYearMatch = paymentYear === parseInt(selectedYear);
        const isMonthMatch =
          selectedMonth === "All time" ||
          paymentMonth === months.indexOf(selectedMonth);

        return isYearMatch && isMonthMatch;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered?.filter((payment) => {
        const details = getUserDetails(payment);
        const userName = details.name.toLowerCase();
        const phoneNumber = details.phoneNumber.toLowerCase();
        const paymentMode = getNormalizedPaymentMode(payment);
        const amount = ((Number(payment.amount) || 0) / 100).toFixed(2).toString();

        return (
          userName.includes(query) ||
          phoneNumber.includes(query) ||
          paymentMode.includes(query) ||
          amount.includes(query)
        );
      });
    }

    return filtered;
  }, [sortData, selectedYear, selectedMonth, months, searchQuery, userList, getUserDetails]);

  const { totalOnlineAmount, totalOfflineAmount } = useMemo(() => {
    if (!filteredPayments || !Array.isArray(filteredPayments)) {
      return { totalOnlineAmount: 0, totalOfflineAmount: 0 };
    }

    const valid = filteredPayments.filter(
      (p) => isPaymentVerified(p) && !isPaymentRefundedUtil(p)
    );
    const clean = deduplicateSubscriptionPayments(valid);

    let onlineTotal = 0;
    let offlineTotal = 0;

    for (const p of clean) {
      const amt = Number(p.amount) || 0;
      if (getNormalizedPaymentMode(p) === "offline") {
        offlineTotal += amt;
      } else {
        onlineTotal += amt;
      }
    }

    return {
      totalOnlineAmount: onlineTotal,
      totalOfflineAmount: offlineTotal,
    };
  }, [filteredPayments]);

  const selectedPayments = useMemo(() => {
    return (
      filteredPayments?.slice((currentPage - 1) * 7, currentPage * 7) || []
    );
  }, [filteredPayments, currentPage]);

  const handleRowClick = (payment) => {
    console.log("Payment details:", payment);
  };

  const handlePauseClick = (e, payment) => {
    e.stopPropagation(); // Prevent row click
    setSelectedPayment(payment);
    setShowPauseModal(true);
  };

  const handleCancelClick = (e, payment) => {
    e.stopPropagation(); // Prevent row click
    setSelectedPayment(payment);
    setShowCancelModal(true);
  };

  const isPaymentRefunded = (payment) => isPaymentRefundedUtil(payment);

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

  const getPaymentRefundInfo = (payment) => {
    if (!payment) return { isOnline: false, refundable: false };
    if (isPaymentRefunded(payment)) {
      return { isOnline: true, status: "refunded", refundable: false };
    }

    const refundStatusLower = String(payment.refundStatus || "").toLowerCase();
    if (
      refundStatusLower === "pending_approval" ||
      refundStatusLower === "pending"
    ) {
      return { isOnline: true, status: "pending_approval", refundable: false };
    }
    if (refundStatusLower === "processing") {
      return { isOnline: true, status: "processing", refundable: false };
    }
    if (refundStatusLower === "rejected") {
      return { isOnline: true, status: "rejected", refundable: false };
    }
    if (refundStatusLower === "expired") {
      return { isOnline: true, status: "expired", refundable: false };
    }
    if (refundStatusLower === "failed") {
      return { isOnline: true, status: "failed", refundable: false };
    }

    const mode = String(payment.paymentMode || "").toLowerCase();
    const method = String(payment.paymentMethod || "").toLowerCase();
    const provider = String(payment.provider || "").toLowerCase();
    if (
      mode === "offline" ||
      mode === "manual" ||
      method === "offline" ||
      method === "manual" ||
      provider === "offline"
    ) {
      return { isOnline: false, status: "offline", refundable: false };
    }

    if (!payment.paymentId) {
      return { isOnline: false, status: "ineligible", refundable: false };
    }

    const isExpired =
      expiredPaymentIds.has(payment.paymentId) ||
      !isWithin72Hours(payment.paymentDate);

    if (isExpired) {
      return { isOnline: true, status: "expired", refundable: false };
    }

    return { isOnline: true, status: "available", refundable: true };
  };

  const isOnlineGatewayPayment = (payment) => getPaymentRefundInfo(payment).refundable;

  const handleRefundClick = (e, payment) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleConfirmRefund = async ({ paymentId, cognitoId, reason }) => {
    if (typeof processRefundPayment !== "function") {
      throw new Error("Refund service is not available.");
    }
    const instId = userData.institution || institutionData?.InstitutionId;
    try {
      const res = await processRefundPayment({
        institutionId: instId,
        paymentId,
        cognitoId:
          cognitoId ||
          selectedPayment?.userDetails?.cognitoId ||
          selectedPayment?.cognitoId,
        reason,
      });

      if (revenue && Array.isArray(revenue)) {
        const updated = revenue.map((p) =>
          p.paymentId === paymentId
            ? {
                ...p,
                refundStatus: "pending_approval",
                refundRequestId: res?.refundRequestId,
              }
            : p
        );
        if (typeof setRevenue === "function") {
          setRevenue(updated);
        }
      }

      toast.success("Refund request submitted for admin approval.");
      setShowRefundModal(false);
      setSelectedPayment(null);
      if (typeof fetchPendingRefundCount === "function") {
        fetchPendingRefundCount();
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

  const handlePauseSubscription = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    try {
      const cognitoId =
        selectedPayment.userDetails?.cognitoId || selectedPayment.cognitoId;
      const subscriptionId = selectedPayment.subscriptionId;
      const gateway = selectedPayment?.provider || "razorpay";
      const paymentId = selectedPayment?.paymentId;
      if (!cognitoId) {
        toast.error("User ID not found");
        setIsProcessing(false);
        return;
      }
      await pauseSubscriptionAdmin({
        cognitoId,
        subscriptionId,
        gateway,
        paymentId,
        institutionId: userData.institution,
      });
      setShowPauseModal(false);
      setSelectedPayment(null);
      // Update the status in revenue (local state) for real-time UI update
      if (revenue && Array.isArray(revenue)) {
        const updated = revenue.map((p) =>
          p.paymentId === selectedPayment.paymentId
            ? {
                ...p,
                subscriptionStatus: {
                  ...(p.subscriptionStatus || {}),
                  status: "paused",
                },
              }
            : p,
        );
        // If revenue is from context, update context if possible, else use a local state
        if (typeof setRevenue === "function") {
          setRevenue(updated);
        }
      }
      toast.success("Subscription paused successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to pause subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    try {
      const cognitoId =
        selectedPayment.userDetails?.cognitoId || selectedPayment.cognitoId;
      const subscriptionId = selectedPayment.subscriptionId;
      const gateway = selectedPayment?.provider || "razorpay";
      const paymentId = selectedPayment?.paymentId;
      if (!cognitoId) {
        toast.error("User ID not found");
        setIsProcessing(false);
        return;
      }
      await cancelSubscriptionAdmin({
        cognitoId,
        subscriptionId,
        gateway,
        paymentId,
        institutionId: userData.institution,
      });
      setShowCancelModal(false);
      setSelectedPayment(null);
      // Update the status in revenue (local state) for real-time UI update
      if (revenue && Array.isArray(revenue)) {
        const updated = revenue.map((p) =>
          p.paymentId === selectedPayment.paymentId
            ? {
                ...p,
                subscriptionStatus: {
                  ...(p.subscriptionStatus || {}),
                  status: "cancelled",
                },
              }
            : p,
        );
        if (typeof setRevenue === "function") {
          setRevenue(updated);
        }
      }
      toast.success("Subscription cancelled successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatEpochToReadableDate = (epoch) => {
    if (!epoch) return "N/A";
    return new Date(epoch).toLocaleDateString();
  };

  const formatAmountWithCurrency = (amount, currency = "INR") => {
    return formatCurrencyAmount(amount, currency, {
      subunit: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const availableMonths = useMemo(() => {
    if (selectedYear === currentYear) {
      return months.slice(0, currentMonth + 1);
    }
    return months;
  }, [selectedYear, currentYear, currentMonth, months]);

  const tableHeaders = [
    { key: "userName", label: "Name", className: "w-28" },
    { key: "phoneNumber", label: "Phone Number", className: "w-32" },
    { key: "paymentDate", label: "Payment Date", className: "w-32" },
    { key: "paymentMode", label: "Payment Mode", className: "w-32" },
    { key: "renew date", label: "renew date", className: "w-28" },
    { key: "status", label: "Status", className: "w-28" },
    { key: "amount", label: "Amount", className: "w-28" },
    { key: "action", label: "Action", className: "w-28" },
  ];

  const CustomTableHeadCell = React.memo(
    ({ onClick, children, sortKey, className }) => (
      <Table.HeadCell
        className={`h-14 px-6 py-2 text-center text-xs font-medium text-white uppercase cursor-pointer ${className}`}
        onClick={onClick}>
        <div className="flex items-center justify-center gap-1 h-full">
          <span className="truncate">{children}</span>
          <SortIcon
            isActive={sortConfig.key === sortKey}
            direction={sortConfig.direction}
          />
        </div>
      </Table.HeadCell>
    ),
  );

  const getSubscriptionStatus = (payment) => {
    const apiStatus = payment?.subscriptionStatus?.status;

    if (!apiStatus) {
      return payment?.subscriptionId ? "active" : "inactive";
    }

    const status = apiStatus.toLowerCase();

    if (["cancelled", "canceled", "expired"].includes(status)) {
      return "cancelled";
    }

    if (["paused", "suspended"].includes(status)) {
      return "paused";
    }

    if (["active"].includes(status)) {
      return "active";
    }

    // 🔥 UNKNOWN should NOT mean inactive blindly
    return payment?.subscriptionId ? "active" : "inactive";
  };

  return (
    <div className="p-4 Inter max850:p-1">
      <div className="w-full">
        {/* Admin Section Tabs */}
        {isAdmin && (
          <div className="w-full flex items-center justify-between border-b border-gray-200 mb-6 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("revenue")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "revenue"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FaReceipt size={13} />
                <span>Revenue & Transactions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("refunds")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                  activeTab === "refunds"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FaUndoAlt size={12} />
                <span>Refund Requests</span>
                {pendingRefundCount > 0 && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      activeTab === "refunds"
                        ? "bg-white text-indigo-700"
                        : "bg-amber-500 text-white animate-pulse"
                    }`}
                  >
                    {pendingRefundCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pending Requests Alert Banner (when on Revenue tab) */}
        {isAdmin && pendingRefundCount > 0 && activeTab === "revenue" && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <FaClock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">
                  {pendingRefundCount} Pending Refund {pendingRefundCount === 1 ? "Request" : "Requests"} Awaiting Approval
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Review and authorize refund requests submitted by instructors and administrators.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("refunds")}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Review Requests ({pendingRefundCount})</span>
            </button>
          </div>
        )}

        {/* Tab 2: Admin Refund Requests Section */}
        {isAdmin && activeTab === "refunds" ? (
          <AdminRefundRequestsSection
            onDataChanged={() => {
              if (typeof fetchPendingRefundCount === "function") {
                fetchPendingRefundCount();
              }
            }}
          />
        ) : (
          <>
            <div className="w-full flex justify-center gap-2 flex-wrap mb-4">
              <div className="border flex items-center justify-center w-32 py-1 rounded-md">
                <Dropdown label={selectedYear.toString()} inline>
              <div className="flex flex-col items-left">
                <Dropdown.Item onClick={() => setSelectedYear("All time")}>
                  All time
                </Dropdown.Item>
                {years?.map((year) => (
                  <Dropdown.Item
                    key={year}
                    onClick={() => setSelectedYear(year)}>
                    {year}
                  </Dropdown.Item>
                ))}
              </div>
            </Dropdown>
          </div>

          {selectedYear !== "All time" && (
            <div className="border flex items-center justify-center w-32 rounded-md">
              <Dropdown label={selectedMonth} inline>
                {availableMonths?.map((month) => (
                  <Dropdown.Item
                    key={month}
                    onClick={() => setSelectedMonth(month)}>
                    {month}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </div>
          )}
        </div>

        <RevenueSection
          revenue={filteredPayments}
          cashoutAmount={cashoutAmount}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          totalOnlineAmount={totalOnlineAmount}
          totalOfflineAmount={totalOfflineAmount}
          userLocation={userData?.location?.countryCode}
        />

        {/* Search Bar */}
        <div className="mt-6 mb-4 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <IoMdSearch className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, payment mode, or amount..."
              className="block w-full pl-10 pr-10 py-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                <IoMdCloseCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 max-w-full mx-auto">
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table hoverable className="min-w-full table-fixed">
              <Table.Head className="bg-white">
                {tableHeaders.map((column) => (
                  <CustomTableHeadCell
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    sortKey={column.key}
                    className={column.className}>
                    {column.label}
                  </CustomTableHeadCell>
                ))}
              </Table.Head>
              <Table.Body className="divide-y">
                {selectedPayments?.map((payment) => (
                  <Table.Row
                    key={payment.paymentId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(payment)}>
                    <Table.Cell className="h-12 text-sm text-gray-500 text-center w-32 overflow-hidden">
                      <div className="truncate px-2">
                        {getUserDetails(payment).name}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="h-12 text-sm text-gray-500 text-center w-32 overflow-hidden">
                      <div className="truncate px-2">
                        {getUserDetails(payment).phoneNumber}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="h-12 text-sm text-gray-500 text-center w-32 overflow-hidden">
                      <div className="truncate px-2">
                        {/* {formatEpochToReadableDate(payment.paymentDate)} */}
                        <DateFormatter epochDate={payment.paymentDate} />
                      </div>
                    </Table.Cell>
                    <Table.Cell className="h-12 text-sm text-gray-500 text-center w-32">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getNormalizedPaymentMode(payment) === "offline"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-green-100 text-green-600"
                        }`}>
                        {getNormalizedPaymentMode(payment) === "offline"
                          ? "Offline"
                          : "Online"}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="h-12 text-sm text-gray-500 text-center w-32 overflow-hidden">
                      <div className="truncate px-2">
                        {/* {formatEpochToReadableDate(payment.renewDate)} */}
                        <DateFormatter epochDate={payment.renewDate} />
                      </div>
                    </Table.Cell>
                    <Table.Cell className="h-12 text-sm text-center">
                      {(() => {
                        if (isPaymentRefunded(payment)) {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                              Refunded
                            </span>
                          );
                        }

                        const refStatus = String(payment.refundStatus || "").toLowerCase();
                        if (refStatus === "pending_approval" || refStatus === "pending") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Pending Approval
                            </span>
                          );
                        }

                        if (refStatus === "processing") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Processing
                            </span>
                          );
                        }

                        if (refStatus === "rejected") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600">
                              Rejected
                            </span>
                          );
                        }

                        if (refStatus === "expired") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              Expired
                            </span>
                          );
                        }

                        const status = getSubscriptionStatus(payment);

                        if (status === "cancelled") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600">
                              Cancelled
                            </span>
                          );
                        }

                        if (status === "paused") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                              Paused
                            </span>
                          );
                        }

                        if (status === "active") {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
                              Active
                            </span>
                          );
                        }

                        return (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        );
                      })()}
                    </Table.Cell>

                    <Table.Cell className="h-12 text-sm text-gray-500 text-center w-32 overflow-hidden">
                      <div className="truncate px-2">
                        {formatAmountWithCurrency(
                          payment.amount,
                          payment.currency,
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell className="h-12 text-sm text-center">
                      {isPaymentRefunded(payment) ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                          Refunded
                        </span>
                      ) : (
                        <div className="flex justify-center gap-1.5 text-xs font-medium items-center flex-wrap">
                          {payment.subscriptionId && (() => {
                            const status = getSubscriptionStatus(payment);
                            if (status === "cancelled") return null;
                            return (
                              <>
                                {status !== "paused" && (
                                  <button
                                    onClick={(e) => handlePauseClick(e, payment)}
                                    className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                  >
                                    Pause
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleCancelClick(e, payment)}
                                  className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                                >
                                  Cancel
                                </button>
                              </>
                            );
                          })()}

                          {(() => {
                            const refundInfo = getPaymentRefundInfo(payment);
                            if (!refundInfo.isOnline && refundInfo.status !== "refunded") {
                              return null;
                            }
                            if (refundInfo.status === "pending_approval") {
                              return (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Pending Approval
                                </span>
                              );
                            }
                            if (refundInfo.status === "processing") {
                              return (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Processing
                                </span>
                              );
                            }
                            if (refundInfo.status === "rejected") {
                              return (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                  Refund Rejected
                                </span>
                              );
                            }
                            if (refundInfo.refundable) {
                              return (
                                <button
                                  onClick={(e) => handleRefundClick(e, payment)}
                                  className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition font-semibold flex items-center gap-1 shadow-xs"
                                  title="Issue full gateway refund"
                                >
                                  <FaUndoAlt size={10} />
                                  Refund Payment
                                </button>
                              );
                            }
                            if (refundInfo.status === "expired") {
                              return (
                                <div className="inline-flex flex-col items-center">
                                  <button
                                    disabled
                                    className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed font-semibold flex items-center gap-1 opacity-75"
                                    title="Refund window expired (exceeded 72 hours from payment timestamp)"
                                  >
                                    <FaUndoAlt size={10} />
                                    Refund Payment
                                  </button>
                                  <span className="text-[10px] text-amber-700 font-medium mt-0.5 whitespace-nowrap">
                                    Refund window expired
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {!payment.subscriptionId && !isOnlineGatewayPayment(payment) && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          {/* <div className="py-4 flex justify-between items-center px-6 border-t"> */}
          {/* <div className="text-sm text-gray-600">
              Showing {Math.min((currentPage - 1) * 7 + 1, filteredPayments?.length || 0)}-
              {Math.min(currentPage * 7, filteredPayments?.length || 0)}{" "}
              of {filteredPayments?.length || 0}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil((filteredPayments?.length || 0) / 7)}
              onPageChange={setCurrentPage}
              className="flex justify-end"
            /> */}
          {/* </div> */}
          <div className="mt-3">
            <PaginationComponent
              showIcons={true}
              data={filteredPayments}
              itemsPerPage={7}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
          </>
        )}
      </div>

      {/* Pause Subscription Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <IoMdPause className="text-yellow-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Pause Subscription
                </h3>
              </div>
              {selectedPayment?.subscriptionStatus?.rawStatus?.toLowerCase() ===
                "authenticated" && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800">
                        Warning
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This subscription is not fully activated yet. Pausing it
                        now will result in cancellation instead of just pausing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to pause the subscription for{" "}
                <span className="font-semibold">
                  {getUserDetails(selectedPayment).name}
                </span>
                ? The subscription will be temporarily suspended and can be
                resumed later.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {
                    setShowPauseModal(false);
                    setSelectedPayment(null);
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handlePauseSubscription}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Pausing...
                    </>
                  ) : (
                    <>
                      <IoMdPause size={18} />
                      Pause Subscription
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <IoMdCloseCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Cancel Subscription
                </h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to cancel the subscription for{" "}
                <span className="font-semibold">
                  {getUserDetails(selectedPayment).name}
                </span>
                ? This action cannot be undone and the user will lose access to
                their subscription immediately.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedPayment(null);
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <IoMdCloseCircle size={18} />
                      Cancel Subscription
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Online Gateway Refund */}
      {showRefundModal && selectedPayment && (
        <ConfirmRefundModal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          member={getUserDetails(selectedPayment)}
          onConfirmRefund={handleConfirmRefund}
          primaryColor={institutionData?.PrimaryColor || "#4F46E5"}
        />
      )}
    </div>
  );
}

export default PaymentDetails;
