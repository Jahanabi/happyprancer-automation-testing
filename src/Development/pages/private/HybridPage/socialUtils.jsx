import React from "react";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaXTwitter,
  FaTiktok,
  FaWhatsapp,
  FaTelegram,
  FaPinterest,
  FaGithub,
  FaDiscord,
  FaThreads,
  FaSnapchat,
  FaReddit,
} from "react-icons/fa6";
import { Globe } from "lucide-react";

/**
 * Normalizes a URL and extracts its lowercase hostname without 'www.' prefix.
 * Handles missing protocol, leading/trailing whitespace, subdomains, and ports.
 */
export function getHostname(url) {
  if (!url || typeof url !== "string") return "";
  let cleanUrl = url.trim();
  if (!cleanUrl) return "";

  // If URL does not start with a protocol or double slash, prepend https://
  if (
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(cleanUrl) &&
    !cleanUrl.startsWith("//")
  ) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const parsed = new URL(cleanUrl);
    let hostname = parsed.hostname.toLowerCase();
    // Strip trailing dot if any (e.g. "linkedin.com.")
    if (hostname.endsWith(".")) {
      hostname = hostname.slice(0, -1);
    }
    // Strip leading www. if any
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    // Fallback if URL parsing fails
    const match = cleanUrl.match(/^(?:https?:)?(?:\/\/)?([^/?#]+)/i);
    if (match && match[1]) {
      let hostname = match[1].toLowerCase().split(":")[0];
      if (hostname.startsWith("www.")) {
        hostname = hostname.slice(4);
      }
      return hostname;
    }
    return "";
  }
}

/**
 * Checks if hostname matches a given domain strictly (exact match or subdomain).
 * Prevents substring false positives (e.g. notlinkedin.com will not match linkedin.com).
 */
export function matchesDomain(hostname, domain) {
  if (!hostname || !domain) return false;
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/**
 * Resolves a social platform identifier from a URL.
 * Returns one of:
 * 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'twitter' |
 * 'tiktok' | 'whatsapp' | 'telegram' | 'pinterest' | 'github' |
 * 'discord' | 'threads' | 'snapchat' | 'reddit' | 'website'
 */
export function getSocialPlatformFromUrl(url) {
  const hostname = getHostname(url);
  if (!hostname) return "website";

  if (matchesDomain(hostname, "linkedin.com")) return "linkedin";
  if (
    matchesDomain(hostname, "instagram.com") ||
    matchesDomain(hostname, "instagr.am")
  ) {
    return "instagram";
  }
  if (
    matchesDomain(hostname, "facebook.com") ||
    matchesDomain(hostname, "fb.com") ||
    matchesDomain(hostname, "fb.watch") ||
    matchesDomain(hostname, "messenger.com")
  ) {
    return "facebook";
  }
  if (
    matchesDomain(hostname, "youtube.com") ||
    matchesDomain(hostname, "youtu.be")
  ) {
    return "youtube";
  }
  if (
    matchesDomain(hostname, "twitter.com") ||
    matchesDomain(hostname, "x.com") ||
    matchesDomain(hostname, "t.co")
  ) {
    return "twitter";
  }
  if (matchesDomain(hostname, "tiktok.com")) return "tiktok";
  if (
    matchesDomain(hostname, "whatsapp.com") ||
    matchesDomain(hostname, "wa.me")
  ) {
    return "whatsapp";
  }
  if (
    matchesDomain(hostname, "telegram.org") ||
    matchesDomain(hostname, "telegram.me") ||
    matchesDomain(hostname, "t.me")
  ) {
    return "telegram";
  }
  if (
    matchesDomain(hostname, "pinterest.com") ||
    matchesDomain(hostname, "pin.it")
  ) {
    return "pinterest";
  }
  if (matchesDomain(hostname, "github.com")) return "github";
  if (
    matchesDomain(hostname, "discord.com") ||
    matchesDomain(hostname, "discord.gg")
  ) {
    return "discord";
  }
  if (matchesDomain(hostname, "threads.net")) return "threads";
  if (matchesDomain(hostname, "snapchat.com")) return "snapchat";
  if (matchesDomain(hostname, "reddit.com")) return "reddit";

  return "website";
}

/**
 * Returns a human-friendly platform display name.
 */
export function getSocialPlatformDisplayName(url) {
  const platform = getSocialPlatformFromUrl(url);
  switch (platform) {
    case "linkedin":
      return "LinkedIn";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "youtube":
      return "YouTube";
    case "twitter":
      return "X / Twitter";
    case "tiktok":
      return "TikTok";
    case "whatsapp":
      return "WhatsApp";
    case "telegram":
      return "Telegram";
    case "pinterest":
      return "Pinterest";
    case "github":
      return "GitHub";
    case "discord":
      return "Discord";
    case "threads":
      return "Threads";
    case "snapchat":
      return "Snapchat";
    case "reddit":
      return "Reddit";
    default:
      return "Website";
  }
}

/**
 * Returns the icon component for a given URL.
 */
export function getSocialIconComponent(url) {
  const platform = getSocialPlatformFromUrl(url);
  switch (platform) {
    case "linkedin":
      return FaLinkedin;
    case "instagram":
      return FaInstagram;
    case "facebook":
      return FaFacebook;
    case "youtube":
      return FaYoutube;
    case "twitter":
      return FaXTwitter;
    case "tiktok":
      return FaTiktok;
    case "whatsapp":
      return FaWhatsapp;
    case "telegram":
      return FaTelegram;
    case "pinterest":
      return FaPinterest;
    case "github":
      return FaGithub;
    case "discord":
      return FaDiscord;
    case "threads":
      return FaThreads;
    case "snapchat":
      return FaSnapchat;
    case "reddit":
      return FaReddit;
    default:
      return Globe;
  }
}

/**
 * Reusable SocialIcon component.
 * Renders the dynamically resolved icon based on the configured URL.
 */
export function SocialIcon({ url, className = "w-4 h-4", ...props }) {
  const IconComponent = getSocialIconComponent(url);
  return <IconComponent className={className} {...props} />;
}
