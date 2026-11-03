import React, { useContext, useMemo } from "react";
import InstitutionContext from "../../../../Context/InstitutionContext";
import {
  calculateRevenueStats,
  formatCurrencyAmount,
} from "../../../../utils/revenueService";

const RevenueCard = ({
  currency,
  totalCollected = 0,
  totalPaid = 0,
  transactionCount = 0,
  isOffline = false,
  cashoutDate,
  userLocation,
}) => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const dateLocale = userLocation === "IN" ? "en-IN" : "en-US";

  const formatAmount = (amount, minimumFractionDigits = 2) => {
    return formatCurrencyAmount(amount, isOffline ? "INR" : currency, {
      subunit: true,
      minimumFractionDigits,
      maximumFractionDigits: 2,
      dateLocale,
    });
  };

  const amountPending = totalCollected - totalPaid;

  const headerTitle = isOffline
    ? "Offline Collection"
    : currency && currency !== "UNKNOWN"
      ? `${currency} Online Collection`
      : "Online Collection";

  return (
    <div className="bg-white rounded-xl shadow-md p-3 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="p-1.5 rounded-full"
          style={{ color: InstitutionData.lightPrimaryColor }}>
          <svg
            className="h-5 w-5"
            style={{ color: InstitutionData.PrimaryColor }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-700">
          {headerTitle}
        </h3>
      </div>

      {isOffline ? (
        <div className="space-y-2">
          <div className="text-sm text-gray-500 text-center">
            Total Collected
          </div>
          <div className="text-lg font-bold text-blue-600 text-center">
            {formatAmount(totalCollected)}
          </div>
          <div className="grid grid-cols-1 gap-3 bg-gray-50 p-2 rounded-lg">
            <div className="text-center">
              <div className="font-bold text-blue-600 text-base">
                {transactionCount}
              </div>
              <div className="text-xs text-gray-600">Transactions</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Total Payment</div>
              <div className="text-lg font-bold text-blue-600">
                {formatAmount(totalCollected)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Total Received</div>
              <div className="text-lg font-bold text-green-600">
                {formatAmount(totalPaid)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2 rounded-lg">
            <div className="text-center">
              <div className="font-bold text-blue-600 text-base">
                {transactionCount}
              </div>
              <div className="text-xs text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-500 text-xs">
                {formatAmount(amountPending)}
              </div>
              <div className="text-xs text-gray-600">Amount Pending</div>
            </div>
          </div>

          {cashoutDate && (
            <div className="text-xs text-gray-500 text-center">
              Last cashout on{" "}
              {new Date(cashoutDate).toLocaleDateString(dateLocale)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RevenueSection = ({
  revenue = [],
  cashoutAmount,
  selectedYear,
  selectedMonth,
  userLocation,
}) => {
  // Define months array
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

  // Authoritative calculations via revenueService
  const stats = useMemo(() => {
    return calculateRevenueStats(revenue, { isNet: true });
  }, [revenue]);

  const usdStats = stats.usd;
  const inrStats = stats.inr;
  const offlineStats = stats.offline;

  // Calculate total paid amounts from cashout logs based on selected year and month
  const paidAmounts = useMemo(() => {
    const cashoutLogs = Array.isArray(cashoutAmount?.client)
      ? cashoutAmount.client[0]?.cashoutLogs || []
      : cashoutAmount?.client?.cashoutLogs || [];

    return cashoutLogs.reduce(
      (acc, log) => {
        const logDate = new Date(log.date);
        const logYear = logDate.getFullYear();
        const logMonth = logDate.getMonth(); // 0-based index to match months array

        // Filter based on selected year and month
        if (selectedYear !== "All time") {
          const yearMatch = logYear === parseInt(selectedYear, 10);
          const monthMatch =
            selectedMonth === "All time" ||
            months[logMonth + 1] === selectedMonth;

          if (!yearMatch || !monthMatch) return acc;
        }

        // Only include "Transferred" status transactions
        if (log.status !== "Transferred") return acc;

        // Convert amount to number and multiply by 100 to match subunit format
        const amount = parseFloat(log.amount || 0) * 100;
        const currency = String(log.currency || "").toUpperCase().trim();

        if (currency === "USD") {
          acc.USD += amount;
        } else if (currency === "INR") {
          acc.INR += amount;
        }

        return acc;
      },
      { USD: 0, INR: 0 },
    );
  }, [cashoutAmount, selectedYear, selectedMonth, months]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <RevenueCard
        currency="USD"
        totalCollected={usdStats.total}
        totalPaid={paidAmounts.USD}
        transactionCount={usdStats.count}
        minAmount={usdStats.amounts.length ? Math.min(...usdStats.amounts) : 0}
        maxAmount={usdStats.amounts.length ? Math.max(...usdStats.amounts) : 0}
        userLocation={userLocation}
      />

      <RevenueCard
        currency="INR"
        totalCollected={inrStats.total}
        totalPaid={paidAmounts.INR}
        transactionCount={inrStats.count}
        minAmount={inrStats.amounts.length ? Math.min(...inrStats.amounts) : 0}
        maxAmount={inrStats.amounts.length ? Math.max(...inrStats.amounts) : 0}
        cashoutDate={cashoutAmount?.paymentDate}
        userLocation={userLocation}
      />

      <RevenueCard
        currency="INR"
        totalCollected={offlineStats.total}
        transactionCount={offlineStats.count}
        isOffline={true}
        userLocation={userLocation}
      />
    </div>
  );
};

export default RevenueSection;

