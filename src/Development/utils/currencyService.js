/**
 * Centralized Dynamic Currency and Pricing Service for HappyPrancer.
 *
 * Requirements:
 * - Country detection via existing CloudFront /user/check-user-location.
 * - Centralized country -> currency resolution (ISO 3166-1 alpha-2 -> ISO 4217).
 * - Dynamic exchange rates fetched from live open rate registries (open.er-api / jsdelivr)
 *   with 12-hour TTL browser caching.
 * - Zero hardcoded country prices or manual exchange rates.
 * - Intl.NumberFormat localized formatting.
 * - Separation of Display Currency vs. Payment Settlement Currency.
 * - Loading & error states with fallback to authoritative backend values.
 * - Frontend price derivation is purely informational; checkout uses authoritative backend product/plan IDs.
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_LOCALE = "en-US";

// LocalStorage cache keys & 12-hour TTL
const STORAGE_KEY_CURRENCY_MAP = "hp_dynamic_country_currency_v2";
const STORAGE_KEY_EXCHANGE_RATES = "hp_dynamic_exchange_rates_v2";
const RATES_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// In-memory cache
let memCountryCurrencyMap = null;
let memExchangeRates = null;
let inFlightCurrencyMapPromise = null;
let inFlightExchangeRatesPromise = null;

/**
 * Standard ISO 3166-1 alpha-2 -> ISO 4217 mapping for major world economies
 * Used as an instant offline/pre-hydration seed so UI never blocks or flashes wrong symbols,
 * augmented by dynamic online fetch.
 */
const SEED_COUNTRY_CURRENCY_MAP = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  NL: "EUR",
  ES: "EUR",
  IT: "EUR",
  PT: "EUR",
  IE: "EUR",
  BE: "EUR",
  AT: "EUR",
  GR: "EUR",
  FI: "EUR",
  RU: "RUB",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  CN: "CNY",
  SG: "SGD",
  AE: "AED",
  SA: "SAR",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  BR: "BRL",
  MX: "MXN",
  ZA: "ZAR",
  KR: "KRW",
  TH: "THB",
  MY: "MYR",
  ID: "IDR",
  PH: "PHP",
  VN: "VND",
  TR: "TRY",
};

/**
 * Zero-decimal currencies as per ISO 4217 standard
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
]);

/**
 * Reads country-to-currency mapping from localStorage or memory cache.
 */
export function getCachedCountryCurrencyMap() {
  if (memCountryCurrencyMap) return memCountryCurrencyMap;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_CURRENCY_MAP);
      if (raw) {
        memCountryCurrencyMap = JSON.parse(raw);
        return memCountryCurrencyMap;
      }
    } catch {
      // ignore storage errors
    }
  }
  return SEED_COUNTRY_CURRENCY_MAP;
}

/**
 * Reads exchange rates from localStorage or memory cache respecting 12-hour TTL.
 */
export function getCachedExchangeRates() {
  if (memExchangeRates) return memExchangeRates;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_EXCHANGE_RATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.timestamp && Date.now() - parsed.timestamp < RATES_CACHE_TTL_MS) {
          memExchangeRates = parsed.rates;
          return memExchangeRates;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return null;
}

/**
 * Fetches dynamic country-to-currency map from standard open registry.
 */
export async function fetchDynamicCountryCurrencyMap() {
  if (memCountryCurrencyMap && Object.keys(memCountryCurrencyMap).length > 100) {
    return memCountryCurrencyMap;
  }
  if (inFlightCurrencyMapPromise) return inFlightCurrencyMapPromise;

  inFlightCurrencyMapPromise = (async () => {
    try {
      const res = await fetch("https://cdn.jsdelivr.net/npm/country-to-currency@3.0.1/index.js");
      if (res.ok) {
        const text = await res.text();
        const map = { ...SEED_COUNTRY_CURRENCY_MAP };
        for (const match of text.matchAll(/([A-Z]{2}):\s*"([A-Z]{3})"/g)) {
          map[match[1]] = match[2];
        }
        if (Object.keys(map).length > 50) {
          memCountryCurrencyMap = map;
          if (typeof window !== "undefined" && window.localStorage) {
            try {
              window.localStorage.setItem(STORAGE_KEY_CURRENCY_MAP, JSON.stringify(map));
            } catch {
              // ignore storage errors
            }
          }
          return map;
        }
      }
    } catch (err) {
      console.warn("[CurrencyService] Dynamic country-currency registry fetch failed, using seed:", err);
    }
    inFlightCurrencyMapPromise = null;
    return getCachedCountryCurrencyMap() || SEED_COUNTRY_CURRENCY_MAP;
  })();

  return inFlightCurrencyMapPromise;
}

/**
 * Fetches dynamic exchange rates against USD with 12-hour caching.
 */
export async function fetchDynamicExchangeRates() {
  const cached = getCachedExchangeRates();
  if (cached) return cached;
  if (inFlightExchangeRatesPromise) return inFlightExchangeRatesPromise;

  inFlightExchangeRatesPromise = (async () => {
    const endpoints = [
      "https://open.er-api.com/v6/latest/USD",
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          let rates = null;
          if (data?.rates) {
            rates = data.rates;
          } else if (data?.usd) {
            rates = {};
            for (const [k, v] of Object.entries(data.usd)) {
              if (typeof v === "number" && v > 0) rates[k.toUpperCase()] = v;
            }
            rates["USD"] = 1;
          }

          if (rates && Object.keys(rates).length > 20) {
            memExchangeRates = rates;
            if (typeof window !== "undefined" && window.localStorage) {
              try {
                window.localStorage.setItem(
                  STORAGE_KEY_EXCHANGE_RATES,
                  JSON.stringify({ timestamp: Date.now(), rates })
                );
              } catch {
                // ignore
              }
            }
            return rates;
          }
        }
      } catch (err) {
        console.warn(`[CurrencyService] Rate fetch failed for ${url}:`, err);
      }
    }

    inFlightExchangeRatesPromise = null;
    return memExchangeRates || null;
  })();

  return inFlightExchangeRatesPromise;
}

/**
 * Resolves visitor's ISO 4217 currency code given an ISO 3166-1 alpha-2 country code.
 */
export function getCurrencyForCountry(countryCode, currencyMap = null) {
  if (!countryCode) return DEFAULT_CURRENCY;
  const normalized = countryCode.toString().trim().toUpperCase();
  const map = currencyMap || memCountryCurrencyMap || getCachedCountryCurrencyMap();
  return map?.[normalized] || DEFAULT_CURRENCY;
}

/**
 * Formats a numeric amount using Intl.NumberFormat according to ISO 4217 rules.
 */
export function formatCurrencyAmount(amount, currencyCode, locale = DEFAULT_LOCALE) {
  if (amount == null || !Number.isFinite(amount)) return "";
  const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(code);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch (err) {
    const symbol = getCurrencySymbol(code);
    const numStr = isZeroDecimal
      ? Math.round(amount).toString()
      : amount.toFixed(2);
    return `${symbol}${numStr}`;
  }
}

/**
 * Returns the narrow symbol for a currency code using Intl.NumberFormat.
 */
export function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return "$";
  const normalized = currencyCode.toString().trim().toUpperCase();
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === "currency");
    if (sym?.value) return sym.value;
  } catch {
    // ignore
  }
  return normalized;
}

/**
 * Inspects a product or plan to extract the authoritative major-unit price and currency.
 * Backend products in minor units (paise / cents) are normalized by dividing by 100.
 */
export function inspectAuthoritativePlan(plan) {
  if (!plan) {
    return { baseAmount: null, baseCurrency: DEFAULT_CURRENCY, durationText: "month" };
  }

  const durationText = plan.durationText || "month";
  const baseCurrency = (plan.currency || DEFAULT_CURRENCY).toUpperCase();

  // Explicit numeric amount
  if (plan.amount !== undefined && plan.amount !== null && plan.amount !== "") {
    const num = Number(plan.amount);
    if (Number.isFinite(num)) {
      const isBackendProduct = !!(plan.productId || plan.planId || plan.subscriptionType);
      if (isBackendProduct && Number.isInteger(num)) {
        return { baseAmount: num / 100, baseCurrency, durationText };
      }
      return { baseAmount: num, baseCurrency, durationText };
    }
  }

  // Explicit baseAmount / baseCurrency fields
  if (plan.baseAmount !== undefined && plan.baseAmount !== null) {
    const num = Number(plan.baseAmount);
    if (Number.isFinite(num)) {
      return {
        baseAmount: num,
        baseCurrency: (plan.baseCurrency || baseCurrency).toUpperCase(),
        durationText,
      };
    }
  }

  // String price fallback (e.g. "$40/month")
  if (plan.price) {
    const str = String(plan.price).trim();
    const match = str.match(/[\d,.]+/);
    if (match) {
      const num = parseFloat(match[0].replace(/,/g, ""));
      if (Number.isFinite(num)) {
        let detected = baseCurrency;
        if (str.includes("$")) detected = "USD";
        else if (str.includes("₹") || str.toLowerCase().includes("rs")) detected = "INR";
        else if (str.includes("€")) detected = "EUR";
        else if (str.includes("£")) detected = "GBP";
        return { baseAmount: num, baseCurrency: detected, durationText };
      }
    }
  }

  return { baseAmount: null, baseCurrency, durationText };
}

/**
 * Calculates dynamic converted display pricing for a plan based on detected visitor country.
 *
 * Returns:
 * - displayPriceText: formatted local currency amount e.g. "£31.66/month"
 * - displayOnlyAmount: formatted local currency without suffix e.g. "£31.66"
 * - basePriceText: formatted base amount e.g. "$40.00/month"
 * - settlementText: explicit settlement notice e.g. "Billed as $40.00 USD at checkout"
 * - isConverted: boolean indicating if display currency differs from settlement currency
 * - targetCurrency: ISO currency code
 * - baseCurrency: Authoritative settlement currency code
 */
export function calculateDynamicPlanPricing(plan, options = {}) {
  const {
    userCountryCode,
    exchangeRates = memExchangeRates || getCachedExchangeRates(),
    currencyMap = memCountryCurrencyMap || getCachedCountryCurrencyMap(),
  } = options;

  if (!plan) return null;

  const { baseAmount, baseCurrency, durationText } = inspectAuthoritativePlan(plan);
  if (baseAmount == null) {
    return {
      displayPriceText: plan.price || "",
      displayOnlyAmount: plan.price || "",
      basePriceText: plan.price || "",
      settlementText: "",
      isConverted: false,
      targetCurrency: baseCurrency,
      baseCurrency,
      durationText,
    };
  }

  const targetCurrency = getCurrencyForCountry(userCountryCode, currencyMap);
  const formattedBase = formatCurrencyAmount(baseAmount, baseCurrency);
  const basePriceText = `${formattedBase}/${durationText}`;

  // Case 1: Same currency (e.g. US visitor for USD product, or Indian visitor for INR product)
  if (targetCurrency === baseCurrency) {
    return {
      displayPriceText: basePriceText,
      displayOnlyAmount: formattedBase,
      basePriceText,
      settlementText: `Billed in ${baseCurrency} at checkout`,
      isConverted: false,
      targetCurrency,
      baseCurrency,
      durationText,
    };
  }

  // Case 2: Conversion needed via dynamic exchange rates
  if (exchangeRates) {
    const rateBase = exchangeRates[baseCurrency];
    const rateTarget = exchangeRates[targetCurrency];

    if (
      Number.isFinite(rateBase) &&
      rateBase > 0 &&
      Number.isFinite(rateTarget) &&
      rateTarget > 0
    ) {
      const converted = baseAmount * (rateTarget / rateBase);
      const formattedConverted = formatCurrencyAmount(converted, targetCurrency);
      const displayPriceText = `${formattedConverted}/${durationText}`;

      return {
        displayPriceText,
        displayOnlyAmount: formattedConverted,
        basePriceText,
        settlementText: `Billed as ${formattedBase} ${baseCurrency} at checkout`,
        isConverted: true,
        targetCurrency,
        baseCurrency,
        durationText,
      };
    }
  }

  // Case 3: Rate unavailable / offline fallback -> show authoritative base price directly
  return {
    displayPriceText: basePriceText,
    displayOnlyAmount: formattedBase,
    basePriceText,
    settlementText: `Billed in ${baseCurrency} at checkout`,
    isConverted: false,
    targetCurrency: baseCurrency,
    baseCurrency,
    durationText,
  };
}

/**
 * Custom React hook providing reactive dynamic pricing for the Hybrid Page.
 */
export function useDynamicPricing({ userCountryCode: explicitCountryCode, userLocation, productList = [] }) {
  const [currencyMap, setCurrencyMap] = useState(() => getCachedCountryCurrencyMap());
  const [exchangeRates, setExchangeRates] = useState(() => getCachedExchangeRates());
  const [isLoading, setIsLoading] = useState(() => !getCachedExchangeRates());

  useEffect(() => {
    let isMounted = true;

    // Fetch dynamic country-to-currency dataset
    fetchDynamicCountryCurrencyMap().then((map) => {
      if (isMounted && map && Object.keys(map).length > 0) {
        setCurrencyMap(map);
      }
    });

    // Fetch dynamic exchange rates
    fetchDynamicExchangeRates().then((rates) => {
      if (isMounted) {
        if (rates && Object.keys(rates).length > 0) {
          setExchangeRates(rates);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Extract country code from explicit country code, userLocation or localStorage
  const userCountryCode = useMemo(() => {
    if (explicitCountryCode && typeof explicitCountryCode === "string") {
      return explicitCountryCode.trim().toUpperCase();
    }
    if (!userLocation) {
      if (typeof window !== "undefined" && window.localStorage) {
        return (window.localStorage.getItem("userLocation") || "").trim().toUpperCase() || null;
      }
      return null;
    }
    const code = userLocation.countryCode || userLocation.country_code;
    if (code && typeof code === "string" && code.trim().length === 2) {
      return code.trim().toUpperCase();
    }
    const name = (userLocation.countryName || userLocation.country || "").trim().toLowerCase();
    if (name === "india") return "IN";
    if (name.includes("united states") || name === "usa") return "US";
    if (name.includes("united kingdom") || name === "uk") return "GB";
    if (name.includes("germany")) return "DE";
    if (name.includes("netherlands")) return "NL";
    if (name.includes("russia")) return "RU";
    if (name.includes("canada")) return "CA";
    if (name.includes("australia")) return "AU";
    if (name.includes("japan")) return "JP";
    return null;
  }, [explicitCountryCode, userLocation]);

  const targetCurrency = useMemo(
    () => getCurrencyForCountry(userCountryCode, currencyMap),
    [userCountryCode, currencyMap]
  );

  const getPlanPricing = useCallback(
    (plan) => {
      return calculateDynamicPlanPricing(plan, {
        userCountryCode,
        exchangeRates,
        currencyMap,
      });
    },
    [userCountryCode, exchangeRates, currencyMap]
  );

  return {
    userCountryCode,
    targetCurrency,
    exchangeRates,
    currencyMap,
    isLoading,
    getPlanPricing,
  };
}
