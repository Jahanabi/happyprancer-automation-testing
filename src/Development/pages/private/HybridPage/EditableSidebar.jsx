import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import {
  Edit3,
  Monitor,
  Smartphone,
  Play,
  User,
  ArrowRight,
  Plus,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import VideoAdjustCard from "./Components/VideoAdjustCard";
import ImageAdjustCard from "./Components/ImageAdjustCard";
import { SocialIcon } from "./socialUtils";

export function Sidebar({
  pageData,
  onUpdatePageData,
  onUpdateGlobalPrimaryColor,
  onHeroVideoUpload,
  onFeaturesTestimonialImageUpload,
  onCardImageUpload,
  onHybridProductImageUpload,
  onClassImageUpload,
  onStepIconUpload,
  onTestimonialImageUpload,
  onAddTestimonial,
  onDeleteTestimonial,
  onSavePage,
  imageLoading,
  editMode,
  onExitEditMode,
  previewMode,
  onPreviewModeChange,
  onRevertChanges,
  originalPageData,
  onVideoAdjustChange,
  setLoading,
  loading,
}) {
  const { institutionData } = useContext(InstitutionContext);
  const UserCtx = useContext(Context)?.userData;
  const InstitutionData = institutionData?.institutionData;
  const [showExitModal, setShowExitModal] = useState(false);
  const [uploadingClassIdx, setUploadingClassIdx] = useState(null);

  const handleExit = () => {
    // Compare current pageData with originalPageData
    // Handle null/undefined cases
    if (!originalPageData) {
      // If no original data, check if pageData exists and has content
      if (pageData) {
        setShowExitModal(true);
        return;
      }
      onExitEditMode();
      return;
    }

    const hasChanges =
      JSON.stringify(pageData) !== JSON.stringify(originalPageData);

    if (!hasChanges) {
      onExitEditMode();
      return;
    }
    setShowExitModal(true);
  };

  const handleConfirmExit = async (action) => {
    if (action === "save") {
      setShowExitModal(false);
      const saved = await onSavePage(pageData, true, { source: "save-all" });
      if (!saved) {
        return;
      }
      onExitEditMode();
    } else if (action === "discard") {
      onRevertChanges();
      onExitEditMode();
      setShowExitModal(false);
    }
  };

  const updateClasses = (newClasses) => {
    onUpdatePageData("classes", newClasses);
  };

  const handleAddClass = () => {
    const idx = (pageData.classes || []).length;
    const newClass = {
      id: `class_${Date.now()}`,
      badge: idx % 2 === 1 ? "Elite Experience" : "Premium Experience",
      name: "New Class Session",
      description: "Hybrid session with live and on-demand access.",
      time: "Mon, Wed, Fri 6:00 PM",
      productId:
        pageData.hybridProducts?.[0]?.productId ||
        pageData.hybridProducts?.[0]?.id ||
        "",
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
    };
    updateClasses([...(pageData.classes || []), newClass]);
  };

  const handleUpdateClassField = (index, field, value) => {
    const updated = pageData.classes.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
    );
    updateClasses(updated);
  };

  const handleClassImageUploadInSidebar = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploader = onClassImageUpload || onHybridProductImageUpload;
    if (!uploader) {
      toast.error("Image upload handler not available");
      return;
    }
    setUploadingClassIdx(index);
    try {
      const url = await uploader(file);
      if (url) {
        handleUpdateClassField(index, "image", url);
        toast.success("Class image uploaded!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload class image");
    } finally {
      setUploadingClassIdx(null);
    }
  };

  const handleDeleteClass = (index) => {
    if (!window.confirm("Delete this class?")) return;
    updateClasses(pageData.classes.filter((_, i) => i !== index));
  };

  const updatePageData = (section, newSectionData) => {
    onUpdatePageData(section, newSectionData);
  };
  const handleHeroVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onHeroVideoUpload(file);
  };
  const handleFeaturesTestimonialImageUpload = async (e) => {
    onFeaturesTestimonialImageUpload(e);
  };
  const handleCardImageUpload = async (e, index) => {
    onCardImageUpload(e, index);
  };
  const handleHybridProductImageUpload = async (e, index) => {
    onHybridProductImageUpload(e, index);
  };
  const handleStepIconUpload = async (e, index) => {
    onStepIconUpload(e, index);
  };
  const handleTestimonialImageUpload = async (e, index) => {
    onTestimonialImageUpload(e, index);
  };
  const handleAddTestimonial = () => {
    onAddTestimonial();
  };
  const handleDeleteTestimonial = (index) => {
    onDeleteTestimonial(index);
  };
  const handleSavePage = () => {
    onSavePage(pageData, true, { source: "save-all" });
  };
  const updatePlansSection = (newPlansData) => {
    onUpdatePageData("plans", newPlansData);
  };

  return (
    <div className="w-full h-2/5 md:w-1/4 md:h-screen poppins bg-white scrollbar-hide border-t-4 md:border-t-0 md:border-l-4 border-primaryColor overflow-y-auto flex flex-col relative">
      {/* Header */}
      <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <Edit3 size={20} className="text-primaryColor" />
          Edit Page
        </h3>
        <button
          onClick={handleExit}
          className="border border-red-600 px-6 py-2 text-red-600 bg-red-100 hover:bg-red-600 hover:text-white font-semibold rounded-lg text-sm transition-colors">
          Exit
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!pageData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading page data...</p>
          </div>
        ) : (
          <>
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <Monitor size={16} className="text-primaryColor" />
                Preview Mode
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onPreviewModeChange("desktop")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    previewMode === "desktop"
                      ? "bg-primaryColor text-white border-primaryColor"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primaryColor/60"
                  }`}>
                  <Monitor size={14} />
                  Desktop
                </button>
                <button
                  onClick={() => onPreviewModeChange("mobile")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    previewMode === "mobile"
                      ? "bg-primaryColor text-white border-primaryColor"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primaryColor/60"
                  }`}>
                  <Smartphone size={14} />
                  Mobile
                </button>
              </div>
            </section>
            {/* Global Primary Color */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <div className="w-4 h-4 rounded-full bg-primaryColor"></div>
                Global Primary Color
              </h4>
              <input
                type="color"
                value={pageData.globalPrimaryColor}
                onChange={(e) => onUpdateGlobalPrimaryColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </section>
            {/* Hero Section */}
            {/* HERO SECTION */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <Play size={16} className="text-primaryColor" />
                Hero
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={pageData.hero?.name || ""}
                    onChange={(e) =>
                      updatePageData("hero", {
                        ...pageData.hero,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={pageData.hero?.title || ""}
                    onChange={(e) =>
                      updatePageData("hero", {
                        ...pageData.hero,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Personal Trainer & Fitness Coach"
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={pageData.hero?.description || ""}
                    onChange={(e) =>
                      updatePageData("hero", {
                        ...pageData.hero,
                        description: e.target.value,
                      })
                    }
                    maxLength={160}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor h-16 resize-none"
                  />
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {(pageData.hero?.description || "").length}/160
                  </div>
                </div>

                {/* Hero Action Chips (e.g. Learn Zumba, Personal Training) */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-gray-700 font-semibold mb-1 text-xs">
                    Action Chips / Buttons
                  </label>
                  <div className="space-y-2">
                    {(
                      pageData.hero?.actionChips || [
                        { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
                        { id: "chip_2", label: "Personal Training", link: "#services-section" },
                      ]
                    ).map((chip, idx) => (
                      <div
                        key={chip.id || idx}
                        className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1"
                      >
                        <div className="text-[10px] font-medium text-gray-500">
                          Button {idx + 1}
                        </div>
                        <input
                          type="text"
                          value={chip.label || ""}
                          placeholder="Label (e.g. Learn Zumba)"
                          onChange={(e) => {
                            const currentChips = pageData.hero?.actionChips || [
                              { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
                              { id: "chip_2", label: "Personal Training", link: "#services-section" },
                            ];
                            const updated = currentChips.map((c, i) =>
                              i === idx ? { ...c, label: e.target.value } : c
                            );
                            updatePageData("hero", {
                              ...pageData.hero,
                              actionChips: updated,
                            });
                          }}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                        />
                        <input
                          type="text"
                          value={chip.link || ""}
                          placeholder="Target Section / URL (e.g. #services-section)"
                          onChange={(e) => {
                            const currentChips = pageData.hero?.actionChips || [
                              { id: "chip_1", label: "Learn Zumba", link: "#services-section" },
                              { id: "chip_2", label: "Personal Training", link: "#services-section" },
                            ];
                            const updated = currentChips.map((c, i) =>
                              i === idx ? { ...c, link: e.target.value } : c
                            );
                            updatePageData("hero", {
                              ...pageData.hero,
                              actionChips: updated,
                            });
                          }}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">
                    Video Upload
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleHeroVideoUpload}
                    disabled={imageLoading}
                    className="w-full text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primaryColor file:text-white file:cursor-pointer"
                  />
                </div>

                {/* Video Adjuster */}
                <div className="mt-2">
                  <label className="block text-gray-600 text-[10px] mb-1">
                    Video Position
                  </label>
                  <VideoAdjustCard
                    pageData={pageData}
                    onVideoAdjustChange={onVideoAdjustChange}
                  />
                </div>
              </div>
            </section>

            {/* Story / About Instructor Section */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <User size={16} className="text-primaryColor" />
                About the Instructor
              </h4>
              <div className="space-y-3 text-xs">
                {/* Fixed Non-Editable Section Label Notification */}
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-500">
                  Section Label: <strong className="text-gray-700">ABOUT THE INSTRUCTOR</strong> (Fixed)
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Heading</label>
                  <input
                    type="text"
                    value={pageData.story?.title ?? "Training Philosophy & Background"}
                    onChange={(e) =>
                      updatePageData("story", {
                        ...(pageData.story || {}),
                        title: e.target.value,
                      })
                    }
                    placeholder="Training Philosophy & Background"
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Intro Paragraph</label>
                  <textarea
                    value={pageData.story?.introParagraph ?? ""}
                    onChange={(e) =>
                      updatePageData("story", {
                        ...(pageData.story || {}),
                        introParagraph: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Hi, I'm..."
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Philosophy / Quote</label>
                  <textarea
                    value={pageData.story?.quote ?? (pageData.features?.testimonial?.text || "")}
                    onChange={(e) =>
                      updatePageData("story", {
                        ...(pageData.story || {}),
                        quote: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Every session is designed to transform your body and uplift your mind."
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Second Paragraph</label>
                  <textarea
                    value={pageData.story?.secondParagraph ?? ""}
                    onChange={(e) =>
                      updatePageData("story", {
                        ...(pageData.story || {}),
                        secondParagraph: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Through HappyPrancer's hybrid platform..."
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor resize-none"
                  />
                </div>

                {/* Features (2 items) */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <label className="block text-gray-700 font-semibold mb-1 text-xs">
                    Value Highlights / Features
                  </label>
                  {(
                    pageData.story?.features || [
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
                    ]
                  ).map((feat, idx) => (
                    <div
                      key={feat.id || idx}
                      className="p-2.5 bg-gray-50 rounded border border-gray-200 space-y-1.5"
                    >
                      <div className="text-[11px] font-semibold text-gray-600">
                        Feature {idx + 1}
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">Title</label>
                        <input
                          type="text"
                          value={feat.title || ""}
                          placeholder="Feature Title"
                          onChange={(e) => {
                            const currentFeatures = pageData.story?.features || [
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
                            const updated = currentFeatures.map((f, i) =>
                              i === idx ? { ...f, title: e.target.value } : f
                            );
                            updatePageData("story", {
                              ...(pageData.story || {}),
                              features: updated,
                            });
                          }}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">Description</label>
                        <textarea
                          rows={2}
                          value={feat.description || ""}
                          placeholder="Feature Description"
                          onChange={(e) => {
                            const currentFeatures = pageData.story?.features || [
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
                            const updated = currentFeatures.map((f, i) =>
                              i === idx ? { ...f, description: e.target.value } : f
                            );
                            updatePageData("story", {
                              ...(pageData.story || {}),
                              features: updated,
                            });
                          }}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructor Overview (Right-hand Card) */}
                <div className="pt-3 border-t border-gray-200 space-y-2.5">
                  <label className="block text-gray-700 font-semibold text-xs">
                    Instructor Overview Card
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-500 text-[10px] mb-0.5">Students Count</label>
                      <input
                        type="text"
                        value={pageData.story?.overview?.students || ""}
                        onChange={(e) =>
                          updatePageData("story", {
                            ...(pageData.story || {}),
                            overview: {
                              ...(pageData.story?.overview || {}),
                              students: e.target.value,
                            },
                          })
                        }
                        placeholder="500+"
                        className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] mb-0.5">Rating</label>
                      <input
                        type="text"
                        value={pageData.story?.overview?.rating || ""}
                        onChange={(e) =>
                          updatePageData("story", {
                            ...(pageData.story || {}),
                            overview: {
                              ...(pageData.story?.overview || {}),
                              rating: e.target.value,
                            },
                          })
                        }
                        placeholder="4.9"
                        className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-500 text-[10px] mb-0.5">Classes Count</label>
                      <input
                        type="text"
                        value={pageData.story?.overview?.classes || ""}
                        onChange={(e) =>
                          updatePageData("story", {
                            ...(pageData.story || {}),
                            overview: {
                              ...(pageData.story?.overview || {}),
                              classes: e.target.value,
                            },
                          })
                        }
                        placeholder="1,200+"
                        className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] mb-0.5">Studio Location</label>
                      <input
                        type="text"
                        value={pageData.story?.overview?.studio || ""}
                        onChange={(e) =>
                          updatePageData("story", {
                            ...(pageData.story || {}),
                            overview: {
                              ...(pageData.story?.overview || {}),
                              studio: e.target.value,
                            },
                          })
                        }
                        placeholder="Studio Flow, Indiranagar"
                        className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-500 text-[10px] mb-0.5">Schedule</label>
                      <input
                        type="text"
                        value={pageData.story?.overview?.schedule ?? pageData.story?.overview?.regularSchedule ?? ""}
                        onChange={(e) =>
                          updatePageData("story", {
                            ...(pageData.story || {}),
                            overview: {
                              ...(pageData.story?.overview || {}),
                              schedule: e.target.value,
                            },
                          })
                        }
                        placeholder="Mon–Sat • Morning & Evening"
                        className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] mb-0.5">Format</label>
                      <input
                        type="text"
                        value={pageData.story?.overview?.format || ""}
                        onChange={(e) =>
                          updatePageData("story", {
                            ...(pageData.story || {}),
                            overview: {
                              ...(pageData.story?.overview || {}),
                              format: e.target.value,
                            },
                          })
                        }
                        placeholder="In-Studio & Online Live"
                        className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-[10px] mb-0.5">Special Offer Pill</label>
                    <input
                      type="text"
                      value={pageData.story?.overview?.specialOffer || ""}
                      onChange={(e) =>
                        updatePageData("story", {
                          ...(pageData.story || {}),
                          overview: {
                            ...(pageData.story?.overview || {}),
                            specialOffer: e.target.value,
                          },
                        })
                      }
                      placeholder="1st Month Free • Hybrid Access Included"
                      className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                    />
                  </div>
                </div>
              </div>
            </section>
            {/* Why Hybrid */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <ArrowRight size={16} className="text-primaryColor" />
                Why Hybrid
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    value={pageData.whyHybrid.instructorName || ""}
                    onChange={(e) =>
                      updatePageData("whyHybrid", {
                        ...pageData.whyHybrid,
                        instructorName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    Header Subtitle
                  </label>
                  <input
                    type="text"
                    value={pageData.whyHybrid.headerSubtitle || ""}
                    onChange={(e) =>
                      updatePageData("whyHybrid", {
                        ...pageData.whyHybrid,
                        headerSubtitle: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="e.g., Special invitation reserved for you"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    Philosophy & Practice Label
                  </label>
                  <input
                    type="text"
                    value={pageData.whyHybrid?.philosophyLabel || ""}
                    onChange={(e) =>
                      updatePageData("whyHybrid", {
                        ...pageData.whyHybrid,
                        philosophyLabel: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="01 — 04 • PHILOSOPHY & PRACTICE"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    Studio Plate Address
                  </label>
                  <input
                    type="text"
                    value={pageData.whyHybrid?.address || ""}
                    onChange={(e) =>
                      updatePageData("whyHybrid", {
                        ...pageData.whyHybrid,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="Studio Flow, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038"
                  />
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mt-2 mb-2">
                    Cards ({pageData.whyHybrid.cards.length})
                  </h5>
                  {pageData.whyHybrid.cards.map((_, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 p-2 rounded mb-2 text-[10px] bg-gray-50">
                      <label className="block text-gray-500 text-[9px] mb-1">
                        Card {index + 1} Title
                      </label>
                      <input
                        value={pageData.whyHybrid.cards[index]?.title || ""}
                        onChange={(e) => {
                          const newCards = pageData.whyHybrid.cards.map(
                            (c, i) =>
                              i === index ? { ...c, title: e.target.value } : c,
                          );
                          updatePageData("whyHybrid", {
                            ...pageData.whyHybrid,
                            cards: newCards,
                          });
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor mb-1"
                      />
                      <label className="block text-gray-500 text-[9px] mb-1">
                        Desc
                      </label>
                      <input
                        value={
                          pageData.whyHybrid.cards[index]?.description || ""
                        }
                        onChange={(e) => {
                          const newCards = pageData.whyHybrid.cards.map(
                            (c, i) =>
                              i === index
                                ? { ...c, description: e.target.value }
                                : c,
                          );
                          updatePageData("whyHybrid", {
                            ...pageData.whyHybrid,
                            cards: newCards,
                          });
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor mb-1"
                      />
                      <label className="block text-gray-500 text-[9px] mb-1">
                        Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(ee) => handleCardImageUpload(ee, index)}
                        className="w-full text-xs"
                      />

                      {/* Card Image Adjuster */}
                      <div className="mt-1">
                        <ImageAdjustCard
                          imageAdjust={
                            pageData.whyHybrid.cards[index]?.imageAdjust
                          }
                          onImageAdjustChange={(changes) => {
                            const newCards = pageData.whyHybrid.cards.map(
                              (c, i) =>
                                i === index
                                  ? {
                                      ...c,
                                      imageAdjust: {
                                        ...c.imageAdjust,
                                        ...changes,
                                      },
                                    }
                                  : c,
                            );
                            updatePageData("whyHybrid", {
                              ...pageData.whyHybrid,
                              cards: newCards,
                            });
                          }}
                          primaryColor={pageData.globalPrimaryColor}
                          isSidebar={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <User size={16} className="text-primaryColor" />
                Testimonials ({pageData.testimonials.length})
              </h4>

              <div className="space-y-3 text-xs">
                {pageData.testimonials.map((t, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 p-3 rounded bg-gray-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-semibold text-sm">
                        Testimonial {index + 1}
                      </span>

                      <button
                        onClick={() => handleDeleteTestimonial(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold">
                        Remove
                      </button>
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[10px] mb-1">
                        Name
                      </label>
                      <input
                        value={t.name}
                        onChange={(e) => {
                          const updated = [...pageData.testimonials];
                          updated[index].name = e.target.value;
                          onUpdatePageData("testimonials", updated);
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[10px] mb-1">
                        Description
                      </label>
                      <textarea
                        value={t.description}
                        onChange={(e) => {
                          const updated = [...pageData.testimonials];
                          updated[index].description = e.target.value;
                          onUpdatePageData("testimonials", updated);
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor h-16 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[10px] mb-1">
                        Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTestimonialImageUpload(e, index)}
                        className="w-full text-xs"
                        disabled={imageLoading}
                      />

                      {/* Testimonial Image Adjuster */}
                      <div className="mt-1">
                        <ImageAdjustCard
                          imageAdjust={t.imageAdjust}
                          onImageAdjustChange={(changes) => {
                            const updated = [...pageData.testimonials];
                            updated[index].imageAdjust = {
                              ...updated[index].imageAdjust,
                              ...changes,
                            };
                            onUpdatePageData("testimonials", updated);
                          }}
                          primaryColor={pageData.globalPrimaryColor}
                          isSidebar={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Testimonial Button */}
                <button
                  onClick={handleAddTestimonial}
                  className="w-full py-2 px-3 bg-primaryColor text-white text-xs rounded-lg font-semibold hover:bg-primaryColor/90 transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} />
                  Add Testimonial
                </button>
              </div>
            </section>

            {/* Classes Section */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <Plus size={16} className="text-primaryColor" />
                Classes ({pageData.classes?.length || 0})
              </h4>

              <div className="space-y-3 text-xs">
                {(pageData.classes || []).map((cls, index) => (
                    <div
                        key={cls.id || index}
                        className="border border-gray-200 p-3 rounded-lg bg-gray-50 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700 font-bold text-xs">
                          Class #{index + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleDeleteClass(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold">
                          Remove
                        </button>
                      </div>

                      {/* Tier Eyebrow & Class Name */}
                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">
                          Tier Eyebrow Badge
                        </label>
                        <input
                            value={cls.badge || ""}
                            onChange={(e) => handleUpdateClassField(index, "badge", e.target.value)}
                            placeholder="e.g., Premium Experience / Elite Experience"
                            className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">
                          Class Name
                        </label>
                        <input
                            value={cls.name || ""}
                            onChange={(e) => handleUpdateClassField(index, "name", e.target.value)}
                            placeholder="e.g., Monday Evening Zumba"
                            className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                        />
                      </div>

                      {/* Schedule / Time & Plan */}
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-gray-500 text-[10px] mb-0.5">
                            Schedule / Time
                          </label>
                          <input
                              value={cls.time || ""}
                              onChange={(e) => handleUpdateClassField(index, "time", e.target.value)}
                              placeholder="e.g., Mon, Wed, Fri 6:00 PM"
                              className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 text-[10px] mb-0.5">
                            Associated Plan / Tier
                          </label>
                          <select
                              value={cls.productId || ""}
                              onChange={(e) => {
                                const newProductId = e.target.value;
                                const hybridProds = pageData.hybridProducts || [];
                                const getProductName = (p) =>
                                  p ? (p.name || p.title || p.heading || "") : "";

                                const prevProduct = hybridProds.find(
                                  (p) =>
                                    String(p.productId || p.id) ===
                                    String(cls.productId),
                                );
                                const prevPlanName = getProductName(prevProduct);

                                const nextProduct = hybridProds.find(
                                  (p) =>
                                    String(p.productId || p.id) ===
                                    String(newProductId),
                                );
                                const nextPlanName = getProductName(nextProduct);

                                const currentName = (cls.name || "").trim();

                                const isExactPrevPlanMatch = Boolean(
                                  prevPlanName &&
                                    currentName.toLowerCase() ===
                                      prevPlanName.trim().toLowerCase(),
                                );

                                const updatedName =
                                  !currentName || isExactPrevPlanMatch
                                    ? nextPlanName || cls.name
                                    : cls.name;

                                const updated = pageData.classes.map((c, i) =>
                                  i === index
                                    ? { ...c, productId: newProductId, name: updatedName }
                                    : c,
                                );
                                updateClasses(updated);
                              }}
                              className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor">
                            <option value="">Select a plan</option>
                            {(pageData.hybridProducts || []).map((plan) => (
                                <option
                                    key={plan.productId || plan.id}
                                    value={plan.productId || plan.id}>
                                  {plan.heading || plan.title || plan.name || "Untitled Plan"}
                                </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Image Artwork & Upload */}
                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">
                          Class Image
                        </label>
                        <div className="flex gap-1.5">
                          <input
                              type="url"
                              value={cls.image || ""}
                              onChange={(e) => handleUpdateClassField(index, "image", e.target.value)}
                              placeholder="Image URL or upload"
                              className="flex-1 p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor"
                          />
                          <label className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium cursor-pointer shrink-0">
                            {uploadingClassIdx === index ? "..." : "Upload"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingClassIdx === index}
                                onChange={(e) => handleClassImageUploadInSidebar(e, index)}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">
                          Description
                        </label>
                        <textarea
                            value={cls.description || ""}
                            onChange={(e) => handleUpdateClassField(index, "description", e.target.value)}
                            rows={2}
                            placeholder="Class description..."
                            className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor resize-none"
                        />
                      </div>

                      {/* What's Included */}
                      <div>
                        <label className="block text-gray-500 text-[10px] mb-0.5">
                          What's Included (one per line)
                        </label>
                        <textarea
                            value={
                              Array.isArray(cls.includedServices)
                                ? cls.includedServices.join("\n")
                                : ""
                            }
                            onChange={(e) => {
                              const items = e.target.value
                                  .split("\n")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                              handleUpdateClassField(index, "includedServices", items);
                            }}
                            rows={3}
                            placeholder={"In-Studio & Online Live\nHD Class Replays\nDirect Instructor Messaging"}
                            className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:border-primaryColor resize-none"
                        />
                      </div>

                      {/* Pricing & Billing */}
                      <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-gray-200">
                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Currency
                          </label>
                          <input
                              value={cls.currency || "₹"}
                              onChange={(e) => handleUpdateClassField(index, "currency", e.target.value)}
                              placeholder="₹"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Recurring Price
                          </label>
                          <input
                              type="number"
                              value={cls.recurringPrice ?? 1500}
                              onChange={(e) => handleUpdateClassField(index, "recurringPrice", Number(e.target.value) || 0)}
                              placeholder="1500"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Original Price
                          </label>
                          <input
                              type="number"
                              value={cls.originalPrice ?? 3000}
                              onChange={(e) => handleUpdateClassField(index, "originalPrice", Number(e.target.value) || 0)}
                              placeholder="3000"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Billing Period
                          </label>
                          <input
                              value={cls.billingPeriod || "month"}
                              onChange={(e) => handleUpdateClassField(index, "billingPeriod", e.target.value)}
                              placeholder="month"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Promo Offer & Button */}
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Offer Pill Badge
                          </label>
                          <input
                              value={cls.offerBadge || "1st Month Free"}
                              onChange={(e) => handleUpdateClassField(index, "offerBadge", e.target.value)}
                              placeholder="1st Month Free"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Button Label
                          </label>
                          <input
                              value={cls.buttonText || "Start Free Month"}
                              onChange={(e) => handleUpdateClassField(index, "buttonText", e.target.value)}
                              placeholder="Start Free Month"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 text-[9px] mb-0.5">
                            Offer Subtext
                          </label>
                          <input
                              value={
                                cls.offerSubtext ||
                                "Then {price}/{period} from month 2 • Cancel anytime"
                              }
                              onChange={(e) => handleUpdateClassField(index, "offerSubtext", e.target.value)}
                              placeholder="Then {price}/{period} from month 2 • Cancel anytime"
                              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                ))}

                <button
                    onClick={handleAddClass}
                    className="w-full py-2 px-3 bg-primaryColor text-white text-xs rounded-lg font-semibold hover:bg-primaryColor/90 transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} />
                  Add Class
                </button>
              </div>
            </section>
            {/* Transform */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <ArrowRight size={16} className="text-primaryColor" />
                Transform
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">Heading</label>
                  <input
                    value={pageData.transform.heading}
                    onChange={(e) =>
                      updatePageData("transform", {
                        ...pageData.transform,
                        heading: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={pageData.transform.desc}
                    onChange={(e) =>
                      updatePageData("transform", {
                        ...pageData.transform,
                        desc: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor h-16 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Location</label>
                  <input
                    value={pageData.transform.location || ""}
                    onChange={(e) =>
                      updatePageData("transform", {
                        ...pageData.transform,
                        location: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="e.g., Studio Name, City, State"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Class Time</label>
                  <input
                    value={pageData.transform.classTime || ""}
                    onChange={(e) =>
                      updatePageData("transform", {
                        ...pageData.transform,
                        classTime: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="e.g., Monday - Friday: 6:00 PM - 7:00 PM"
                  />
                </div>
                {/* <div>
              <label className="block text-gray-600 mb-1">Button Text</label>
              <input
                value={pageData.transform.button}
                onChange={(e) =>
                  updatePageData("transform", {
                    ...pageData.transform,
                    button: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
              />
            </div> */}
                {/* <div>
              <label className="block text-gray-600 mb-1">Primary Color</label>
              <input
                type="color"
                value={pageData.transform.primaryColor}
                onChange={(e) =>
                  updatePageData("transform", {
                    ...pageData.transform,
                    primaryColor: e.target.value,
                  })
                }
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div> */}
              </div>
            </section>
            {/* Social Media Links */}
            <section className="space-y-3 pb-6 border-b-2 border-dotted border-gray-800">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <ArrowRight size={16} className="text-primaryColor" />
                Social Media Links
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <SocialIcon
                      url={pageData.socialMedia?.instagram}
                      className="w-3.5 h-3.5 text-gray-500"
                    />
                    <span>Instagram URL</span>
                  </label>
                  <input
                    type="url"
                    value={pageData.socialMedia?.instagram || ""}
                    onChange={(e) =>
                      updatePageData("socialMedia", {
                        ...(pageData.socialMedia || {}),
                        instagram: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <SocialIcon
                      url={pageData.socialMedia?.facebook}
                      className="w-3.5 h-3.5 text-gray-500"
                    />
                    <span>Facebook URL</span>
                  </label>
                  <input
                    type="url"
                    value={pageData.socialMedia?.facebook || ""}
                    onChange={(e) =>
                      updatePageData("socialMedia", {
                        ...(pageData.socialMedia || {}),
                        facebook: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <SocialIcon
                      url={pageData.socialMedia?.youtube}
                      className="w-3.5 h-3.5 text-gray-500"
                    />
                    <span>YouTube URL</span>
                  </label>
                  <input
                    type="url"
                    value={pageData.socialMedia?.youtube || ""}
                    onChange={(e) =>
                      updatePageData("socialMedia", {
                        ...(pageData.socialMedia || {}),
                        youtube: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="https://youtube.com/@username"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <SocialIcon
                      url={pageData.socialMedia?.twitter}
                      className="w-3.5 h-3.5 text-gray-500"
                    />
                    <span>Twitter / X URL</span>
                  </label>
                  <input
                    type="url"
                    value={pageData.socialMedia?.twitter || ""}
                    onChange={(e) =>
                      updatePageData("socialMedia", {
                        ...(pageData.socialMedia || {}),
                        twitter: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <SocialIcon
                      url={pageData.socialMedia?.telegram}
                      className="w-3.5 h-3.5 text-gray-500"
                    />
                    <span>Telegram URL</span>
                  </label>
                  <input
                    type="url"
                    value={pageData.socialMedia?.telegram || ""}
                    onChange={(e) =>
                      updatePageData("socialMedia", {
                        ...(pageData.socialMedia || {}),
                        telegram: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                    placeholder="https://t.me/username"
                  />
                </div>
                {Object.entries(pageData.socialMedia || {})
                  .filter(
                    ([key]) =>
                      ![
                        "instagram",
                        "facebook",
                        "youtube",
                        "twitter",
                        "telegram",
                      ].includes(key),
                  )
                  .map(([key, value]) => (
                    <div key={key}>
                      <label className="flex items-center gap-1.5 text-gray-600 mb-1 capitalize">
                        <SocialIcon
                          url={value}
                          className="w-3.5 h-3.5 text-gray-500"
                        />
                        <span>{key} URL</span>
                      </label>
                      <input
                        type="url"
                        value={value || ""}
                        onChange={(e) =>
                          updatePageData("socialMedia", {
                            ...(pageData.socialMedia || {}),
                            [key]: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:border-primaryColor"
                        placeholder={`https://${key}.com/...`}
                      />
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Footer Save Button */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 sticky bottom-0">
        <button
          onClick={handleSavePage}
          disabled={imageLoading || loading}
          className="w-full p-3 bg-primaryColor hover:bg-primaryColor/90 text-white rounded-lg
               font-semibold text-sm disabled:opacity-50 transition-colors
               flex items-center justify-center gap-2">
          {imageLoading || loading ? (
            <>
              {/* SPINNER LOADER */}
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-30"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-100"
                  fill="white"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save All Changes
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal - Rendered via Portal */}
      {showExitModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Unsaved Changes
                  </h3>
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  You have unsaved changes. Do you want to save them before
                  exiting?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleConfirmExit("save")}
                    className="w-full py-3 px-4 bg-primaryColor text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: pageData.globalPrimaryColor }}>
                    <Save size={18} />
                    Save & Exit
                  </button>
                  <button
                    onClick={() => handleConfirmExit("discard")}
                    className="w-full py-3 px-4 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200 flex items-center justify-center gap-2">
                    <X size={18} />
                    Discard Changes
                  </button>
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="w-full py-3 px-4 text-gray-500 font-medium hover:text-gray-800 transition-colors hover:bg-gray-50 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
