import { useContext, useMemo } from "react";
import Context from "../Context/Context";

/**
 * Checks whether a given product is a one-day trial / day pass plan.
 * Reused from Home Subscriptions card logic.
 */
export const isOneDayPlan = (product) => {
  if (!product) return false;
  const heading = (product.heading || "").toLowerCase();
  const durationText = (product.durationText || "").toLowerCase();
  return heading.includes("day") || durationText.includes("day");
};

/**
 * Filter productList for standard monthly products in a given region ("IN" vs "US"/international).
 * Matches the exact filtering rules in Subscriptions.jsx:
 * - Excludes dev-only student plan (1000048)
 * - Excludes displayOnHome === false
 * - Excludes isVisible === false
 * - Excludes hybrid plans
 * - Excludes referral-only discounted duplicates (standard pricing)
 * - Regional currency check (INR for India, USD/non-INR for international)
 * - Monthly subscriptionType and not a one-day plan
 */
export const getMonthlyProductsForRegion = (productList, region = "IN") => {
  if (!Array.isArray(productList) || productList.length === 0) {
    return [];
  }

  const isIndia =
    region === "IN" ||
    region === "INDIA" ||
    region === "India";

  return productList
    .filter((item) => item.productId !== "1000048")
    .filter((item) => item.displayOnHome !== false)
    .filter((item) => item.isVisible !== false)
    .filter((item) => item.subscriptionType?.toLowerCase() !== "hybrid")
    .filter((item) => !item.referralEligible)
    .filter((item) => {
      if (isIndia) {
        return item.currency === "INR";
      }
      return item.currency !== "INR";
    })
    .filter((item) => {
      return (
        item.subscriptionType?.toLowerCase() === "monthly" &&
        !isOneDayPlan(item)
      );
    });
};

/**
 * Extracts the single source of truth monthly subscription price for a region.
 * Returns the exact card amount, currency, currency symbol, and formatted strings.
 */
export const getMonthlySubscriptionPrice = (productList, region = "IN") => {
  const monthlyProducts = getMonthlyProductsForRegion(productList, region);
  if (!monthlyProducts || monthlyProducts.length === 0) {
    return null;
  }

  // Find individual subscription if explicitly labeled, otherwise pick the first monthly card
  const primaryProduct =
    monthlyProducts.find((p) => {
      const heading = (p.heading || "").toLowerCase();
      return heading.includes("individual") || heading.includes("monthly");
    }) || monthlyProducts[0];

  const currencySymbol = primaryProduct.currency === "INR" ? "₹" : "$";
  const amount = Number(primaryProduct.amount || 0) / 100;
  const durationText = primaryProduct.durationText || "month";

  return {
    product: primaryProduct,
    amount,
    currency: primaryProduct.currency,
    currencySymbol,
    formattedPrice: `${currencySymbol}${amount}`,
    durationText,
    billingPeriod: "monthly",
  };
};

/**
 * Custom React Hook providing reactive monthly subscription pricing for both
 * Indian and US/International users from Context productList.
 */
export const useMonthlySubscriptionPricing = () => {
  const context = useContext(Context);
  const productList = context?.productList || [];

  const indianPricing = useMemo(
    () => getMonthlySubscriptionPrice(productList, "IN"),
    [productList]
  );

  const intlPricing = useMemo(
    () => getMonthlySubscriptionPrice(productList, "US"),
    [productList]
  );

  return {
    productList,
    indianPricing,
    intlPricing,
    isLoading: !productList || productList.length === 0,
  };
};

/**
 * Identifies if a FAQ item title refers to the subscription fee/charges question.
 */
export const isSubscriptionFaq = (title = "") => {
  const lower = (title || "").toLowerCase();
  return (
    lower.includes("subscription charge") ||
    lower.includes("subscription fee") ||
    lower.includes("subscription")
  );
};

/**
 * Formats the FAQ subscription answer using live monthly pricing.
 */
export const getDynamicFaqSubscriptionText = (template, indianPricing, intlPricing) => {
  const indianPriceStr = indianPricing?.formattedPrice;
  const intlPriceStr = intlPricing?.formattedPrice;

  // Handle placeholders if template uses them
  if (template && (template.includes("{INDIAN_PRICE}") || template.includes("{{INDIAN_PRICE}}"))) {
    return template
      .replace(/\{\{?INDIAN_PRICE\}?\}|\{\{?INDIAN_MONTHLY_PRICE\}?\}/g, indianPriceStr || "...")
      .replace(/\{\{?INTERNATIONAL_PRICE\}?\}|\{\{?INTERNATIONAL_MONTHLY_PRICE\}?\}|\{\{?INTL_PRICE\}?\}/g, intlPriceStr || "...");
  }

  // If prices are still loading, show neutral ellipsis without hardcoded amounts
  if (!indianPriceStr || !intlPriceStr) {
    return `Indian members can avail a special discount and join HappyPrancer live Zumba sessions for only ... per month, while international users can participate for ... per month.`;
  }

  return `Indian members can avail a special discount and join HappyPrancer live Zumba sessions for only ${indianPriceStr} per month, while international users can participate for ${intlPriceStr} per month.`;
};

/**
 * Identifies if a Refund section heading refers to the subscription fees policy.
 */
export const isSubscriptionRefundHeading = (heading = "") => {
  const lower = (heading || "").toLowerCase();
  return (
    lower.includes("subscription fee") ||
    lower.includes("subscription")
  );
};

/**
 * Formats the Refund subscription fees clause using live monthly pricing.
 */
export const getDynamicRefundSubscriptionText = (template, indianPricing, intlPricing) => {
  const indianPriceStr = indianPricing?.formattedPrice;
  const intlPriceStr = intlPricing?.formattedPrice;

  // Handle placeholders if template uses them
  if (template && (template.includes("{INDIAN_PRICE}") || template.includes("{{INDIAN_PRICE}}"))) {
    return template
      .replace(/\{\{?INDIAN_PRICE\}?\}|\{\{?INDIAN_MONTHLY_PRICE\}?\}/g, indianPriceStr || "...")
      .replace(/\{\{?INTERNATIONAL_PRICE\}?\}|\{\{?INTERNATIONAL_MONTHLY_PRICE\}?\}|\{\{?INTL_PRICE\}?\}/g, intlPriceStr || "...");
  }

  // If prices are still loading, show neutral ellipsis without hardcoded amounts
  if (!indianPriceStr || !intlPriceStr) {
    return `We charge ... per month for Indian users and ... per month for outside India users. We may run periodic discount offers. The subscription fee is charged on a monthly basis and is an automated recurring payment`;
  }

  return `We charge ${indianPriceStr} per month for Indian users and ${intlPriceStr} per month for outside India users. We may run periodic discount offers. The subscription fee is charged on a monthly basis and is an automated recurring payment`;
};
