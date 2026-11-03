import { Share2, Copy, ArrowRight, ArrowLeft } from "lucide-react";
import {
  FaGift,
  FaUsers,
  FaStar,
  FaWhatsapp,
  FaHistory,
  FaFacebookF,
  FaTwitter,
  FaTelegramPlane,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import institutionData from "../../../../../constants";
import { useContext } from "react";
import Context from "../../../../../Context/Context";

export default function ReferAndEarn({
  user,
  totalReferrals,
  nextRewardTarget,
  InstitutionData,
}) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("all");
  const [showHistory, setShowHistory] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const { userData } = useContext(Context);

  // ================= REFERRAL LINK LOGIC =================
  let domain;
  if (process.env.REACT_APP_STAGE === "DEV") {
    domain = institutionData.BETA_DOMAIN || window.location.origin;
  } else if (process.env.REACT_APP_STAGE === "PROD") {
    domain = window.location.origin || institutionData.PROD_DOMAIN;
  }
  let referralLink;

  // Use referralCode from enriched user object (already calculated)
  const referralCode =
    user?.referralCode ||
    userData?.referral_code ||
    InstitutionData?.InstitutionId ||
    "HP001Sai";

  if (user?.userType === "instructor") {
    referralLink = `${domain}/signup?referral=${referralCode}`;
  } else if (user?.userType === "admin") {
    referralLink = `${domain}/signup?referral=${
      InstitutionData?.InstitutionId || referralCode
    }`;
  } else {
    referralLink = `${domain}/signup?referral=${referralCode}`;
  }

  // ================= HANDLERS =================

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

  const remaining = nextRewardTarget - totalReferrals;
  const progress = (totalReferrals / nextRewardTarget) * 100;


  const buildReferralLink = (isStudent = false) => {
    const refCode =
      user?.referralCode ||
      userData?.referral_code ||
      InstitutionData?.InstitutionId ||
      "HP001Sai";
    const url = new URL("/signup", window.location.origin);
    url.searchParams.set("referral", refCode);
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

  const pointsData = [
    {
      id: 1,
      title: "Completed Yoga Session",
      date: "Today, 9:30 AM",
      points: +25,
    },
    { id: 2, title: "Referred Riya", date: "Yesterday, 2:15 PM", points: +50 },
    {
      id: 3,
      title: "Redeemed Free Yoga Class",
      date: "2 days ago, 11:00 AM",
      points: -100,
    },
    {
      id: 4,
      title: "Weekly Challenge Bonus",
      date: "3 days ago, 6:00 PM",
      points: +75,
    },
    { id: 5, title: "Zumba Session", date: "4 days ago, 7:30 PM", points: +30 },
  ];

  const filteredData =
    tab === "all"
      ? pointsData
      : tab === "earned"
      ? pointsData.filter((d) => d.points > 0)
      : pointsData.filter((d) => d.points < 0);

  return (
    <div className="min-h-screen font-poppins bg-white flex flex-col items-center text-gray-800 pb-10 no-scrollbar w-full overflow-hidden">
      {/* ================= REFERRAL PAGE ================= */}
      {!showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full relative flex flex-col items-center"
        >
          {/* Header */}
          <div
            className="absolute top-0 -mt-1 w-full text-white p-4 pb-5 rounded-b-[28px] shadow-md"
            style={{ backgroundColor: InstitutionData?.PrimaryColor }}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 fill="#fff" size={24} />
              <h2 className="font-semibold text-2xl">Refer & Earn</h2>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="z-10 bg-white rounded-[15px] border border-primaryColor px-4 py-4 text-center mb-5 mt-16 w-[90%]">
            <p className="text-gray-500 text-lg">Your Referral Code</p>

            <div className="flex flex-col items-center justify-center gap-3 rounded-xl p-3 mt-3 mb-3">
              <p className="font-bold text-2xl tracking-wide text-gray-800">
                {user?.referralCode ||
                  userData?.referral_code ||
                  InstitutionData?.InstitutionId ||
                  "HP001Sai"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 relative">
                <div className="relative">
                  <button
                    onClick={handleCopyClick}
                    className={`bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all ${
                      showCopyDropdown
                        ? "ring-2 ring-offset-2 ring-emerald-400 scale-105"
                        : "hover:scale-105"
                    }`}
                  >
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
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-col gap-2 min-w-[160px]"
                      >
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap"
                        >
                          <FaUsers size={14} />
                          Copy for Normal User
                        </button>
                        <button
                          onClick={handleCopyStudent}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap"
                        >
                          <FaUsers size={14} />
                          Copy for Student
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-lg mb-4">
              Invite friends & earn <b>100  zPoint</b> for each referral
            </p>

            {/* Share Buttons */}
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
                  icon: <FaTwitter size={18} />,
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer transition-all ${
                      activePlatform === p.name
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    {p.icon}
                  </div>

                  {/* Share Options Dropdown - Above Icon */}
                  <AnimatePresence>
                    {activePlatform === p.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-col gap-2 min-w-[140px]"
                      >
                        <button
                          onClick={() => handleShare(p.name, false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap"
                        >
                          <FaUsers size={14} />
                          Share With Normal User
                        </button>
                        <button
                          onClick={() => handleShare(p.name, true)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-all hover:scale-105 whitespace-nowrap"
                        >
                          <FaUsers size={14} />
                          Share With a Student
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-primaryColor px-4 py-4 mb-6 flex justify-between items-center w-[90%]">
            <div>
              <p className="font-bold text-gray-800 text-lg">Your Progress</p>
              <p className="text-md text-gray-500 mt-1">
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
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl border border-primaryColor px-6 py-5 mt-2 w-[90%] md:w-[85%] lg:w-[70%]"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" /> Earn zPoints
            </h3>

            <div className="grid gap-4">
              {[
                {
                  icon: <FaGift className="text-emerald-600" />,
                  title: "Attend a Class",
                  points: "+1 zPoint",
                  desc: "Earn points for each class you attend.",
                },
                {
                  icon: <FaUsers className="text-blue-600" />,
                  title: "Refer a Member",
                  points: "+100 zPoint",
                  desc: "Earn when your friend subscribes to a plan.",
                },
                {
                  icon: <FaStar className="text-yellow-500" />,
                  title: "Rate an Instructor",
                  points: "+1 zPoint",
                  desc: "Earn for each instructor rating.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="text-xl">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center gap-3 w-full">
                      <h1>{item.title}</h1>
                      <span className="text-emerald-600 font-bold">
                        {item.points}
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FaUsers className="text-purple-600" /> Referral Process
              </h4>
              <ol className="list-decimal ml-6 space-y-2 text-gray-700 text-md">
                <li>Share your referral code or link with friends.</li>
                <li>Your friend signs up using your code.</li>
                <li>Your friend subscribes to a plan.</li>
                <li>
                  You get <b className="text-emerald-600">100 zPoint</b> instantly,
                  and your referred friend will get <b>one month subscription free</b>.
                </li>
              </ol>
            </div>
          </motion.div>

          {/* Navigate to Points */}
          {/* <button
            onClick={() => setShowHistory(true)}
            className="w-[90%] text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2 hover:opacity-90 transition"
            style={{ backgroundColor: InstitutionData?.PrimaryColor }}
          >
            Track your referrals in Points
            <ArrowRight size={18} />
          </button> */}
        </motion.div>
      )}


      {/* ================= POINT HISTORY PAGE ================= */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex flex-col items-center pb-10"
        >
          {/* Header */}
          <div
            className="absolute flex top-0 -mt-1 w-full text-white p-4 pb-5 rounded-b-[28px] shadow-md justify-between items-center "
            style={{ backgroundColor: InstitutionData?.PrimaryColor }}
          >
            <ArrowLeft
              size={22}
              className="cursor-pointer"
              onClick={() => setShowHistory(false)}
            />
            <div className="flex items-center">
              <FaHistory size={22} />
              <h1 className="text-2xl font-semibold ml-2">Point History</h1>
            </div>
            <div></div>
          </div>

          {/* Total HP Points */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white z-10 rounded-2xl w-[90%] mt-16 py-4 px-4 flex justify-between items-center shadow-[0_3.98px_5.97px_rgba(0,0,0,0.1),0_9.95px_14.93px_rgba(0,0,0,0.1)]"
          >
            <div>
              <p className="text-gray-500 text-md font-medium">
                Total HP Points
              </p>
              <h2 className="text-[34px] leading-tight font-bold text-gray-900 mt-1">
                {user?.totalPoints || user?.hpPoints || 0}
              </h2>
            </div>

            <div className="flex items-center justify-center relative w-14 h-14">
              <svg className="w-full h-full">
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="#22c55e"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
              <span className="absolute text-[18px] font-bold text-gray-800">
                75%
              </span>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex bg-gray-200 rounded-full p-1 mt-4 w-[90%]">
            {["all", "earned", "spent"].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 py-2 text-sm font-medium rounded-full capitalize transition-all ${
                  tab === item
                    ? "bg-green-500 text-white shadow-md"
                    : "text-gray-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Transactions */}
          <div className="w-[90%] mt-4 space-y-3 mb-10">
            {filteredData.map((item) => {
              const isPositive = item.points > 0;
              const bgGradient = isPositive
                ? "bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7]"
                : "bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF]";
              const amountColor = isPositive
                ? "text-green-600"
                : "text-purple-600";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-2xl shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex justify-between items-center ${bgGradient}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPositive ? "bg-green-100" : "bg-purple-100"
                      }`}
                    >
                      {isPositive ? (
                        <FaPlus className="text-green-600 text-sm" />
                      ) : (
                        <FaMinus className="text-purple-600 text-sm" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium text-black`}>{item.title}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${amountColor}`}>
                    {isPositive ? "+" : ""}
                    {item.points}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
