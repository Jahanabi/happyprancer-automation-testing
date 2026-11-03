import React, { useState, useCallback, useEffect, useContext } from "react";
import { useMediaQuery } from "../../../../utils/helpers";
import UsersListMobile from "./UsersListMobile";
import Context from "../../../../Context/Context";
import "./index.css";
import { Pagination } from "flowbite-react";
import { FaEye, FaGift } from "react-icons/fa";
import InstitutionContext from "../../../../Context/InstitutionContext";
import CreateUser from "./Components/CreateUpdateUser";
import { getCountryCodeFromName } from "../../../../utils/country-mapping.js";
import { toast } from "react-toastify";
import InstructorList from "./InstructorList";
import ConfirmDeleteModal from "./Components/ConfirmDeleteModal";
import RewardStatusModal from "./Components/RewardStatusModal";
import MembersHeroHeader from "./Components/MembersHeroHeader";
import Skeleton from "react-loading-skeleton";
import {
  getMemberGracePeriodInfo,
  formatDateString,
} from "../../../../utils/gracePeriod.js";
import {
  Search,
  X,
  UserPlus,
  Eye,
  Trash2,
  Users,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { deduplicateUserList } from "../../../../utils/userDeduplication.js";

const UsersList = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const Ctx = useContext(Context);
  const { loadingUserList } = useContext(Context);
  const [isUserAdd, setIsUserAdd] = useState(false);
  const [showUserAdd, setShowUserAdd] = useState(false);
  const { getUserList, userAttendance } = useContext(Context);
  const [userName, setuserName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Inactive");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [balance, setBalance] = useState("");
  const [productType, setProductType] = useState("Product Type");
  const [selectedProductAmount, setSelectedProductAmount] = useState("");
  const [createButton, setCreateButton] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [initialProductId, setInitialProductId] = useState("");
  const [cognitoId, setCognitoId] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("member");
  const [lastLogin, setLastLogin] = useState("");
  const [userStatus, setUserStatus] = useState("Active");
  const [instructorStatus, setInstructorStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Members List");
  const [amount, setAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [team, setTeam] = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedUserForReward, setSelectedUserForReward] = useState(null);
  const itemsPerPage = 5;

  // Track which reward users the admin has already viewed (persisted in localStorage)
  const CHECKED_REWARDS_KEY = "checkedRewardUsers";
  const [checkedRewardUsers, setCheckedRewardUsers] = useState(() => {
    try {
      const stored = localStorage.getItem(CHECKED_REWARDS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Helper: does this user have rewards the admin hasn't viewed yet?
  const hasUnseenRewards = useCallback(
    (user) =>
      hasRedeemedRewards(user) && !checkedRewardUsers.has(user.cognitoId),
    [checkedRewardUsers],
  );
  const isMobileScreen = useMediaQuery("(max-width: 600px)");
  const { instructorList, getInstructorList } = useContext(Context);

  const deduplicatedUserList = React.useMemo(() => {
    return deduplicateUserList(Ctx.userList || []);
  }, [Ctx.userList]);

  const deduplicatedInstructorList = React.useMemo(() => {
    return deduplicateUserList(instructorList || []);
  }, [instructorList]);

  const searchinstructorList = deduplicatedInstructorList.filter((user) => {
    return (
      (typeof user?.name === "string" &&
        user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user?.emailId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.phone?.includes(searchQuery)
    );
  });

  const filteredInstructorList = searchinstructorList.filter((instructor) => {
    if (instructorStatus === "All") {
      return true;
    }

    return (
      (instructor?.instructorStatus || "Active").toLowerCase() ===
      instructorStatus.toLowerCase()
    );
  });

  const [rewardClaim, setRewardClaim] = useState("all");
  // all | claimed | not_claimed
  const hasClaimedReward = (user) =>
    Array.isArray(user?.rewards) && user.rewards.length > 0;
  const filterUsersByRewardClaim = (users, rewardClaim) => {
    if (rewardClaim === "all") return users;

    if (rewardClaim === "claimed") {
      return users.filter(hasClaimedReward);
    }

    if (rewardClaim === "not_claimed") {
      return users.filter((u) => !hasClaimedReward(u));
    }

    return users;
  };

  // Helper function to check if user has redeemed rewards
  const hasRedeemedRewards = (user) => {
    let userRewards = user?.rewards || [];

    // If rewards is a string, try to parse it
    if (typeof userRewards === "string") {
      try {
        userRewards = JSON.parse(userRewards);
      } catch (e) {
        return false;
      }
    }

    // Check if rewards array exists and has items
    return Array.isArray(userRewards) && userRewards.length > 0;
  };

  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "active") return "Active";
    if (s === "inactive" || s === "paused" || s === "cancelled") {
      return "Inactive";
    }
    if (s === "trial") return "Trial";
    if (s === "graceperiod") return "GracePeriod";
    return "";
  };

  const filterUsersByStatus = (status) => {
    const rawList = deduplicatedUserList;
    if (status === "all") {
      return rawList;
    }
    if (status === "RewardClaim") {
      return rawList.filter(hasRedeemedRewards);
    }
    if (status === "GracePeriod") {
      return rawList.filter(
        (user) => getMemberGracePeriodInfo(user).isGracePeriod,
      );
    }
    if (status === "Inactive") {
      return rawList.filter(
        (user) => {
          const info = getMemberGracePeriodInfo(user);
          return normalizeStatus(user.status) === "Inactive" || info.isExpired;
        },
      );
    }
    if (status === "Active") {
      return rawList.filter(
        (user) => {
          const info = getMemberGracePeriodInfo(user);
          return normalizeStatus(user.status) === "Active" && !info.isGracePeriod;
        },
      );
    }
    return rawList.filter(
      (user) => normalizeStatus(user.status) === status,
    );
  };

  const availableStatuses = Array.from(
    new Set([
      "all",
      ...deduplicatedUserList
        .map((user) => normalizeStatus(user.status))
        .filter(Boolean),
      "GracePeriod",
      "RewardClaim",
    ]),
  );

  // Summary counts for header stat cards
  const allMembersList = deduplicatedUserList.filter((user) => !user.isArchived);
  const totalMembersCount = allMembersList.length;
  const activeMembersCount = allMembersList.filter((u) => {
    const info = getMemberGracePeriodInfo(u);
    return (
      normalizeStatus(u.status) === "Active" &&
      !info.isGracePeriod &&
      !info.isExpired
    );
  }).length;
  const gracePeriodCount = allMembersList.filter(
    (u) => getMemberGracePeriodInfo(u).isGracePeriod,
  ).length;
  const inactiveMembersCount = allMembersList.filter((u) => {
    const info = getMemberGracePeriodInfo(u);
    return normalizeStatus(u.status) === "Inactive" || info.isExpired;
  }).length;

  const statusFiltered = filterUsersByStatus(userStatus);
  const rewardFiltered = filterUsersByRewardClaim(statusFiltered, rewardClaim);

  // Search functionality
  const searchedUserList = (rewardFiltered || []).filter((user) => {
    return (
      (typeof user?.userName === "string" &&
        user.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user?.emailId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.phoneNumber?.includes(searchQuery)
    );
  });

  const activeUserList = searchedUserList.filter((user) => !user.isArchived);

  const getJoiningDateTimestamp = (joiningDate) => {
    const numeric = Number(joiningDate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric < 1e12 ? numeric * 1000 : numeric;
    }

    const parsed = Date.parse(joiningDate);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // Show unseen reward users first, then latest joined members
  activeUserList.sort((a, b) => {
    const aUnseen = hasUnseenRewards(a) ? 1 : 0;
    const bUnseen = hasUnseenRewards(b) ? 1 : 0;

    if (bUnseen !== aUnseen) {
      return bUnseen - aUnseen;
    }

    return (
      getJoiningDateTimestamp(b?.joiningDate) -
      getJoiningDateTimestamp(a?.joiningDate)
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredUserList = activeUserList.slice(startIndex, endIndex);

  // Delete functionality
  const handleDelete = async (institution, cognitoId) => {
    try {
      const response = await Ctx.deleteUser(institution, cognitoId);
      if (response) {
        toast.success("User deleted successfully!", { autoClose: 3000 });
        await getUserList(); // Refresh the user list
        return true;
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user. Please try again.", {
        autoClose: 3000,
      });
      return false;
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleDeleteUser = (institution, cognitoId) => {
    if (!institution || !cognitoId) {
      toast.error("Invalid user data for deletion");
      return;
    }
    setUserToDelete({ institution, cognitoId });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      const success = await handleDelete(
        userToDelete.institution,
        userToDelete.cognitoId,
      );
      if (success) {
        setShowDeleteModal(false);
        setUserToDelete(null);
      }
    }
  };

  const resolveEpochMs = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric < 1e12 ? numeric * 1000 : numeric;
  };

  const formatDate = (epochDate) => {
    return formatDateString(epochDate);
  };

  const formatJoiningDate = (joiningDate) => {
    return formatDateString(joiningDate);
  };

  // Sort functionality
  const requestSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };

  // for profile pic
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    return initials;
  };

  const getColor = () => {
    return InstitutionData.PrimaryColor || "#216B66";
  };

  // Handle reward modal open — does NOT mark as seen (highlight persists)
  const handleRewardIconClick = (user) => {
    setSelectedUserForReward(user);
    setShowRewardModal(true);
  };

  // Mark a user's rewards as seen (removes highlight). Called only when all rewards are delivered.
  const markRewardUserSeen = (cognitoId) => {
    setCheckedRewardUsers((prev) => {
      const next = new Set(prev);
      next.add(cognitoId);
      localStorage.setItem(CHECKED_REWARDS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  // Handle reward modal close
  const handleRewardModalClose = () => {
    setShowRewardModal(false);
    setSelectedUserForReward(null);
  };

  // Handle reward update callback
  const handleRewardUpdate = async () => {
    if (getUserList) {
      await getUserList();
    }
  };

  const handleAddNewUserClick = () => {
    setCreateButton(true);
    setuserName("");
    setLastName("");
    setName("");
    setCountryCode("91");
    setEmail("");
    setStatus("Inactive");
    setPhoneNumber("");
    setBalance("");
    setProductType("");
    setSelectedProductAmount("");
    setInitialProductId("");
    setShowUserAdd(true);
    setPaymentDate("");
    setAmount(0);
    setPaymentStatus("paid");
    setTeam("");
  };

  const handleViewUserClick = (user) => {
    setIsUserAdd(false);
    setIsModalOpen(true);
    setCognitoId(user.cognitoId);
    setName(user.userName);
    setLastLogin(user.lastLogin);
    setEmail(user.emailId);
    setTeam(user.team || "");

    const phoneDialCode =
      user.phoneNumber?.toString().match(/^\+(\d{1,4})/)?.[1] || null;
    const newCountryCode =
      getCountryCodeFromName(user.country) || phoneDialCode || "91";
    setCountryCode(newCountryCode);

    const cleanedPhone = (user.phoneNumber || "")
      .toString()
      .replace(`+${newCountryCode}`, "");
    setPhoneNumber(cleanedPhone);

    setStatus(user.status);
    setBalance(user.balance);
    setUserType(user.userType);
    setAmount(Number(user?.payment?.amount) || 0);
    setPaymentStatus(
      user?.payment?.paymentStatus || user?.paymentStatus || "paid",
    );
    setInitialProductId(
      user?.payment?.productId || user?.productId || "",
    );

    if (user?.payment?.paymentDate) {
      setPaymentDate(user.payment.paymentDate);
    } else {
      setPaymentDate("");
    }

    if (
      (user?.status === "Active" ||
        user?.status === "GracePeriod" ||
        user?.isGracePeriod) &&
      user?.userType === "member"
    ) {
      setProductType(
        user?.product ||
          user?.productType ||
          user?.payment?.productType ||
          "",
      );
      setSelectedProductAmount("");
      setPaymentDate(user?.payment?.paymentDate || "");
    } else {
      setProductType("");
      setSelectedProductAmount("");
      setInitialProductId("");
    }
  };

  const renderStatusBadge = (user) => {
    const graceInfo = getMemberGracePeriodInfo(user);
    if (graceInfo.isGracePeriod) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Grace Period
        </span>
      );
    }

    if (graceInfo.isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Inactive
        </span>
      );
    }

    const norm = normalizeStatus(user.status);
    if (norm === "Active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }

    if (norm === "Inactive") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Inactive
        </span>
      );
    }

    if (norm === "Trial") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          Trial
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {user.status || "Unknown"}
      </span>
    );
  };

  const mobileProps = {
    phoneNumber,
    name,
    email,
    status,
    cognitoId,
    balance,
    countryCode,
    productType,
    selectedProductAmount,
    createButton,
    showUserAdd,
    isModalOpen,
    setPaymentDate,
    paymentDate,
    setStatus,
    setCognitoId,
    setShowUserAdd,
    setPhoneNumber,
    setCreateButton,
    setIsModalOpen,
    setEmail,
    setCountryCode,
    setName,
    setBalance,
    setProductType,
    setSelectedProductAmount,
    userStatus,
    setUserStatus,
    instructorStatus,
    setInstructorStatus,
    setPaymentStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    filteredUserList,
    activeUserList,
    filteredInstructorList,
    handleDeleteUser,
    formatDate,
    availableStatuses,
    itemsPerPage,
    requestSort,
    handleSelectChange,
    selectedOption,
    rewardFiltered,
    setShowDeleteModal,
    showDeleteModal,
    confirmDelete,
    hasRedeemedRewards,
    hasUnseenRewards,
    handleRewardIconClick,
    handleRewardUpdate,
    showRewardModal,
    handleRewardModalClose,
    selectedUserForReward,
    setSelectedUserForReward,
    markRewardUserSeen,
    paymentStatus,
    initialProductId,
    setInitialProductId,
    rewardClaim,
    setRewardClaim,
    totalMembersCount,
    activeMembersCount,
    gracePeriodCount,
    inactiveMembersCount,
    handleAddNewUserClick,
  };

  const primaryColor = InstitutionData.PrimaryColor || "#216B66";
  const lightestPrimaryColor = InstitutionData.LightestPrimaryColor || "#CFE9DC";

  return (
    <>
      <style>{`
        .members-page::before,
        .members-hero-bg-texture {
          background-image: url("/images/dashboard-bg.png");
        }
      `}</style>
      <div
        className="members-page no-scrollbar"
        style={{
          "--members-primary": primaryColor,
          "--members-primary-light": lightestPrimaryColor,
        }}>
        {/* Floating glow orbs — background layer matching Upcoming Sessions */}
        <div className="members-bg-glow" aria-hidden="true">
          <span className="members-glow-orb members-glow-orb--one" />
          <span className="members-glow-orb members-glow-orb--two" />
          <span className="members-glow-orb members-glow-orb--three" />
        </div>

        <div className="members-shell">
          {isMobileScreen ? (
            <UsersListMobile {...mobileProps} />
          ) : (
            <div className="members-card-entrance flex flex-col gap-5 w-full">
              {/* Header Card — Hero Style matching Upcoming Classes */}
              <MembersHeroHeader
                selectedOption={selectedOption}
                handleSelectChange={handleSelectChange}
                primaryColor={primaryColor}
                activeCount={activeUserList.length}
                instructorCount={filteredInstructorList.length}
                handleAddNewUserClick={handleAddNewUserClick}
              />

              {/* Stat Chips / Summary Cards */}
              {selectedOption === "Members List" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      label: "Members",
                      value: totalMembersCount,
                      subtext: "Total enrolled",
                      statusKey: "all",
                      dotColor: "bg-teal-600",
                      activeBorder: "border-[#216B66] ring-2 ring-[#216B66]/20 bg-teal-50/50",
                    },
                    {
                      label: "Active",
                      value: activeMembersCount,
                      subtext: "In good standing",
                      statusKey: "Active",
                      dotColor: "bg-emerald-500",
                      activeBorder: "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/50",
                    },
                    {
                      label: "Grace Period",
                      value: gracePeriodCount,
                      subtext: "Renewal pending",
                      statusKey: "GracePeriod",
                      dotColor: "bg-amber-500 animate-pulse",
                      activeBorder: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50",
                    },
                    {
                      label: "Inactive",
                      value: inactiveMembersCount,
                      subtext: "Expired / paused",
                      statusKey: "Inactive",
                      dotColor: "bg-rose-400",
                      activeBorder: "border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/50",
                    },
                  ].map((card) => {
                    const isSelected = userStatus === card.statusKey;
                    return (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => {
                          setUserStatus(card.statusKey);
                          setCurrentPage(1);
                        }}
                        className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm ${
                          isSelected
                            ? card.activeBorder
                            : "bg-white/90 backdrop-blur-md border-[#E3ECE9] hover:border-gray-300 hover:bg-white"
                        }`}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {card.label}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${card.dotColor}`} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-inter">
                          {card.value}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {card.subtext}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search & Filter Section */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#E3ECE9] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search members by name, email or phone no."
                    value={searchQuery}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setSearchQuery(e.target.value);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-primaryColor rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-primaryColor/20 text-gray-800"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setCurrentPage(1);
                        setSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
                      title="Clear search">
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {selectedOption === "Members List" ? (
                    <>
                      {/* User Status Filter */}
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="userStatusFilter"
                          className="text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          User Status:
                        </label>
                        <div className="relative inline-flex items-center min-w-[140px]">
                          <select
                            id="userStatusFilter"
                            value={userStatus}
                            onChange={(e) => {
                              setUserStatus(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="appearance-none w-full py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white text-gray-700 outline-none focus:ring-2 focus:ring-primaryColor/20 focus:border-primaryColor transition-all cursor-pointer">
                            {availableStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status === "all" ? "All Statuses" : status}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                        </div>
                      </div>

                      {/* Reward Claim Filter */}
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="rewardFilter"
                          className="text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Rewards:
                        </label>
                        <div className="relative inline-flex items-center min-w-[135px]">
                          <select
                            id="rewardFilter"
                            value={rewardClaim}
                            onChange={(e) => {
                              setRewardClaim(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="appearance-none w-full py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white text-gray-700 outline-none focus:ring-2 focus:ring-primaryColor/20 focus:border-primaryColor transition-all cursor-pointer">
                            <option value="all">All Rewards</option>
                            <option value="claimed">Claimed</option>
                            <option value="not_claimed">Not Claimed</option>
                          </select>
                          <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Instructor Status Filter */
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="instructorStatusFilter"
                        className="text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Status:
                      </label>
                      <div className="relative inline-flex items-center min-w-[140px]">
                        <select
                          id="instructorStatusFilter"
                          value={instructorStatus}
                          onChange={(e) => {
                            setInstructorStatus(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="appearance-none w-full py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white text-gray-700 outline-none focus:ring-2 focus:ring-primaryColor/20 focus:border-primaryColor transition-all cursor-pointer">
                          <option value="All">All Instructors</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Reset Filters button if any filter is active */}
                  {(searchQuery ||
                    userStatus !== "Active" ||
                    rewardClaim !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setUserStatus("Active");
                        setRewardClaim("all");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                      <RotateCcw size={13} />
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Members Table or Instructor List */}
              {selectedOption === "Members List" ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E3ECE9] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto members-table-scrollbar">
                    <table className="w-full text-left text-sm text-gray-700 border-collapse">
                      <thead
                        className="text-xs uppercase tracking-wider text-white select-none"
                        style={{ backgroundColor: primaryColor }}>
                        <tr>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center w-12">
                            #
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-left">
                            Member
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center">
                            Phone Number
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center">
                            Joining Date
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center">
                            Renew Date
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center">
                            Classes Attended
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center">
                            Balance
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center">
                            Status
                          </th>
                          <th
                            scope="col"
                            className="py-4 px-4 font-semibold text-center w-28">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingUserList ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-100 animate-pulse bg-white">
                              <td className="py-4 px-4 text-center">
                                <Skeleton width={16} height={16} />
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <Skeleton circle height={38} width={38} />
                                  <div className="space-y-1.5">
                                    <Skeleton height={14} width={120} />
                                    <Skeleton height={11} width={150} />
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Skeleton height={14} width={100} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Skeleton height={14} width={85} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Skeleton height={14} width={85} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Skeleton
                                  height={20}
                                  width={40}
                                  borderRadius={12}
                                />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Skeleton height={14} width={60} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Skeleton
                                  height={22}
                                  width={70}
                                  borderRadius={12}
                                />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Skeleton circle height={28} width={28} />
                                  <Skeleton circle height={28} width={28} />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : filteredUserList.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <Users size={24} />
                                </div>
                                <p className="text-base font-semibold text-gray-700">
                                  No members found
                                </p>
                                <p className="text-xs text-gray-500 max-w-sm">
                                  {searchQuery || userStatus !== "Active"
                                    ? "No members match your current filter or search criteria."
                                    : "There are currently no members enrolled."}
                                </p>
                                {(searchQuery ||
                                  userStatus !== "Active" ||
                                  rewardClaim !== "all") && (
                                  <button
                                    onClick={() => {
                                      setSearchQuery("");
                                      setUserStatus("all");
                                      setRewardClaim("all");
                                      setCurrentPage(1);
                                    }}
                                    className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors">
                                    Reset Filters
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredUserList.map((user, idx) => {
                            if (!user.isArchived) {
                              const graceInfo = getMemberGracePeriodInfo(user);
                              const isUnseen = hasUnseenRewards(user);
                              return (
                                <tr
                                  key={user.cognitoId || idx}
                                  className={`members-table-row even:bg-gray-50/40 ${
                                    isUnseen ? "cursor-pointer" : ""
                                  }`}
                                  style={
                                    isUnseen
                                      ? {
                                          background:
                                            "linear-gradient(90deg, #fef3c7 0%, #fffbeb 100%)",
                                          borderLeft: "4px solid #f59e0b",
                                        }
                                      : graceInfo.isGracePeriod
                                      ? {
                                          background:
                                            "linear-gradient(90deg, #fffbe6 0%, #ffffff 100%)",
                                          borderLeft: "4px solid #d97706",
                                        }
                                      : {}
                                  }
                                  onClick={() =>
                                    isUnseen && handleRewardIconClick(user)
                                  }>
                                  {/* Row index */}
                                  <td className="py-3.5 px-4 text-center text-xs text-gray-400 font-medium">
                                    {startIndex + idx + 1}
                                  </td>

                                  {/* Member (Avatar + Name) */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="relative flex-shrink-0">
                                        {user.imgUrl ? (
                                          <img
                                            src={user.imgUrl}
                                            alt={user.userName}
                                            className="h-10 w-10 rounded-full object-cover shadow-xs border border-gray-100"
                                          />
                                        ) : (
                                          <div
                                            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                                            style={{
                                              backgroundColor: getColor(
                                                user.userName,
                                              ),
                                            }}>
                                            {getInitials(user.userName)}
                                          </div>
                                        )}
                                        {hasRedeemedRewards(user) && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRewardIconClick(user);
                                            }}
                                            className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full p-1.5 shadow-md hover:bg-pink-600 transition-colors animate-pulse z-10"
                                            title="View Reward Status">
                                            <FaGift size={11} />
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-semibold text-gray-900 text-sm truncate">
                                            {user.userName}
                                          </span>
                                          {isUnseen && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                              <FaGift
                                                size={10}
                                                className="text-amber-600"
                                              />
                                              New Reward
                                            </span>
                                          )}
                                        </div>
                                        {user.emailId && (
                                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                            {user.emailId}
                                          </span>
                                        )}
                                        {graceInfo.isGracePeriod && (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-0.5">
                                            <AlertTriangle size={12} />
                                            Grace Period ({graceInfo.remainingDays}{" "}
                                            {graceInfo.remainingDays === 1
                                              ? "day"
                                              : "days"}{" "}
                                            left)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Phone Number */}
                                  <td className="py-3.5 px-4 text-center font-medium text-gray-700 whitespace-nowrap">
                                    {user.phoneNumber || "—"}
                                  </td>

                                  {/* Joining Date */}
                                  <td className="py-3.5 px-4 text-center font-medium text-gray-600 whitespace-nowrap">
                                    {formatJoiningDate(user.joiningDate)}
                                  </td>

                                  {/* Renew Date */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <div className="font-medium text-gray-700">
                                      {formatDate(user.renewDate)}
                                    </div>
                                    {graceInfo.isGracePeriod && (
                                      <div className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center justify-center gap-1.5">
                                        <span>
                                          Grace Ends:{" "}
                                          {graceInfo.formattedGraceEndDate}
                                        </span>
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                          {graceInfo.progressText}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Classes Attended */}
                                  <td className="py-3.5 px-4 text-center">
                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                      {userAttendance[user.cognitoId] || 0}
                                    </span>
                                  </td>

                                  {/* Balance */}
                                  <td
                                    className={`py-3.5 px-4 text-center font-semibold ${
                                      parseFloat(user.balance) < 0
                                        ? "text-rose-600"
                                        : "text-gray-700"
                                    }`}>
                                    {user.balance || 0}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3.5 px-4 text-center">
                                    {renderStatusBadge(user)}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors duration-150 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewUserClick(user);
                                        }}
                                        title="View / Edit Member">
                                        <Eye size={17} />
                                      </button>
                                      <button
                                        className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteUser(
                                            user.institution,
                                            user.cognitoId,
                                          );
                                        }}
                                        title="Delete Member">
                                        <Trash2 size={17} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return null;
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50/70 border-t border-[#E3ECE9]">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      <span className="font-semibold text-gray-800">
                        {activeUserList.length === 0 ? 0 : startIndex + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-gray-800">
                        {Math.min(endIndex, activeUserList.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-800">
                        {activeUserList.length}
                      </span>{" "}
                      members
                    </div>
                    <div className="flex overflow-x-auto justify-center sm:justify-end">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={Math.max(
                          1,
                          Math.ceil(activeUserList.length / itemsPerPage),
                        )}
                        onPageChange={(page) => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        showIcons
                        layout="pagination"
                        className="text-gray-600 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Instructor List */
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E3ECE9] shadow-sm p-4 overflow-hidden">
                  <InstructorList
                    instructorList={filteredInstructorList}
                    getInstructorList={getInstructorList}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Member Modal Drawer */}
      <div className={showUserAdd || isModalOpen ? "showBox open" : "hidden"}>
        <CreateUser
          productType={productType}
          setProductType={setProductType}
          selectedProductAmount={selectedProductAmount}
          setSelectedProductAmount={setSelectedProductAmount}
          createButton={createButton}
          setCreateButton={setCreateButton}
          phoneNumber={phoneNumber}
          cognitoId={cognitoId}
          balance={balance}
          status={status}
          lastLogin={lastLogin}
          email={email}
          countryCode={countryCode}
          name={name}
          userType={userType}
          setUserType={setUserType}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          setPhoneNumber={setPhoneNumber}
          setBalance={setBalance}
          setStatus={setStatus}
          setEmail={setEmail}
          setCountryCode={setCountryCode}
          setName={setName}
          setShowUserAdd={setShowUserAdd}
          paymentDate={paymentDate}
          setLastLogin={setLastLogin}
          setPaymentDate={setPaymentDate}
          setIsModalOpen={setIsModalOpen}
          amount={amount}
          initialPaymentStatus={paymentStatus}
          initialProductId={initialProductId}
          team={team}
        />
      </div>

      <ConfirmDeleteModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {selectedUserForReward && (
        <RewardStatusModal
          showModal={showRewardModal}
          setShowModal={handleRewardModalClose}
          user={selectedUserForReward}
          onUpdate={handleRewardUpdate}
          onMarkSeen={() => markRewardUserSeen(selectedUserForReward.cognitoId)}
        />
      )}
    </>
  );
};

export default UsersList;
