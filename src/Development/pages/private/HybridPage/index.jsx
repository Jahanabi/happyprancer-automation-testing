import React, { useRef, useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "react-toastify";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import fileUpload from "../../../common/utils/upload-file";
import { DefaultPageSchema, BetaSeedPageData } from "./HybridPageData";
import { Play, ArrowRight, Edit3, Trash2, X, Loader } from "lucide-react";
import "./index.css";

// Components imports
import { Preview } from "./Preview";
import { Sidebar } from "./EditableSidebar";

// ============================================================================
// MAIN COMBINED COMPONENT WITH EDIT MODE (Updated to use new components)
// ============================================================================
export default function CombinedHybridPage({
  onClaim,
  primaryColor = "#215A55",
}) {
  const location = useLocation();

  // State for instructor details
  const [instructorDetails, setInstructorDetails] = useState(null);

  // Instructor name variable (environment-aware: never fallback to Pk in production)
  const instructorName =
    instructorDetails?.name ||
    (process.env.REACT_APP_STAGE === "PROD" ? "" : "Pk");

  // Loading state for saving changes
  const [loading, setLoading] = useState(false);

  // New: Loading state for fetching initial data
  // New: Loading state for fetching initial data
  const [isFetching, setIsFetching] = useState(true);

  const InstitutionData = useContext(InstitutionContext).institutionData;
  const contextData = useContext(Context);
  const UserCtx = contextData?.userData;
  const instructorList = contextData?.instructorList;
  const loadingInstructors = contextData?.loadingInstructors;
  const { deleteFile, updateHybridPage, getInstructorProfile } =
    useContext(Context);

  const targetInstructorId =
    instructorDetails?.instructorId || UserCtx?.cognitoId;
  const canEdit =
    UserCtx?.userType === "admin" ||
    (Boolean(UserCtx?.cognitoId && instructorDetails?.instructorId) &&
      UserCtx.cognitoId === instructorDetails.instructorId);

  // ============================================================================
  // FETCH & SAVE DATA (Refactored for Cleanliness)
  // ============================================================================

  // Helper to resolve the first non-empty array candidate, preventing empty arrays from wiping populated backend data
  const resolveNonEmptyArray = (...candidates) => {
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate;
      }
    }
    return [];
  };

  // Helper to determine the correct instructor ID from URL or Context
  const getTargetInstructorId = (referralParam) => {
    let targetId = referralParam; // Default to param if no match found

    if (instructorList && instructorList.length > 0) {
      const foundInstructor = instructorList.find(
        (inst) =>
          inst.instructorId === referralParam ||
          inst.cognitoId === referralParam ||
          inst.referralCode === referralParam ||
          inst.referral_code === referralParam ||
          inst.referral === referralParam,
      );
      if (foundInstructor) {
        targetId = foundInstructor.instructorId || foundInstructor.cognitoId;
      }
    }
    return targetId;
  };

  // Fetch Logic
  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        let institutionId = queryParams.get("institution");
        let referralParam = queryParams.get("referral");

        // Fallback: If parameters missing, try Context
        if (!institutionId && InstitutionData?.institutionid) {
          institutionId = InstitutionData.institutionid;
        }
        if (!referralParam && UserCtx?.cognitoId) {
          referralParam = UserCtx.cognitoId;
        }

        // Validate Identifiers
        if (!referralParam || !institutionId) {
          console.warn("[HybridPage] Missing instructor/institution ID");
          setIsFetching(false);
          return;
        }

        setIsFetching(true);

        // Resolve Instructor ID
        const targetInstructorId = getTargetInstructorId(referralParam);

        // API Call
        const response = await getInstructorProfile(
          institutionId,
          referralParam,
        );

        console.log("[HybridPage] Fetch Response:", response);

        if (response) {
          const resolvedHybridProducts = resolveNonEmptyArray(
            response?.instructorProfile?.hybrid?.hybridProducts,
            response?.instructorProfile?.hybridProducts,
            response?.hybridProducts,
          );

          // User's preferred mapping:
          setInstructorDetails({
            instructorId: response?.instructorProfile?.instructorId,
            name: response?.instructorProfile?.name,
            hybrid: response?.instructorProfile?.hybrid || {},
            hybridProducts: resolvedHybridProducts,
            instructorProfile: response?.instructorProfile,
          });
        }
      } catch (error) {
        console.error("[HybridPage] Failed to fetch data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchInstructorData();
  }, [UserCtx, InstitutionData, location.search, instructorList]);

  // Save Logic
  const handleSavePage = async (
    customPageData,
    shouldExitEditMode = true,
    options = {}
  ) => {
    try {
      setLoading(true);

      const institutionId = InstitutionData?.institutionid;
      const instructorId = instructorDetails?.instructorId;

      if (!institutionId || !instructorId) {
        toast.error("Missing institution or instructor identifiers.");
        return false;
      }

      if (!canEdit) {
        toast.error("Unauthorized: You do not have permission to edit this portfolio.");
        return false;
      }

      const dataToSave = customPageData || pageData;

      const payload = {
        hybrid: dataToSave,
        hybridProducts: dataToSave.hybridProducts || [],
        classes: dataToSave.classes || [],
        instructorId,
        institutionId,
      };

      await updateHybridPage(institutionId, instructorId, payload);

      const isSectionSave = options?.source === "section";

      if (!isSectionSave) {
        toast.success("Hybrid page saved successfully!");
      }

      // Update local state immediately
      setInstructorDetails((prev) => ({
        ...prev,
        hybrid: dataToSave,
        hybridProducts: dataToSave.hybridProducts || [],
      }));

      if (customPageData) {
        setPageData(customPageData);
      }

      if (shouldExitEditMode) {
        setEditMode(false);
      }
      return true;
    } catch (error) {
      console.error("[HybridPage] Save failed:", error);
      const errMsg = error?.response?.data?.message || "Failed to save page.";
      toast.error(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // OTHER HANDLERS & NAVIGATION
  // ============================================================================

  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [pageData, setPageData] = useState(null);
  const [hasHybridData, setHasHybridData] = useState(false);

  const normalizeClasses = (classes) => {
    if (!Array.isArray(classes)) return [];
    return classes.map((cls, idx) => ({
      id:
        cls.id ||
        `class_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      badge:
        cls.badge ||
        cls.tier ||
        (idx % 2 === 1 ? "Elite Experience" : "Premium Experience"),
      name: cls.name || cls.title || "",
      description: cls.description || "",
      time: cls.time || "Monday - Friday: 6:00 PM - 7:00 PM",
      productId: cls.productId || "",
      image: cls.image || cls.img || cls.imageUrl || "",
      includedServices: Array.isArray(cls.includedServices)
        ? cls.includedServices
        : Array.isArray(cls.provides)
          ? cls.provides
          : Array.isArray(cls.classType)
            ? cls.classType
            : ["Dance Classes"],
      recurringPrice:
        cls.recurringPrice ??
        cls.price ??
        cls.pricing?.recurringPrice ??
        (idx % 2 === 1 ? 2000 : 1500),
      originalPrice:
        cls.originalPrice ??
        cls.price ??
        cls.pricing?.originalPrice ??
        (idx % 2 === 1 ? 2000 : 1500),
      currency: cls.currency || cls.pricing?.currency || "₹",
      billingPeriod:
        cls.billingPeriod || cls.pricing?.billingPeriod || "monthly",
      offerBadge: cls.offerBadge || cls.offerText || "1st Month Free",
      offerSubtext:
        cls.offerSubtext ||
        `Then ${cls.currency || "₹"}${Number(
          cls.recurringPrice ?? cls.price ?? (idx % 2 === 1 ? 2000 : 1500),
        ).toLocaleString("en-IN")}.00/month from month 2 • Cancel anytime`,
      buttonText: cls.buttonText || "Start Free Month",
    }));
  };

  // Explicit resolver: strictly separates Production instructor backend data from Beta seed data.
  // In PROD: backend is authoritative. Missing fields resolve to DefaultPageSchema (empty/neutral).
  // In BETA: preserves BetaSeedPageData for ongoing Beta verification workflows.
  const resolveHybridPageData = ({
    hybridData,
    instructorDetails: instDetails,
    isProd = process.env.REACT_APP_STAGE === "PROD",
  }) => {
    const hasData = !!(hybridData && Object.keys(hybridData).length > 0);
    const currentName =
      instDetails?.name ||
      instDetails?.userProfile?.userName ||
      (!isProd ? "Pk" : "");

    if (isProd) {
      // PRODUCTION RESOLUTION:
      // Real backend data only. Never fall back to another instructor's demo data.
      if (!hasData) {
        return {
          ...DefaultPageSchema,
          hero: {
            ...DefaultPageSchema.hero,
            name: currentName,
            title:
              instDetails?.position ||
              instDetails?.instructorProfile?.position ||
              "",
            actionChips: DefaultPageSchema.hero.actionChips,
          },
          story: {
            ...DefaultPageSchema.story,
            introParagraph: currentName
              ? `Hi, I'm ${currentName}. My mission as a fitness coach is to make sustainable, high-energy training accessible to everyone, whether you train with me in our local studio or stream sessions from your home.`
              : DefaultPageSchema.story.introParagraph,
            overview: {
              ...DefaultPageSchema.story.overview,
              studio:
                instDetails?.location ||
                instDetails?.city ||
                DefaultPageSchema.story.overview.studio,
            },
          },
          whyHybrid: {
            ...DefaultPageSchema.whyHybrid,
            instructorName: currentName,
            address:
              instDetails?.location ||
              instDetails?.city ||
              DefaultPageSchema.whyHybrid.address,
          },
          hybridProducts: resolveNonEmptyArray(
            instDetails?.hybridProducts,
            instDetails?.instructorProfile?.hybridProducts,
          ),
          classes: normalizeClasses(
            resolveNonEmptyArray(
              instDetails?.classes,
              instDetails?.instructorProfile?.classes,
            ),
          ),
          testimonials: resolveNonEmptyArray(
            instDetails?.instructorProfile?.testimonials,
          ),
        };
      }

      return {
        ...hybridData,
        globalPrimaryColor:
          hybridData.globalPrimaryColor || DefaultPageSchema.globalPrimaryColor,
        hero: {
          name: currentName,
          title:
            hybridData.hero?.title ||
            hybridData.features?.testimonial?.role ||
            instDetails?.position ||
            instDetails?.instructorProfile?.position ||
            "",
          description: hybridData.hero?.description || "",
          image: hybridData.hero?.image || "",
          imageAdjust: hybridData.hero?.imageAdjust || { x: 0, y: 0, zoom: 1 },
          video: hybridData.hero?.video || "",
          videoAdjust: hybridData.hero?.videoAdjust || { x: 0, y: 0, zoom: 1 },
          // calories:
          //   hybridData.hero?.calories ?? hybridData.hero?.calorieCount ?? 0,
          stats: hybridData.hero?.stats || null,
          actionChips:
            Array.isArray(hybridData.hero?.actionChips) &&
            hybridData.hero.actionChips.length > 0
              ? hybridData.hero.actionChips
              : DefaultPageSchema.hero.actionChips,
        },
        story: {
          title:
            hybridData.story?.title ||
            DefaultPageSchema.story.title,
          introParagraph:
            hybridData.story?.introParagraph ||
            (currentName
              ? `Hi, I'm ${currentName}. My mission as a fitness coach is to make sustainable, high-energy training accessible to everyone, whether you train with me in our local studio or stream sessions from your home.`
              : DefaultPageSchema.story.introParagraph),
          quote:
            hybridData.story?.quote ||
            hybridData.features?.testimonial?.text ||
            DefaultPageSchema.story.quote,
          secondParagraph:
            hybridData.story?.secondParagraph ||
            DefaultPageSchema.story.secondParagraph,
          features:
            Array.isArray(hybridData.story?.features) &&
            hybridData.story.features.length > 0
              ? hybridData.story.features
              : DefaultPageSchema.story.features,
          overview: {
            students:
              hybridData.story?.overview?.students ||
              hybridData.features?.stats?.students ||
              instDetails?.instructorProfile?.stats?.students ||
              "",
            rating:
              hybridData.story?.overview?.rating ||
              hybridData.features?.stats?.rating ||
              instDetails?.instructorProfile?.stats?.rating ||
              "",
            classes:
              hybridData.story?.overview?.classes ||
              hybridData.features?.stats?.classes ||
              instDetails?.instructorProfile?.stats?.classes ||
              "",
            studio:
              hybridData.story?.overview?.studio ||
              hybridData.transform?.location ||
              instDetails?.location ||
              instDetails?.city ||
              "",
            schedule:
              hybridData.story?.overview?.schedule ??
              hybridData.story?.overview?.regularSchedule ??
              hybridData.transform?.classTime ??
              "",
            format:
              hybridData.story?.overview?.format ||
              "In-Person Studio Classes & Live Online Stream",
            specialOffer:
              hybridData.story?.overview?.specialOffer ||
              "Your first month is 100% free on all hybrid subscription tiers.",
          },
        },
        whyHybrid: {
          instructorName: currentName,
          headerTitle:
            hybridData.whyHybrid?.headerTitle ||
            hybridData.whyHybrid?.title ||
            "Why Go Hybrid",
          title:
            hybridData.whyHybrid?.title ||
            hybridData.whyHybrid?.headerTitle ||
            "Why Go Hybrid",
          headerSubtitle: hybridData.whyHybrid?.headerSubtitle || "",
          address:
            hybridData.whyHybrid?.address ||
            hybridData.transform?.location ||
            instDetails?.location ||
            instDetails?.city ||
            "",
          philosophyLabel:
            hybridData.whyHybrid?.philosophyLabel ||
            "01 — 04 • PHILOSOPHY & PRACTICE",
          cards: Array.isArray(hybridData.whyHybrid?.cards)
            ? hybridData.whyHybrid.cards
            : [],
          steps: Array.isArray(hybridData.whyHybrid?.steps)
            ? hybridData.whyHybrid.steps
            : [],
        },
        features: {
          primaryColor:
            hybridData.features?.primaryColor ||
            hybridData.globalPrimaryColor ||
            "#215A55",
          stats: hybridData.features?.stats || {
            students: "",
            rating: "",
            classes: "",
          },
          testimonial: {
            image: hybridData.features?.testimonial?.image || "",
            imageAdjust: hybridData.features?.testimonial?.imageAdjust || {
              x: 0,
              y: 0,
              zoom: 1,
            },
            text:
              hybridData.story?.quote ||
              hybridData.features?.testimonial?.text ||
              "",
            author: hybridData.features?.testimonial?.author || "",
            role:
              hybridData.hero?.title ||
              hybridData.features?.testimonial?.role ||
              "",
          },
        },
        plans: {
          heading: hybridData.plans?.heading || "Our Fitness Plans",
          description: hybridData.plans?.description || "",
          cards: Array.isArray(hybridData.plans?.cards)
            ? hybridData.plans.cards
            : [],
        },
        hybridProducts: resolveNonEmptyArray(
          hybridData.hybridProducts,
          instDetails?.hybridProducts,
          instDetails?.instructorProfile?.hybrid?.hybridProducts,
          instDetails?.instructorProfile?.hybridProducts,
        ),
        classes: normalizeClasses(
          resolveNonEmptyArray(
            hybridData.classes,
            instDetails?.classes,
            instDetails?.instructorProfile?.hybrid?.classes,
            instDetails?.instructorProfile?.classes,
          ),
        ),
        transform: {
          heading: hybridData.transform?.heading || "Ready to Transform?",
          desc: hybridData.transform?.desc || "",
          button:
            hybridData.transform?.button || "Join With Special Invitation",
          primaryColor:
            hybridData.transform?.primaryColor ||
            hybridData.globalPrimaryColor ||
            "#215A55",
          location:
            hybridData.transform?.location ||
            instDetails?.location ||
            instDetails?.city ||
            "",
          classTime: hybridData.transform?.classTime || "",
        },
        testimonials: resolveNonEmptyArray(
          hybridData.testimonials,
          instDetails?.hybrid?.testimonials,
          instDetails?.instructorProfile?.testimonials,
        ),
        socialMedia: hybridData.socialMedia || {
          ...DefaultPageSchema.socialMedia,
        },
      };
    }

    // BETA RESOLUTION:
    // Preserves BetaSeedPageData so existing Beta verification works seamlessly.
    if (hasData) {
      return {
        ...BetaSeedPageData,
        ...hybridData,
        hero: {
          ...BetaSeedPageData.hero,
          ...hybridData.hero,
          name:
            currentName ||
            hybridData.hero?.name ||
            BetaSeedPageData.hero.name,
          title:
            hybridData.hero?.title ||
            hybridData.features?.testimonial?.role ||
            BetaSeedPageData.hero.title,
          actionChips:
            Array.isArray(hybridData.hero?.actionChips) &&
            hybridData.hero.actionChips.length > 0
              ? hybridData.hero.actionChips
              : BetaSeedPageData.hero.actionChips,
        },
        story: {
          ...BetaSeedPageData.story,
          ...(hybridData.story || {}),
          title:
            hybridData.story?.title ||
            BetaSeedPageData.story.title,
          introParagraph:
            hybridData.story?.introParagraph ||
            (currentName
              ? `Hi, I'm ${currentName}. My mission as a fitness coach is to make sustainable, high-energy training accessible to everyone, whether you train with me in our local studio or stream sessions from your home.`
              : BetaSeedPageData.story.introParagraph),
          quote:
            hybridData.story?.quote ||
            hybridData.features?.testimonial?.text ||
            BetaSeedPageData.story.quote,
          secondParagraph:
            hybridData.story?.secondParagraph ||
            BetaSeedPageData.story.secondParagraph,
          features:
            Array.isArray(hybridData.story?.features) &&
            hybridData.story.features.length > 0
              ? hybridData.story.features
              : BetaSeedPageData.story.features,
          overview: {
            ...BetaSeedPageData.story.overview,
            ...(hybridData.story?.overview || {}),
            students:
              hybridData.story?.overview?.students ||
              hybridData.features?.stats?.students ||
              BetaSeedPageData.story.overview.students,
            rating:
              hybridData.story?.overview?.rating ||
              hybridData.features?.stats?.rating ||
              BetaSeedPageData.story.overview.rating,
            classes:
              hybridData.story?.overview?.classes ||
              hybridData.features?.stats?.classes ||
              BetaSeedPageData.story.overview.classes,
            studio:
              hybridData.story?.overview?.studio ||
              hybridData.transform?.location ||
              BetaSeedPageData.story.overview.studio,
            schedule:
              hybridData.story?.overview?.schedule ??
              hybridData.story?.overview?.regularSchedule ??
              hybridData.transform?.classTime ??
              BetaSeedPageData.story.overview.schedule,
            format:
              hybridData.story?.overview?.format ||
              BetaSeedPageData.story.overview.format,
            specialOffer:
              hybridData.story?.overview?.specialOffer ||
              BetaSeedPageData.story.overview.specialOffer,
          },
        },
        whyHybrid: {
          ...BetaSeedPageData.whyHybrid,
          ...hybridData.whyHybrid,
          instructorName:
            currentName ||
            hybridData.whyHybrid?.instructorName ||
            BetaSeedPageData.whyHybrid.instructorName,
          headerSubtitle:
            hybridData.whyHybrid?.headerSubtitle ||
            BetaSeedPageData.whyHybrid.headerSubtitle,
          address:
            hybridData.whyHybrid?.address ||
            hybridData.transform?.location ||
            BetaSeedPageData.whyHybrid.address,
          philosophyLabel:
            hybridData.whyHybrid?.philosophyLabel ||
            BetaSeedPageData.whyHybrid.philosophyLabel,
          cards:
            Array.isArray(hybridData.whyHybrid?.cards) &&
            hybridData.whyHybrid.cards.length > 0
              ? hybridData.whyHybrid.cards
              : BetaSeedPageData.whyHybrid.cards,
        },
        features: {
          ...BetaSeedPageData.features,
          ...hybridData.features,
          testimonial: {
            ...BetaSeedPageData.features.testimonial,
            ...(hybridData.features?.testimonial || {}),
            role:
              hybridData.hero?.title ||
              hybridData.features?.testimonial?.role ||
              BetaSeedPageData.features.testimonial.role,
            text:
              hybridData.story?.quote ||
              hybridData.features?.testimonial?.text ||
              BetaSeedPageData.features.testimonial.text,
          },
          stats: {
            ...BetaSeedPageData.features.stats,
            ...(hybridData.features?.stats || {}),
          },
        },
        plans: {
          ...BetaSeedPageData.plans,
          ...hybridData.plans,
        },
        hybridProducts: resolveNonEmptyArray(
          instDetails?.hybridProducts,
          hybridData.hybridProducts,
          instDetails?.instructorProfile?.hybrid?.hybridProducts,
          instDetails?.instructorProfile?.hybridProducts,
        ),
        classes: normalizeClasses(
          resolveNonEmptyArray(
            instDetails?.classes,
            hybridData.classes,
            instDetails?.instructorProfile?.hybrid?.classes,
            instDetails?.instructorProfile?.classes,
          ),
        ),
        transform: {
          ...BetaSeedPageData.transform,
          ...hybridData.transform,
          location:
            hybridData.transform?.location ||
            instDetails?.location ||
            BetaSeedPageData.transform.location,
        },
        testimonials: resolveNonEmptyArray(
          hybridData.testimonials,
          instDetails?.hybrid?.testimonials,
          instDetails?.instructorProfile?.testimonials,
          BetaSeedPageData.testimonials,
        ),
        socialMedia: {
          ...BetaSeedPageData.socialMedia,
          ...(hybridData.socialMedia || {}),
        },
      };
    }

    // Pure Beta seed demo fallback (e.g. testing /hybrid without backend instructor data)
    return {
      ...BetaSeedPageData,
      hero: {
        ...BetaSeedPageData.hero,
        name: currentName || BetaSeedPageData.hero.name,
        title: BetaSeedPageData.hero.title,
        actionChips: BetaSeedPageData.hero.actionChips,
      },
      story: {
        ...BetaSeedPageData.story,
        introParagraph: currentName
          ? `Hi, I'm ${currentName}. My mission as a fitness coach is to make sustainable, high-energy training accessible to everyone, whether you train with me in our local studio or stream sessions from your home.`
          : BetaSeedPageData.story.introParagraph,
      },
      whyHybrid: {
        ...BetaSeedPageData.whyHybrid,
        instructorName: currentName || BetaSeedPageData.whyHybrid.instructorName,
      },
      hybridProducts: instDetails?.hybridProducts || [],
      classes: normalizeClasses(instDetails?.classes || []),
    };
  };

  // Sync pageData with instructorDetails using explicit resolver
  useEffect(() => {
    if (!instructorDetails) return;

    const hybridData = instructorDetails.hybrid;
    const isProd = process.env.REACT_APP_STAGE === "PROD";
    const hasBackendData = !!(hybridData && Object.keys(hybridData).length > 0);

    // In Production, hasHybridData reflects whether real backend data exists.
    // In Beta, if no backend data exists, Beta seed data allows verification.
    setHasHybridData(isProd ? hasBackendData : true);

    const finalData = resolveHybridPageData({
      hybridData,
      instructorDetails,
      isProd,
    });

    setPageData(finalData);
  }, [instructorDetails]);

  // Video Adjust handler (used by Sidebar)
  const updateVideoAdjust = (changes) => {
    setPageData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        videoAdjust: { ...prev.hero.videoAdjust, ...changes },
      },
    }));
  };

  const [imageLoading, setImageLoading] = useState(false);

  const updatePageData = (section, newSectionData) => {
    setPageData((prev) => ({ ...prev, [section]: newSectionData }));
  };

  const updateGlobalPrimaryColor = (color) => {
    setPageData((prev) => ({
      ...prev,
      globalPrimaryColor: color,
      features: { ...prev.features, primaryColor: color },
      transform: { ...prev.transform, primaryColor: color },
    }));
  };

  // --- UPLOAD HANDLERS ---

  const handleHeroVideoUpload = async (fileOrEvent, options = {}) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);

      const bucketName = "institution-utils";
      const region = "us-east-1";

      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }

      const folder = `${InstitutionData.institutionid}/instructors/${targetInstructorId}/hero/video`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        updatePageData("hero", {
          ...pageData.hero,
          video: fileUrl,
        });
      }

      toast.success("Video uploaded!");
      return fileUrl;
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload video.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleFeaturesTestimonialImageUpload = async (
    fileOrEvent,
    options = {},
  ) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }
      const folder = `${InstitutionData?.institutionid}/instructors/${targetInstructorId}/features/testimonial`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        const newTestimonial = {
          ...pageData.features.testimonial,
          image: fileUrl,
        };
        updatePageData("features", {
          ...pageData.features,
          testimonial: newTestimonial,
        });
      }

      toast.success("Image uploaded!");
      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleCardImageUpload = async (fileOrEvent, index, options = {}) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }
      const card = pageData?.whyHybrid?.cards?.[index];
      const cardId = card?.id || `card_${index}`;
      const folder = `${InstitutionData?.institutionid}/instructors/${targetInstructorId}/whyhybrid/cards/${cardId}`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        const newCards = pageData.whyHybrid.cards.map((c, i) =>
          i === index ? { ...c, image: fileUrl } : c,
        );
        updatePageData("whyHybrid", { ...pageData.whyHybrid, cards: newCards });
      }

      toast.success("Image uploaded!");
      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleHybridProductImageUpload = async (
    fileOrEvent,
    index,
    options = {},
  ) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }
      const product = pageData?.hybridProducts?.[index];
      const prodId = product?.productId || product?.id || `product_${index}`;
      const folder = `${InstitutionData?.institutionid}/instructors/${targetInstructorId}/hybrid/products/${prodId}`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        const newHybridProducts = pageData.hybridProducts.map((product, i) =>
          i === index ? { ...product, image: fileUrl } : product,
        );
        updatePageData("hybridProducts", newHybridProducts);
      }

      toast.success("Plan image uploaded!");
      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload plan image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleClassImageUpload = async (
    fileOrEvent,
    index,
    options = {},
  ) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }
      const cls = pageData?.classes?.[index];
      const classId = cls?.id || `class_${index}`;
      const folder = `${InstitutionData?.institutionid}/instructors/${targetInstructorId}/classes/${classId}`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        const newClasses = pageData.classes.map((c, i) =>
          i === index ? { ...c, image: fileUrl } : c,
        );
        updatePageData("classes", newClasses);
      }

      toast.success("Class image uploaded!");
      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload class image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleStepIconUpload = async (fileOrEvent, index, options = {}) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }
      const step = pageData?.whyHybrid?.steps?.[index];
      const stepId = step?.id || `step_${index}`;
      const folder = `${InstitutionData?.institutionid}/instructors/${targetInstructorId}/whyhybrid/steps/${stepId}`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        const newSteps = pageData.whyHybrid.steps.map((s, i) =>
          i === index ? { ...s, icon: fileUrl } : s,
        );
        updatePageData("whyHybrid", { ...pageData.whyHybrid, steps: newSteps });
      }

      toast.success("Icon uploaded!");
      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload icon.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleTestimonialImageUpload = async (
    fileOrEvent,
    index,
    options = {},
  ) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file) return;

    try {
      setImageLoading(true);
      const bucketName = "institution-utils";
      const region = "us-east-1";
      if (!InstitutionData?.institutionid || !targetInstructorId) {
        toast.error("Missing institution or instructor identifier.");
        return;
      }
      const testimonial = pageData?.testimonials?.[index];
      const testId = testimonial?.id || `testimonial_${index}`;
      const folder = `${InstitutionData?.institutionid}/instructors/${targetInstructorId}/testimonials/${testId}`;

      const fileUrl = await fileUpload({
        bucket: bucketName,
        region,
        folder,
        file,
      });

      if (!options?.skipCommit) {
        const newTestimonials = pageData.testimonials.map((t, i) =>
          i === index ? { ...t, image: fileUrl } : t,
        );
        setPageData((prev) => ({ ...prev, testimonials: newTestimonials }));
      }

      toast.success("Image uploaded!");
      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleAddTestimonial = () => {
    const newTest = {
      id: `testimonial_${Date.now()}`,
      name: "",
      description: "",
      image: "",
      rating: 5,
    };
    setPageData((prev) => ({
      ...prev,
      testimonials: [...prev.testimonials, newTest],
    }));
  };

  const handleDeleteTestimonial = (index) => {
    if (pageData.testimonials.length <= 1) {
      toast.error("Cannot delete the last testimonial");
      return;
    }
    if (window.confirm("Are you sure?")) {
      setPageData((prev) => ({
        ...prev,
        testimonials: prev.testimonials.filter((_, i) => i !== index),
      }));
      toast.success("Testimonial deleted!");
    }
  };

  useEffect(() => {
    if (!editMode) {
      setPreviewMode("desktop");
    }
  }, [editMode]);

  const originalPageDataRef = useRef(null);

  const handleRevertChanges = () => {
    if (originalPageDataRef.current) {
      setPageData(JSON.parse(JSON.stringify(originalPageDataRef.current)));
    }
  };

  // Improved Loading State
  // We only show full-screen loader if we have NO data to show AND we are fetching.
  // If we have pageData (from navigation state or previous fetch), we show it immediately
  // while the API runs in the background.
  if (!pageData && (isFetching || loadingInstructors)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader className="w-10 h-10 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Loading hybrid page...
        </p>
      </div>
    );
  }

  // If we finished fetching but still have no pageData, it means the instructor wasn't found or data failed.
  if (!pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">
          Instructor not found or page unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>{`
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .mobile-viewport-wrapper { overflow: hidden; position: relative; }
  .mobile-viewport-wrapper::-webkit-scrollbar { display: none; }
  .mobile-viewport-wrapper { -ms-overflow-style: none; scrollbar-width: none; }

  /* compact badge sizes for small screens */
  @media (max-width: 800px) {
    .calories-badge { padding: 6px 8px !important; }
    .calories-badge .calorie-icon { width: 28px !important; height: 28px !important; }
    .calories-badge .calorie-number { font-size: 1rem !important; }
    .calories-badge .calorie-label { font-size: 10px !important; }
    .live-badge { padding: 6px 8px !important; right: 12px !important; bottom: 12px !important; border-width: 2px !important; }
    .live-badge .live-icon { width: 28px !important; height: 28px !important; }
    .live-badge .live-title { font-size: 0.9rem !important; }
    .live-badge .live-sub { font-size: 10px !important; }
  }

  /* ============================
     🔥 RANGE SLIDER CUSTOM STYLE
     ============================ */
  .range-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 8px;
    background: #e6e6e6;
    cursor: pointer;
  }

  /* Chrome / Safari / Edge — Thumb */
  .range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primaryColor);
    border: 2px solid white;
    cursor: grab;
    box-shadow: 0 1px 6px rgba(0,0,0,0.2);
    margin-top: -5px;
  }

  .range-slider:active::-webkit-slider-thumb {
    cursor: grabbing;
  }

  /* Firefox — Thumb */
  .range-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primaryColor);
    border: 2px solid white;
    cursor: grab;
    box-shadow: 0 1px 6px rgba(0,0,0,0.2);
  }

  .range-slider:active::-moz-range-thumb {
    cursor: grabbing;
  }

  /* Firefox progress bar */
  .range-slider::-moz-range-progress {
    background: var(--primaryColor);
  }
`}</style>

      {editMode ? (
        <div className="no-scrollbar flex h-screen flex-col md:flex-row overflow-hidden">
          <div
            className={`w-full h-3/5 md:h-full ${
              previewMode === "mobile"
                ? "md:flex-1 md:w-3/4 bg-[#0f0f0f] scrollbar-hide overflow-hidden flex justify-center py-6 px-4"
                : "md:w-3/4 overflow-y-auto bg-[#1b1b1b] scrollbar-hide"
            }`}
            {...(previewMode === "desktop"
              ? { "data-scroll-container": true }
              : {})}>
            {previewMode === "mobile" ? (
              <div className="mobile-viewport-wrapper relative mx-auto">
                <MobileViewportFrame>
                  <Preview
                    instructorDetails={instructorDetails}
                    instructorName={instructorName}
                    onClaim={onClaim}
                    primaryColor={primaryColor}
                    pageData={pageData}
                    editMode={editMode}
                    forceMobile={true}
                    hasHybridData={hasHybridData}
                    onUpdatePageData={updatePageData}
                    onSavePage={handleSavePage}
                    onHeroVideoUpload={handleHeroVideoUpload}
                    onFeaturesTestimonialImageUpload={
                      handleFeaturesTestimonialImageUpload
                    }
                    onCardImageUpload={handleCardImageUpload}
                    onHybridProductImageUpload={handleHybridProductImageUpload}
                    onClassImageUpload={handleClassImageUpload}
                    onStepIconUpload={handleStepIconUpload}
                    onTestimonialImageUpload={handleTestimonialImageUpload}
                    onAddTestimonial={handleAddTestimonial}
                    onDeleteTestimonial={handleDeleteTestimonial}
                  />
                </MobileViewportFrame>
              </div>
            ) : (
              <Preview
                instructorDetails={instructorDetails}
                instructorName={instructorName}
                onClaim={onClaim}
                primaryColor={primaryColor}
                pageData={pageData}
                editMode={editMode}
                hasHybridData={hasHybridData}
                onUpdatePageData={updatePageData}
                onSavePage={handleSavePage}
                onHeroVideoUpload={handleHeroVideoUpload}
                onFeaturesTestimonialImageUpload={
                  handleFeaturesTestimonialImageUpload
                }
                onCardImageUpload={handleCardImageUpload}
                onHybridProductImageUpload={handleHybridProductImageUpload}
                onClassImageUpload={handleClassImageUpload}
                onStepIconUpload={handleStepIconUpload}
                onTestimonialImageUpload={handleTestimonialImageUpload}
                onAddTestimonial={handleAddTestimonial}
                onDeleteTestimonial={handleDeleteTestimonial}
              />
            )}
          </div>
          <Sidebar
            pageData={pageData}
            originalPageData={originalPageDataRef.current}
            onUpdatePageData={updatePageData}
            onUpdateGlobalPrimaryColor={updateGlobalPrimaryColor}
            onHeroVideoUpload={handleHeroVideoUpload}
            onFeaturesTestimonialImageUpload={
              handleFeaturesTestimonialImageUpload
            }
            onCardImageUpload={handleCardImageUpload}
            onHybridProductImageUpload={handleHybridProductImageUpload}
            onClassImageUpload={handleClassImageUpload}
            onStepIconUpload={handleStepIconUpload}
            onTestimonialImageUpload={handleTestimonialImageUpload}
            onAddTestimonial={handleAddTestimonial}
            onDeleteTestimonial={handleDeleteTestimonial}
            onSavePage={handleSavePage}
            onRevertChanges={handleRevertChanges}
            imageLoading={imageLoading}
            editMode={editMode}
            onExitEditMode={() => setEditMode(false)}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            onVideoAdjustChange={updateVideoAdjust}
            setLoading={setLoading}
            loading={loading}
          />
        </div>
      ) : (
        <>
          {canEdit && (
            <button
              className="fixed border-l-4 border-r-4 border-primaryColor rounded-lg text-sm top-32 right-4 shadow z-50 px-4 py-2 bg-white text-primaryColor transition duration-700 ease-in-out"
              onClick={() => {
                originalPageDataRef.current = JSON.parse(
                  JSON.stringify(pageData),
                );
                setEditMode(true);
              }}>
              <div className="poppins text-md font-semibold flex items-center gap-2 ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.7"
                  stroke="currentColor"
                  className="size-4">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
                Edit
              </div>
            </button>
          )}

          <Preview
            instructorDetails={instructorDetails}
            instructorName={instructorName}
            onClaim={onClaim}
            primaryColor={primaryColor}
            pageData={pageData}
            editMode={editMode}
            hasHybridData={hasHybridData}
            onUpdatePageData={updatePageData}
            onSavePage={handleSavePage}
            onHeroVideoUpload={handleHeroVideoUpload}
            onFeaturesTestimonialImageUpload={
              handleFeaturesTestimonialImageUpload
            }
            onCardImageUpload={handleCardImageUpload}
            onHybridProductImageUpload={handleHybridProductImageUpload}
            onClassImageUpload={handleClassImageUpload}
            onStepIconUpload={handleStepIconUpload}
            onTestimonialImageUpload={handleTestimonialImageUpload}
            onAddTestimonial={handleAddTestimonial}
            onDeleteTestimonial={handleDeleteTestimonial}
          />
        </>
      )}
    </div>
  );
}

function MobileViewportFrame({ children }) {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const styles = [
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
        (link) => `<link rel="stylesheet" href="${link.href}" />`,
      ),
      ...Array.from(document.querySelectorAll("style")).map(
        (style) => style.outerHTML,
      ),
    ].join("");
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=393, initial-scale=1" />
    ${styles}
    <style>
      html, body { margin: 0; height: 100%; overflow: hidden; scroll-behavior: smooth; }
      body {
        background: #ffffff;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: none;
        scrollbar-width: none;
        scroll-behavior: smooth;
      }
      body::-webkit-scrollbar { display: none; }
      .mobile-frame-root { min-height: 100%; overflow-x: hidden; }
    </style>
  </head>
  <body data-scroll-container>
    <div class="mobile-frame-root" data-scroll-container></div>
  </body>
</html>`);
    doc.close();
    const root = doc.querySelector(".mobile-frame-root");
    setMountNode(root);
  }, []);
  useEffect(() => {
    if (!mountNode) return;
    ScrollTrigger.refresh();
    const iframeWindow = iframeRef.current?.contentWindow;
    const handleResize = () => ScrollTrigger.refresh();
    iframeWindow?.addEventListener("resize", handleResize);
    return () => iframeWindow?.removeEventListener("resize", handleResize);
  }, [mountNode]);
  return (
    <div className="mobile-viewport-wrapper relative mx-auto">
      <iframe
        ref={iframeRef}
        title="mobile-preview-frame"
        style={{
          width: "393px",
          height: "852px",
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
          background: "#000000",
          display: "block",
          overflow: "hidden",
        }}
        scrolling="yes"
      />
      {mountNode && createPortal(children, mountNode)}
    </div>
  );
}
