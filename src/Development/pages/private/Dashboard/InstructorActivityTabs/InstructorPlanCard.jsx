import React, { useState, useMemo } from "react";
import {
  FaCheck,
  FaCopy,
  FaCheckCircle,
  FaTag,
  FaCalendarAlt,
  FaDumbbell,
} from "react-icons/fa";
import { toast } from "react-toastify";

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

const InstructorPlanCard = ({
  plan,
  isActiveProduct = false,
  primaryColor = "#4F46E5",
}) => {
  const [copied, setCopied] = useState(false);


  const isPlanActive = Boolean(plan.isActive || isActiveProduct);

  const handleCopyReferral = () => {
    if (!plan.referralCode) return;
    navigator.clipboard.writeText(plan.referralCode);
    setCopied(true);
    toast.success("Referral code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const classTypesList = useMemo(() => {
    if (Array.isArray(plan.classType) && plan.classType.length > 0) {
      return plan.classType.join(", ");
    }
    if (typeof plan.classType === "string" && plan.classType.trim()) {
      return plan.classType;
    }
    return "All Available Classes";
  }, [plan.classType]);

  const durationDisplay = useMemo(() => {
    if (plan.duration) {
      return typeof plan.duration === "number"
        ? `${plan.duration} Days`
        : String(plan.duration);
    }
    return plan.durationText || "Monthly";
  }, [plan.duration, plan.durationText]);

  const providesList = Array.isArray(plan.provides) ? plan.provides : [];

  if (!plan) return null;
  return (
    <div
      className={`bg-white rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between relative shadow-sm hover:shadow-md ${
        isActiveProduct
          ? "border-2 shadow-md ring-2 ring-opacity-20"
          : isPlanActive
          ? "border-green-300"
          : "border-gray-200"
      }`}
      style={{
        borderColor: isActiveProduct ? primaryColor : undefined,
      }}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
            isPlanActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {isPlanActive ? "Active Plan" : "Inactive"}
        </span>

        {isActiveProduct && (
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1"
            style={{ backgroundColor: primaryColor }}
          >
            <FaCheckCircle size={10} /> Active Catalog Plan
          </span>
        )}
      </div>

      {/* Plan Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">
          {plan.heading || "Instructor Plan"}
        </h3>
        {plan.subscriptionType && (
          <p className="text-xs text-gray-500 capitalize mt-0.5">
            {plan.subscriptionType} Plan {plan.isStandardPlan ? "• Standard" : ""}
          </p>
        )}

        {/* Pricing */}
        <div className="mt-4 mb-5 flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-gray-900">
            {formatAmount(plan.amount, plan.currency)}
          </span>
          {plan.durationText && (
            <span className="text-sm font-medium text-gray-500">
              / {plan.durationText}
            </span>
          )}
        </div>

        {/* Plan Details / Meta */}
        <div className="space-y-2.5 text-xs text-gray-600 border-t border-b border-gray-100 py-3.5 mb-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400 shrink-0" size={12} />
            <span>
              Duration:{" "}
              <strong className="text-gray-800 capitalize">
                {durationDisplay}
              </strong>
              {plan.durationText && typeof plan.duration === "number" && (
                <span className="text-gray-400 ml-1">({plan.durationText})</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FaDumbbell className="text-gray-400 shrink-0" size={12} />
            <span className="truncate">
              Classes: <strong className="text-gray-800">{classTypesList}</strong>
            </span>
          </div>

          {plan.referralCode && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-gray-600">
                <FaTag className="text-gray-400" size={11} />
                Referral Code:
              </span>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                title="Click to copy referral code"
              >
                {plan.referralCode}
                {copied ? (
                  <FaCheck className="text-green-600" size={10} />
                ) : (
                  <FaCopy size={10} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Features / Provides List */}
        {providesList.length > 0 && (
          <div className="space-y-2 mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              What's Included:
            </span>
            <ul className="space-y-1.5">
              {providesList.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-gray-700"
                >
                  <FaCheck
                    className="shrink-0 mt-0.5"
                    size={10}
                    style={{ color: primaryColor }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Plan ID footer info */}
      <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
        <span>Product ID: {plan.productId || "-"}</span>
        {plan.planId && <span>Plan ID: {plan.planId}</span>}
      </div>
    </div>
  );
};

export default InstructorPlanCard;
