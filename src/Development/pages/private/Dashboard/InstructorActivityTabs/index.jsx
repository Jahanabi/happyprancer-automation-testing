import React, { useContext, useState, useEffect, useCallback } from "react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import ReferredMembersList from "./ReferredMembersList";
import InstructorClassesTaken from "./InstructorClassesTaken";
import InstructorPlanCard from "./InstructorPlanCard";
import MemberPaymentDetailsModal from "./MemberPaymentDetailsModal";
import {
  FaUsers,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaLayerGroup,
  FaFilter,
  FaCalendarAlt,
  FaSyncAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const PERIODS = [
  { key: "month", label: "This Month" },
  { key: "today", label: "Today" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

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

const formatPeriodDate = (isoOrMs) => {
  if (!isoOrMs) return "";
  try {
    if (isoOrMs instanceof Date) {
      if (isNaN(isoOrMs.getTime()) || isoOrMs.getFullYear() <= 1970) return "";
      return isoOrMs.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const num = Number(isoOrMs);
    // Timestamp 0 or unix epoch start (< 1 day) is not a real user reporting date
    if (!isNaN(num) && num <= 86400000) return "";

    const date =
      !isNaN(num) && num > 1000000000
        ? new Date(num < 1000000000000 ? num * 1000 : num)
        : new Date(isoOrMs);
    if (isNaN(date.getTime()) || date.getFullYear() <= 1970) return "";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

function InstructorActivityTabs() {
  const { userData, getInstructorDashboard } = useContext(Context);
  const institutionCtx = useContext(InstitutionContext);
  const institutionData = institutionCtx?.institutionData;

  const [activeTab, setActiveTab] = useState("members");
  const [period, setPeriod] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPaymentMember, setSelectedPaymentMember] = useState(null);
  const [selectedModalTab, setSelectedModalTab] = useState("overview");

  const primaryColor = institutionData?.PrimaryColor || "#4F46E5";
  const institutionId = institutionData?.InstitutionId || userData?.institution;

  const fetchDashboard = useCallback(
    async (targetPeriod, start, end) => {
      if (!institutionId) {
        setLoading(false);
        return;
      }

      const activePeriod = targetPeriod || period;
      if (activePeriod === "custom" && (!start || !end)) {
        toast.warn("Please select both start and end dates for custom period.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = { period: activePeriod };
        if (activePeriod === "custom") {
          params.startDate = start;
          params.endDate = end;
        }

        const response = await getInstructorDashboard(institutionId, params);

        if (response && response.success && response.data) {
          setDashboardData(response.data);
        } else if (response && response.data) {
          setDashboardData(response.data);
        } else {
          setDashboardData(response || null);
        }
      } catch (err) {
        console.error("Error fetching instructor dashboard:", err);
        setError("Failed to load instructor dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [institutionId, getInstructorDashboard, period]
  );

  useEffect(() => {
    if (period !== "custom") {
      fetchDashboard(period);
    }
  }, [period, fetchDashboard]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      fetchDashboard(newPeriod);
    }
  };

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) {
      toast.warn("Please provide both start and end dates.");
      return;
    }
    fetchDashboard("custom", customStartDate, customEndDate);
  };

  const summary = dashboardData?.summary;
  const plans = dashboardData?.plans || [];
  const allMembers = dashboardData?.allMembers || dashboardData?.members || [];
  const hybridMembers = dashboardData?.hybridMembers || [];
  const normalMembers = dashboardData?.normalMembers || [];
  const counts = dashboardData?.counts || null;
  const activeProductId = dashboardData?.activeProductId;

  // Determine if multi-currency totals exist
  const isMixedCurrency =
    summary?.currency === "MIXED" ||
    summary?.paymentsCollected === null ||
    (summary?.paymentsCollectedByCurrency &&
      Object.keys(summary.paymentsCollectedByCurrency).length > 1);

  const totalMembersCount =
    counts?.total ?? summary?.totalMembers ?? allMembers.length;

  const TABS = [
    { key: "members", label: `My Members (${totalMembersCount})` },
    { key: "plans", label: `My Plans (${plans.length})` },
    { key: "classes", label: "Classes Taken" },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Dashboard Header & Controls */}
      <div className="w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Instructor Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track assigned plans, enrolled members, class attendance, and revenue performance.
            </p>
          </div>

          {/* Period Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-gray-100/90 rounded-xl border border-gray-200 shadow-inner">
              {PERIODS.map((p) => {
                const isActive = period === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePeriodChange(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                fetchDashboard(period, customStartDate, customEndDate)
              }
              disabled={loading}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
              title="Refresh dashboard data"
            >
              <FaSyncAlt size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Strip */}
        {period === "custom" && (
          <form
            onSubmit={handleApplyCustomDates}
            className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center gap-3 animate-fadeIn"
          >
            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
              <FaFilter size={11} className="text-gray-400" />
              <span>Custom Date Range:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                required
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-sm transition-all hover:opacity-95"
              style={{ backgroundColor: primaryColor }}
            >
              Apply Filter
            </button>
          </form>
        )}

        {/* Reporting Period Info Banner */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <FaCalendarAlt size={11} className="text-gray-400 shrink-0" />
          <span>
            Reporting Period:{" "}
            {(() => {
              const now = new Date();
              if (period === "all") {
                return <strong className="text-gray-700">All Time</strong>;
              }

              if (period === "today") {
                const todayFormatted =
                  formatPeriodDate(summary?.reportingPeriod?.startDate) ||
                  formatPeriodDate(now);
                return <strong className="text-gray-700">{todayFormatted}</strong>;
              }

              if (period === "month") {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startFormatted =
                  formatPeriodDate(summary?.reportingPeriod?.startDate) ||
                  formatPeriodDate(startOfMonth);
                const endFormatted =
                  formatPeriodDate(summary?.reportingPeriod?.endDate) ||
                  formatPeriodDate(now);
                return (
                  <>
                    <strong className="text-gray-700">{startFormatted}</strong>
                    {" – "}
                    <strong className="text-gray-700">{endFormatted}</strong>
                  </>
                );
              }

              if (period === "custom") {
                const startFormatted =
                  formatPeriodDate(customStartDate) ||
                  formatPeriodDate(summary?.reportingPeriod?.startDate);
                const endFormatted =
                  formatPeriodDate(customEndDate) ||
                  formatPeriodDate(summary?.reportingPeriod?.endDate);
                if (startFormatted && endFormatted) {
                  return (
                    <>
                      <strong className="text-gray-700">{startFormatted}</strong>
                      {" – "}
                      <strong className="text-gray-700">{endFormatted}</strong>
                    </>
                  );
                }
                return <strong className="text-gray-700">Custom Range</strong>;
              }

              // Fallback for any other period
              const fallbackStart = formatPeriodDate(summary?.reportingPeriod?.startDate);
              const fallbackEnd = formatPeriodDate(summary?.reportingPeriod?.endDate);
              if (!fallbackStart) {
                return <strong className="text-gray-700">All Time</strong>;
              }
              return (
                <>
                  <strong className="text-gray-700">{fallbackStart}</strong>
                  {" – "}
                  <strong className="text-gray-700">{fallbackEnd || formatPeriodDate(now)}</strong>
                </>
              );
            })()}
          </span>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="w-full mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" size={14} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard(period, customStartDate, customEndDate)}
            className="px-3 py-1 bg-white border border-red-200 rounded-lg text-red-700 font-semibold hover:bg-red-50 transition-colors shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-7">
        {/* Card 1: Total Plans */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Assigned Plans
            </span>
            {loading ? (
              <div className="h-7 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.totalPlans ?? plans.length}
              </div>
            )}
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            <FaLayerGroup size={20} />
          </div>
        </div>

        {/* Card 2: Total Members */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Enrolled Members
            </span>
            {loading ? (
              <div className="h-7 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {totalMembersCount}
                </div>
                {counts && (counts.hybrid > 0 || counts.normal > 0) && (
                  <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {counts.hybrid} Hybrid &bull; {counts.normal} Normal
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
            <FaUsers size={20} />
          </div>
        </div>

        {/* Card 3: Classes Conducted */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Classes Conducted
            </span>
            {loading ? (
              <div className="h-7 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.classesConducted ?? 0}
              </div>
            )}
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
            <FaCalendarCheck size={20} />
          </div>
        </div>

        {/* Card 4: Payments Collected (Single Currency vs MIXED - Never combined) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex-1 pr-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Payments Collected
            </span>
            <div className="mt-1">
              {loading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : isMixedCurrency ? (
                /* Multi-currency breakdown - DO NOT combine */
                <div className="space-y-1">
                  {summary?.paymentsCollectedByCurrency &&
                  Object.keys(summary.paymentsCollectedByCurrency).length > 0 ? (
                    Object.entries(summary.paymentsCollectedByCurrency).map(
                      ([curr, amt]) => (
                        <div
                          key={curr}
                          className="text-base font-bold text-green-700 flex items-center gap-1.5"
                        >
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-800">
                            {curr}
                          </span>
                          <span>{formatAmount(amt, curr)}</span>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-base font-bold text-gray-500">0</div>
                  )}
                </div>
              ) : (
                /* Single Currency */
                <div className="text-2xl font-bold text-green-700">
                  {formatAmount(
                    summary?.paymentsCollected ?? 0,
                    summary?.currency || "INR"
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-50 text-green-700 shrink-0">
            <FaMoneyBillWave size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="w-full mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? "border-current"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={
                activeTab === tab.key ? { color: primaryColor } : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="w-full">
        {activeTab === "members" && (
          <ReferredMembersList
            members={allMembers}
            hybridMembers={hybridMembers}
            normalMembers={normalMembers}
            allMembers={allMembers}
            counts={counts}
            loading={loading}
            error={error}
            primaryColor={primaryColor}
            onSelectMemberPayment={(member, tab = "overview") => {
              setSelectedPaymentMember(member);
              setSelectedModalTab(tab);
            }}
          />
        )}

        {activeTab === "plans" && (
          <div className="w-full animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Assigned Subscription Plans ({plans.length})
              </h2>
            </div>

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
                  Loading assigned plans...
                </span>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-500 text-sm bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            ) : plans.length === 0 ? (
              <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-base font-semibold text-gray-700">
                  No assigned plans found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Plans assigned to your instructor profile will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <InstructorPlanCard
                    key={plan.productId || plan.planId || plan.heading}
                    plan={plan}
                    isActiveProduct={plan.productId === activeProductId}
                    primaryColor={primaryColor}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "classes" && <InstructorClassesTaken />}
      </div>

      {/* Global Member Details & Payment Modal */}
      {selectedPaymentMember && (
        <MemberPaymentDetailsModal
          isOpen={!!selectedPaymentMember}
          onClose={() => setSelectedPaymentMember(null)}
          member={selectedPaymentMember}
          initialTab={selectedModalTab}
          primaryColor={primaryColor}
          onPaymentRefunded={() => {
            fetchDashboard(period);
          }}
        />
      )}
    </div>
  );
}

export default InstructorActivityTabs;
