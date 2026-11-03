import React, { useContext, useEffect, useState, useCallback } from "react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";

function InstructorClassesTaken() {
  const UserCtx = useContext(Context);
  const InstitutionData = useContext(InstitutionContext).institutionData;

  // Adjust this if your Context exposes the instructor's cognito id under a
  // different key — ReferralCode.jsx used `UserCtx.cognitoId` directly.
  const instructorCognitoId = UserCtx.cognitoId || UserCtx.userData?.cognitoId;

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-12
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    totalDaysWithAttendance: 0,
  });
  const [rateInfo, setRateInfo] = useState({
    perClassAmount: 0, // stored in paise, like bonus elsewhere in this codebase
    perClassCurrency: "INR",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const primaryColor = InstitutionData?.PrimaryColor || "#4F46E5";

  const formatCurrency = (amountInPaise, currency) => {
    const amount = (amountInPaise || 0) / 100;
    try {
      return new Intl.NumberFormat(currency === "INR" ? "en-IN" : undefined, {
        style: "currency",
        currency: currency || "INR",
      }).format(amount);
    } catch {
      return `${currency || ""} ${amount.toFixed(2)}`;
    }
  };

  const totalClasses = summary.totalClasses || 0;
  const totalEarnedPaise = totalClasses * (rateInfo.perClassAmount || 0);

  const fetchAttendance = useCallback(async () => {
    if (!instructorCognitoId || !InstitutionData?.InstitutionId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await UserCtx.getInstructorAttendance(
        InstitutionData.InstitutionId,
        [instructorCognitoId],
        viewMonth,
        viewYear,
      );

      const myResult =
        response?.results?.find((r) => r.cognitoId === instructorCognitoId) ||
        response?.results?.[0];

      setAttendance(myResult?.attendance || []);
      setSummary(
        myResult?.summary || { totalClasses: 0, totalDaysWithAttendance: 0 },
      );
      setRateInfo({
        perClassAmount: myResult?.instructor?.perClassAmount || 0,
        perClassCurrency: myResult?.instructor?.perClassCurrency || "INR",
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching instructor attendance:", err);
      setError("Failed to load classes taken.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    instructorCognitoId,
    InstitutionData?.InstitutionId,
    viewMonth,
    viewYear,
  ]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const monthName = new Date(viewYear, viewMonth - 1, 1).toLocaleString(
    undefined,
    { month: "long" },
  );

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Defensive field access — real attendance record field names are not yet
  // confirmed (sample data had empty arrays). Adjust these getters once you
  // see a populated response.
  const getDate = (rec) => rec.date || rec.classDate || rec.day || null;
  const getClassType = (rec) =>
    rec.classType || rec.classTaken?.[0]?.classType || rec.type || "Class";
  const getAttendeeCount = (rec) =>
    rec.total ??
    rec.attendeeCount ??
    rec.studentsCount ??
    rec.students?.length ??
    rec.attendees?.length ??
    "-";

  const getDisplayDate = (rec) => {
    const raw = getDate(rec);
    if (!raw) return "-";

    const ts = Number(raw);

    if (!Number.isNaN(ts) && ts > 0) {
      return new Date(ts < 1000000000000 ? ts * 1000 : ts).toLocaleDateString();
    }

    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Classes Taken</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1 rounded hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="font-medium text-sm w-32 text-center">
              {monthName} {viewYear}
            </div>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1 rounded hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-200/80 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
              {summary.totalClasses}
            </p>

            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
              Total Classes
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-200/80 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
              {summary.totalDaysWithAttendance}
            </p>

            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
              Active Days
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-200/80 shadow-sm">
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totalEarnedPaise, rateInfo.perClassCurrency)}
            </p>

            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
              Earnings
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading…</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">{error}</div>
        ) : attendance.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No classes recorded for {monthName} {viewYear}.
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
            <table className="w-full text-xs min-w-[500px]">
              <thead className="bg-gray-50/90 text-gray-500 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-center">Class Type</th>
                  <th className="px-4 py-3 text-center">Attendees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((rec, index) => (
                  <tr
                    key={rec.date || rec.classDate || `${index}`}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-center font-medium text-gray-700">
                      {getDisplayDate(rec)}
                    </td>

                    <td className="px-4 py-3 text-center text-gray-600">
                      {getClassType(rec)}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-gray-800">
                      {getAttendeeCount(rec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorClassesTaken;
