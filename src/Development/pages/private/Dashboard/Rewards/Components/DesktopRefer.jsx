import {
  FaWhatsapp,
  FaFacebookF,
  FaTelegramPlane,
  FaUsers,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RedeemModal from "./RedeemModal";
import { Lock, ArrowLeft } from "lucide-react";
import { Share2, Copy } from "lucide-react";

export default function ReferAndEarnDesktop({
  user = {},
  setPage,
  totalReferrals,
  rewards = [],
  nextRewardTarget,
  InstitutionData,
}) {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const referrals = user?.referrals || 0;
  const totalPoints = user?.totalPoints || user?.hpPoints || 0;
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReward(null);
  };
  const [selectedReward, setSelectedReward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rewardsCount = Array.isArray(user?.rewards)
    ? user.rewards.length
    : user?.rewards || 0;

  const handleShareClick = (platform) => {
    // Toggle the active platform - if same platform clicked, close it
    setActivePlatform(activePlatform === platform ? null : platform);
    setShowCopyDropdown(false); // Close copy dropdown when platform is clicked
  };

  const handleShare = (platform, isStudent = false) => {
    const referralLinkToShare = buildReferralLink(isStudent);
    const shareMessage = `Join me on ${
      `${InstitutionData?.InstitutionId}!` || "happyprancer"
    }! Sign up with my referral link: ${referralLinkToShare}`;

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLinkToShare
        )}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareMessage
        )}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          referralLinkToShare
        )}&text=${encodeURIComponent(shareMessage)}`;
        break;
      default:
        break;
    }
    window.open(url, "_blank");
    setActivePlatform(null);
  };

  const buildReferralLink = (isStudent = false) => {
    const referralCode =
      user?.referralCode || InstitutionData?.InstitutionId || "HAPPYPRANCER001";
    const url = new URL("/signup", window.location.origin);
    url.searchParams.set("referral", referralCode);
    if (isStudent) url.searchParams.set("student", "true");
    return url.toString();
  };

  const handleCopyClick = () => {
    setShowCopyDropdown(!showCopyDropdown);
    setActivePlatform(null); // Close platform dropdowns when copy is clicked
  };

  const handleCopy = () => {
    const referralLink = buildReferralLink(false);
    const message = `Join me on ${
      `${InstitutionData?.InstitutionId}!` || "happyprancer"
    }! Sign up with my referral link: ${referralLink}`;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setShowCopyDropdown(false);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyStudent = () => {
    const referralLink = buildReferralLink(true);
    const message = `Join me on ${
      `${InstitutionData?.InstitutionId}!` || "happyprancer"
    }! Sign up with my referral link: ${referralLink}`;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setShowCopyDropdown(false);
    setTimeout(() => setCopied(false), 1500);
  };

  const remaining = nextRewardTarget - totalReferrals;
  const progress = (totalReferrals / nextRewardTarget) * 100;

  const [selectedImages, setSelectedImages] = useState({});
  useEffect(() => {
    let defaults = {};
    rewards.forEach((reward) => {
      if (reward.images) {
        defaults[reward.id] = reward.images[0];
      }
    });
    setSelectedImages(defaults);
  }, [rewards]);
  const handleImageClick = (rewardId, img) => {
    setSelectedImages((prev) => ({
      ...prev,
      [rewardId]: img,
    }));
  };

  return (
    <section className="w-full h-[calc(100vh-8rem)] p-8 font-poppins">
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <ArrowLeft
          size={22}
          className="cursor-pointer"
          onClick={() => setPage("profile")}
        />

        <div className="flex gap-2"></div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 gap-8 mb-10 items-start">
        {/* Left Section */}
        <section>
          <div className="bg-white rounded-2xl border-2 border-primaryColor px-6 py-7 w-full space-y-8">
            {/* PROGRESS SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 text-lg">Your Progress</p>
                <p className="text-sm text-gray-500 mt-1">
                  You’re {remaining} referrals away from your next reward
                </p>
              </div>

              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    strokeWidth="5"
                    stroke="#E5E7EB"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    strokeWidth="5"
                    stroke="#10B981"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-in-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-gray-800">
                  {totalReferrals}/{nextRewardTarget}
                </div>
              </div>
            </motion.div>

            {/* REFERRAL CODE SECTION */}
            <div className="text-center">
              <p className="text-gray-500 text-md font-medium">
                Your Referral Code
              </p>

              <div className="flex flex-col items-center justify-center gap-3 mt-3">
                <p className="font-bold text-2xl tracking-wide text-gray-800">
                  {user?.referralCode ||
                    InstitutionData?.InstitutionId ||
                    "USER12345"}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 relative">
                  <div className="relative">
                    <button
                      onClick={handleCopyClick}
                      className={`bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all ${
                        showCopyDropdown
                          ? "ring-2 ring-offset-2 ring-emerald-400 scale-105"
                          : "hover:scale-105"
                      }`}>
                      <Copy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>

                    {/* Copy Options Dropdown */}
                    <AnimatePresence>
                      {showCopyDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-col gap-2 min-w-[160px]">
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap">
                            <FaUsers size={14} />
                            Copy for Normal User
                          </button>
                          <button
                            onClick={handleCopyStudent}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap">
                            <FaUsers size={14} />
                            Copy for Student
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mt-2">
                Invite friends & earn <b>100 zPoints</b> for each successful
                referral.
              </p>
            </div>

            {/* SHARE SECTION */}
            <div className="text-center ">
              <p className="text-gray-700 font-medium mb-3">
                Share With Friends
              </p>

              <div className="flex justify-center gap-4 flex-wrap">
                {[
                  {
                    icon: <FaWhatsapp size={18} />,
                    color: "#22C55E",
                    name: "whatsapp",
                  },
                  {
                    icon: <FaFacebookF size={18} />,
                    color: "#1877F2",
                    name: "facebook",
                  },
                  {
                    icon: <FaXTwitter size={18} />,
                    color: "#1DA1F2",
                    name: "twitter",
                  },
                  {
                    icon: <FaTelegramPlane size={18} />,
                    color: "#0088cc",
                    name: "telegram",
                  },
                ].map((p, i) => (
                  <div key={i} className="relative">
                    <div
                      onClick={() => handleShareClick(p.name)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white cursor-pointer transition-all ${
                        activePlatform === p.name
                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: p.color }}>
                      {p.icon}
                    </div>

                    {/* Share Options Dropdown - Above Icon */}
                    {activePlatform === p.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-col gap-2 min-w-[140px]">
                        <button
                          onClick={() => handleShare(p.name, false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap">
                          <FaUsers size={14} />
                          Share With Normal User
                        </button>
                        <button
                          onClick={() => handleShare(p.name, true)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap">
                          <FaUsers size={14} />
                          Share With a Student
                        </button>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* YOUR EXTRA SECTION (CLEAN + ELEGANT) */}
            <div className=" border-gray-100">
              <p className="text-gray-700 font-medium text-sm mb-">
                Share on your favorite platforms
              </p>

              <p className="text-xs text-gray-500 leading-relaxed">
                When someone uses your referral code to sign up, they will
                receive one month of free subscription.
              </p>
            </div>
          </div>
        </section>

        {/* Right Section */}
        <div className="w-full bg-white rounded-2xl  border-2 border-primaryColor p-6  ">
          <h3 className="font-bold text-lg mb-6">Available Rewards</h3>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className={`p-4 rounded-xl shadow-sm transition flex flex-col items-center text-center
    ${
      reward.unlocked ? "bg-white hover:bg-gray-100" : "bg-gray-100 opacity-70"
    }`}>
                {/* MAIN IMAGE */}
                <div className="w-full flex items-center justify-center mb-3">
                  {reward.images ? (
                    <img
                      src={selectedImages[reward.id]}
                      alt="selected"
                      className="w-full h-40 object-contain rounded-xl bg-white"
                    />
                  ) : (
                    <div
                      className={`w-20 h-20 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600

          `}>
                      {reward.icon}
                    </div>
                  )}
                </div>

                {/* THUMBNAILS */}
                {reward.images && (
                  <div className="flex gap-2 mb-3 w-full justify-center">
                    {reward.images.map((img, index) => (
                      <img
                        key={index}
                        alt="main"
                        src={img}
                        onClick={() => handleImageClick(reward.id, img)}
                        className={`h-12 w-12 object-contain rounded-lg cursor-pointer border
            ${
              selectedImages[reward.id] === img
                ? "border-yellow-400"
                : "border-transparent"
            }`}
                      />
                    ))}
                  </div>
                )}

                <p
                  className={`font-bold text-md ${
                    reward.unlocked ? "text-gray-800" : "text-gray-500"
                  }`}>
                  {reward.title}
                </p>

                <p className="text-sm text-gray-500 mb-3">
                  {reward.points} zPoints required
                </p>

                {reward.isClaimed ? (
                  // ✅ ALREADY CLAIMED
                  <div className="flex items-center justify-center gap-1 text-green-600 bg-green-100 px-3 py-2 rounded-md w-full text-xs font-semibold">
                    ✔ Claimed
                  </div>
                ) : reward.canClaim ? (
                  // 🎁 CAN CLAIM
                  <button
                    onClick={() => {
                      setSelectedReward(reward);
                      setIsModalOpen(true);
                    }}
                    className="bg-[#FFD93D] hover:bg-yellow-400 text-gray-900 font-semibold text-xs px-3 py-2 rounded-md w-full">
                    Redeem Now
                  </button>
                ) : (
                  // 🔒 LOCKED
                  <div className="flex items-center justify-center gap-1 text-gray-500 bg-gray-200 px-3 py-2 rounded-md w-full text-xs">
                    <Lock size={12} /> Locked
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Redeem Modal */}
        <RedeemModal
          open={isModalOpen}
          onClose={handleCloseModal}
          reward={selectedReward}
          user={user}
        />
      </div>
    </section>
  );
}
