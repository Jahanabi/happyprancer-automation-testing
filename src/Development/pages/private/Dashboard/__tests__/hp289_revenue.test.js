/**
 * Automated Test Suite: HP289 — INR Online Collections Missing from Revenue
 *
 * Verifies frontend data processing, currency segregation, payment mode normalization,
 * subscription deduplication, refund handling, and revenue calculations.
 */

import {
  getNormalizedCurrency,
  getNormalizedPaymentMode,
  isPaymentRefunded,
  isPaymentVerified,
  deduplicateSubscriptionPayments,
  calculateRevenueStats,
  formatCurrencyAmount,
} from "../../../../utils/revenueService";

describe("HP289 — INR Online Collections Missing from Revenue", () => {
  // 1. Currency Normalization and Segregation
  describe("Currency Resolution and Segregation", () => {
    test("normalizes 'INR', 'inr', 'RS', '₹' to uppercase INR", () => {
      expect(getNormalizedCurrency("INR")).toBe("INR");
      expect(getNormalizedCurrency("inr")).toBe("INR");
      expect(getNormalizedCurrency("₹")).toBe("INR");
      expect(getNormalizedCurrency("Rs")).toBe("INR");
      expect(getNormalizedCurrency({ currency: "INR" })).toBe("INR");
    });

    test("normalizes 'USD', 'usd', '$' to uppercase USD", () => {
      expect(getNormalizedCurrency("USD")).toBe("USD");
      expect(getNormalizedCurrency("usd")).toBe("USD");
      expect(getNormalizedCurrency("$")).toBe("USD");
      expect(getNormalizedCurrency({ currency: "USD" })).toBe("USD");
    });

    test("strictly does NOT treat missing or UNKNOWN currency as INR", () => {
      expect(getNormalizedCurrency(null)).toBe("UNKNOWN");
      expect(getNormalizedCurrency(undefined)).toBe("UNKNOWN");
      expect(getNormalizedCurrency("")).toBe("UNKNOWN");
      expect(getNormalizedCurrency("UNKNOWN")).toBe("UNKNOWN");
      expect(getNormalizedCurrency("EUR")).toBe("EUR");
      expect(getNormalizedCurrency({})).toBe("UNKNOWN");
    });
  });

  // 2. Payment Mode Normalization
  describe("Payment Mode Classification", () => {
    test("categorizes online modes correctly (razorpay, stripe, upi, card, netbanking)", () => {
      expect(getNormalizedPaymentMode("razorpay")).toBe("online");
      expect(getNormalizedPaymentMode("Razorpay Online")).toBe("online");
      expect(getNormalizedPaymentMode("stripe")).toBe("online");
      expect(getNormalizedPaymentMode("upi")).toBe("online");
      expect(getNormalizedPaymentMode("card")).toBe("online");
      expect(getNormalizedPaymentMode("netbanking")).toBe("online");
      expect(getNormalizedPaymentMode("online")).toBe("online");
      expect(getNormalizedPaymentMode({ paymentMode: "Razorpay" })).toBe("online");
      expect(getNormalizedPaymentMode({ mode: "UPI" })).toBe("online");
    });

    test("categorizes offline modes correctly (cash, cheque, bank transfer, offline)", () => {
      expect(getNormalizedPaymentMode("cash")).toBe("offline");
      expect(getNormalizedPaymentMode("cheque")).toBe("offline");
      expect(getNormalizedPaymentMode("bank_transfer")).toBe("offline");
      expect(getNormalizedPaymentMode("offline")).toBe("offline");
      expect(getNormalizedPaymentMode({ paymentMode: "Cash" })).toBe("offline");
    });

    test("preserves offline classification when provider is unknown", () => {
      expect(getNormalizedPaymentMode("manual")).toBe("offline");
      expect(getNormalizedPaymentMode(null)).toBe("offline");
      expect(getNormalizedPaymentMode("")).toBe("offline");
    });
  });

  // 3. Payment Verification & Status Checks
  describe("Payment Status & Verification", () => {
    test("identifies verified / successful payments", () => {
      expect(isPaymentVerified({ status: "captured" })).toBe(true);
      expect(isPaymentVerified({ status: "COMPLETED" })).toBe(true);
      expect(isPaymentVerified({ status: "successful" })).toBe(true);
      expect(isPaymentVerified({ status: "paid" })).toBe(true);
      expect(isPaymentVerified({ verified: true })).toBe(true);
      expect(isPaymentVerified({ isVerified: true })).toBe(true);
    });

    test("excludes pending, created, failed, and unverified payments", () => {
      expect(isPaymentVerified({ status: "pending" })).toBe(false);
      expect(isPaymentVerified({ status: "created" })).toBe(false);
      expect(isPaymentVerified({ status: "failed" })).toBe(false);
      expect(isPaymentVerified({ status: "authorized" })).toBe(false);
      expect(isPaymentVerified({ verified: false })).toBe(false);
      expect(isPaymentVerified(null)).toBe(false);
      expect(isPaymentVerified({})).toBe(false);
    });
  });

  // 4. Refund Handling
  describe("Refund Handling (Gross vs Net)", () => {
    test("identifies refunded payments correctly", () => {
      expect(isPaymentRefunded({ isRefunded: true })).toBe(true);
      expect(isPaymentRefunded({ refunded: true })).toBe(true);
      expect(isPaymentRefunded({ status: "refunded" })).toBe(true);
      expect(isPaymentRefunded({ refundStatus: "full" })).toBe(true);
      expect(isPaymentRefunded({ status: "captured" })).toBe(false);
      expect(isPaymentRefunded(null)).toBe(false);
    });
  });

  // 5. Subscription & Payment Record Deduplication
  describe("Subscription Record Deduplication", () => {
    test("suppresses container subscription record when individual payment record exists", () => {
      const records = [
        {
          paymentId: "pay_HP12345",
          subscriptionId: "sub_HP999",
          amount: 1500,
          currency: "INR",
          paymentMode: "razorpay",
          status: "captured",
        },
        {
          paymentId: "sub_HP999",
          subscriptionId: "sub_HP999",
          amount: 1500,
          currency: "INR",
          paymentMode: "razorpay",
          status: "active",
        },
      ];

      const deduplicated = deduplicateSubscriptionPayments(records);
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].paymentId).toBe("pay_HP12345");
    });

    test("keeps independent individual payments intact", () => {
      const records = [
        { paymentId: "pay_001", amount: 1000, currency: "INR" },
        { paymentId: "pay_002", amount: 2000, currency: "INR" },
      ];
      const deduplicated = deduplicateSubscriptionPayments(records);
      expect(deduplicated).toHaveLength(2);
    });
  });

  // 6. Revenue Aggregation & Stats Calculation
  describe("Revenue Aggregation (HP289 Core Acceptance)", () => {
    test("calculates correct INR online revenue excluding pending and unknown currencies", () => {
      const payments = [
        // Eligible verified INR online payment
        {
          paymentId: "pay_inr_01",
          amount: 2500,
          currency: "INR",
          paymentMode: "razorpay",
          status: "captured",
        },
        // Another verified INR online payment via UPI
        {
          paymentId: "pay_inr_02",
          amount: 1500,
          currency: "INR",
          paymentMode: "upi",
          status: "paid",
        },
        // Verified INR offline payment
        {
          paymentId: "pay_inr_offline",
          amount: 3000,
          currency: "INR",
          paymentMode: "cash",
          status: "completed",
        },
        // Pending INR online payment (must be excluded)
        {
          paymentId: "pay_inr_pending",
          amount: 5000,
          currency: "INR",
          paymentMode: "razorpay",
          status: "pending",
        },
        // Unknown currency payment (must NOT be counted in INR)
        {
          paymentId: "pay_unknown",
          amount: 10000,
          currency: "UNKNOWN",
          paymentMode: "razorpay",
          status: "captured",
        },
        // Fully refunded INR online payment (must be excluded from net)
        {
          paymentId: "pay_inr_refunded",
          amount: 800,
          currency: "INR",
          paymentMode: "razorpay",
          status: "refunded",
          isRefunded: true,
        },
        // USD payment (must not be mixed with INR)
        {
          paymentId: "pay_usd_01",
          amount: 50,
          currency: "USD",
          paymentMode: "stripe",
          status: "captured",
        },
      ];

      const stats = calculateRevenueStats(payments, "INR");

      // Online: pay_inr_01 (2500) + pay_inr_02 (1500) = 4000
      expect(stats.totalOnline).toBe(4000);
      // Offline: pay_inr_offline (3000)
      expect(stats.totalOffline).toBe(3000);
      // Net: 4000 + 3000 = 7000
      expect(stats.netRevenue).toBe(7000);
      // Gross: 7000 + refunded 800 = 7800
      expect(stats.grossRevenue).toBe(7800);
      // Total count of verified payments in history: 3 verified (2 online + 1 offline)
      expect(stats.totalCount).toBe(3);
    });

    test("handles empty payment lists gracefully without crashing", () => {
      const stats = calculateRevenueStats([], "INR");
      expect(stats.totalOnline).toBe(0);
      expect(stats.totalOffline).toBe(0);
      expect(stats.netRevenue).toBe(0);
      expect(stats.grossRevenue).toBe(0);
      expect(stats.totalCount).toBe(0);
    });

    test("handles null or malformed payment items safely", () => {
      const stats = calculateRevenueStats([null, undefined, {}, { amount: "not_a_number" }], "INR");
      expect(stats.totalOnline).toBe(0);
      expect(stats.totalOffline).toBe(0);
      expect(stats.netRevenue).toBe(0);
    });
  });

  // 7. Amount Formatting
  describe("formatCurrencyAmount", () => {
    test("formats INR amounts with ₹ prefix", () => {
      expect(formatCurrencyAmount(1500, "INR")).toBe("₹1,500");
      expect(formatCurrencyAmount(0, "INR")).toBe("₹0");
    });

    test("formats USD amounts with $ prefix", () => {
      expect(formatCurrencyAmount(50, "USD")).toBe("$50");
    });

    test("does not add ₹ or $ to UNKNOWN currency", () => {
      expect(formatCurrencyAmount(100, "UNKNOWN")).toBe("100 UNKNOWN");
      expect(formatCurrencyAmount(100, null)).toBe("100 UNKNOWN");
    });
  });
});
