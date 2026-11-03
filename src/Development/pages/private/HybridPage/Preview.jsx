import React, { useRef, useState, useEffect, useContext, useCallback } from "react";
import {
  Play,
  Pause,
  X,
  Star,
  Share2,
  Loader2,
  MapPin,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Users,
  Video,
  Globe,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  ExternalLink,
  User,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import fileUpload from "../../../common/utils/upload-file";
import liveIcon from "../../../../assets/Live.svg";
import Footer from "../../../components/Footer";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useDynamicPricing } from "../../../utils/currencyService";
import zumbaImg from "../../../../assets/zumba.png";
import yogaImg from "../../../../assets/yoga.png";
import botanicalCornerPine from "../../../../assets/Hybrid/botanical-corner-pine.svg";
import botanicalCornerGold from "../../../../assets/Hybrid/botanical-corner-gold.svg";
import botanicalFlourishPine from "../../../../assets/Hybrid/botanical-flourish-pine.svg";
import botanicalBranchPine from "../../../../assets/Hybrid/botanical-branch-pine.svg";
import botanicalSideLeft from "../../../../assets/Hybrid/botanical-side-left.svg";
import botanicalSideRight from "../../../../assets/Hybrid/botanical-side-right.svg";
import { getShareProfileUrl, shareProfile } from "../../../utils/shareService";
import { SocialIcon, getSocialPlatformDisplayName } from "./socialUtils";
import { getCurrencySymbol } from "../../../utils/currencyService";
// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================================================
// HELPER: Share Profile (Native Web Share with Clipboard Fallback)
// ============================================================================
const handleShareProfile = async (instructorName, customUrl) => {
  const url = customUrl || window.location.href;
  const result = await shareProfile({
    title: `${instructorName || "Instructor"} | HappyPrancer Hybrid Fitness`,
    text: `Check out ${instructorName || "Instructor"}'s professional hybrid fitness portfolio on HappyPrancer!`,
    url,
  });

  if (result.shared && result.method === "clipboard") {
    toast.success("Profile link copied to clipboard!");
  } else if (!result.shared && result.method === "failed") {
    toast.info(`Share this link: ${url}`);
  }
  return result;
};

// ============================================================================
// HELPER: Scoped Smooth Scroll to Section (Supports Desktop, Mobile Editor Frame, and Live Site)
// ============================================================================
export const smoothScrollToSection = (sectionId, triggerElement) => {
  if (!sectionId) return;
  const cleanId = sectionId.startsWith("#") ? sectionId.slice(1) : sectionId;

  // 1. Locate the target element across possible documents (trigger's ownerDocument, main doc, iframe docs)
  let el = null;
  if (triggerElement && triggerElement.ownerDocument) {
    el = triggerElement.ownerDocument.getElementById(cleanId);
  }
  if (!el && typeof document !== "undefined") {
    el = document.getElementById(cleanId);
  }
  if (!el && typeof document !== "undefined") {
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const idoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (idoc) {
          const found = idoc.getElementById(cleanId);
          if (found) {
            el = found;
            break;
          }
        }
      } catch (e) {
        // Cross-origin safety
      }
    }
  }

  if (!el) return;

  // Verify target element is currently mounted in its document
  const targetDoc = el.ownerDocument;
  if (!targetDoc || !targetDoc.contains(el)) return;
  const targetWin = targetDoc.defaultView || window;

  // 2. Identify the active scroll container within the same document
  let container = null;
  let curr = el.parentElement;

  // First check for an intermediate scrollable ancestor enclosing el (e.g. desktop editor container)
  while (curr && curr !== targetDoc.body && curr !== targetDoc.documentElement) {
    try {
      const style = targetWin.getComputedStyle(curr);
      const overflowY = style?.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        curr.scrollHeight > curr.clientHeight
      ) {
        container = curr;
        break;
      }
    } catch (e) {}
    curr = curr.parentElement;
  }

  // If no intermediate scrollable ancestor found, detect the document-level scrolling element
  if (!container) {
    const se = targetDoc.scrollingElement;
    const de = targetDoc.documentElement;
    const bd = targetDoc.body;

    let bodyStyle = null;
    let deStyle = null;
    try {
      if (bd) bodyStyle = targetWin.getComputedStyle(bd);
      if (de) deStyle = targetWin.getComputedStyle(de);
    } catch (e) {}

    const isBodyScrollable =
      bd &&
      bodyStyle &&
      (bodyStyle.overflowY === "auto" || bodyStyle.overflowY === "scroll") &&
      bd.scrollHeight > bd.clientHeight;

    const isDeScrollable =
      de &&
      deStyle &&
      (deStyle.overflowY === "auto" || deStyle.overflowY === "scroll") &&
      de.scrollHeight > de.clientHeight;

    if (isBodyScrollable) {
      container = bd;
    } else if (isDeScrollable) {
      container = de;
    } else if (se && se.scrollHeight > se.clientHeight) {
      container = se;
    } else if (de && de.scrollHeight > de.clientHeight) {
      container = de;
    } else if (bd && bd.scrollHeight > bd.clientHeight) {
      container = bd;
    } else {
      container = se || de || bd;
    }
  }

  // Verify target is inside the container
  const isDocumentRootContainer =
    container === targetDoc.documentElement ||
    container === targetDoc.body ||
    container === targetDoc.scrollingElement;

  if (!isDocumentRootContainer && container && !container.contains(el)) {
    return;
  }

  // 3. Scroll only the identified container without scrolling outer window
  if (!isDocumentRootContainer && container) {
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetTop = container.scrollTop + (elRect.top - containerRect.top);
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      container.scrollTop = targetTop;
    }
  } else if (container) {
    const elRect = el.getBoundingClientRect();
    const currentScrollTop =
      container?.scrollTop ??
      targetDoc.scrollingElement?.scrollTop ??
      targetDoc.body?.scrollTop ??
      targetWin.pageYOffset ??
      0;
    const targetTop = currentScrollTop + elRect.top;

    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    } else if (typeof targetWin.scrollTo === "function") {
      targetWin.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      container.scrollTop = targetTop;
    }
  } else {
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {}
  }
};

// ============================================================================
// COMPONENT 1: EditableHero (Editorial Instructor Hero)
// ============================================================================

// Memoized Hero Video Player: keeps <video> DOM element mounted across unrelated pageData changes
const HeroVideoPlayer = React.memo(
  function HeroVideoPlayer({
    videoSrc,
    videoAdjust,
    videoRef,
    onPlay,
    onPause,
    onEnded,
  }) {
    return (
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover object-center"
        playsInline
        preload="auto"
        loop
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        style={{
          transform: `translate(${videoAdjust?.x ?? 0}px, ${
            videoAdjust?.y ?? 0
          }px) scale(${videoAdjust?.zoom ?? 1})`,
          transformOrigin: "center center",
        }}
      />
    );
  },
  (prev, next) =>
    prev.videoSrc === next.videoSrc &&
    prev.videoAdjust?.x === next.videoAdjust?.x &&
    prev.videoAdjust?.y === next.videoAdjust?.y &&
    prev.videoAdjust?.zoom === next.videoAdjust?.zoom &&
    prev.onPlay === next.onPlay &&
    prev.onPause === next.onPause &&
    prev.onEnded === next.onEnded &&
    prev.videoRef === next.videoRef
);

export function EditableHero({
  data,
  instructorDetails,
  forceMobile = false,
  editMode = false,
  onUpdatePageData,
  onSavePage,
  onHeroVideoUpload,
}) {
  const videoRef = useRef(null);
  const heroContentRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleEnded = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    if (editMode || !heroContentRef.current) return;
    gsap.fromTo(
      heroContentRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );
  }, [editMode]);

  const institutionData = useContext(InstitutionContext);
  const UserCtxContext = useContext(Context);
  const { deleteFile } = UserCtxContext || {};
  const InstitutionData = institutionData?.institutionData;
  const instId =
    InstitutionData?.InstitutionId || InstitutionData?.institutionid;
  const targetInstructorId =
    instructorDetails?.instructorId ||
    instructorDetails?.instructorProfile?.instructorId ||
    UserCtxContext?.userData?.cognitoId;
  const newlyUploadedVideoRef = useRef(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [heroForm, setHeroForm] = useState({
    name: "",
    title: "",
    description: "",
    video: "",
    actionChips: [
      { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
      { id: "chip_2", label: "Personal Training", link: "#services-section" },
    ],
  });

  const onOpenEdit = () => {
    newlyUploadedVideoRef.current = null;
    setHeroForm({
      name: data?.hero?.name || instructorDetails?.name || "",
      title:
        data?.hero?.title ||
        data?.features?.testimonial?.role ||
        instructorDetails?.position ||
        "",
      description: data?.hero?.description || "",
      video: data?.hero?.video || "",
      actionChips:
        Array.isArray(data?.hero?.actionChips) && data.hero.actionChips.length > 0
          ? data.hero.actionChips
          : [
              { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
              { id: "chip_2", label: "Personal Training", link: "#services-section" },
            ],
    });
    setIsEditing(true);
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onHeroVideoUpload) {
      setIsVideoUploading(true);
      try {
        const fileUrl = await onHeroVideoUpload(file, { skipCommit: true });
        if (fileUrl) {
          newlyUploadedVideoRef.current = fileUrl;
          setHeroForm((prev) => ({ ...prev, video: fileUrl }));
        }
      } finally {
        setIsVideoUploading(false);
      }
    }
  };

  const handleCancelHero = async () => {
    if (newlyUploadedVideoRef.current && deleteFile && instId && targetInstructorId) {
      try {
        const folder = `${instId}/instructors/${targetInstructorId}/hero/video`;
        await deleteFile("institution-utils", folder);
      } catch (err) {
        console.warn("[Hero] Cancel cleanup warning:", err?.message || err);
      }
      newlyUploadedVideoRef.current = null;
    }
    setIsEditing(false);
  };

  const handleSaveHero = async () => {
    setIsSaving(true);
    try {
      const updatedHero = {
        ...data?.hero,
        name: heroForm.name,
        title: heroForm.title,
        description: heroForm.description,
        video: heroForm.video,
        actionChips: heroForm.actionChips,
      };
      const updatedFeatures = {
        ...data?.features,
        testimonial: {
          ...data?.features?.testimonial,
          role: heroForm.title,
        },
      };

      if (onUpdatePageData) {
        onUpdatePageData("hero", updatedHero);
        onUpdatePageData("features", updatedFeatures);
      }

      if (onSavePage) {
        const fullPageData = {
          ...data,
          hero: updatedHero,
          features: updatedFeatures,
        };
        const saved = await onSavePage(fullPageData, false, {
          source: "section",
          section: "hero",
        });
        if (!saved) {
          return;
        }
      }
      newlyUploadedVideoRef.current = null;
      setIsEditing(false);
      toast.success("Hero section updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save hero section");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.warn("Video play error:", err);
      });
    }
  }, [isPlaying]);

  const primaryColor = data?.globalPrimaryColor || "#215A55";

  // Data extractions
  const name =
    data?.hero?.name ||
    instructorDetails?.name ||
    instructorDetails?.userProfile?.userName ||
    "";

  const professionalTitle =
    data?.hero?.title ||
    data?.features?.testimonial?.role ||
    instructorDetails?.position ||
    instructorDetails?.instructorProfile?.position ||
    "";

  const description = data?.hero?.description || "";

  // Authoritative rating & student stats
  const validRatings = (data?.testimonials || [])
    .map((t) => Number(t?.rating))
    .filter((r) => !isNaN(r) && r > 0);
  const calculatedRating =
    validRatings.length > 0
      ? (
          validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
        ).toFixed(1)
      : data?.features?.stats?.rating || null;
  const rating = calculatedRating;
  const studentsCount = data?.features?.stats?.students || null;
  const reviewsCount = data?.testimonials?.length || 0;

  // Instructor Portrait: prioritized from hero data, instructor profile, or empty
  const instructorImage =
    data?.hero?.image ||
    instructorDetails?.hybridHeroImage ||
    instructorDetails?.instructorProfile?.hybridHeroImage ||
    instructorDetails?.image ||
    instructorDetails?.instructorProfile?.image ||
    "";

  const hasVideo = !!(data?.hero?.video && typeof data.hero.video === "string");

  const scrollToSection = (sectionId, e) => {
    smoothScrollToSection(
      sectionId,
      e?.currentTarget || e?.target || heroContentRef.current,
    );
  };

  const onShareClick = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const institution =
        instId ||
        new URLSearchParams(window.location.search).get("institution") ||
        "happyprancer";

      const referral =
        instructorDetails?.instructorProfile?.referral_code ||
        instructorDetails?.instructorProfile?.referralCode ||
        instructorDetails?.instructorProfile?.referral ||
        new URLSearchParams(window.location.search).get("referral") ||
        UserCtxContext?.userData?.referral_code ||
        "";

      const { url: shareUrl } = await getShareProfileUrl({
        institution,
        referral,
        fallbackUrl: window.location.href,
        user: UserCtxContext?.userData,
      });

      const result = await shareProfile({
        title: `${name || "Instructor"} | HappyPrancer Hybrid Fitness`,
        text: `Check out ${name || "Instructor"}'s professional hybrid fitness portfolio on HappyPrancer!`,
        url: shareUrl,
      });

      if (result.shared && result.method === "clipboard") {
        setCopied(true);
        toast.success("Profile link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      } else if (!result.shared && result.method !== "aborted") {
        toast.info(`Share this link: ${shareUrl}`);
      }
    } catch (err) {
      console.error("[EditableHero] Share error:", err);
      toast.error("Unable to share profile. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section
      className="relative w-full bg-gradient-to-b from-[#FAFBFB] via-white to-white border-b border-gray-100 overflow-hidden"
      data-hero-section
    >
      {editMode && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur border border-stone-300 text-stone-800 shadow-md hover:bg-white hover:border-stone-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Edit Hero</span>
          </button>
        </div>
      )}
      {/* Subtle Hero Framing Art */}
      <div
        className="absolute -left-6 xl:left-4 top-1/3 -translate-y-1/2 pointer-events-none hidden xl:block opacity-[0.14] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalBranchPine}
          alt=""
          aria-hidden="true"
          className="w-28 xl:w-32 h-auto max-h-72 object-contain"
        />
      </div>

      <div
        className="absolute -right-6 xl:right-4 top-1/4 pointer-events-none hidden xl:block opacity-[0.12] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalBranchPine}
          alt=""
          aria-hidden="true"
          className="w-28 xl:w-32 h-auto max-h-72 object-contain -scale-x-100"
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-10 sm:py-14 lg:py-20 relative z-10">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
          style={
            forceMobile
              ? { gridTemplateColumns: "1fr", gap: "2rem" }
              : undefined
          }
        >
          {/* Left Column: Editorial Information & Trust Badges */}
          <div
            ref={heroContentRef}
            className="lg:col-span-7 flex flex-col justify-center text-left order-2 lg:order-1"
          >
            {/* Platform & Credential Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
                style={{
                  backgroundColor: `${primaryColor}14`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}30`,
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified HappyPrancer Instructor
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                Online & In-Person
              </span>
            </div>

            {/* Instructor Name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-3">
              {name}
            </h1>

            {/* Professional Title */}
            <p
              className="text-lg sm:text-xl font-semibold mb-3"
              style={{ color: primaryColor }}
            >
              {professionalTitle}
            </p>

            {/* Rating & Social Proof Strip */}
            {(rating || (studentsCount && studentsCount !== "0") || reviewsCount > 0) && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2 mb-6 border-y border-gray-100">
                {rating && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[...Array(Math.round(Number(rating)) || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      {rating}
                    </span>
                    {reviewsCount > 0 && (
                      <span className="text-sm text-gray-500">
                        ({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})
                      </span>
                    )}
                  </div>
                )}

                {rating && studentsCount && (
                  <div className="hidden sm:block h-4 w-px bg-gray-200" />
                )}

                {studentsCount && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>
                      <strong className="text-gray-900">{studentsCount}</strong>{" "}
                      students trained
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Concise Bio / Introduction */}
            {description ? (
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
                {description}
              </p>
            ) : null}

            {/* Editable Action Chips (e.g. Learn Zumba, Personal Training) */}
            <div className="flex flex-wrap gap-2.5 mb-8">
              {(Array.isArray(data?.hero?.actionChips) && data.hero.actionChips.length > 0
                ? data.hero.actionChips
                : [
                    { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
                    { id: "chip_2", label: "Personal Training", link: "#services-section" },
                  ]
              ).map((chip, i) => (
                <a
                  key={chip.id || i}
                  href={chip.link || "#services-section"}
                  onClick={(e) => {
                    if (chip.link?.startsWith("#")) {
                      e.preventDefault();
                      scrollToSection(chip.link.slice(1), e);
                    }
                  }}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200/90 shadow-2xs transition-all cursor-pointer"
                >
                  <span>{chip.label}</span>
                </a>
              ))}
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {/* Primary CTA: Book Session / View Plans */}
              <button
                onClick={(e) => scrollToSection("services-section", e)}
                className="px-6 py-3.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm sm:text-base"
                style={{ backgroundColor: primaryColor }}
              >
                <span>View Training Options</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Secondary CTA: Share Profile */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onShareClick}
                  disabled={isSharing}
                  className={`px-4 py-3.5 rounded-xl font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial cursor-pointer ${
                    isSharing ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  title="Share instructor portfolio"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <span>Sharing...</span>
                    </>
                  ) : copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-gray-500" />
                      <span>Share Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dominant Editorial Instructor Media / Video */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Media Container with Subtle Warm Depth */}
              <div
                className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-gray-900 border border-gray-200/80 aspect-[4/5] group"
                style={{ transform: "translateZ(0)" }}
              >
                {data?.hero?.video ? (
                  <HeroVideoPlayer
                    videoSrc={data.hero.video}
                    videoAdjust={data.hero.videoAdjust}
                    videoRef={videoRef}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                  />
                ) : instructorImage ? (
                  <img
                    src={instructorImage}
                    alt={name || "Instructor"}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = "flex";
                      }
                    }}
                    style={{
                      transform: `translate(${
                        data?.features?.testimonial?.imageAdjust?.x ?? 0
                      }px, ${
                        data?.features?.testimonial?.imageAdjust?.y ?? 0
                      }px) scale(${
                        data?.features?.testimonial?.imageAdjust?.zoom ?? 1
                      })`,
                      transformOrigin: "center center",
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                    <User className="w-20 h-20 text-stone-300 stroke-1" />
                    {name && (
                      <span className="mt-2 text-stone-600 font-semibold text-base">
                        {name}
                      </span>
                    )}
                  </div>
                )}

                {/* Subtle bottom gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Floating Bottom Card: Real-time Status */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-lg border border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-none">
                        Accepting New Students
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        First month free available
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Play Pill Button on Media Card */}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="absolute top-4 right-4 z-20 bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Pause Intro</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch Intro</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-900">Edit Hero Section</h4>
              <button
                type="button"
                onClick={handleCancelHero}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={heroForm.name}
                  onChange={(e) => setHeroForm({ ...heroForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Enter instructor name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Professional Title / Tagline
                </label>
                <input
                  type="text"
                  value={heroForm.title}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. Personal Trainer & Fitness Coach"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hero Bio / Mission Statement
                </label>
                <textarea
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Write a welcoming description of your training style..."
                />
              </div>

              {/* Action Buttons / Chips Editor */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Action Chips / Buttons
                </label>
                <div className="space-y-3">
                  {(heroForm.actionChips || []).map((chip, idx) => (
                    <div key={chip.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="text-xs font-semibold text-gray-600">
                        Button {idx + 1}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-0.5">Label</label>
                          <input
                            type="text"
                            value={chip.label || ""}
                            placeholder="e.g. Learn Zumba"
                            onChange={(e) => {
                              const updated = heroForm.actionChips.map((c, i) =>
                                i === idx ? { ...c, label: e.target.value } : c
                              );
                              setHeroForm({ ...heroForm, actionChips: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-0.5">Link / Target Anchor</label>
                          <input
                            type="text"
                            value={chip.link || ""}
                            placeholder="e.g. #services-section"
                            onChange={(e) => {
                              const updated = heroForm.actionChips.map((c, i) =>
                                i === idx ? { ...c, link: e.target.value } : c
                              );
                              setHeroForm({ ...heroForm, actionChips: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hero Video URL or Upload
                </label>
                <input
                  type="text"
                  value={heroForm.video}
                  onChange={(e) => setHeroForm({ ...heroForm, video: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 mb-2"
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {isVideoUploading && (
                    <span className="text-xs text-emerald-600 animate-pulse">Uploading video...</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={handleCancelHero}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHero}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? "Saving..." : "Save Hero"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 2: InstructorStory (About / Story Section)
// ============================================================================
export function InstructorStory({
  data,
  instructorDetails,
  editMode = false,
  onUpdatePageData,
  onSavePage,
}) {
  const primaryColor = data?.globalPrimaryColor || "#215A55";

  const storyContentRef = useRef(null);
  const overviewCardRef = useRef(null);

  useEffect(() => {
    if (editMode) return;

    const ctx = gsap.context(() => {
      if (storyContentRef.current) {
        gsap.fromTo(
          storyContentRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: storyContentRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (overviewCardRef.current) {
        gsap.fromTo(
          overviewCardRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.15,
            scrollTrigger: {
              trigger: overviewCardRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, [editMode]);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const name =
    data?.hero?.name ||
    instructorDetails?.name ||
    instructorDetails?.userProfile?.userName ||
    "";

  const defaultIntro = `Hi, I'm ${name}. My mission as a fitness coach is to make sustainable, high-energy training accessible to everyone, whether you train with me in our local studio or stream sessions from your home.`;
  const defaultSecondParagraph =
    "Through HappyPrancer's hybrid platform, you get the flexibility to fit workouts seamlessly around your schedule without sacrificing personalized guidance, accountability, or community support.";
  const defaultQuote =
    data?.features?.testimonial?.text ||
    data?.hero?.description ||
    "Every session is designed to transform your body and uplift your mind.";

  const defaultFeatures = [
    {
      id: "feat_1",
      title: "Certified Instruction",
      description: "Safe progression, proper form, and tailored modifications.",
      icon: "award",
    },
    {
      id: "feat_2",
      title: "Flexible Hybrid Schedule",
      description: "Attend live in-studio or join online seamlessly.",
      icon: "clock",
    },
  ];

  const defaultOverview = {
    students:
      data?.story?.overview?.students ||
      data?.features?.stats?.students ||
      instructorDetails?.instructorProfile?.stats?.students ||
      "500+",
    rating:
      data?.story?.overview?.rating ||
      data?.features?.stats?.rating ||
      instructorDetails?.instructorProfile?.stats?.rating ||
      "4.9",
    classes:
      data?.story?.overview?.classes ||
      data?.features?.stats?.classes ||
      instructorDetails?.instructorProfile?.stats?.classes ||
      "50+",
    studio:
      data?.story?.overview?.studio ||
      data?.transform?.location ||
      instructorDetails?.location ||
      instructorDetails?.city ||
      "Ambassador of dance, Farmington hill, Michigan",
    schedule:
      data?.story?.overview?.schedule ??
      data?.story?.overview?.regularSchedule ??
      data?.transform?.classTime ??
      "Monday - Friday: 6:00 PM - 7:00 PM",
    format:
      data?.story?.overview?.format ||
      "In-Person Studio Classes & Live Online Stream",
    specialOffer:
      data?.story?.overview?.specialOffer ||
      "Your first month is 100% free on all hybrid subscription tiers.",
  };

  const [storyForm, setStoryForm] = useState({
    title: "",
    introParagraph: "",
    quote: "",
    secondParagraph: "",
    features: defaultFeatures,
    overview: defaultOverview,
  });

  const onOpenEdit = () => {
    setStoryForm({
      title: data?.story?.title || "Training Philosophy & Background",
      introParagraph: data?.story?.introParagraph || defaultIntro,
      quote: data?.story?.quote || defaultQuote,
      secondParagraph: data?.story?.secondParagraph || defaultSecondParagraph,
      features: (Array.isArray(data?.story?.features) && data.story.features.length > 0
        ? data.story.features
        : defaultFeatures
      ).map((f, i) => ({
        id: f.id || `feat_${i + 1}`,
        title: f.title || "",
        description: f.description || "",
        icon: f.icon || (i === 1 ? "clock" : "award"),
      })),
      overview: {
        students:
          data?.story?.overview?.students ||
          data?.features?.stats?.students ||
          "500+",
        rating:
          data?.story?.overview?.rating ||
          data?.features?.stats?.rating ||
          "4.9",
        classes:
          data?.story?.overview?.classes ||
          data?.features?.stats?.classes ||
          "50+",
        studio:
          data?.story?.overview?.studio ||
          data?.transform?.location ||
          instructorDetails?.location ||
          instructorDetails?.city ||
          "Ambassador of dance, Farmington hill, Michigan",
        schedule:
          data?.story?.overview?.schedule ??
          data?.story?.overview?.regularSchedule ??
          data?.transform?.classTime ??
          "Monday - Friday: 6:00 PM - 7:00 PM",
        format:
          data?.story?.overview?.format ||
          "In-Person Studio Classes & Live Online Stream",
        specialOffer:
          data?.story?.overview?.specialOffer ||
          "Your first month is 100% free on all hybrid subscription tiers.",
      },
    });
    setIsEditing(true);
  };

  const handleSaveStory = async () => {
    setIsSaving(true);
    try {
      const updatedStory = {
        ...data?.story,
        title: storyForm.title,
        introParagraph: storyForm.introParagraph,
        quote: storyForm.quote,
        secondParagraph: storyForm.secondParagraph,
        features: storyForm.features,
        overview: storyForm.overview,
      };

      const updatedFeatures = {
        ...data?.features,
        stats: {
          ...(data?.features?.stats || {}),
          students: storyForm.overview?.students,
          rating: storyForm.overview?.rating,
          classes: storyForm.overview?.classes,
        },
      };

      if (onUpdatePageData) {
        onUpdatePageData("story", updatedStory);
        onUpdatePageData("features", updatedFeatures);
      }

      if (onSavePage) {
        const fullPageData = {
          ...data,
          story: updatedStory,
          features: updatedFeatures,
        };
        const saved = await onSavePage(fullPageData, false, {
          source: "section",
          section: "story",
        });
        if (!saved) {
          return;
        }
      }
      setIsEditing(false);
      toast.success("Story section updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save story");
    } finally {
      setIsSaving(false);
    }
  };

  const storyTitle = data?.story?.title || "Training Philosophy & Background";
  const introParagraph = data?.story?.introParagraph || defaultIntro;
  const quote = data?.story?.quote || defaultQuote;
  const secondParagraph = data?.story?.secondParagraph || defaultSecondParagraph;
  const storyFeatures =
    Array.isArray(data?.story?.features) && data.story.features.length > 0
      ? data.story.features
      : defaultFeatures;

  const storyOverview = {
    students:
      data?.story?.overview?.students ??
      data?.features?.stats?.students ??
      "500+",
    rating:
      data?.story?.overview?.rating ??
      data?.features?.stats?.rating ??
      "4.9",
    classes:
      data?.story?.overview?.classes ??
      data?.features?.stats?.classes ??
      "50+",
    studio:
      data?.story?.overview?.studio ??
      data?.transform?.location ??
      instructorDetails?.location ??
      instructorDetails?.city ??
      "Ambassador of dance, Farmington hill, Michigan",
    schedule:
      data?.story?.overview?.schedule ??
      data?.story?.overview?.regularSchedule ??
      data?.transform?.classTime ??
      "Monday - Friday: 6:00 PM - 7:00 PM",
    format:
      data?.story?.overview?.format ??
      "In-Person Studio Classes & Live Online Stream",
    specialOffer:
      data?.story?.overview?.specialOffer ??
      "Your first month is 100% free on all hybrid subscription tiers.",
  };

  return (
    <section
      id="about-section"
      className="py-14 sm:py-20 px-5 sm:px-8 lg:px-12 xl:px-16 bg-white relative overflow-hidden"
    >
      {editMode && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur border border-stone-300 text-stone-800 shadow-md hover:bg-white hover:border-stone-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Edit Story</span>
          </button>
        </div>
      )}
      {/* Subtle Peripheral Botanical Accents */}
      <div
        className="absolute -left-4 xl:left-6 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-[0.14] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalFlourishPine}
          alt=""
          aria-hidden="true"
          className="w-24 xl:w-28 h-auto max-h-64 object-contain"
        />
      </div>

      <div
        className="absolute -right-4 xl:right-6 top-1/3 pointer-events-none hidden xl:block opacity-[0.12] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalFlourishPine}
          alt=""
          aria-hidden="true"
          className="w-24 xl:w-28 h-auto max-h-64 object-contain -scale-x-100"
        />
      </div>

      <div className="max-w-[1340px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: About Text & Philosophy */}
          <div className="lg:col-span-7">
            {/* FIXED SECTION LABEL - NOT EDITABLE */}
            <span
              className="text-xs font-bold tracking-wider uppercase mb-2 block select-none"
              style={{ color: primaryColor }}
            >
              About the Instructor
            </span>

            <div ref={storyContentRef}>
              {/* EDITABLE SECTION TITLE */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-6">
                {storyTitle}
              </h2>

              <div className="space-y-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                {/* EDITABLE INTRO PARAGRAPH */}
                <p>
                  {data?.story?.introParagraph ? (
                    data.story.introParagraph
                  ) : (
                    <>
                      Hi, I'm <strong className="text-gray-900">{name}</strong>. My
                      mission as a fitness coach is to make sustainable, high-energy
                      training accessible to everyone, whether you train with me in
                      our local studio or stream sessions from your home.
                    </>
                  )}
                </p>

                {/* EDITABLE PHILOSOPHY / QUOTE */}
                {quote ? (
                  <blockquote
                    className="p-4 my-4 rounded-xl border-l-4 bg-gray-50 italic text-gray-800 text-base sm:text-lg"
                    style={{ borderColor: primaryColor }}
                  >
                    "{quote}"
                  </blockquote>
                ) : null}

                {/* EDITABLE SECOND PARAGRAPH */}
                <p>
                  {secondParagraph}
                </p>
              </div>

              {/* EDITABLE VALUE HIGHLIGHTS / FEATURES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                {storyFeatures.map((feat, idx) => (
                  <div key={feat.id || idx} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      {feat.icon === "clock" || idx === 1 ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Instructor Quick Facts & Credibility Card */}
          <div className="lg:col-span-5">
            <div
              ref={overviewCardRef}
              className="bg-[#FAFBFB] rounded-2xl p-6 sm:p-8 border border-gray-200/90 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center justify-between">
                <span>Instructor Overview</span>
                <ShieldCheck
                  className="w-5 h-5"
                  style={{ color: primaryColor }}
                />
              </h3>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mb-6">
                <div className="bg-white p-2 sm:p-3 rounded-xl border border-gray-100 shadow-xs min-w-0">
                  <div
                    className="text-lg sm:text-2xl font-bold whitespace-nowrap"
                    style={{ color: primaryColor }}
                  >
                    {storyOverview.students}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 mt-1 uppercase tracking-wide font-semibold whitespace-nowrap">
                    Students
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-3 rounded-xl border border-gray-100 shadow-xs min-w-0">
                  <div
                    className="text-lg sm:text-2xl font-bold whitespace-nowrap"
                    style={{ color: primaryColor }}
                  >
                    {storyOverview.rating} ★
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 mt-1 uppercase tracking-wide font-semibold whitespace-nowrap">
                    Rating
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-3 rounded-xl border border-gray-100 shadow-xs min-w-0">
                  <div
                    className="text-lg sm:text-2xl font-bold whitespace-nowrap"
                    style={{ color: primaryColor }}
                  >
                    {storyOverview.classes}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 mt-1 uppercase tracking-wide font-semibold whitespace-nowrap">
                    Classes
                  </div>
                </div>
              </div>

              {/* Specific Details */}
              <div className="space-y-3.5 text-sm">
                {storyOverview.studio && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        Studio:{" "}
                      </span>
                      <span className="text-gray-600">{storyOverview.studio}</span>
                    </div>
                  </div>
                )}

                {storyOverview.schedule && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        Regular Schedule:{" "}
                      </span>
                      <span className="text-gray-600">{storyOverview.schedule}</span>
                    </div>
                  </div>
                )}

                {storyOverview.format && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        Format:{" "}
                      </span>
                      <span className="text-gray-600">
                        {storyOverview.format}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* First Month Free Notice */}
              {storyOverview.specialOffer && (
                <div
                  className="mt-6 p-3.5 rounded-xl text-xs flex items-center gap-2.5"
                  style={{
                    backgroundColor: `${primaryColor}12`,
                    border: `1px solid ${primaryColor}25`,
                  }}
                >
                  <Award
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <span className="text-gray-700 font-medium">
                    <strong>Special Offer:</strong> {storyOverview.specialOffer}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Story Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-900">Edit Story & Philosophy</h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Note: Section label "ABOUT THE INSTRUCTOR" is fixed and not editable */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                Section Label: <strong className="text-gray-700">ABOUT THE INSTRUCTOR</strong> (Fixed)
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Section Heading / Title
                </label>
                <input
                  type="text"
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Training Philosophy & Background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Intro Paragraph
                </label>
                <textarea
                  value={storyForm.introParagraph}
                  onChange={(e) => setStoryForm({ ...storyForm, introParagraph: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Write your introductory background and greeting..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Training Philosophy / Quote
                </label>
                <textarea
                  value={storyForm.quote}
                  onChange={(e) => setStoryForm({ ...storyForm, quote: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Every session is designed to transform your body and uplift your mind."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Second Paragraph
                </label>
                <textarea
                  value={storyForm.secondParagraph}
                  onChange={(e) => setStoryForm({ ...storyForm, secondParagraph: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Describe your hybrid flexibility and coaching approach..."
                />
              </div>

              {/* Value Highlights / Features Editor */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Value Highlights / Features
                </label>
                <div className="space-y-3">
                  {(storyForm.features || []).map((feat, idx) => (
                    <div key={feat.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="text-xs font-semibold text-gray-600">
                        Feature {idx + 1}
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-0.5">Title</label>
                        <input
                          type="text"
                          value={feat.title || ""}
                          placeholder="e.g. Certified Instruction"
                          onChange={(e) => {
                            const updated = storyForm.features.map((f, i) =>
                              i === idx ? { ...f, title: e.target.value } : f
                            );
                            setStoryForm({ ...storyForm, features: updated });
                          }}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-0.5">Description</label>
                        <textarea
                          rows={2}
                          value={feat.description || ""}
                          placeholder="e.g. Safe progression, proper form, and tailored modifications."
                          onChange={(e) => {
                            const updated = storyForm.features.map((f, i) =>
                              i === idx ? { ...f, description: e.target.value } : f
                            );
                            setStoryForm({ ...storyForm, features: updated });
                          }}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Overview Card Inputs */}
              <div className="border-t border-gray-100 pt-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Instructor Overview (Right Card)
                </h5>
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                        Students
                      </label>
                      <input
                        type="text"
                        value={storyForm.overview?.students ?? ""}
                        onChange={(e) =>
                          setStoryForm({
                            ...storyForm,
                            overview: {
                              ...storyForm.overview,
                              students: e.target.value,
                            },
                          })
                        }
                        placeholder="500+"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                        Rating
                      </label>
                      <input
                        type="text"
                        value={storyForm.overview?.rating ?? ""}
                        onChange={(e) =>
                          setStoryForm({
                            ...storyForm,
                            overview: {
                              ...storyForm.overview,
                              rating: e.target.value,
                            },
                          })
                        }
                        placeholder="4.9"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                        Classes
                      </label>
                      <input
                        type="text"
                        value={storyForm.overview?.classes ?? ""}
                        onChange={(e) =>
                          setStoryForm({
                            ...storyForm,
                            overview: {
                              ...storyForm.overview,
                              classes: e.target.value,
                            },
                          })
                        }
                        placeholder="50+"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                      Studio / Address
                    </label>
                    <input
                      type="text"
                      value={storyForm.overview?.studio ?? ""}
                      onChange={(e) =>
                        setStoryForm({
                          ...storyForm,
                          overview: {
                            ...storyForm.overview,
                            studio: e.target.value,
                          },
                        })
                      }
                      placeholder="Ambassador of dance, Farmington hill, Michigan"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                      Regular Schedule
                    </label>
                    <input
                      type="text"
                      value={storyForm.overview?.schedule ?? ""}
                      onChange={(e) =>
                        setStoryForm({
                          ...storyForm,
                          overview: {
                            ...storyForm.overview,
                            schedule: e.target.value,
                          },
                        })
                      }
                      placeholder="Monday - Friday: 6:00 PM - 7:00 PM"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                      Format
                    </label>
                    <input
                      type="text"
                      value={storyForm.overview?.format ?? ""}
                      onChange={(e) =>
                        setStoryForm({
                          ...storyForm,
                          overview: {
                            ...storyForm.overview,
                            format: e.target.value,
                          },
                        })
                      }
                      placeholder="In-Person Studio Classes & Live Online Stream"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5 font-medium">
                      Special Offer Notice
                    </label>
                    <textarea
                      rows={2}
                      value={storyForm.overview?.specialOffer ?? ""}
                      onChange={(e) =>
                        setStoryForm({
                          ...storyForm,
                          overview: {
                            ...storyForm.overview,
                            specialOffer: e.target.value,
                          },
                        })
                      }
                      placeholder="Your first month is 100% free on all hybrid subscription tiers."
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStory}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? "Saving..." : "Save Story"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 3: WhyGoHybridCards (Why Work With Me / Hybrid Methodology)
// ============================================================================
export function WhyGoHybridCards({
  data,
  forceMobile = false,
  instructorDetails,
  editMode = false,
  onUpdatePageData,
  onSavePage,
  onCardImageUpload,
}) {
  const containerRef = useRef(null);
  const activeImageRef = useRef(null);
  const visualStageRef = useRef(null);
  const chaptersContainerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (editMode) return;

    const ctx = gsap.context(() => {
      if (visualStageRef.current) {
        gsap.fromTo(
          visualStageRef.current,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: visualStageRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (chaptersContainerRef.current) {
        const chapterItems = chaptersContainerRef.current.children;
        if (chapterItems && chapterItems.length > 0) {
          gsap.fromTo(
            chapterItems,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: chaptersContainerRef.current,
                start: "top 85%",
                once: true,
              },
            }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [editMode]);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCardIndex, setUploadingCardIndex] = useState(null);
  const [methodologyForm, setMethodologyForm] = useState({
    headerTitle: "",
    headerSubtitle: "",
    address: "",
    philosophyLabel: "",
    cards: [],
  });

  const onOpenEdit = () => {
    setMethodologyForm({
      headerTitle:
        data?.whyHybrid?.headerTitle ||
        data?.whyHybrid?.title ||
        "Why Go Hybrid",
      headerSubtitle: data?.whyHybrid?.headerSubtitle || "",
      address:
        data?.whyHybrid?.address ||
        data?.transform?.location ||
        instructorDetails?.location ||
        instructorDetails?.city ||
        "Ambassador of dance, Farmington hill, Michigan",
      philosophyLabel:
        data?.whyHybrid?.philosophyLabel || "01 — 04 • PHILOSOPHY & PRACTICE",
      cards: (data?.whyHybrid?.cards || []).map((c, i) => ({
        id: c.id || i,
        title: c.title || "",
        description: c.description || "",
        image: c.image || "",
      })),
    });
    setIsEditing(true);
  };

  const handleCardImageChange = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onCardImageUpload) {
      setUploadingCardIndex(index);
      try {
        const fileUrl = await onCardImageUpload(e, index, { skipCommit: true });
        if (fileUrl) {
          setMethodologyForm((prev) => ({
            ...prev,
            cards: prev.cards.map((c, i) =>
              i === index ? { ...c, image: fileUrl } : c,
            ),
          }));
        }
      } finally {
        setUploadingCardIndex(null);
      }
    }
  };

  const handleSaveMethodology = async () => {
    setIsSaving(true);
    try {
      const updatedWhyHybrid = {
        ...data?.whyHybrid,
        headerTitle: methodologyForm.headerTitle,
        title: methodologyForm.headerTitle,
        headerSubtitle: methodologyForm.headerSubtitle,
        address: methodologyForm.address,
        philosophyLabel: methodologyForm.philosophyLabel,
        cards: (data?.whyHybrid?.cards || []).map((c, i) => ({
          ...c,
          title: methodologyForm.cards[i]?.title ?? c.title,
          description: methodologyForm.cards[i]?.description ?? c.description,
          image: methodologyForm.cards[i]?.image ?? c.image,
        })),
      };

      if (onUpdatePageData) {
        onUpdatePageData("whyHybrid", updatedWhyHybrid);
      }

      if (onSavePage) {
        const fullPageData = {
          ...data,
          whyHybrid: updatedWhyHybrid,
        };
        await onSavePage(fullPageData, false, {
          source: "section",
          section: "methodology",
        });
      }
      setIsEditing(false);
      toast.success("Methodology section updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save methodology section");
    } finally {
      setIsSaving(false);
    }
  };

  const instructorName =
    data?.whyHybrid?.instructorName ||
    instructorDetails?.name ||
    instructorDetails?.userProfile?.userName ||
    data?.hero?.name ||
    "";

  const headerSubtitle = data?.whyHybrid?.headerSubtitle || "";

  const headerTitle =
    data?.whyHybrid?.headerTitle || data?.whyHybrid?.title || "Why Go Hybrid";

  const cards = data?.whyHybrid?.cards || [];

  // Methodology chapter metadata (derived structurally to mirror the 4 chapters)
  const chapterEyebrows = [
    "01 / FOUNDATION",
    "02 / MENTORSHIP",
    "03 / INVITATION",
    "04 / SYNERGY",
  ];

  const chapterSublabels = [
    "Primal Flow",
    "Kinetic Precision",
    "Curated Selection",
    "Community Circle",
  ];

  // GSAP image transition on active chapter switch
  useEffect(() => {
    if (!cards || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        activeImageRef.current,
        { opacity: 0.18, scale: 1.04 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: "power2.out",
        },
      );
    });

    return () => ctx.revert();
  }, [activeIndex]);

  if (!cards || cards.length === 0) return null;

  // Safe active card lookup
  const safeIndex = Math.min(Math.max(0, activeIndex), cards.length - 1);
  const activeCard = cards[safeIndex] || cards[0];

  const instructorLocation =
    data?.whyHybrid?.address ||
    instructorDetails?.location ||
    instructorDetails?.city ||
    data?.transform?.location ||
    data?.hero?.location ||
    "";

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#071914] text-[#F9F7F1] py-12 sm:py-14 lg:py-16 overflow-hidden border-y border-white/10"
      id="why-hybrid-section"
    >
      {editMode && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur border border-stone-300 text-stone-800 shadow-md hover:bg-white hover:border-stone-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#215A55]" />
            <span>Edit Methodology</span>
          </button>
        </div>
      )}
      {/* Ambient Atmospheric Glows */}
      <div
        className="pointer-events-none absolute -left-28 top-1/4 w-[420px] h-[420px] rounded-full bg-[#1b4338]/25 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-28 top-10 w-[360px] h-[360px] rounded-full bg-[#cca45e]/8 blur-[110px]"
        aria-hidden="true"
      />

      {/* Understated Botanical Accent Line (Externally Sourced CC0 SVG: OpenClipart #310423) */}
      <div
        className="absolute -right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-[0.07] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalCornerGold}
          alt=""
          aria-hidden="true"
          className="w-72 xl:w-96 h-auto max-h-[480px] object-contain"
        />
      </div>

      <div className="max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Section Header: Philosophy & Instructor Offer */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 sm:pb-7 border-b border-white/10">
          <div className="max-w-2xl">
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#CCA45E] uppercase block mb-2">
              CURATED METHODOLOGY
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-[42px] font-medium text-[#F9F7F1] tracking-tight leading-[1.15]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {headerTitle}
            </h2>
          </div>

          {/* Dynamic Instructor Offer */}
          {headerSubtitle ? (
            <div className="lg:text-right max-w-lg lg:ml-auto">
              <p
                className="text-[#CCA45E] text-base sm:text-lg lg:text-xl italic leading-snug"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {headerSubtitle}
              </p>
            </div>
          ) : null}
        </div>

        {/* Main Composition: Large Visual & Methodology Chapters */}
        <div
          className="mt-7 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 xl:gap-12 items-stretch"
          style={forceMobile ? { gridTemplateColumns: "1fr" } : undefined}
        >
          {/* Left / Top: Large Visual Stage */}
          <div
            ref={visualStageRef}
            className={`flex flex-col ${
              forceMobile ? "w-full" : "lg:col-span-7"
            }`}
          >
            <div className="relative w-full h-[270px] sm:h-[350px] lg:h-[420px] xl:h-[440px] rounded-2xl sm:rounded-[22px] overflow-hidden bg-[#0A221C] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
              {/* Active Image with GSAP Transition */}
              <img
                key={`active-hybrid-img-${safeIndex}`}
                ref={activeImageRef}
                src={activeCard?.image}
                alt={activeCard?.title || "Methodology visual"}
                className="w-full h-full object-cover absolute inset-0"
                style={{
                  transform: `translate(${activeCard?.imageAdjust?.x ?? 0}px, ${
                    activeCard?.imageAdjust?.y ?? 0
                  }px) scale(${activeCard?.imageAdjust?.zoom ?? 1})`,
                  transformOrigin: "center center",
                }}
                onError={(e) => {
                  e.target.style.opacity = "0";
                }}
              />

              {/* Gentle Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#061712]/85 via-transparent to-[#061712]/20 pointer-events-none" />

              {/* Step Pill in corner */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-black/50 backdrop-blur-md border border-white/15 text-white text-[10px] sm:text-[11px] font-semibold tracking-widest px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCA45E]" />
                <span>
                  CHAPTER {String(safeIndex + 1).padStart(2, "0")} / 0
                  {cards.length}
                </span>
              </div>
            </div>

            {/* Editorial Caption Bar Beneath Large Visual */}
            <div className="flex items-center justify-between gap-4 mt-2.5 px-1 text-xs text-white/50">
              <span
                className="text-[#CCA45E] italic font-serif text-xs sm:text-[13px]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Plate {String(safeIndex + 1).padStart(2, "0")} •{" "}
                {activeCard?.title || "Sanctuary in Motion"}
              </span>
              {instructorLocation ? (
                <span className="tracking-[0.2em] uppercase text-[10px] sm:text-[11px] font-medium text-white/55">
                  {instructorLocation}
                </span>
              ) : null}
            </div>
          </div>

          {/* Right / Bottom: Methodology Chapters List */}
          <div
            className={`flex flex-col justify-between ${
              forceMobile ? "w-full mt-3" : "lg:col-span-5"
            }`}
            role="region"
            aria-label="Training Methodology Chapters"
          >
            <div
              ref={chaptersContainerRef}
              className="divide-y divide-white/10 flex flex-col justify-between h-full"
            >
              {cards.map((card, index) => {
                const isActive = safeIndex === index;
                const chapterNumber = String(index + 1).padStart(2, "0");
                const chapterLabel =
                  chapterEyebrows[index] || `${chapterNumber} / PHASE`;
                const sublabel = chapterSublabels[index] || "";

                return (
                  <div
                    key={card.id || index}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    aria-label={`Chapter ${chapterNumber}: ${card.title}`}
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveIndex(index);
                      }
                    }}
                    className={`group w-full text-left py-3.5 sm:py-4 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#CCA45E] rounded-xl px-2.5 -mx-2.5 ${
                      isActive ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"
                    }`}
                  >
                    {/* Chapter Header: Eyebrow + Sublabel */}
                    <div className="flex items-center justify-between gap-2.5 mb-1 sm:mb-1.5">
                      <span
                        className={`text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-300 ${
                          isActive
                            ? "text-[#CCA45E]"
                            : "text-white/45 group-hover:text-white/75"
                        }`}
                      >
                        {chapterLabel}
                      </span>
                      {sublabel && (
                        <span
                          className={`text-[11px] sm:text-xs italic font-serif transition-colors duration-300 hidden sm:inline-block ${
                            isActive
                              ? "text-[#CCA45E]/85"
                              : "text-white/30 group-hover:text-white/55"
                          }`}
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                          }}
                        >
                          {sublabel}
                        </span>
                      )}
                    </div>

                    {/* Chapter Title & Arrow Indicator */}
                    <div className="flex items-center justify-between gap-2.5">
                      <h3
                        className={`text-lg sm:text-xl lg:text-[22px] font-normal tracking-tight transition-colors duration-300 leading-snug ${
                          isActive
                            ? "text-[#F9F7F1]"
                            : "text-[#F9F7F1]/65 group-hover:text-[#F9F7F1]/95"
                        }`}
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {card.title}
                      </h3>
                      <ArrowRight
                        className={`w-3.5 h-3.5 flex-shrink-0 text-[#CCA45E] transition-all duration-300 ${
                          isActive
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0"
                        }`}
                      />
                    </div>

                    {/* Chapter Description */}
                    <p
                      className={`text-sm sm:text-[15px] leading-relaxed mt-1.5 transition-colors duration-300 ${
                        isActive
                          ? "text-[#C2CEC7] font-normal"
                          : "text-[#C2CEC7]/50 group-hover:text-[#C2CEC7]/80"
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Editorial Detail */}
        <div className="mt-9 sm:mt-11 pt-4 sm:pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] sm:text-[11px] text-white/45 tracking-[0.2em] uppercase font-medium">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCA45E]" />
            <span>{data?.whyHybrid?.philosophyLabel || "01 — 04 • PHILOSOPHY & PRACTICE"}</span>
          </div>
          <div className="hidden md:block text-white/30">
            FOUNDATION &bull; GUIDANCE &bull; ADAPTATION &bull; COMMUNITY
          </div>
          <div>HAPPYPRANCER HYBRID SYSTEM</div>
        </div>
      </div>

      {/* Methodology Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-gray-900">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-900">Edit Training Methodology</h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={methodologyForm.headerTitle}
                  onChange={(e) =>
                    setMethodologyForm({ ...methodologyForm, headerTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. Why Go Hybrid"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Section Subtitle / Offer Note
                </label>
                <input
                  type="text"
                  value={methodologyForm.headerSubtitle}
                  onChange={(e) =>
                    setMethodologyForm({ ...methodologyForm, headerSubtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. Special offer note for trainees..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plate / Studio Address
                  </label>
                  <input
                    type="text"
                    value={methodologyForm.address}
                    onChange={(e) =>
                      setMethodologyForm({ ...methodologyForm, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Ambassador of dance, Farmington hill, Michigan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Methodology Footer Label
                  </label>
                  <input
                    type="text"
                    value={methodologyForm.philosophyLabel}
                    onChange={(e) =>
                      setMethodologyForm({ ...methodologyForm, philosophyLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="01 — 04 • PHILOSOPHY & PRACTICE"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Methodology Chapters (4 Pillars)
                </h5>
                <div className="space-y-4">
                  {methodologyForm.cards.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5"
                    >
                      <div className="text-xs font-bold text-emerald-800">
                        Chapter 0{idx + 1}: {chapterEyebrows[idx] || `Pillar ${idx + 1}`}
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Chapter Title
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => {
                            const newCards = [...methodologyForm.cards];
                            newCards[idx] = { ...newCards[idx], title: e.target.value };
                            setMethodologyForm({ ...methodologyForm, cards: newCards });
                          }}
                          className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                          placeholder="e.g. Guided Form & Foundation"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Chapter Description
                        </label>
                        <textarea
                          value={card.description}
                          onChange={(e) => {
                            const newCards = [...methodologyForm.cards];
                            newCards[idx] = { ...newCards[idx], description: e.target.value };
                            setMethodologyForm({ ...methodologyForm, cards: newCards });
                          }}
                          rows={2}
                          className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                          placeholder="Chapter description..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Chapter Image
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCardImageChange(e, idx)}
                            className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300"
                          />
                          {uploadingCardIndex === idx && (
                            <span className="text-xs text-emerald-600 animate-pulse">Uploading...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMethodology}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: "#215A55" }}
                >
                  {isSaving ? "Saving..." : "Save Methodology"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 4: EditablePlans (Services / Classes: "Ways to Work With Me")
// ============================================================================
export function EditablePlans({
  data,
  forceMobile = false,
  editMode = false,
  onUpdatePageData,
  onSavePage,
  onHybridProductImageUpload,
  onClassImageUpload,
}) {
  const InstitutionData = useContext(InstitutionContext)?.institutionData;
  const { productList, userData: UserCtx, isAuth } = useContext(Context);
  const primaryColor = data?.globalPrimaryColor || "#215A55";
  const plansData = data?.plans;
  const hybridProducts = data?.hybridProducts || [];
  const classes = data?.classes || [];

  const cardsGridRef = useRef(null);

  useEffect(() => {
    if (editMode) return;

    const ctx = gsap.context(() => {
      if (cardsGridRef.current) {
        const cards = cardsGridRef.current.children;
        if (cards && cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.15,
              ease: "power2.out",
              scrollTrigger: {
                trigger: cardsGridRef.current,
                start: "top 85%",
                once: true,
              },
            }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [editMode]);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingClassIdx, setUploadingClassIdx] = useState(null);
  const [plansForm, setPlansForm] = useState({
    description: "",
    classes: [],
  });

  const onOpenEdit = () => {
    setPlansForm({
      description:
        data?.plans?.description ||
        "Choose the perfect plan for your fitness journey. Every plan includes full hybrid access and your first month free.",
      classes: (data?.classes || []).map((c, i) => ({
        id: c.id || `class_${i}`,
        badge: c.badge || (i % 2 === 1 ? "Elite Experience" : "Premium Experience"),
        name: c.name || "",
        description: c.description || "",
        time: c.time || "",
        productId: c.productId || "",
        image: c.image || "",
        includedServices: Array.isArray(c.includedServices)
          ? c.includedServices
          : [
              "In-Studio & Online Live",
              "HD Class Replays",
              "Direct Instructor Messaging",
            ],
        recurringPrice:
          c.recurringPrice !== undefined && c.recurringPrice !== null
            ? c.recurringPrice
            : 1500,
        originalPrice:
          c.originalPrice !== undefined && c.originalPrice !== null
            ? c.originalPrice
            : 3000,
        currency: c.currency || "₹",
        billingPeriod: c.billingPeriod || "month",
        offerBadge: c.offerBadge || "1st Month Free",
        offerSubtext:
          c.offerSubtext || "Then {price}/{period} from month 2 • Cancel anytime",
        buttonText: c.buttonText || "Start Free Month",
      })),
    });
    setIsEditing(true);
  };

  const addClassItem = () => {
    const defaultProductId =
      hybridProducts[0]?.productId || hybridProducts[0]?.id || "";
    const idx = plansForm.classes.length;
    setPlansForm((prev) => ({
      ...prev,
      classes: [
        ...prev.classes,
        {
          id: `class_${Date.now()}`,
          badge: idx % 2 === 1 ? "Elite Experience" : "Premium Experience",
          name: "New Class Session",
          description: "Hybrid session with live and on-demand access.",
          time: "Mon, Wed, Fri 6:00 PM",
          productId: defaultProductId,
          image: "",
          includedServices: [
            "In-Studio & Online Live",
            "HD Class Replays",
            "Direct Instructor Messaging",
          ],
          recurringPrice: 1500,
          originalPrice: 3000,
          currency: "₹",
          billingPeriod: "month",
          offerBadge: "1st Month Free",
          offerSubtext: "Then {price}/{period} from month 2 • Cancel anytime",
          buttonText: "Start Free Month",
        },
      ],
    }));
  };

  const removeClassItem = (idx) => {
    setPlansForm((prev) => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== idx),
    }));
  };

  const handleClassImageFileChange = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploader = onClassImageUpload || onHybridProductImageUpload;
    if (!uploader) {
      toast.error("Image upload handler not available");
      return;
    }
    setUploadingClassIdx(idx);
    try {
      const uploadedUrl = await uploader(file);
      if (uploadedUrl) {
        const newClasses = [...plansForm.classes];
        newClasses[idx] = {
          ...newClasses[idx],
          image: uploadedUrl,
        };
        setPlansForm((prev) => ({ ...prev, classes: newClasses }));
        toast.success("Class image uploaded successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload class image");
    } finally {
      setUploadingClassIdx(null);
    }
  };

  const handleSavePlans = async () => {
    setIsSaving(true);
    try {
      const updatedPlans = {
        ...data?.plans,
        description: plansForm.description,
      };
      const updatedClasses = [...plansForm.classes];

      if (onUpdatePageData) {
        onUpdatePageData("plans", updatedPlans);
        onUpdatePageData("classes", updatedClasses);
      }

      if (onSavePage) {
        const fullPageData = {
          ...data,
          plans: updatedPlans,
          classes: updatedClasses,
        };
        await onSavePage(fullPageData, false, {
          source: "section",
          section: "plans",
        });
      }
      setIsEditing(false);
      toast.success("Classes & services updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save classes & services");
    } finally {
      setIsSaving(false);
    }
  };

  // Match each class to its plan; provide safe fallback
  const displayClasses = classes.map((cls, idx) => {
    const plan =
      hybridProducts.find(
        (p) => p.productId === cls.productId || p.id === cls.productId,
      ) ||
      hybridProducts[idx] ||
      hybridProducts[0] ||
      null;
    return { cls, plan };
  });

  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("referral");

  /** -----------------------------
   * LOCATION INITIALIZATION
   * ----------------------------- */
  const [userLocation, setUserLocation] = useState(() => {
    return (
      UserCtx?.location?.countryCode ||
      localStorage.getItem("userLocation") ||
      null
    );
  });

  useEffect(() => {
    if (UserCtx?.location?.countryCode) {
      setUserLocation(UserCtx.location.countryCode);
      localStorage.setItem("userLocation", UserCtx.location.countryCode);
      return;
    }
    const storedLocation = localStorage.getItem("userLocation");
    if (storedLocation) {
      setUserLocation(storedLocation);
    }
  }, [UserCtx?.location?.countryCode]);

  // Dynamic Multi-Currency Pricing Hook driven by resolved userLocation
  const {
    userCountryCode,
    targetCurrency,
    isLoading: isPricingLoading,
    getPlanPricing,
  } = useDynamicPricing({
    userCountryCode: userLocation,
    userLocation: UserCtx?.location,
    productList,
  });

  const getDisplayPrice = (plan) => {
    const pricing = getPlanPricing(plan);
    return pricing?.displayPriceText || plan?.price || plan?.durationText || "";
  };

  const getFirstMonthFreePrice = (plan) => {
    const pricing = getPlanPricing(plan);
    const original = pricing?.displayPriceText || plan?.price || "";
    // Dynamically replace digits with 0 while keeping currency symbol/locale intact
    const discounted = original.replace(/[\d,.]+/, "0");
    const originalAmountOnly =
      pricing?.displayOnlyAmount || original.split("/")[0];
    return {
      original,
      discounted,
      originalAmountOnly,
      settlementText: pricing?.settlementText || "",
      isConverted: !!pricing?.isConverted,
      isLoading: isPricingLoading,
    };
  };

  const defaultPlanImages = [zumbaImg, yogaImg];

  const getPlanImage = (plan, cls, index) => {
    if (
      cls?.image &&
      typeof cls.image === "string" &&
      cls.image.trim() &&
      cls.image !== "undefined" &&
      cls.image !== "null"
    ) {
      return cls.image;
    }
    if (
      plan?.image &&
      typeof plan.image === "string" &&
      plan.image.trim() &&
      plan.image !== "undefined" &&
      plan.image !== "null"
    ) {
      return plan.image;
    }
    const cardImage = plansData?.cards?.[index]?.image;
    if (
      cardImage &&
      typeof cardImage === "string" &&
      cardImage.trim() &&
      cardImage !== "undefined" &&
      cardImage !== "null"
    ) {
      return cardImage;
    }
    const isProd = process.env.REACT_APP_STAGE === "PROD";

    // In Beta only: allow demo image fallbacks for Beta verification
    if (!isProd) {
      const title = (
        cls?.name ||
        plan?.heading ||
        plan?.title ||
        plan?.name ||
        ""
      ).toLowerCase();
      if (
        title.includes("yoga") ||
        title.includes("personal") ||
        title.includes("train")
      ) {
        return yogaImg;
      }
      if (title.includes("zumba") || title.includes("dance")) {
        return zumbaImg;
      }
      return defaultPlanImages[index % defaultPlanImages.length] || zumbaImg;
    }

    return null;
  };

  const handleImageError = (e, planTitle, fallbackImg) => {
    if (e.target.dataset.hasFallback) return;
    e.target.dataset.hasFallback = "true";
    if (process.env.REACT_APP_STAGE !== "PROD" && fallbackImg) {
      e.target.src = fallbackImg;
    } else {
      e.target.style.display = "none";
    }
    e.target.alt = `${planTitle}`;
  };

  const getClassTitle = (cls, plan) =>
    cls?.name?.trim() || plan?.heading || plan?.title || plan?.name || "Class";

  const getClassDescription = (cls, plan) => {
    if (cls?.description?.trim()) return cls.description;
    if (plan?.classType?.length) return plan.classType.join(" • ");
    if (plan?.durationText) return `Billed ${plan.durationText}`;
    return "Hybrid subscription with full studio and online live access.";
  };

  const getHybridPlanBadges = (plan) => {
    if (plan?.provides?.length) return plan.provides;
    if (plan?.classType?.length) return plan.classType;
    if (plan?.durationText) return [plan.durationText];
    return ["In-Studio & Online Live", "HD Class Replays", "Direct Instructor Messaging"];
  };

  const handlePlanSubscribeClick = async (
    plan,
    cls,
    cognitoId,
    referralParam,
    isUpgrade = false,
  ) => {
    try {
      const hybridProductId =
        cls?.productId ||
        plan?.productId ||
        plan?.planId ||
        productList?.find(
          (item) =>
            item.subscriptionType === "hybrid" && item.productId !== "100032",
        )?.productId;

      if (!hybridProductId) {
        toast.error("Hybrid product not available");
        return;
      }

      const ref = referralParam || referralCode || "";

      // Determine authoritative recurring price and details
      const actualPrice =
        cls?.recurringPrice !== undefined &&
        cls?.recurringPrice !== null &&
        cls?.recurringPrice !== ""
          ? cls.recurringPrice
          : cls?.price ?? plan?.baseAmount ?? 1500;

      const actualCurrency = cls?.currency || "INR";
      const actualBillingPeriod = cls?.billingPeriod || "month";
      const actualPlanName =
        cls?.name ||
        plan?.heading ||
        plan?.title ||
        plan?.name ||
        "Hybrid Subscription";

      const queryParams = new URLSearchParams({
        productId: String(hybridProductId),
        planId: String(plan?.id || plan?.productId || cls?.productId || ""),
        userType: "hybrid",
        amount: String(actualPrice),
        price: String(actualPrice),
        recurringPrice: String(actualPrice),
        planName: String(actualPlanName),
        currency: String(actualCurrency),
        billingPeriod: String(actualBillingPeriod),
      });
      if (ref) queryParams.set("referral", ref);

      if (isUpgrade) {
        const prevSubId =
          UserCtx?.subscriptionId ||
          UserCtx?.paymentId ||
          UserCtx?.userData?.subscriptionId ||
          UserCtx?.userData?.paymentId;
        if (prevSubId) {
          queryParams.set("previousSubscriptionId", prevSubId);
        }
        queryParams.set("isUpgrade", "true");
      }

      if (!cognitoId) {
        window.location.href = `/signup?${queryParams.toString()}`;
        return;
      }

      const base =
        process.env.REACT_APP_STAGE === "PROD"
          ? "https://payment.happyprancer.com"
          : "https://betapayment.happyprancer.com";

      const paymentUrl = `${base}/${InstitutionData?.InstitutionId}/${hybridProductId}/${cognitoId}?${queryParams.toString()}`;

      window.location.href = paymentUrl;
    } catch (e) {
      console.error(e);
      toast.error("Unable to start subscription");
    }
  };

  // Authoritative subscription status: active member only
  const userStatus = (
    UserCtx?.status ||
    UserCtx?.userData?.status ||
    ""
  ).toLowerCase();
  const hasActiveSubscription = Boolean(
    isAuth && userStatus === "active",
  );

  // Strict plan identity matching: evaluates product and plan identifiers, never card/index position
  const checkIsCurrentPlan = (cls, plan) => {
    if (!hasActiveSubscription || !UserCtx) return false;

    const userProdId = UserCtx.productId
      ? String(UserCtx.productId)
      : UserCtx.userData?.productId
        ? String(UserCtx.userData.productId)
        : null;
    const userProdIds = Array.isArray(UserCtx.productIds)
      ? UserCtx.productIds.map(String)
      : Array.isArray(UserCtx.userData?.productIds)
        ? UserCtx.userData.productIds.map(String)
        : [];
    const userPlanId = UserCtx.planId
      ? String(UserCtx.planId)
      : UserCtx.userData?.planId
        ? String(UserCtx.userData.planId)
        : null;

    // Cross-catalog matching product from productList
    const userCatalogProduct = Array.isArray(productList)
      ? productList.find(
          (p) =>
            (userProdId && String(p.productId) === userProdId) ||
            (userPlanId &&
              (String(p.planId) === userPlanId ||
                String(p.plan_id) === userPlanId)),
        )
      : null;

    const candidateIds = [
      cls?.productId,
      plan?.productId,
      plan?.planId,
      plan?.id,
    ]
      .filter(Boolean)
      .map(String);

    return candidateIds.some((candId) => {
      if (userProdId && candId === userProdId) return true;
      if (userProdIds.includes(candId)) return true;
      if (userPlanId && candId === userPlanId) return true;
      if (userCatalogProduct) {
        if (
          userCatalogProduct.productId &&
          candId === String(userCatalogProduct.productId)
        )
          return true;
        if (
          userCatalogProduct.planId &&
          candId === String(userCatalogProduct.planId)
        )
          return true;
        if (
          userCatalogProduct.plan_id &&
          candId === String(userCatalogProduct.plan_id)
        )
          return true;
      }
      return false;
    });
  };

  const itemsToRender =
    displayClasses.length > 0
      ? displayClasses
      : (plansData?.cards || []).map((card, idx) => ({
          cls: {
            id: card.id || `card-${idx}`,
            name: card.title,
            description: card.description,
            time: card.time || "",
          },
          plan: card,
        }));

  // Resolve recurring amount of the current subscribed plan
  const currentSubscribedItem = itemsToRender.find(({ cls, plan }) =>
    checkIsCurrentPlan(cls, plan),
  );

  const currentSubscribedAmount = currentSubscribedItem
    ? Number(
        currentSubscribedItem.cls?.recurringPrice ??
          currentSubscribedItem.plan?.baseAmount ??
          0,
      )
    : 0;

  return (
    <section
      id="services-section"
      className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 bg-[#FAFBF9] relative overflow-hidden"
    >
      {editMode && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur border border-stone-300 text-stone-800 shadow-md hover:bg-white hover:border-stone-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Edit Classes</span>
          </button>
        </div>
      )}
      {/* Left Editorial Outer Botanical Accent (OpenClipart #297239 by Firkin, CC0) */}
      <div
        className="absolute -left-12 sm:-left-8 lg:-left-4 xl:left-0 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-[0.14] xl:opacity-[0.18] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalSideLeft}
          alt=""
          aria-hidden="true"
          className="w-48 sm:w-56 lg:w-64 xl:w-72 h-auto max-h-[460px] object-contain"
        />
      </div>

      {/* Right Editorial Outer Botanical Accent (OpenClipart #297240 by Firkin, CC0) */}
      <div
        className="absolute -right-12 sm:-right-8 lg:-right-4 xl:right-0 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-[0.14] xl:opacity-[0.18] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalSideRight}
          alt=""
          aria-hidden="true"
          className="w-48 sm:w-56 lg:w-64 xl:w-72 h-auto max-h-[460px] object-contain -scale-x-100"
        />
      </div>

      {/* Right Editorial Handwritten / Illustrative Stamp (Matching Reference Image) */}
      <div
        className="absolute right-4 xl:right-10 top-16 sm:top-20 pointer-events-none hidden xl:flex flex-col items-center select-none z-10 rotate-[5deg] opacity-75"
        aria-hidden="true"
      >
        <div className="font-serif italic text-base xl:text-lg text-[#215A55] tracking-wide leading-tight text-center max-w-[130px]">
          Invest In A Healthier, Happier You
        </div>
        <div className="w-14 h-0.5 bg-[#CCA45E]/60 rounded-full mt-1.5" />
      </div>

      <div className="max-w-[1360px] mx-auto relative z-10">
        {/* Section Editorial Header - Compact Spacing */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 lg:mb-12">
          <span
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase mb-1.5 block"
            style={{ color: primaryColor }}
          >
            Services & Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-gray-900 tracking-tight mb-2 font-normal">
            Ways to Work With Me
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
            {plansData?.description ||
              "Choose the perfect plan for your fitness journey. Every plan includes full hybrid access and your first month free."}
          </p>
          <div className="w-10 h-0.5 bg-[#CCA45E]/50 mx-auto mt-3" />
        </div>

        {itemsToRender.length === 0 ? (
          <div className="text-center py-10 px-6 bg-white rounded-2xl border border-stone-200 max-w-md mx-auto">
            <p className="text-gray-500 text-sm">
              No classes or services have been scheduled yet.
            </p>
          </div>
        ) : (
          <div
            ref={cardsGridRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-8 max-w-[1160px] xl:max-w-[1220px] mx-auto items-stretch"
          >
            {itemsToRender.map(({ cls, plan }, index) => {
              const planImage = getPlanImage(plan, cls, index);
              const fallbackImg =
                defaultPlanImages[index % defaultPlanImages.length] || zumbaImg;
              const classTitle = getClassTitle(cls, plan);
              const {
                original,
                discounted,
                originalAmountOnly,
                settlementText,
                isConverted,
              } = getFirstMonthFreePrice(plan);

              const isElite = index % 2 === 1;
              const badges = getHybridPlanBadges(plan);
              const inclusions =
                Array.isArray(cls?.includedServices) && cls.includedServices.length > 0
                  ? cls.includedServices
                  : badges;

              const displayBadge =
                cls?.badge || (isElite ? "Elite Experience" : "Premium Experience");

              // Determine price presentation
              const currencySymbol = getCurrencySymbol(targetCurrency);
              const recurringPrice =
                cls?.recurringPrice !== undefined &&
                cls?.recurringPrice !== null &&
                cls?.recurringPrice !== ""
                  ? cls.recurringPrice
                  : originalAmountOnly || 1500;
              const originalStrike =
                cls?.originalPrice !== undefined &&
                cls?.originalPrice !== null &&
                cls?.originalPrice !== ""
                  ? `${currencySymbol}${cls.originalPrice}`
                  : original || `${currencySymbol}3000`;
              const displayRecurring = `${currencySymbol}${recurringPrice}`;
              const displayOfferBadge = cls?.offerBadge || "1st Month Free";

              const offerSubtext = cls?.offerSubtext
                ? cls.offerSubtext
                    .replace(/\{price\}/g, displayRecurring)
                    .replace(/\{period\}/g, cls?.billingPeriod || "month")
                : null;

              const buttonLabel = cls?.buttonText || "Start Free Month";
              const isCurrentPlan = checkIsCurrentPlan(cls, plan);
              const isUpgrade = Boolean(hasActiveSubscription && !isCurrentPlan);

              return (
                <div
                  key={cls.id || index}
                  className={`group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    isElite
                      ? "border border-[#CCA45E]/40 shadow-[0_12px_35px_-15px_rgba(204,164,94,0.18)] hover:shadow-[0_18px_45px_-12px_rgba(204,164,94,0.25)] hover:border-[#CCA45E]/70"
                      : "border border-stone-200/90 shadow-[0_12px_35px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_18px_45px_-12px_rgba(0,0,0,0.12)] hover:border-stone-300"
                  }`}
                >
                  {/* Subtle Corner Ornament for Elite card */}
                  {isElite && (
                    <div
                      className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-20 overflow-hidden z-20"
                      aria-hidden="true"
                    >
                      <img
                        src={botanicalCornerGold}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Card Main Interior - Compact Padding */}
                  <div className="p-5 sm:p-6 lg:p-7 flex-1 flex flex-col">
                    {/* Top Tier Identifier Eyebrow */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCurrentPlan
                              ? "bg-emerald-600"
                              : isElite
                                ? "bg-[#CCA45E]"
                                : "bg-[#215A55]"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold tracking-[0.18em] uppercase ${
                            isCurrentPlan
                              ? "text-emerald-700"
                              : isElite
                                ? "text-[#CCA45E]"
                                : "text-[#215A55]"
                          }`}
                        >
                          {displayBadge}
                        </span>
                      </div>
                      {isCurrentPlan ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                          Current Plan
                        </span>
                      ) : isElite && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF5EC] text-[#9A7426] border border-[#CCA45E]/30">
                          Signature
                        </span>
                      )}
                    </div>

                    {/* Editorial Visual Artwork Container - Compact Height */}
                    <div className="relative w-full h-44 sm:h-48 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 mb-4 shadow-inner flex items-center justify-center">
                      {planImage ? (
                        <img
                          src={planImage}
                          alt={classTitle}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          loading="lazy"
                          onError={(e) =>
                            handleImageError(e, classTitle, fallbackImg)
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#071914]/5 text-stone-400 p-4">
                          <Calendar className="w-8 h-8 mb-1.5 opacity-40 text-[#215A55]" />
                          <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 text-center line-clamp-1">
                            {classTitle}
                          </span>
                        </div>
                      )}

                      {/* Dark gradient scrim at bottom for text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                      {/* Schedule / Time pill if present */}
                      {cls?.time && (
                        <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-md text-white/95 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                          <Clock className="w-3 h-3 text-[#CCA45E]" />
                          <span>{cls.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Plan Heading & Description - Compact Spacing */}
                    <div className="mb-3.5">
                      <h3 className="text-xl sm:text-2xl font-serif font-normal text-gray-900 tracking-tight mb-1">
                        {classTitle}
                      </h3>
                      <p className="text-sm sm:text-base text-stone-600 leading-normal font-light line-clamp-2">
                        {cls?.description?.trim() || getClassDescription(cls, plan)}
                      </p>
                    </div>

                    {/* What's Included / Inclusions from real data */}
                    {inclusions && inclusions.length > 0 && (
                      <div className="pt-3 border-t border-stone-100 mb-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 block mb-1.5">
                          What's included
                        </span>
                        <ul className="space-y-1.5">
                          {inclusions.map((badge, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-xs sm:text-sm text-stone-700 font-medium"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isElite ? "bg-[#CCA45E]" : "bg-[#215A55]"
                                }`}
                              />
                              <span>{badge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Spacer to push pricing & CTA to bottom */}
                    <div className="mt-auto" />

                    {/* Hero Price Block - Compact Spacing */}
                    <div className="pt-3.5 border-t border-stone-100">
                      {hasActiveSubscription ? (
                        <div>
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span
                              className="text-2xl sm:text-3xl font-bold tracking-tight"
                              style={{ color: primaryColor }}
                            >
                              {displayRecurring}
                            </span>
                            <span className="text-xs sm:text-sm text-stone-500 font-medium">
                              /{cls?.billingPeriod || "monthly"}
                            </span>
                          </div>
                          <p className="text-[13px] sm:text-sm text-stone-500 font-normal leading-normal mt-0.5">
                            {isCurrentPlan
                              ? "Current active plan • Renews automatically"
                              : "Standard recurring billing • Cancel anytime"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 mb-1.5">
                            <div className="flex items-baseline gap-2.5 flex-wrap">
                              <span
                                className="text-2xl sm:text-3xl font-bold tracking-tight"
                                style={{ color: primaryColor }}
                              >
                                {discounted || `${currencySymbol}0`}
                              </span>
                              {originalStrike && (
                                <span className="text-xs sm:text-sm text-stone-400 line-through font-normal">
                                  {originalStrike}
                                </span>
                              )}
                              <span
                                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isElite
                                    ? "bg-[#FAF5EC] text-[#9A7426] border border-[#CCA45E]/30"
                                    : "bg-[#E8FFFC] text-[#03413A] border border-[#03413A]/10"
                                }`}
                              >
                                {displayOfferBadge}
                              </span>
                            </div>
                          </div>

                          <p className="text-[13px] sm:text-sm text-stone-500 font-normal leading-normal mt-0.5">
                            {offerSubtext ? (
                              offerSubtext
                            ) : (
                              <>
                                Then{" "}
                                <strong className="text-stone-800 font-semibold">
                                  {displayRecurring}
                                </strong>
                                /{cls?.billingPeriod || "month"} from month 2 • Cancel anytime
                              </>
                            )}
                          </p>

                          {/* Currency Settlement Note if converted */}
                          {isConverted && settlementText && (
                            <p className="text-[10px] text-stone-400 italic mt-1">
                              ⓘ {settlementText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Substantial Premium CTA Button - Compact */}
                      {isCurrentPlan ? (
                        <button
                          type="button"
                          disabled
                          className="w-full mt-3.5 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300/80 cursor-default shadow-none"
                        >
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span>Subscribed</span>
                        </button>
                      ) : isUpgrade ? (
                        <button
                          type="button"
                          onClick={() =>
                            handlePlanSubscribeClick(
                              plan,
                              cls,
                              UserCtx?.cognitoId || UserCtx?.userData?.cognitoId,
                              UserCtx?.referral_code || UserCtx?.userData?.referral_code,
                              true,
                            )
                          }
                          className="w-full mt-3.5 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span>Upgrade Plan</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handlePlanSubscribeClick(
                              plan,
                              cls,
                              UserCtx?.cognitoId || UserCtx?.userData?.cognitoId,
                              UserCtx?.referral_code || UserCtx?.userData?.referral_code,
                              false,
                            )
                          }
                          className="w-full mt-3.5 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span>{buttonLabel}</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Classes & Services Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-gray-900">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-900">
                Edit Classes & Offerings
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Section Intro Description
                </label>
                <textarea
                  value={plansForm.description}
                  onChange={(e) =>
                    setPlansForm({ ...plansForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Introductory text describing the ways to work with you..."
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Classes & Services ({plansForm.classes.length})
                  </h5>
                  <button
                    type="button"
                    onClick={addClassItem}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    + Add Class
                  </button>
                </div>

                <div className="space-y-4">
                  {plansForm.classes.map((clsItem, idx) => (
                    <div
                      key={clsItem.id || idx}
                      className="p-4 bg-stone-50 rounded-xl border border-stone-200 relative space-y-3"
                    >
                      <div className="flex items-center justify-between pr-8 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-stone-700">
                          Class #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeClassItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer flex items-center gap-1 text-xs"
                          title="Remove class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      {/* Tier Badge & Class Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                            Tier Eyebrow Badge
                          </label>
                          <input
                            type="text"
                            value={clsItem.badge || ""}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                badge: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                            placeholder="e.g. Premium Experience / Elite Experience"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                            Class Name
                          </label>
                          <input
                            type="text"
                            value={clsItem.name}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                name: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                            placeholder="e.g. Zumba Energy Live"
                          />
                        </div>
                      </div>

                      {/* Schedule / Time & Associated Tier */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                            Schedule / Time
                          </label>
                          <input
                            type="text"
                            value={clsItem.time}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                time: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                            placeholder="e.g. Mon, Wed, Fri 6:00 PM"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                            Associated Product / Plan Tier
                          </label>
                          <select
                            value={clsItem.productId}
                            onChange={(e) => {
                              const newProductId = e.target.value;
                              const newClasses = [...plansForm.classes];
                              const currentCls = newClasses[idx];

                              const getProductName = (p) =>
                                p ? (p.name || p.title || p.heading || "") : "";

                              const prevProduct = hybridProducts.find(
                                (p) =>
                                  String(p.productId || p.id) ===
                                  String(currentCls.productId),
                              );
                              const prevPlanName = getProductName(prevProduct);

                              const nextProduct = hybridProducts.find(
                                (p) =>
                                  String(p.productId || p.id) ===
                                  String(newProductId),
                              );
                              const nextPlanName = getProductName(nextProduct);

                              const currentName = (currentCls.name || "").trim();

                              const isExactPrevPlanMatch = Boolean(
                                prevPlanName &&
                                  currentName.toLowerCase() ===
                                    prevPlanName.trim().toLowerCase(),
                              );

                              const shouldUpdateName =
                                !currentName || isExactPrevPlanMatch;

                              const updatedName = shouldUpdateName
                                ? nextPlanName || currentCls.name
                                : currentCls.name;

                              newClasses[idx] = {
                                ...currentCls,
                                productId: newProductId,
                                name: updatedName,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                          >
                            <option value="">Select a subscription tier...</option>
                            {hybridProducts.map((p) => (
                              <option
                                key={p.productId || p.id}
                                value={p.productId || p.id}
                              >
                                {p.name || p.title || p.productId || "Plan"} (
                                {p.durationText || p.price || ""})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Image URL & Upload */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Class Artwork Image
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={clsItem.image || ""}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                image: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="flex-1 px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                            placeholder="Image URL or upload file"
                          />
                          <label className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-xs font-medium cursor-pointer transition-colors shrink-0">
                            {uploadingClassIdx === idx ? "Uploading..." : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingClassIdx === idx}
                              onChange={(e) => handleClassImageFileChange(idx, e)}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Description
                        </label>
                        <textarea
                          value={clsItem.description}
                          onChange={(e) => {
                            const newClasses = [...plansForm.classes];
                            newClasses[idx] = {
                              ...newClasses[idx],
                              description: e.target.value,
                            };
                            setPlansForm({ ...plansForm, classes: newClasses });
                          }}
                          rows={2}
                          className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                          placeholder="Class description..."
                        />
                      </div>

                      {/* What's Included (1 per line) */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          What's Included (one per line)
                        </label>
                        <textarea
                          value={
                            Array.isArray(clsItem.includedServices)
                              ? clsItem.includedServices.join("\n")
                              : ""
                          }
                          onChange={(e) => {
                            const newClasses = [...plansForm.classes];
                            newClasses[idx] = {
                              ...newClasses[idx],
                              includedServices: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            };
                            setPlansForm({ ...plansForm, classes: newClasses });
                          }}
                          rows={3}
                          className="w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                          placeholder={"In-Studio & Online Live\nHD Class Replays\nDirect Instructor Messaging"}
                        />
                      </div>

                      {/* Pricing Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-stone-100/70 p-2.5 rounded-lg border border-stone-200">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Currency
                          </label>
                          <input
                            type="text"
                            value={clsItem.currency || "₹"}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                currency: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="₹"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Recurring Price
                          </label>
                          <input
                            type="number"
                            value={clsItem.recurringPrice ?? 1500}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                recurringPrice: Number(e.target.value) || 0,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="1500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Original Price
                          </label>
                          <input
                            type="number"
                            value={clsItem.originalPrice ?? 3000}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                originalPrice: Number(e.target.value) || 0,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="3000"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Billing Period
                          </label>
                          <input
                            type="text"
                            value={clsItem.billingPeriod || "month"}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                billingPeriod: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="month"
                          />
                        </div>
                      </div>

                      {/* Promo Offer & Button */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Offer Pill Badge
                          </label>
                          <input
                            type="text"
                            value={clsItem.offerBadge || "1st Month Free"}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                offerBadge: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="1st Month Free"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Button Label
                          </label>
                          <input
                            type="text"
                            value={clsItem.buttonText || "Start Free Month"}
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                buttonText: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="Start Free Month"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                            Offer Subtext
                          </label>
                          <input
                            type="text"
                            value={
                              clsItem.offerSubtext ||
                              "Then {price}/{period} from month 2 • Cancel anytime"
                            }
                            onChange={(e) => {
                              const newClasses = [...plansForm.classes];
                              newClasses[idx] = {
                                ...newClasses[idx],
                                offerSubtext: e.target.value,
                              };
                              setPlansForm({ ...plansForm, classes: newClasses });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs bg-white"
                            placeholder="Then {price}/{period} from month 2 • Cancel anytime"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePlans}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? "Saving..." : "Save Classes & Services"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 5: TestimonialComponent (Reviews / Recommendations: "What People Say")
// ============================================================================
export function TestimonialComponent({
  instructorDetails,
  editable = false,
  testimonials: propTestimonials,
  data,
  forceMobile = false,
  onUpdatePageData,
  onSavePage,
  onTestimonialImageUpload,
  onAddTestimonial,
  onDeleteTestimonial,
}) {
  const primaryColor = data?.globalPrimaryColor || "#215A55";
  const institutionData = useContext(InstitutionContext);
  const UserCtxContext = useContext(Context);
  const UserCtx = UserCtxContext?.userData;
  const { updateInstructorTestimonials, deleteFile } = UserCtxContext || {};
  const InstitutionData = institutionData?.institutionData;
  const instId =
    InstitutionData?.InstitutionId || InstitutionData?.institutionid;

  const targetInstructorId =
    instructorDetails?.instructorId ||
    instructorDetails?.instructorProfile?.instructorId ||
    UserCtx?.cognitoId;

  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempTestimonial, setTempTestimonial] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const newlyUploadedImageUrlRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    // Unified authoritative source: both public and edit modes consume the exact same hybrid testimonials dataset
    let candidate = [];
    if (Array.isArray(propTestimonials) && propTestimonials.length > 0) {
      candidate = propTestimonials;
    } else if (
      Array.isArray(instructorDetails?.hybrid?.testimonials) &&
      instructorDetails.hybrid.testimonials.length > 0
    ) {
      candidate = instructorDetails.hybrid.testimonials;
    } else if (
      Array.isArray(instructorDetails?.instructorProfile?.testimonials) &&
      instructorDetails.instructorProfile.testimonials.length > 0
    ) {
      candidate = instructorDetails.instructorProfile.testimonials;
    }

    const formatted = candidate.map((item, idx) => ({
      id: item.id || `testimonial_${idx}`,
      name: item.name || "",
      description: item.description || "",
      image: item.image || "",
      rating: item.rating || 5,
      role: item.role || "",
    }));

    setTestimonials(formatted);
    setIsLoading(false);
  }, [instructorDetails, propTestimonials]);

  const validateTestimonial = (t) => {
    const newErrors = {};
    if (!t.name?.trim()) newErrors.name = "Name is required";
    if (!t.description?.trim())
      newErrors.description = "Description is required";
    else if (t.description.trim().length < 10)
      newErrors.description = "Minimum 10 characters";
    else if (t.description.trim().length > 600)
      newErrors.description = "Max 600 characters";
    return newErrors;
  };

  const onStartEdit = (index) => {
    setEditingIndex(index);
    setTempTestimonial({ ...testimonials[index] });
    newlyUploadedImageUrlRef.current = null;
    setErrors({});
  };

  const onCancelEdit = async () => {
    // If an image was uploaded during this edit session but cancelled, clean it up from S3
    if (newlyUploadedImageUrlRef.current && deleteFile && instId && targetInstructorId) {
      try {
        const testId = tempTestimonial?.id || `testimonial_${Date.now()}`;
        const folder = `${instId}/instructors/${targetInstructorId}/testimonials/${testId}`;
        await deleteFile("institution-utils", folder);
      } catch (err) {
        console.warn("[Testimonials] Cancel cleanup warning:", err?.message || err);
      }
      newlyUploadedImageUrlRef.current = null;
    }
    setEditingIndex(null);
    setTempTestimonial(null);
    setErrors({});
  };

  const onAddNew = () => {
    const newTest = {
      id: `testimonial_${Date.now()}`,
      name: "",
      description: "",
      image: "",
      rating: 5,
    };
    setEditingIndex("new");
    setTempTestimonial(newTest);
    setErrors({});
  };

  const onDelete = async (index) => {
    if (testimonials.length <= 1) {
      toast.error("Cannot delete the last testimonial");
      return;
    }
    if (!window.confirm("Delete this testimonial?")) return;
    const newTestimonials = testimonials.filter((_, i) => i !== index);

    try {
      if (editable) {
        if (!targetInstructorId) {
          toast.error("Missing instructor identifier");
          return;
        }
        if (updateInstructorTestimonials && instId) {
          await updateInstructorTestimonials(instId, {
            cognitoId: targetInstructorId,
            testimonials: newTestimonials,
          });
        }
        if (onSavePage) {
          await onSavePage(
            { ...data, testimonials: newTestimonials },
            false,
            { source: "section", section: "testimonials" },
          );
        }
      }
      // Update local and parent state only after successful backend confirmation
      setTestimonials(newTestimonials);
      if (onUpdatePageData) {
        onUpdatePageData("testimonials", newTestimonials);
      }
      toast.success("Testimonial deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete testimonial");
    }
  };

  const onSave = async () => {
    const validation = validateTestimonial(tempTestimonial || {});
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    const updated =
      editingIndex === "new"
        ? [...testimonials, tempTestimonial]
        : testimonials.map((t, idx) =>
            idx === editingIndex ? { ...tempTestimonial } : t,
          );

    try {
      if (editable) {
        if (!targetInstructorId) {
          toast.error("Missing instructor identifier");
          return;
        }
        if (updateInstructorTestimonials && instId) {
          await updateInstructorTestimonials(instId, {
            cognitoId: targetInstructorId,
            testimonials: updated,
          });
        }
        if (onSavePage) {
          await onSavePage(
            { ...data, testimonials: updated },
            false,
            { source: "section", section: "testimonials" },
          );
        }
      }
      // Update local and parent state only after successful backend confirmation
      setTestimonials(updated);
      if (onUpdatePageData) {
        onUpdatePageData("testimonials", updated);
      }
      toast.success("Testimonial saved");
      newlyUploadedImageUrlRef.current = null;
      setEditingIndex(null);
      setTempTestimonial(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error("Failed to save testimonial");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.InstitutionId && !InstitutionData?.institutionid) {
        toast.error("Missing institution identifier.");
        return;
      }
      if (!targetInstructorId) {
        toast.error("Missing instructor identifier.");
        return;
      }
      const testId = tempTestimonial?.id || `testimonial_${Date.now()}`;
      const folder = `${instId}/instructors/${targetInstructorId}/testimonials/${testId}`;
      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });
      newlyUploadedImageUrlRef.current = fileUrl;
      setTempTestimonial((prev) => ({ ...prev, image: fileUrl }));
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    } finally {
      setImageLoading(false);
    }
  };

  const onChangeTemp = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 600) return;
    const val =
      name === "rating" ? (value === "" ? "" : parseFloat(value)) : value;
    setTempTestimonial((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const isInstructor = editable && UserCtx?.userType === "instructor";

  // Slider State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(forceMobile ? 1 : 3);
  const cardRefs = useRef([]);
  const [activeHeight, setActiveHeight] = useState(undefined);

  useEffect(() => {
    if (forceMobile) {
      setVisibleCount(1);
      return;
    }
    const handleResize = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [forceMobile]);

  const effectiveVisibleCount = forceMobile ? 1 : visibleCount;
  const maxIndex = Math.max(0, (testimonials?.length || 0) - effectiveVisibleCount);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!forceMobile && effectiveVisibleCount > 1) {
      setActiveHeight(undefined);
      return;
    }
    const activeEl = cardRefs.current[currentIndex];
    if (!activeEl) return;
    const target = activeEl.firstElementChild || activeEl;

    const updateHeight = () => {
      const h = target.offsetHeight;
      if (h > 0) {
        setActiveHeight(h);
      }
    };

    updateHeight();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const h = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect?.height;
          if (h > 0) {
            setActiveHeight(Math.ceil(h));
          }
        }
      });
      ro.observe(target);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [currentIndex, testimonials, forceMobile, effectiveVisibleCount]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 bg-[#FAF7F0]">
        <div
          className="animate-spin h-8 w-8 border-3 rounded-full border-t-transparent"
          style={{ borderColor: primaryColor }}
        />
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section
      id="reviews-section"
      className="py-16 sm:py-20 lg:py-26 bg-[#FAF7F0] overflow-hidden border-y border-[#EBE7DF]/60 relative"
    >
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');`}
      </style>

      {/* Subtle Peripheral Botanical Edge Accents (Externally Sourced CC0 SVG: OpenClipart #310423) */}
      <div
        className="absolute left-4 xl:left-8 top-10 pointer-events-none hidden xl:block opacity-[0.14] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalCornerPine}
          alt=""
          aria-hidden="true"
          className="w-20 xl:w-24 h-auto max-h-48 object-contain"
        />
      </div>

      <div
        className="absolute right-4 xl:right-8 bottom-8 pointer-events-none hidden xl:block opacity-[0.12] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalCornerPine}
          alt=""
          aria-hidden="true"
          className="w-20 xl:w-24 h-auto max-h-48 object-contain -scale-x-100 -scale-y-100"
        />
      </div>

      <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div
          className={`grid grid-cols-1 ${
            forceMobile ? "" : "lg:grid-cols-12"
          } gap-8 lg:gap-12 items-center`}
          style={forceMobile ? { gridTemplateColumns: "1fr" } : undefined}
        >
          {/* =========================================================
        LEFT EDITORIAL PANEL
        Desktop: unchanged
        Mobile/Tablet: centered
    ========================================================= */}
          <div className={`${forceMobile ? "w-full" : "lg:col-span-4"} flex flex-col justify-between h-full`}>
            <div className="text-center lg:text-left">
              {/* Eyebrow */}
              <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">
                REAL PEOPLE. REAL STORIES
              </p>

              {/* Heading */}
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Testimonials
              </h2>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg lg:text-base text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-sm mx-auto lg:mx-0">
                {data?.testimonialsDescription ||
                  "Every session is designed to transform your body and uplift your mind."}
              </p>

              {/* Expressive Editorial Phrase: Desktop only */}
              <div
                className={`${
                  forceMobile ? "hidden" : "hidden lg:block"
                } mb-8 select-none text-3xl sm:text-4xl lg:text-[40px] font-normal leading-[1.15]`}
                style={{
                  fontFamily:
                    "'Caveat', 'Dancing Script', 'Brush Script MT', cursive",
                  color: primaryColor,
                }}
              >
                Community
                <br />
                That Moves
                <br />
                Together
              </div>
            </div>

            {/* =========================================================
          DESKTOP NAVIGATION
          Visible ONLY on lg+ when not in mobile preview mode
      ========================================================= */}
            <div className={`${forceMobile ? "hidden" : "hidden lg:flex"} items-center gap-3 pt-2`}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Previous testimonial"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 shadow-xs hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#215A55] focus-visible:ring-offset-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                aria-label="Next testimonial"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 shadow-xs hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#215A55] focus-visible:ring-offset-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {isInstructor && (
                <button
                  onClick={onAddNew}
                  className="ml-2 px-3.5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  + Add Review
                </button>
              )}
            </div>
          </div>

          {/* =========================================================
        RIGHT HORIZONTAL SLIDER
        Desktop: 3 cards
        Tablet: 2 cards
        Mobile Preview / Mobile: 1 card (content-driven height)
    ========================================================= */}
          <div
            className={`${forceMobile ? "w-full" : "lg:col-span-8"} overflow-hidden`}
            style={
              forceMobile && activeHeight
                ? {
                    height: `${activeHeight + 16}px`,
                    transition: "height 300ms cubic-bezier(0.25, 1, 0.5, 1)",
                  }
                : undefined
            }
          >
            <div
              className={`flex transition-transform duration-350 ease-out py-2 ${
                forceMobile ? "items-start" : ""
              }`}
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / effectiveVisibleCount)
                }%)`,
                transition: "transform 350ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            >
              {testimonials.map((t, idx) => (
                <div
                  key={t.id || idx}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  className={`flex-shrink-0 ${
                    forceMobile ? "px-1 w-full" : "px-2 sm:px-3"
                  }`}
                  style={{ width: `${100 / effectiveVisibleCount}%` }}
                >
                  <div
                    className={`bg-white rounded-2xl p-6 sm:p-7 border border-[#EBE7DF] shadow-xs hover:shadow-md transition-shadow relative group ${
                      forceMobile
                        ? "h-auto min-h-0 flex flex-col justify-start"
                        : "h-full flex flex-col justify-between min-h-[290px]"
                    }`}
                  >
                    {/* Admin / Instructor Edit Controls */}
                    {isInstructor && (
                      <div className="absolute top-3.5 right-3.5 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onStartEdit(idx)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDelete(idx)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-full text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className={`flex flex-col ${forceMobile ? "flex-initial" : "flex-1"}`}>
                      {/* Quotation Mark */}
                      <span
                        className="text-2xl font-serif leading-none mb-3 select-none block"
                        style={{ color: primaryColor }}
                      >
                        “
                      </span>

                      {/* Author Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {t.image ? (
                            <img
                              src={t.image}
                              alt={t.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-bold text-xs text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {t.name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate leading-snug">
                            {t.name || "HappyPrancer Member"}
                          </h4>

                          <p className="text-xs text-gray-500 truncate font-medium">
                            {t.role || "Member"}
                          </p>
                        </div>
                      </div>

                      {/* =====================================================
                    TESTIMONIAL QUOTE
                    Mobile: natural wrap without aggressive truncation
                    Desktop: original line-clamp-5
                ===================================================== */}
                      <p
                        className={`text-sm sm:text-base leading-relaxed italic text-gray-600 ${
                          forceMobile
                            ? "mb-4"
                            : "lg:text-[13px] line-clamp-5 my-auto"
                        }`}
                      >
                        "{t.description}"
                      </p>
                    </div>

                    {/* Star Rating */}
                    <div className={`flex items-center gap-0.5 ${forceMobile ? "pt-3 border-t border-gray-100" : "mt-5 pt-3 border-t border-gray-50"}`}>
                      {[...Array(5)].map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx < Math.floor(t.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================
        MOBILE + TABLET NAVIGATION
        Visible below lg OR when forceMobile is true
        Positioned BELOW testimonial cards.
    ========================================================= */}
          <div className={`${forceMobile ? "flex" : "lg:hidden flex"} col-span-1 items-center justify-center gap-3 pt-4`}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Previous testimonial"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 shadow-xs hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#215A55] focus-visible:ring-offset-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {testimonials.length > 1 && (
              <div className="flex items-center gap-1.5 px-1">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === i
                        ? "w-6"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    style={currentIndex === i ? { backgroundColor: primaryColor } : undefined}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              aria-label="Next testimonial"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 shadow-xs hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#215A55] focus-visible:ring-offset-2"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {isInstructor && (
              <button
                onClick={onAddNew}
                className="ml-2 px-3.5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                + Add Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructor Edit Testimonial Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold">Edit Recommendation</h4>
              <button
                onClick={onCancelEdit}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Name
                </label>
                <input
                  name="name"
                  value={tempTestimonial?.name || ""}
                  onChange={onChangeTemp}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g. Rahul Sharma"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  name="rating"
                  value={tempTestimonial?.rating ?? 5}
                  onChange={onChangeTemp}
                  className="w-28 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4.5}>4.5 Stars</option>
                  <option value={4}>4 Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Feedback / Review
                </label>
                <textarea
                  name="description"
                  value={tempTestimonial?.description || ""}
                  onChange={onChangeTemp}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Minimum 10 characters..."
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                    {tempTestimonial?.image ? (
                      <img
                        src={tempTestimonial.image}
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">
                        {tempTestimonial?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {imageLoading && (
                    <span className="text-xs text-emerald-600 animate-pulse">
                      Uploading...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Save Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 6: Transform (Final Call to Action)
// ============================================================================
export function Transform({
  data,
  onClaim,
  editMode = false,
  onUpdatePageData,
  onSavePage,
}) {
  const transformData = data?.transform || {};
  const primaryColor = data?.globalPrimaryColor || "#215A55";

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transformForm, setTransformForm] = useState({
    heading: "",
    desc: "",
    location: "",
    classTime: "",
  });

  const onOpenEdit = () => {
    setTransformForm({
      heading: transformData.heading || "Ready to Transform?",
      desc:
        transformData.desc ||
        "Join our community and unlock your potential with hybrid fitness.",
      location:
        transformData.location ||
        data?.location?.address ||
        data?.location?.name ||
        "",
      classTime: transformData.classTime || "",
    });
    setIsEditing(true);
  };

  const handleSaveTransform = async () => {
    setIsSaving(true);
    try {
      const updatedTransform = {
        ...transformData,
        heading: transformForm.heading,
        desc: transformForm.desc,
        location: transformForm.location,
        classTime: transformForm.classTime,
      };

      if (onUpdatePageData) {
        onUpdatePageData("transform", updatedTransform);
      }

      if (onSavePage) {
        const fullPageData = {
          ...data,
          transform: updatedTransform,
        };
        await onSavePage(fullPageData, false, {
          source: "section",
          section: "cta",
        });
      }
      setIsEditing(false);
      toast.success("CTA section updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save CTA section");
    } finally {
      setIsSaving(false);
    }
  };

  const instructorName =
    data?.hero?.name ||
    data?.whyHybrid?.instructorName ||
    "";
  const heading = transformData.heading || "Ready to Transform?";
  const desc =
    transformData.desc ||
    "Join our fitness community and unlock your potential with hybrid fitness.";

  // Use existing instructor/location data when available.
  const location =
    transformData.location ||
    data?.location?.address ||
    data?.location?.name ||
    data?.instructorDetails?.location ||
    null;

  const classTime =
    transformData.classTime ||
    data?.classTime ||
    data?.location?.classTime ||
    null;

  const scrollToServices = (e) => {
    smoothScrollToSection("services-section", e?.currentTarget || e?.target);
  };

  return (
    <section
      className="pb-16 sm:pb-20 lg:pb-24 bg-[#FAF9F6] relative overflow-hidden"
      data-purpose="conversion-banner"
      id="transform"
    >
      {editMode && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur border border-stone-300 text-stone-800 shadow-md hover:bg-white hover:border-stone-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Edit CTA</span>
          </button>
        </div>
      )}
      {/* Subtle Peripheral Framing Curves (Externally Sourced CC0 SVG: OpenClipart #285791) */}
      <div
        className="absolute left-6 xl:left-14 top-1/2 -translate-y-1/2 pointer-events-none hidden 2xl:block opacity-[0.14] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalFlourishPine}
          alt=""
          aria-hidden="true"
          className="w-20 xl:w-24 h-auto max-h-56 object-contain"
        />
      </div>

      <div
        className="absolute right-6 xl:right-14 top-1/2 -translate-y-1/2 pointer-events-none hidden 2xl:block opacity-[0.14] select-none z-0"
        aria-hidden="true"
      >
        <img
          src={botanicalFlourishPine}
          alt=""
          aria-hidden="true"
          className="w-20 xl:w-24 h-auto max-h-56 object-contain -scale-x-100"
        />
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="relative rounded-[28px] sm:rounded-[36px] text-white py-14 sm:py-16 lg:py-20 px-6 sm:px-10 lg:px-16 overflow-hidden shadow-2xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, #164035 0%, #0c2b23 65%, #082019 100%)",
            boxShadow: "0 25px 60px -15px rgba(5, 20, 16, 0.45)",
          }}
        >
          {/* Subtle ambient lighting */}
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-black/20"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Heading */}
            <h2
              className="font-serif font-bold text-3xl sm:text-5xl lg:text-[56px] leading-[1.15] tracking-tight text-white mb-4 sm:mb-5"
              style={{
                fontFamily:
                  "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif",
              }}
            >
              {heading}
            </h2>

            {/* Subheading in warm gold */}
            <p
              className="font-serif italic font-normal text-xl sm:text-2xl lg:text-[28px] leading-relaxed mb-8 sm:mb-10 max-w-3xl"
              style={{
                color: "#cca45e",
                fontFamily:
                  "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif",
              }}
            >
              {desc}
            </p>

            {/* Information Badges */}
            {(location || classTime) && (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                {location && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/[0.08] border border-white/[0.14] text-xs sm:text-[13px] font-medium text-white/90 backdrop-blur-sm shadow-xs">
                    <span aria-hidden="true" className="text-sm">
                      📍
                    </span>
                    <span>{location}</span>
                  </div>
                )}

                {classTime && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/[0.08] border border-white/[0.14] text-xs sm:text-[13px] font-medium text-white/90 backdrop-blur-sm shadow-xs">
                    <span aria-hidden="true" className="text-sm">
                      ⏱
                    </span>
                    <span>{classTime}</span>
                  </div>
                )}
              </div>
            )}

            {/* Primary CTA Button */}
            <div>
              <button
                type="button"
                onClick={scrollToServices}
                className="inline-flex items-center justify-center min-w-[280px] sm:min-w-[320px] px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-xs sm:text-[13px] font-bold tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#cca45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c2b23]"
                style={{
                  backgroundColor: "#cca45e",
                  color: "#0c2b23",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#d6ad66";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#cca45e";
                }}
              >
                {transformData.button || "Join With Special Invitation"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-gray-900">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-900">Edit Call To Action</h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  CTA Headline
                </label>
                <input
                  type="text"
                  value={transformForm.heading}
                  onChange={(e) =>
                    setTransformForm({ ...transformForm, heading: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. Ready to Transform?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  CTA Subtitle / Description
                </label>
                <textarea
                  value={transformForm.desc}
                  onChange={(e) =>
                    setTransformForm({ ...transformForm, desc: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Inspiring invitation text..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Studio / Training Location
                </label>
                <input
                  type="text"
                  value={transformForm.location}
                  onChange={(e) =>
                    setTransformForm({ ...transformForm, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="Studio or Location (e.g. City, State)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Schedule / Class Hours
                </label>
                <input
                  type="text"
                  value={transformForm.classTime}
                  onChange={(e) =>
                    setTransformForm({ ...transformForm, classTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. Monday - Friday: 6:00 PM - 7:00 PM"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransform}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? "Saving..." : "Save CTA"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 8: SocialMediaLinks (Clean Floating Share Links)
// ============================================================================
function SocialMediaLinks({
  data,
  editMode = false,
  onUpdatePageData,
  onSavePage,
}) {
  const socialMedia = data?.socialMedia || {};
  const primaryColor = data?.globalPrimaryColor || "#215A55";

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [socialForm, setSocialForm] = useState({
    instagram: "",
    facebook: "",
    youtube: "",
    twitter: "",
    telegram: "",
  });

  const onOpenEdit = () => {
    setSocialForm({
      instagram: socialMedia.instagram || "",
      facebook: socialMedia.facebook || "",
      youtube: socialMedia.youtube || "",
      twitter: socialMedia.twitter || "",
      telegram: socialMedia.telegram || "",
    });
    setIsEditing(true);
  };

  const handleSaveSocial = async () => {
    setIsSaving(true);
    try {
      const updatedSocial = {
        ...socialMedia,
        instagram: socialForm.instagram,
        facebook: socialForm.facebook,
        youtube: socialForm.youtube,
        twitter: socialForm.twitter,
        telegram: socialForm.telegram,
      };

      if (onUpdatePageData) {
        onUpdatePageData("socialMedia", updatedSocial);
      }

      if (onSavePage) {
        const fullPageData = {
          ...data,
          socialMedia: updatedSocial,
        };
        await onSavePage(fullPageData, false, {
          source: "section",
          section: "social",
        });
      }
      setIsEditing(false);
      toast.success("Social media links updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save social links");
    } finally {
      setIsSaving(false);
    }
  };

  const links = Object.entries(socialMedia).filter(
    ([_, url]) => url && typeof url === "string" && url.trim(),
  );

  if (links.length === 0 && !editMode) return null;

  return (
    <>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2.5">
        {links.map(([platform, url]) => {
          const displayName = getSocialPlatformDisplayName(url);
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white text-gray-700 shadow-md hover:shadow-lg flex items-center justify-center border border-gray-200 hover:scale-110 transition-all"
              style={{ color: primaryColor }}
              aria-label={displayName}
              title={displayName}
            >
              <SocialIcon url={url} className="w-4 h-4" />
            </a>
          );
        })}

        {editMode && (
          <button
            type="button"
            onClick={onOpenEdit}
            className="w-10 h-10 rounded-full bg-white text-emerald-700 shadow-md hover:shadow-lg flex items-center justify-center border border-emerald-300 hover:scale-110 transition-all cursor-pointer"
            title="Edit Social Media Links"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Social Media Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-gray-900">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-900">
                Edit Social Media Links
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <SocialIcon
                    url={socialForm.instagram}
                    className="w-3.5 h-3.5 text-gray-500"
                  />
                  <span>Instagram Profile URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.instagram}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, instagram: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <SocialIcon
                    url={socialForm.facebook}
                    className="w-3.5 h-3.5 text-gray-500"
                  />
                  <span>Facebook Profile / Page URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.facebook}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, facebook: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <SocialIcon
                    url={socialForm.youtube}
                    className="w-3.5 h-3.5 text-gray-500"
                  />
                  <span>YouTube Channel URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.youtube}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, youtube: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="https://youtube.com/@channel"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <SocialIcon
                    url={socialForm.twitter}
                    className="w-3.5 h-3.5 text-gray-500"
                  />
                  <span>Twitter / X Profile URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.twitter}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, twitter: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <SocialIcon
                    url={socialForm.telegram}
                    className="w-3.5 h-3.5 text-gray-500"
                  />
                  <span>Telegram Channel / Group URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.telegram}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, telegram: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="https://t.me/channel"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSocial}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? "Saving..." : "Save Links"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// COMPONENT: HybridNavbar (Minimal Premium Portfolio Header matching Screenshot 2)
// ============================================================================
export function HybridNavbar() {
  const { isAuth, userData: UserCtx } = useContext(Context);
  const isAuthenticated = Boolean(isAuth || UserCtx?.cognitoId);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#E8FFFC] border-none">
      <div className="w-full h-[80px] sm:h-[96px] lg:h-[90px] px-4 sm:px-8 lg:px-[120px] flex items-center justify-between">
        {/* Left: HappyPrancer Brand Logo */}
        <Link
          to="/"
          className="flex items-center shrink-0 transition-opacity hover:opacity-90"
        >
          <img
            src="/images/logo.png"
            alt="HappyPrancer"
            className="h-10 sm:h-12 lg:h-[55px] w-auto max-w-[200px] sm:max-w-[240px] lg:max-w-[260px] object-contain"
          />
        </Link>

        {/* Right: Login Pill & DEV Text / Dashboard */}
        <div className="flex items-center gap-4 sm:gap-[24px]">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 sm:px-6 h-[34px] sm:h-[36px] rounded-full bg-[#03413A] hover:bg-[#02362f] text-white text-sm font-semibold flex items-center justify-center transition-all shadow-none"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="w-[80px] sm:w-[88px] h-[34px] sm:h-[36px] rounded-full bg-[#03413A] hover:bg-[#02362f] text-white text-sm font-semibold flex items-center justify-center transition-all shadow-none"
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="text-sm font-semibold tracking-wide text-[#03413A] hover:opacity-80 transition-opacity"
              >
                DEV
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export const Header = HybridNavbar;


// ============================================================================
// MAIN COMPONENT: Preview
// ============================================================================
export function Preview({
  instructorDetails,
  instructorName = "",
  onClaim,
  primaryColor = "#215A55",
  pageData,
  editMode = false,
  forceMobile = false,
  hasHybridData = true,
  onUpdatePageData,
  onSavePage,
  onHeroVideoUpload,
  onFeaturesTestimonialImageUpload,
  onCardImageUpload,
  onHybridProductImageUpload,
  onClassImageUpload,
  onStepIconUpload,
  onTestimonialImageUpload,
  onAddTestimonial,
  onDeleteTestimonial,
}) {
  // If no hybrid data and not in edit mode, show empty placeholder
  if (!hasHybridData && !editMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFB] px-4">
        <div className="text-center px-6 py-12 max-w-lg bg-white rounded-3xl border border-gray-200 shadow-sm">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: `${pageData?.globalPrimaryColor || primaryColor}15`,
            }}
          >
            <ShieldCheck
              className="w-8 h-8"
              style={{ color: pageData?.globalPrimaryColor || primaryColor }}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Hybrid Page Not Available
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            This instructor hasn't published their hybrid portfolio yet. Please
            check back shortly.
          </p>
        </div>
      </div>
    );
  }

  const effectivePrimaryColor =
    pageData?.globalPrimaryColor || primaryColor || "#215A55";

  const currentInstructorId =
    instructorDetails?.instructorId ||
    instructorDetails?.instructorProfile?.instructorId ||
    "";

  const resolvedName =
    pageData?.hero?.name || instructorDetails?.name || instructorName;

  return (
    <div
      className={`bg-white min-h-screen font-sans ${
        forceMobile ? "max-w-md mx-auto" : "w-full"
      }`}
    >
      {!editMode && <HybridNavbar />}

      <SocialMediaLinks
        data={pageData}
        editMode={editMode}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
      />

      {/* 1. Editorial Instructor Hero */}
      <EditableHero
        data={pageData}
        instructorDetails={instructorDetails}
        forceMobile={forceMobile}
        editMode={editMode}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
        onHeroVideoUpload={onHeroVideoUpload}
      />

      {/* 2. About & Story Section */}
      <InstructorStory
        data={pageData}
        instructorDetails={instructorDetails}
        editMode={editMode}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
      />

      {/* 3. Why Work With Me / Hybrid Benefits */}
      <WhyGoHybridCards
        data={pageData}
        instructorDetails={instructorDetails}
        forceMobile={forceMobile}
        editMode={editMode}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
        onCardImageUpload={onCardImageUpload}
      />

      {/* 4. Services & Classes: "Ways to Work With Me" */}
      <EditablePlans
        data={pageData}
        forceMobile={forceMobile}
        editMode={editMode}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
        onHybridProductImageUpload={onHybridProductImageUpload}
        onClassImageUpload={onClassImageUpload || onHybridProductImageUpload}
      />

      {/* 5. Verified Recommendations: "What People Say" */}
      <TestimonialComponent
        instructorDetails={instructorDetails}
        editable={editMode}
        testimonials={pageData?.testimonials}
        data={pageData}
        forceMobile={forceMobile}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
        onTestimonialImageUpload={onTestimonialImageUpload}
        onAddTestimonial={onAddTestimonial}
        onDeleteTestimonial={onDeleteTestimonial}
      />

      {/* 6. Explore More Instructors (Bottom Strip) */}
      {/* <SimilarInstructors
        currentInstructorId={currentInstructorId}
        currentInstructorName={resolvedName}
        primaryColor={effectivePrimaryColor}
      /> */}

      {/* 7. Final Call to Action */}
      <Transform
        data={pageData}
        onClaim={onClaim}
        editMode={editMode}
        onUpdatePageData={onUpdatePageData}
        onSavePage={onSavePage}
      />

      {!editMode && (
        <Footer instructorDetails={instructorDetails} isInstructorMode={true} />
      )}
    </div>
  );
}

export default Preview;
