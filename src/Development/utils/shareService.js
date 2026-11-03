import { post } from "aws-amplify/api";
import apiPaths from "./api-paths";

// In-memory session cache for resolved short URLs: key -> shortUrl
// Key format: `${institution.toLowerCase()}:${referral.toLowerCase()}`
const shareUrlCache = new Map();

/**
 * Builds the canonical long Hybrid profile URL.
 * Format: https://<domain>/hybrid/?institution=<institution>&referral=<referral>
 */
export const buildCanonicalHybridUrl = ({ institution, referral, fallbackUrl } = {}) => {
  if (fallbackUrl && typeof fallbackUrl === "string" && fallbackUrl.includes("referral=")) {
    return fallbackUrl;
  }

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : process.env.REACT_APP_PUBLIC_ORIGIN ||
        (process.env.REACT_APP_STAGE === "PROD"
          ? "https://happyprancer.com"
          : "https://beta.happyprancer.com");

  const inst = institution || "happyprancer";
  const ref = referral || "";

  if (!ref) {
    return `${origin}/hybrid/?institution=${encodeURIComponent(inst)}`;
  }

  return `${origin}/hybrid/?institution=${encodeURIComponent(inst)}&referral=${encodeURIComponent(ref)}`;
};

/**
 * Service function to obtain the shareable profile URL.
 * 1. Checks in-memory session cache first (avoids redundant requests).
 * 2. Attempts to call the backend short-link endpoint if available.
 * 3. Falls back gracefully to the authoritative long Hybrid URL if the backend
 *    API is unavailable, not yet implemented, or encounters an error.
 *
 * @param {Object} params
 * @param {string} params.institution - Institution identifier (e.g. "happyprancer")
 * @param {string} params.referral - Instructor referral code or identifier (e.g. "MADAN")
 * @param {string} [params.fallbackUrl] - Optional explicit fallback URL (defaults to canonical long URL)
 * @param {Object} [params.user] - Logged-in user context for authorization verification
 * @returns {Promise<{ url: string, isShort: boolean }>}
 */
export const getShareProfileUrl = async ({
  institution,
  referral,
  fallbackUrl,
  user,
} = {}) => {
  const resolvedInstitution = (institution || "happyprancer").trim();
  const resolvedReferral = (referral || "").trim();

  // Canonical fallback URL
  const longUrl = buildCanonicalHybridUrl({
    institution: resolvedInstitution,
    referral: resolvedReferral,
    fallbackUrl,
  });

  // If no referral is present, short URL cannot be generated; return long URL directly
  if (!resolvedReferral) {
    return { url: longUrl, isShort: false };
  }

  // Authorization check: If logged-in user is an instructor, ensure they can only request for their own profile
  if (user && user.userType === "instructor" && user.referral_code) {
    const userRef = (user.referral_code || "").trim().toLowerCase();
    const targetRef = resolvedReferral.toLowerCase();
    if (userRef && userRef !== targetRef) {
      console.warn(
        `[shareService] Instructor ${user.referral_code} attempted to generate share link for different referral ${resolvedReferral}. Using canonical URL.`
      );
      return { url: longUrl, isShort: false };
    }
  }

  // Check in-memory session cache to avoid duplicate API calls during the session
  const cacheKey = `${resolvedInstitution.toLowerCase()}:${resolvedReferral.toLowerCase()}`;
  if (shareUrlCache.has(cacheKey)) {
    return { url: shareUrlCache.get(cacheKey), isShort: true };
  }

  // Backend API Call point: POST /short-links
  try {
    const endpointPath = apiPaths.createShortLink || "/short-links";
    const op = post({
      apiName: "main",
      path: endpointPath,
      options: {
        body: {
          institution: resolvedInstitution,
          referral: resolvedReferral,
        },
      },
    });

    const res = await op.response;
    const data = await res.body.json();

    // Consume whatever short URL the backend returns (e.g. { shortUrl: "https://beta.happyprancer.com/h/M7x2K" })
    const shortUrl = data?.shortUrl || data?.short_url || data?.url;
    if (shortUrl && typeof shortUrl === "string") {
      shareUrlCache.set(cacheKey, shortUrl);
      return { url: shortUrl, isShort: true };
    }
  } catch (error) {
  console.error("[shareService] Short-link API failed:", error);
  }

  return { url: longUrl, isShort: false };
};

/**
 * Reusable sharing helper using Web Share API with Clipboard fallback.
 *
 * @param {Object} options
 * @param {string} options.title - Share title
 * @param {string} options.text - Share text / description
 * @param {string} options.url - The URL to share (short or long)
 * @returns {Promise<{ shared: boolean, method: "native" | "clipboard" | "aborted" | "failed" }>}
 */
export const shareProfile = async ({ title, text, url }) => {
  const shareData = {
    title: title || "HappyPrancer Hybrid Fitness",
    text: text || "Check out this professional hybrid fitness portfolio on HappyPrancer!",
    url,
  };

  // 1. Web Share API if supported by browser and payload is valid
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare(shareData)
  ) {
    try {
      await navigator.share(shareData);
      return { shared: true, method: "native" };
    } catch (err) {
      if (err.name === "AbortError") {
        return { shared: false, method: "aborted" };
      }
      console.warn("[shareService] Native share failed, falling back to clipboard:", err);
    }
  }

  // 2. Clipboard API fallback
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return { shared: true, method: "clipboard" };
    } catch (clipErr) {
      console.warn("[shareService] navigator.clipboard.writeText failed:", clipErr);
    }
  }

  // 3. Fallback for older browsers
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return { shared: true, method: "clipboard" };
    } catch (legacyErr) {
      console.error("[shareService] Legacy copy failed:", legacyErr);
    }
  }

  return { shared: false, method: "failed" };
};
