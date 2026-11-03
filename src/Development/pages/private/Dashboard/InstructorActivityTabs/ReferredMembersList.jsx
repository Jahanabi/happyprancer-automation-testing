import React, { useContext, useEffect, useState, useMemo } from "react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import MemberPaymentDetailsModal from "./MemberPaymentDetailsModal";
import { getMemberGracePeriodInfo } from "../../../../utils/gracePeriod.js";
import { deduplicateUserList } from "../../../../utils/userDeduplication";
import {
  FaSearch,
  FaReceipt,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaInfoCircle,
} from "react-icons/fa";

const ITEMS_PER_PAGE = 8;

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

export const isMemberHybrid = (m) => {
  if (!m || typeof m !== "object") return false;
  if (m.isHybrid === true || m.isHybrid === "true") return true;
  if (m.hybridPageUser === true || m.hybridPageUser === "true") return true;
  const memberType = String(m.memberType || "").toLowerCase();
  if (memberType === "hybrid") return true;
  const regSource = String(m.registrationSource || "").toLowerCase();
  if (regSource === "hybrid") return true;
  const userType = String(m.userType || "").toLowerCase();
  if (userType === "hybrid") return true;
  const subType = String(m.subscriptionType || "").toLowerCase();
  if (subType === "hybrid") return true;
  const planSubType = String(m.planDetails?.subscriptionType || "").toLowerCase();
  if (planSubType === "hybrid") return true;
  const planName = String(m.planName || "").toLowerCase();
  if (planName.includes("hybrid")) return true;
  return false;
};

export const isMemberNormal = (m) => {
  if (!m || typeof m !== "object") return false;
  if (isMemberHybrid(m)) return false;
  const memberType = String(m.memberType || "").toLowerCase();
  if (memberType === "normal") return true;
  const regSource = String(m.registrationSource || "").toLowerCase();
  if (regSource === "referral") return true;
  if (m.isHybrid === false || m.hybridPageUser === false) return true;
  if (m.referred_code || m.referral_code) return true;
  return true;
};

function ReferredMembersList({
  members: propMembers,
  hybridMembers: propHybridMembers,
  normalMembers: propNormalMembers,
  allMembers: propAllMembers,
  counts: propCounts,
  loading: propLoading,
  error: propError,
  primaryColor: propPrimaryColor,
  onSelectMemberPayment,
}) {
  const { userData, getReferredMembers, getInstructorDashboard } =
    useContext(Context);
  const institutionCtx = useContext(InstitutionContext);
  const institutionData = institutionCtx?.institutionData;

  const [localMembers, setLocalMembers] = useState([]);
  const [localHybridMembers, setLocalHybridMembers] = useState([]);
  const [localNormalMembers, setLocalNormalMembers] = useState([]);
  const [localCounts, setLocalCounts] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [memberCategory, setMemberCategory] = useState("all"); // "all" | "hybrid" | "normal"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive" | "grace"
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalSelectedMember, setInternalSelectedMember] = useState(null);
  const [modalTab, setModalTab] = useState("overview");

  const isPropDriven =
    propMembers !== undefined ||
    propAllMembers !== undefined ||
    propHybridMembers !== undefined;
  const rawMembers = isPropDriven
    ? propAllMembers || propMembers || []
    : localMembers;
  const rawHybrid = propHybridMembers || localHybridMembers || [];
  const rawNormal = propNormalMembers || localNormalMembers || [];
  const rawCounts = propCounts || localCounts || null;

  const loading = isPropDriven ? propLoading : localLoading;
  const error = isPropDriven ? propError : localError;
  const primaryColor =
    propPrimaryColor || institutionData?.PrimaryColor || "#4F46E5";

  // Deduplication and category resolution
  const { allList, hybridList, normalList, resolvedCounts } = useMemo(() => {
    const hasExplicitHybrid = Array.isArray(rawHybrid) && rawHybrid.length > 0;
    const hasExplicitNormal = Array.isArray(rawNormal) && rawNormal.length > 0;

    const baseAll = deduplicateUserList(
      rawMembers?.length
        ? rawMembers
        : hasExplicitHybrid || hasExplicitNormal
        ? [...rawHybrid, ...rawNormal]
        : []
    );

    const hybrids = hasExplicitHybrid
      ? deduplicateUserList(rawHybrid)
      : baseAll.filter(isMemberHybrid);

    const normals = hasExplicitNormal
      ? deduplicateUserList(rawNormal)
      : baseAll.filter(isMemberNormal);

    // If explicit lists were passed, ensure allList is their deduplicated union
    let combinedAll = baseAll;
    if (hasExplicitHybrid || hasExplicitNormal) {
      combinedAll = deduplicateUserList([...hybrids, ...normals]);
    }

    const counts = {
      total: rawCounts?.total ?? combinedAll.length,
      hybrid: rawCounts?.hybrid ?? hybrids.length,
      normal: rawCounts?.normal ?? normals.length,
    };

    return {
      allList: combinedAll,
      hybridList: hybrids,
      normalList: normals,
      resolvedCounts: counts,
    };
  }, [rawMembers, rawHybrid, rawNormal, rawCounts]);

  // Selected Category List
  const selectedCategoryMembers = useMemo(() => {
    if (memberCategory === "hybrid") return hybridList;
    if (memberCategory === "normal") return normalList;
    return allList;
  }, [memberCategory, hybridList, normalList, allList]);

  // Fallback: If not passed as props, fetch dashboard directly
  useEffect(() => {
    if (isPropDriven) return;
    let cancelled = false;

    async function fetchFallback() {
      if (!userData?.referral_code && !userData?.institution) {
        return;
      }
      try {
        setLocalLoading(true);
        const isInstructorUser =
          String(userData?.userType || "").toLowerCase() === "instructor";

        // For instructors without props, attempt dashboard endpoint first with safe fallback
        if (
          isInstructorUser &&
          typeof getInstructorDashboard === "function"
        ) {
          try {
            const res = await getInstructorDashboard(
              institutionData?.InstitutionId,
              { period: "month" }
            );
            if (!cancelled && res?.data) {
              const d = res.data;
              setLocalMembers(d.allMembers || d.members || []);
              setLocalHybridMembers(d.hybridMembers || []);
              setLocalNormalMembers(d.normalMembers || []);
              setLocalCounts(d.counts || null);
              setLocalError(null);
              return;
            }
          } catch (dashErr) {
            console.warn(
              "Instructor dashboard fallback failed, falling back to referral code:",
              dashErr
            );
          }
        }

        // Standard referral-code fetch (used by Administrators and fallback for instructors)
        if (
          typeof getReferredMembers === "function" &&
          userData?.referral_code
        ) {
          const response = await getReferredMembers(userData.referral_code);
          if (!cancelled && response) {
            setLocalMembers(response.allMembers || response.referredMembers || []);
            setLocalHybridMembers(response.hybridMembers || []);
            setLocalNormalMembers(response.normalMembers || []);
            setLocalCounts(response.counts || null);
            setLocalError(null);
          }
        }
      } catch (err) {
        console.error("Error fetching referred members fallback:", err);
        if (!cancelled) setLocalError("Failed to load members.");
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    }

    fetchFallback();
    return () => {
      cancelled = true;
    };
  }, [
    isPropDriven,
    userData?.userType,
    userData?.referral_code,
    userData?.institution,
    institutionData?.InstitutionId,
    getInstructorDashboard,
    getReferredMembers,
  ]);

  // Precompute member grace status for accurate filtering and display
  const memberGraceMap = useMemo(() => {
    const map = new Map();
    for (const m of allList) {
      const graceInfo = getMemberGracePeriodInfo({
        ...m,
        status: m.membershipStatus || m.status,
        renewDate: m.membershipValidity || m.renewDateEpoch,
        isGracePeriod: m.isGracePeriod,
      });
      const isGrace =
        m.isGracePeriod !== undefined
          ? Boolean(m.isGracePeriod)
          : graceInfo.isGracePeriod;
      const remainingDays =
        m.remainingGraceDays !== undefined
          ? m.remainingGraceDays
          : graceInfo.remainingGraceDays;
      map.set(m.cognitoId || m.emailId, { isGrace, remainingDays });
    }
    return map;
  }, [allList]);

  // Derived counts for status within the selected category
  const activeMembersCount = useMemo(
    () =>
      selectedCategoryMembers.filter((m) => {
        const grace = memberGraceMap.get(m.cognitoId || m.emailId);
        const status = String(m.membershipStatus || m.status || "").toLowerCase();
        return status === "active" && !grace?.isGrace;
      }).length,
    [selectedCategoryMembers, memberGraceMap]
  );

  const inactiveMembersCount = useMemo(
    () =>
      selectedCategoryMembers.filter((m) => {
        const grace = memberGraceMap.get(m.cognitoId || m.emailId);
        const status = String(m.membershipStatus || m.status || "").toLowerCase();
        return status !== "active" && !grace?.isGrace;
      }).length,
    [selectedCategoryMembers, memberGraceMap]
  );

  const graceMembersCount = useMemo(
    () =>
      selectedCategoryMembers.filter((m) => {
        const grace = memberGraceMap.get(m.cognitoId || m.emailId);
        return Boolean(grace?.isGrace);
      }).length,
    [selectedCategoryMembers, memberGraceMap]
  );

  // Status Filtering
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "active") {
      return selectedCategoryMembers.filter((m) => {
        const grace = memberGraceMap.get(m.cognitoId || m.emailId);
        const status = String(m.membershipStatus || m.status || "").toLowerCase();
        return status === "active" && !grace?.isGrace;
      });
    }
    if (statusFilter === "inactive") {
      return selectedCategoryMembers.filter((m) => {
        const grace = memberGraceMap.get(m.cognitoId || m.emailId);
        const status = String(m.membershipStatus || m.status || "").toLowerCase();
        return status !== "active" && !grace?.isGrace;
      });
    }
    if (statusFilter === "grace") {
      return selectedCategoryMembers.filter((m) => {
        const grace = memberGraceMap.get(m.cognitoId || m.emailId);
        return Boolean(grace?.isGrace);
      });
    }
    return selectedCategoryMembers;
  }, [selectedCategoryMembers, statusFilter, memberGraceMap]);

  // Search Query Filtering
  const displayedMembers = useMemo(() => {
    if (!searchQuery.trim()) return filteredByStatus;
    const q = searchQuery.toLowerCase().trim();
    return filteredByStatus.filter(
      (m) =>
        (m.userName && m.userName.toLowerCase().includes(q)) ||
        (m.emailId && m.emailId.toLowerCase().includes(q)) ||
        (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q)) ||
        (m.planName && m.planName.toLowerCase().includes(q)) ||
        (m.subscriptionId && String(m.subscriptionId).toLowerCase().includes(q)) ||
        (m.productId && String(m.productId).toLowerCase().includes(q))
    );
  }, [filteredByStatus, searchQuery]);

  // Reset to page 1 on category/status/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [memberCategory, statusFilter, searchQuery]);

  // Pagination slice
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const paginatedMembers = displayedMembers.slice(indexOfFirst, indexOfLast);

  const handleOpenMemberModal = (member, tab = "overview") => {
    if (typeof onSelectMemberPayment === "function") {
      onSelectMemberPayment(member, tab);
    } else {
      setInternalSelectedMember(member);
      setModalTab(tab);
    }
  };

  const categoryTabsConfig = [
    { key: "all", label: "All Members", count: resolvedCounts.total },
    { key: "hybrid", label: "Hybrid Members", count: resolvedCounts.hybrid },
    { key: "normal", label: "Normal Members", count: resolvedCounts.normal },
  ];

  const statusTabsConfig = [
    { key: "all", label: `All (${selectedCategoryMembers.length})` },
    { key: "active", label: `Active (${activeMembersCount})` },
    { key: "inactive", label: `Inactive (${inactiveMembersCount})` },
    { key: "grace", label: `Grace Period (${graceMembersCount})` },
  ];

  return (
    <div className="w-full">
      {/* Category Tabs Strip: All Members, Hybrid Members, Normal Members */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Classification Segmented Tabs */}
        <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
          {categoryTabsConfig.map((cat) => {
            const isActive = memberCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setMemberCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={isActive ? { color: primaryColor } : undefined}
              >
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, plan..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Status Filter Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-2 border-b border-gray-100">
        <span className="text-[11px] font-medium text-gray-400 mr-1">Status:</span>
        {statusTabsConfig.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              style={{
                backgroundColor: isActive ? primaryColor : undefined,
                borderColor: isActive ? primaryColor : undefined,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{
              borderColor: primaryColor,
              borderTopColor: "transparent",
            }}
          />
          <span className="text-xs font-medium text-gray-500">
            Loading assigned member records...
          </span>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500 text-sm bg-red-50/50 rounded-xl border border-red-100">
          {error}
        </div>
      ) : displayedMembers.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
          <FaUser className="mx-auto text-gray-300 mb-2" size={24} />
          <p className="text-sm font-semibold text-gray-700">No members found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery
              ? "Try refining your search keyword."
              : "No members match the selected category."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-gray-50/90 text-gray-500 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Plan / Subscription</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joining & Renewal</th>
                  <th className="px-4 py-3 text-center">Attendance</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMembers.map((member, index) => {
                  const grace = memberGraceMap.get(
                    member.cognitoId || member.emailId
                  );
                  const isGrace = Boolean(grace?.isGrace);
                  const remainingDays = grace?.remainingDays ?? 0;

                  const statusStr = String(
                    member.membershipStatus || member.status || "Unknown"
                  );
                  const isStatusActive = statusStr.toLowerCase() === "active";
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
                    <tr
                      key={member.cognitoId || member.emailId || index}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenMemberModal(member, "overview")}
                            className="text-left font-semibold text-gray-900 hover:underline"
                          >
                            {member.userName || "Member"}
                          </button>
                          {isMemberHybrid(member) ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Hybrid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Normal
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {member.emailId || "-"}
                        </div>
                        {member.phoneNumber && (
                          <div className="text-gray-400 text-[10px]">
                            {member.phoneNumber}
                          </div>
                        )}
                      </td>

                      {/* Plan / Subscription */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {member.planName || "Assigned Plan"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                            {member.subscriptionType ||
                              member.planDetails?.durationText ||
                              "Recurring"}
                          </span>
                          {(member.subscriptionId || member.productId) && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              &bull; ID: {member.subscriptionId || member.productId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status / Grace Period */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isGrace ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <FaExclamationTriangle size={9} className="text-amber-600" />
                            Grace ({remainingDays}d)
                          </span>
                        ) : isStatusActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 capitalize">
                            <FaUserCheck size={9} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                            <FaUserTimes size={9} />
                            {statusStr}
                          </span>
                        )}
                      </td>

                      {/* Joining & Renewal Dates */}
                      <td className="px-4 py-3 text-gray-600 text-[11px] whitespace-nowrap">
                        <div>
                          <span className="text-gray-400">Joined: </span>
                          <strong>
                            {formatDisplayDate(
                              member.joiningDate,
                              member.joiningDateEpoch
                            )}
                          </strong>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-gray-400">Valid: </span>
                          <span>
                            {formatDisplayDate(
                              member.membershipValidity,
                              member.renewDateEpoch
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Attendance (Backend Authoritative) */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {member.classesAttended ?? 0}{" "}
                          <span className="font-normal text-gray-500 text-[11px]">
                            attended
                          </span>
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          {member.classesMissed ?? 0} missed
                        </div>
                      </td>

                      {/* Outstanding Balance */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold text-xs ${
                            balanceNum > 0
                              ? "text-amber-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formatAmount(balanceNum, member.currency)}
                        </span>
                      </td>

                      {/* Paid Amounts (Multi-currency safe) */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-green-700">
                          {isPeriodMixed ? (
                            Object.entries(
                              member.totalAmountPaidInPeriodByCurrency
                            ).map(([curr, amt]) => (
                              <div key={curr} className="text-[11px]">
                                {curr} {formatAmount(amt, curr)}
                              </div>
                            ))
                          ) : (
                            formatAmount(
                              member.totalAmountPaidInPeriod ?? 0,
                              member.currency
                            )
                          )}
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          Total:{" "}
                          {isLifetimeMixed ? (
                            Object.entries(
                              member.totalAmountPaidByCurrency
                            ).map(([curr, amt]) => (
                              <span key={curr} className="ml-1">
                                {curr} {formatAmount(amt, curr)}
                              </span>
                            ))
                          ) : (
                            formatAmount(
                              member.totalAmountPaid ?? 0,
                              member.currency
                            )
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenMemberModal(member, "overview")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                            title="View member subscription report"
                          >
                            <FaInfoCircle size={10} className="text-gray-500" />
                            <span>Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMemberModal(member, "payments")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
                            title="View payment history"
                          >
                            <FaReceipt size={10} className="text-green-600" />
                            <span>Payments</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {displayedMembers.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex justify-center">
              <PaginationComponent
                data={displayedMembers}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                showIcons={true}
                hideResultsText={false}
              />
            </div>
          )}
        </>
      )}

      {/* Internal Modal Fallback */}
      {internalSelectedMember && (
        <MemberPaymentDetailsModal
          isOpen={!!internalSelectedMember}
          onClose={() => setInternalSelectedMember(null)}
          member={internalSelectedMember}
          initialTab={modalTab}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}

export default ReferredMembersList;
