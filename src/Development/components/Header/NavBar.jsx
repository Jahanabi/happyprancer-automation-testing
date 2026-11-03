import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import institutionContext from "../../Context/InstitutionContext";
import Context from "../../Context/Context";
import { HiMenuAlt3 } from "react-icons/hi";
import { HiHome } from "react-icons/hi2";
import { FaBell } from "react-icons/fa";
import {
  FaCalendarAlt,
  FaHistory,
  FaUsers,
  FaVideo,
  FaEnvelope,
  FaUserPlus,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { GiStarsStack } from "react-icons/gi";
import { HiCurrencyDollar } from "react-icons/hi2";
import { BsBoxArrowRight } from "react-icons/bs";

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/previous",
  "/choreography",
  "/yoga-classes",
  "/ratings",
  "/reward",
  "/members",
  "/payments",
  "/revenue",
  "/manage-members",
  "/referred-members",
  "/account",
  "/query",
];

const getInitials = (name) => {
  if (!name) return "";
  return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
};

const NavBar = ({ content = [], authContent = [] }) => {
  const { PrimaryColor } = useContext(institutionContext).institutionData;
  const UserCtx = useContext(Context);
  const { isAuth, setLoading } = UserCtx;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);

  // Which bottom-tab icon is highlighted on mobile. Home and Schedule
  // currently both route to /dashboard (no separate home page exists yet),
  // so we can't derive this purely from the URL — we track the last tab
  // the user tapped and default to "schedule" since /dashboard IS the
  // schedule page today.
  const [mobileActiveTab, setMobileActiveTab] = useState("home");

  const profileRef = useRef(null);
  const bellRef = useRef(null);

  const location = useLocation();
  const Navigate = useNavigate();
  const isAboutPage = location.pathname === "/about";
  const isHomePage = location.pathname === "/";
  const isTransparent = isAboutPage && !isScrolled;

  const isDashboardMode =
      isAuth && DASHBOARD_ROUTES.includes(location.pathname);

  /* ---------------- Scroll Detection ---------------- */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------------- Keep bottom-tab highlight in sync with the URL ---------------- */
  useEffect(() => {
    if (location.pathname === "/previous") {
      setMobileActiveTab("previous");
    } else if (
        location.pathname === "/account" ||
        location.pathname === "/payments" ||
        location.pathname === "/revenue" ||
        location.pathname === "/members" ||
        location.pathname === "/manage-members" ||
        location.pathname === "/referred-members" ||
        location.pathname === "/query"
    ) {
      setMobileActiveTab("profile");
    } else if (location.pathname === "/dashboard") {
      // Don't stomp "home" if that's what was just tapped — see note above.
      setMobileActiveTab((prev) => (prev === "home" ? "home" : "yoga"));
    }
  }, [location.pathname]);

  /* ---------------- Logout ---------------- */
  const handleLogout = async () => {
    try {
      setLoading?.(true);
      setLoggingOut(true);
      await signOut();
      setLoading?.(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setLoading?.(false);
      setLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  /* ---------------- Close dropdowns/menu on outside click ---------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
          isMobileMenuOpen &&
          !event.target.closest(".mobile-drawer") &&
          !event.target.closest(".hamburger-btn")
      ) {
        setIsMobileMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const textClass = isTransparent ? "text-white" : "text-[#03413A]";
  const linkBaseClass =
      "text-base font-['Inter'] font-semibold transition-opacity hover:opacity-80";

  /* ---------------- Dashboard nav data ---------------- */
  const isAdmin = UserCtx.userData?.userType === "admin";
  const isInstructor = UserCtx.userData?.userType === "instructor";
  const ratings = UserCtx.ratings || [];
  const paymentsOrRevenuePath = isAdmin ? "/revenue" : "/payments";
  const isMembersPage = location.pathname === "/members";

  // Core row — the class-facing links every user type sees, mirroring the
  // reference's "Classes / My Bookings / Instructors / Rewards" row.
  const primaryTabs = [
    {
      icon: <FaCalendarAlt size={14} />,
      text: "Upcoming Classes",
      path: "/dashboard",
    },
    {
      icon: <FaHistory size={14} />,
      text: "Previous Classes",
      path: "/previous",
    },
    {
      icon: <FaVideo size={14} />,
      text: "Choreography",
      path: "/choreography",
    },
    {
      icon: <FaVideo size={14} />,
      text: "Yoga Classes",
      path: "/yoga-classes",
    },
    ...(ratings.length >= 1
        ? [
          {
            icon: <GiStarsStack size={14} />,
            text: "Ratings",
            path: "/ratings",
          },
        ]
        : []),
    isMembersPage
      ? { icon: <FaUsers size={14} />, text: "Members", path: "/members" }
      : { icon: <FaTrophy size={14} />, text: "Reward", path: "/reward" },
  ];

  // Everything else (admin/instructor sections + account-level items) lives
  // under the profile avatar dropdown on desktop. On mobile, tapping the
  // "Profile" bottom tab opens this same list in the slide-out drawer.
  const profileMenuItems = [
    ...(isAdmin && !isMembersPage
        ? [{ icon: <FaUsers size={14} />, text: "Members", path: "/members" }]
        : []),
    ...(!isInstructor
        ? [
          {
            icon: <HiCurrencyDollar size={14} />,
            text: isAdmin ? "Revenue" : "Payments",
            path: paymentsOrRevenuePath,
          },
        ]
        : []),
    ...(UserCtx.userData?.members > 0
        ? [
          {
            icon: <FaUserPlus size={14} />,
            text: "Manage Members",
            path: "/manage-members",
          },
        ]
        : []),
    ...((isAdmin || isInstructor) && UserCtx.userData?.referral_code
        ? [
          {
            icon: <FaUserPlus size={14} />,
            text: "Referred Members",
            path: "/referred-members",
          },
        ]
        : []),
    { icon: <FaUser size={14} />, text: "Account", path: "/account" },
    { icon: <FaEnvelope size={14} />, text: "Contact us", path: "/query" },
  ];

  const userName = UserCtx.userData?.userName || "";
  const userInitials = getInitials(userName) || "U";

  // primaryTabs entries not already reachable via a bottom tab (Home and
  // Schedule both cover /dashboard; Previous Classes has its own tab now).
  // These surface in the mobile Profile drawer instead so nothing that was
  // in primaryTabs disappears on mobile.
  const drawerPrimaryItems = primaryTabs.filter(
      (tab) => tab.path !== "/dashboard" && tab.path !== "/previous",
  );

  // Bottom tab bar config (mobile, dashboard mode only).
  // mobileActiveTab above.
  const mobileTabs = [
    {
      key: "home",
      label: "Home",
      icon: <HiHome size={20} />,
      path: "/dashboard",
    },
    {
      key: "previous",
      label: "Previous",
      icon: <FaHistory size={18} />,
      path: "/previous",
    },
    {
      key: "yoga",
      label: "Yoga",
      icon: <FaCalendarAlt size={17} />,
      path: "/yoga-classes",
    },
  ];

  const handleMobileTabClick = (tab) => {
    setMobileActiveTab(tab.key);
    Navigate(tab.path);
  };

  /* ---------------- Auth Item Renderer (marketing mode) ---------------- */
  const renderAuthItem = (item, isMobile = false) => {
    const isButton =
        item.label === "Join Now" ||
        item.label === "Login" ||
        (isAuth && item.label === "Dashboard");

    if (isButton) {
      return (
          <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              className={`
            px-6 py-2 rounded-full text-sm font-semibold border transition-all
            ${
                  isMobile
                      ? "w-full text-center bg-[#03413A] text-white border-[#03413A] hover:bg-[#02362f]"
                      : isTransparent
                          ? "border-white text-white hover:bg-white/10"
                          : "bg-[#03413A] text-white border-[#03413A] hover:bg-[#02362f]"
              }
          `}>
            {item.label}
          </Link>
      );
    }

    return (
        <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
            className={`${linkBaseClass} ${
                isMobile ? "block w-full text-center py-2 text-[#03413A]" : textClass
            }`}>
          {item.label}
        </Link>
    );
  };

  return (
      <>
        {/* Spacer — collapses on mobile in dashboard mode since the top
            header is hidden there (bottom tab bar takes over). */}
        {!isTransparent && (
            <div
                className={`w-full bg-white ${
                    isDashboardMode
                        ? "hidden xl:block xl:h-[4.25rem]"
                        : "h-16 sm:h-[4.25rem]"
                }`}
            />
        )}

        {/* ================= TOP HEADER ================= */}
        {/* On mobile, dashboard mode hides this entirely — the page owns
            its own heading (e.g. "Schedule") and the bottom tab bar handles
            navigation instead. Desktop keeps the full top nav. */}
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
          ${isDashboardMode ? "hidden xl:block" : ""}
          ${
                isScrolled
                    ? "bg-white shadow-sm border-b border-[#E5E7EB]"
                    : isAboutPage
                        ? "bg-transparent"
                        : "bg-[#E8FFFC] border-none"
            }
        `}>
          <div
              className={`
            flex items-center justify-between
            px-3 md:!px-10 xl:!px-14
            transition-all duration-300
            ${isHomePage ? (isScrolled ? "py-3 xl:py-4" : "py-6 xl:py-10") : "py-3 xl:py-4"}
          `}>
            {/* LOGO */}
            <Link to="/" className="z-50 shrink-0">
              <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="h-10 md:h-14 object-contain"
              />
            </Link>

            {/* DESKTOP NAV — marketing links, OR dashboard nav on dashboard routes */}
            {isDashboardMode ? (
                <div className="hidden xl:flex items-center gap-6">
                  <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {primaryTabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                    isActive
                                        ? "font-semibold"
                                        : "text-gray-600 hover:text-gray-900"
                                }`
                            }
                            style={({ isActive }) =>
                                isActive ? { color: PrimaryColor } : undefined
                            }>
                          {tab.text}
                        </NavLink>
                    ))}
                  </nav>

                  {/* Bell + profile, grouped right next to the tabs */}
                  <div className="flex items-center gap-4">
                    {/* Bell */}
                    <div className="relative" ref={bellRef}>
                      <button
                          onClick={() => setIsBellOpen((prev) => !prev)}
                          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                          aria-label="Notifications">
                        <FaBell size={16} />
                      </button>
                      {isBellOpen && (
                          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-50">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              Notifications
                            </p>
                            <p className="text-xs text-gray-500">
                              No new notifications.
                            </p>
                          </div>
                      )}
                    </div>

                    {/* Profile avatar + dropdown */}
                    <div className="relative" ref={profileRef}>
                      <button
                          onClick={() => setIsProfileOpen((prev) => !prev)}
                          className="flex items-center gap-1">
                        <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: PrimaryColor }}>
                          {userInitials}
                        </div>
                      </button>
                      {isProfileOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {userName || "User"}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">
                                {UserCtx.userData?.userType}
                              </p>
                            </div>
                            {profileMenuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                      Navigate(item.path);
                                      setIsProfileOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                  {item.icon}
                                  {item.text}
                                </button>
                            ))}
                            <div className="border-t border-gray-100 mt-1 pt-1">
                              <button
                                  onClick={handleLogout}
                                  disabled={loggingOut}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                                <BsBoxArrowRight size={14} />
                                {loggingOut ? "Signing out..." : "Sign Out"}
                              </button>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
            ) : (
                <div className="hidden xl:flex items-center gap-10">
                  <nav className={`flex items-center gap-12 ${textClass}`}>
                    {content.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${linkBaseClass} ${isActive ? "opacity-100" : "opacity-90"}`
                            }>
                          {item.label}
                        </NavLink>
                    ))}
                  </nav>
                  <div className="flex items-center gap-4">
                    {authContent.map((item) => renderAuthItem(item))}
                  </div>
                </div>
            )}

            {/* MOBILE HAMBURGER — marketing/non-dashboard pages only.
                Dashboard mode uses the bottom tab bar's Profile tab instead. */}
            {!isDashboardMode && (
                <button
                    onClick={toggleMobileMenu}
                    className="hamburger-btn xl:hidden z-50">
                  <HiMenuAlt3
                      className={`h-8 w-8 transition-colors duration-300 ${
                          isTransparent ? "text-white" : "text-[#03413A]"
                      }`}
                  />
                </button>
            )}
          </div>
        </header>

        {/* ================= MOBILE BACKDROP ================= */}
        {/* Kept mounted regardless of header visibility — the dashboard's
            Profile tab (in the bottom bar) opens this same drawer. */}
        <div
            className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300
            ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
            onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* ================= MOBILE DRAWER ================= */}
        <div
            className={`mobile-drawer fixed top-0 right-0 h-full w-[72%] max-w-[280px]
            bg-white z-50 transform transition-transform duration-300
            shadow-[-4px_0_12px_rgba(0,0,0,0.15)]
            ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}>
          <div className="flex justify-between items-center px-4 py-4 border-b">
            <span className="text-sm font-bold text-[#03413A]">
              {isDashboardMode ? "PROFILE" : "MENU"}
            </span>
            <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-bold text-[#03413A]">
              ✕
            </button>
          </div>
          <nav className="flex flex-col px-3 py-4 overflow-y-auto h-[calc(100%-64px)]">
            {isDashboardMode ? (
                <>
                  <div className="px-3 pb-3 mb-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {userName || "User"}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {UserCtx.userData?.userType}
                    </p>
                  </div>

                  {/* Class-facing items that don't have their own bottom tab
                      (Choreography, Yoga Classes, Ratings, Reward) */}
                  {drawerPrimaryItems.map((item) => (
                      <button
                          key={item.path}
                          onClick={() => {
                            Navigate(item.path);
                            setIsMobileMenuOpen(false);
                          }}
                          className="group flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-semibold text-[#03413A] hover:bg-[#03413A]/10 text-left">
                        {item.icon}
                        {item.text}
                      </button>
                  ))}

                  <div className="border-t border-gray-100 my-2" />

                  {/* Account / admin-instructor items */}
                  {profileMenuItems.map((item) => (
                      <button
                          key={item.path}
                          onClick={() => {
                            Navigate(item.path);
                            setIsMobileMenuOpen(false);
                          }}
                          className="group flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-semibold text-[#03413A] hover:bg-[#03413A]/10 text-left">
                        {item.icon}
                        {item.text}
                      </button>
                  ))}

                  <div className="border-t border-gray-100 my-2" />

                  {/* Notifications */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      No new notifications.
                    </p>
                  </div>

                  <div className="border-t border-gray-100 my-2" />

                  <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50 mt-2 text-left">
                    <BsBoxArrowRight size={14} />
                    {loggingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </>
            ) : (
                <>
                  {content.map((item) => (
                      <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) =>
                              `group block w-full px-3 py-2 rounded-md text-sm font-semibold transition
                      ${isActive ? "bg-[#03413A] text-white" : "text-[#03413A] hover:bg-[#03413A]/10"}`
                          }>
                    <span className="flex justify-between items-center">
                      {item.label}
                      <span className="opacity-0 group-hover:opacity-100 transition text-xs">
                        →
                      </span>
                    </span>
                      </NavLink>
                  ))}
                  <div className="flex flex-col gap-2">
                    {authContent.map((item) => renderAuthItem(item, true))}
                  </div>
                </>
            )}
          </nav>
        </div>

        {/* ================= MOBILE BOTTOM TAB BAR ================= */}
        {/* Dashboard mode only, hidden at xl+ (desktop keeps the top nav). */}
        {isDashboardMode && (
            <nav
                className="mobile-drawer xl:hidden fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-100 flex items-stretch justify-around"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              {mobileTabs.map((tab) => {
                const isActive = mobileActiveTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => handleMobileTabClick(tab)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
                        style={{ color: isActive ? PrimaryColor : "#9CA3AF" }}>
                      {tab.icon}
                      <span
                          className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}>
                        {tab.label}
                      </span>
                    </button>
                );
              })}
              {/* Profile — opens the drawer above instead of navigating,
                  so Members/Payments/Contact/Sign Out stay reachable. */}
              <button
                  onClick={toggleMobileMenu}
                  className="hamburger-btn flex-1 flex flex-col items-center justify-center gap-1 py-2"
                  style={{
                    color: mobileActiveTab === "profile" ? PrimaryColor : "#9CA3AF",
                  }}>
                <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                    style={{
                      backgroundColor:
                          mobileActiveTab === "profile" ? PrimaryColor : "#9CA3AF",
                    }}>
                  {userInitials}
                </div>
                <span
                    className={`text-[11px] ${
                        mobileActiveTab === "profile" ? "font-semibold" : "font-medium"
                    }`}>
                  Profile
                </span>
              </button>
            </nav>
        )}
      </>
  );
};

export default NavBar;