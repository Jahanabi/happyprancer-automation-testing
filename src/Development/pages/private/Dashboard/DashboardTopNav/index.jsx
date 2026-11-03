import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import {
  FaUser,
  FaCalendarAlt,
  FaHistory,
  FaUsers,
  FaVideo,
  FaEnvelope,
  FaUserPlus,
  FaTrophy,
} from "react-icons/fa";
import { GiStarsStack } from "react-icons/gi";
import { HiCurrencyDollar } from "react-icons/hi2";
import { BsBoxArrowRight } from "react-icons/bs";

// Top nav used ONLY on the "Upcoming Classes" (/dashboard) page. Replaces
// LeftBanner's sidebar + mobile hamburger/drawer with a single horizontal
// tab strip (desktop + mobile) so the photo-forward dashboard gets full
// page width. Every other route still renders <LeftBanner /> unchanged.
const DashboardTopNav = () => {
  const [loading, setLoading] = useState(false);
  const Navigate = useNavigate();
  const location = useLocation();
  const UserCtx = useContext(Context);
  const InstitutionData = useContext(InstitutionContext).institutionData;

  const isAdmin = UserCtx.userData.userType === "admin";
  const isInstructor = UserCtx.userData.userType === "instructor";
  const ratings = UserCtx.ratings || [];
  const activePath = location.pathname;
  const paymentsOrRevenuePath = isAdmin ? "/revenue" : "/payments";

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      setLoading(false);
      window.location.href = "/";
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const tabs = [
    {
      icon: <FaCalendarAlt size={15} />,
      text: "Upcoming Classes",
      path: "/dashboard",
    },
    {
      icon: <FaHistory size={15} />,
      text: "Previous Classes",
      path: "/previous",
    },
    {
      icon: <FaVideo size={15} />,
      text: "Choreography",
      path: "/choreography",
    },
    {
      icon: <FaVideo size={15} />,
      text: "Yoga Classes",
      path: "/yoga-classes",
    },
    ...(ratings.length >= 1
      ? [
          {
            icon: <GiStarsStack size={15} />,
            text: "Ratings",
            path: "/ratings",
          },
        ]
      : []),
    { icon: <FaTrophy size={15} />, text: "Reward", path: "/reward" },
    ...(isAdmin
      ? [{ icon: <FaUsers size={15} />, text: "Members", path: "/members" }]
      : []),
    ...(!isInstructor
      ? [
          {
            icon: <HiCurrencyDollar size={15} />,
            text: isAdmin ? "Revenue" : "Payments",
            path: paymentsOrRevenuePath,
          },
        ]
      : []),
    ...(UserCtx.userData?.members > 0
      ? [
          {
            icon: <FaUserPlus size={15} />,
            text: "Manage Members",
            path: "/manage-members",
          },
        ]
      : []),
    ...((isAdmin || isInstructor) && UserCtx.userData?.referral_code
      ? [
          {
            icon: <FaUserPlus size={15} />,
            text: "Referred Members",
            path: "/referred-members",
          },
        ]
      : []),
    { icon: <FaUser size={15} />, text: "Account", path: "/account" },
    { icon: <FaEnvelope size={15} />, text: "Contact us", path: "/query" },
  ];

  return (
    <div
      className="dtn-wrap w-full sticky top-0 z-30 bg-white border-b border-gray-100"
      style={{ "--dtn-primary": InstitutionData.PrimaryColor }}>
      <style>{`
        .dtn-scroll::-webkit-scrollbar { display: none; }
        .dtn-tab.active { background-color: var(--dtn-primary); color: #fff; }
      `}</style>
      <div className="dtn-scroll flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-3 max-w-[100vw]">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => Navigate(tab.path)}
            className={`dtn-tab flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activePath === tab.path
                ? "active"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}>
            {tab.icon}
            {tab.text}
          </button>
        ))}

        <button
          onClick={handleLogout}
          disabled={loading}
          className="dtn-tab flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 ml-auto">
          <BsBoxArrowRight size={15} />
          {loading ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
};

export default DashboardTopNav;
