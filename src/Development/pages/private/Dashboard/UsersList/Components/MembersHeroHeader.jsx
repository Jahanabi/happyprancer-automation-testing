import React from "react";
import { UserPlus, ChevronDown } from "lucide-react";

/**
 * MembersHeroHeader
 *
 * Compact Hero/Header card matching the visual language of Upcoming Classes (DashboardHero):
 * - Atmospheric scenery with celestial sun glow + leaf cluster on the right
 * - Botanical branch anchored at bottom-left
 * - Soft light-green curved bottom wave accent
 * - Subtle dashboard-bg texture overlay
 * - Complete preservation of title dropdown, counts, subtitle, and action button
 */
const MembersHeroHeader = ({
  selectedOption,
  handleSelectChange,
  primaryColor = "#216B66",
  activeCount = 0,
  instructorCount = 0,
  handleAddNewUserClick,
  isMobile = false,
}) => {
  return (
    <div className="members-hero-card">
      {/* Background texture overlay */}
      <div className="members-hero-bg-texture" aria-hidden="true" />

      {/* Atmospheric Scenery Layer */}
      <div className="members-hero-scenery" aria-hidden="true">
        {/* Right Celestial Body (Sun with soft radial glow) */}
        <div className="members-hero-celestial-wrap">
          <div
            style={{
              position: "absolute",
              inset: -22,
              borderRadius: "50%",
              background: "rgba(246, 196, 69, 0.24)",
              filter: "blur(18px)",
            }}
          />
          <svg viewBox="0 0 140 140" width="100%" height="100%">
            <defs>
              <radialGradient id="membersHeroSunGradient" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFE29A" />
                <stop offset="100%" stopColor="#F6C445" />
              </radialGradient>
            </defs>
            <circle cx="70" cy="70" r="50" fill="url(#membersHeroSunGradient)" />
          </svg>
        </div>

        {/* Leaf Cluster tucked behind/left of Celestial Body */}
        <div className="members-hero-leaves-cluster">
          <svg viewBox="0 0 70 70" width="100%" height="100%">
            <ellipse cx="20" cy="35" rx="16" ry="9" fill="#7FA66B" transform="rotate(-25 20 35)" />
            <ellipse cx="40" cy="20" rx="13" ry="7" fill="#B7D6A0" transform="rotate(15 40 20)" />
            <ellipse cx="45" cy="45" rx="14" ry="8" fill="#4F7A4F" transform="rotate(45 45 45)" />
          </svg>
        </div>

        {/* Botanical Branch anchored at bottom-left */}
        <div className="members-hero-branch">
          <svg viewBox="0 0 150 150" width="100%" height="100%">
            <path
              d="M10 150 C 20 110, 15 90, 45 60 C 60 45, 70 40, 85 20"
              stroke="#7FA66B"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="30" cy="120" rx="18" ry="10" fill="#4F7A4F" transform="rotate(-40 30 120)" />
            <ellipse cx="48" cy="90" rx="16" ry="9" fill="#7FA66B" transform="rotate(-20 48 90)" />
            <ellipse cx="60" cy="60" rx="15" ry="8" fill="#B7D6A0" transform="rotate(10 60 60)" />
            <ellipse cx="78" cy="35" rx="13" ry="7" fill="#7FA66B" transform="rotate(35 78 35)" />
            <ellipse cx="88" cy="18" rx="11" ry="6" fill="#4F7A4F" transform="rotate(55 88 18)" />
          </svg>
        </div>

        {/* Soft light-green curved bottom wave accent */}
        <div className="members-hero-curve">
          <svg viewBox="0 0 800 50" width="100%" height="100%" preserveAspectRatio="none">
            <path
              d="M0 30 C 150 5, 300 45, 450 20 C 600 -5, 700 35, 800 15 L 800 50 L 0 50 Z"
              fill="rgba(215, 236, 194, 0.55)"
            />
          </svg>
        </div>
      </div>

      {/* Foreground Content */}
      <div
        className={`members-hero-content flex ${
          isMobile
            ? "flex-col gap-3"
            : "flex-col sm:flex-row sm:items-center justify-between gap-4"
        }`}>
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Title Dropdown with USER's exact fix preserved */}
            <div className="relative inline-flex items-center w-[180px] sm:w-[210px]">
              <select
                className="
                  w-full
                  text-xl sm:text-2xl
                  font-bold
                  bg-transparent
                  border-none
                  p-0
                  pr-10 sm:pr-12
                  cursor-pointer
                  focus:ring-0
                  focus:outline-none
                  appearance-none
                  font-inter
                  truncate
                "
                value={selectedOption}
                onChange={handleSelectChange}
                style={{ color: primaryColor }}>
                <option value="Members List">Members List</option>
                <option value="Instructor List">Instructor List</option>
              </select>

              <ChevronDown
                size={18}
                strokeWidth={2.5}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  z-10
                  flex-shrink-0
                "
                style={{ color: primaryColor }}
              />
            </div>

            {/* Member / Instructor Count Pill */}
            <span
              className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold border whitespace-nowrap shadow-2xs"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: `${primaryColor}30`,
              }}>
              {selectedOption === "Members List"
                ? `${activeCount} members`
                : `${instructorCount} instructors`}
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-medium" style={{ color: "#66807D" }}>
            {selectedOption === "Members List"
              ? "Manage and view your HappyPrancer members"
              : "Manage instructors, assignments, and payouts"}
          </p>
        </div>

        {/* Action Button */}
        <div className={`flex items-center ${isMobile ? "pt-1" : ""}`}>
          {selectedOption === "Members List" && (
            <button
              onClick={handleAddNewUserClick}
              className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:opacity-95 cursor-pointer active:scale-95 whitespace-nowrap ${
                isMobile ? "w-full" : "flex-shrink-0"
              }`}
              style={{ backgroundColor: primaryColor }}>
              <UserPlus size={16} />
              Add New User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersHeroHeader;
