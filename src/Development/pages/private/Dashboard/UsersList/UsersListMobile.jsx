import React, { useState, useContext } from "react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import CreateUser from "./Components/CreateUpdateUser";
import ConfirmDeleteModal from "./Components/ConfirmDeleteModal";
import RewardStatusModal from "./Components/RewardStatusModal";
import InstructorListMobile from "./InstructorListMobile";
import MembersHeroHeader from "./Components/MembersHeroHeader";
import Skeleton from "react-loading-skeleton";
import { FaGift } from "react-icons/fa";
import { Search, X, UserPlus, Eye, Trash2, Users, AlertTriangle, RotateCcw, ChevronDown } from "lucide-react";
import { getCountryCodeFromName } from "../../../../utils/country-mapping";
import { getMemberGracePeriodInfo } from "../../../../utils/gracePeriod.js";

const UsersListMobile = ({
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
  paymentStatus,
  setPaymentStatus,
  initialProductId,
  setInitialProductId,
  userStatus,
  setUserStatus,
  instructorStatus,
  setInstructorStatus,
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
  selectedOption,
  handleSelectChange,
  showDeleteModal,
  setShowDeleteModal,
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
  rewardClaim,
  setRewardClaim,
  totalMembersCount,
  activeMembersCount,
  gracePeriodCount,
  inactiveMembersCount,
  handleAddNewUserClick,
}) => {
  const Ctx = useContext(Context);
  const { loadingUserList, userAttendance } = useContext(Context);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const [amount, setAmount] = useState(0);
  const itemsPerPage = 4;

  const primaryColor = InstitutionData.PrimaryColor || "#216B66";

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    return initials;
  };

  const getColor = (name) => {
    return primaryColor;
  };

  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "active") return "Active";
    if (s === "inactive" || s === "paused" || s === "cancelled") return "Inactive";
    if (s === "trial") return "Trial";
    if (s === "graceperiod") return "GracePeriod";
    return "";
  };

  const renderStatusBadge = (user) => {
    const graceInfo = getMemberGracePeriodInfo(user);
    if (graceInfo.isGracePeriod) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Grace Period
        </span>
      );
    }

    if (graceInfo.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Inactive
        </span>
      );
    }

    const norm = normalizeStatus(user.status);
    if (norm === "Active") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }

    if (norm === "Inactive") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Inactive
        </span>
      );
    }

    if (norm === "Trial") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          Trial
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {user.status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full gap-4 max-w-full">
      {/* Header Card — Hero Style matching Upcoming Classes */}
      <MembersHeroHeader
        selectedOption={selectedOption}
        handleSelectChange={handleSelectChange}
        primaryColor={primaryColor}
        activeCount={activeUserList.length}
        instructorCount={filteredInstructorList.length}
        handleAddNewUserClick={
          handleAddNewUserClick ||
          (() => {
            setCreateButton(true);
            setName("");
            setCountryCode("+91");
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
          })
        }
        isMobile={true}
      />

      {/* Mobile Stat Chips */}
      {selectedOption === "Members List" && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            {
              label: "Members",
              value: totalMembersCount,
              statusKey: "all",
              dotColor: "bg-teal-600",
              activeBorder: "border-[#216B66] ring-1 ring-[#216B66]/30 bg-teal-50/50",
            },
            {
              label: "Active",
              value: activeMembersCount,
              statusKey: "Active",
              dotColor: "bg-emerald-500",
              activeBorder: "border-emerald-600 ring-1 ring-emerald-600/30 bg-emerald-50/50",
            },
            {
              label: "Grace Period",
              value: gracePeriodCount,
              statusKey: "GracePeriod",
              dotColor: "bg-amber-500 animate-pulse",
              activeBorder: "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/50",
            },
            {
              label: "Inactive",
              value: inactiveMembersCount,
              statusKey: "Inactive",
              dotColor: "bg-rose-400",
              activeBorder: "border-rose-400 ring-1 ring-rose-400/30 bg-rose-50/50",
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
                className={`text-left p-2.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-xs ${
                  isSelected
                    ? card.activeBorder
                    : "bg-white/90 backdrop-blur-md border-[#E3ECE9] hover:bg-white"
                }`}>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 truncate">
                    {card.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${card.dotColor}`} />
                </div>
                <div className="text-xl font-bold text-gray-900 font-inter">
                  {card.value}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Filter Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-[#E3ECE9] shadow-sm flex flex-col gap-3">
        {/* Search input */}
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder={
              selectedOption === "Members List"
                ? "Search members by name, email or phone"
                : "Search instructors by name or email"
            }
            value={searchQuery}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchQuery(e.target.value);
            }}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-primaryColor rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primaryColor/20 text-gray-800"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setCurrentPage(1);
                setSearchQuery("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Stacked filter rows with clear separation & proper chevrons */}
        {selectedOption === "Members List" ? (
          <div className="flex flex-col gap-2.5 pt-1 border-t border-gray-100">
            {/* User Status Filter */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                User Status
              </span>
              <div className="relative inline-flex items-center flex-1 max-w-[210px]">
                <select
                  value={userStatus}
                  onChange={(e) => {
                    setUserStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs font-medium outline-none focus:ring-1 focus:ring-primaryColor cursor-pointer">
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* Rewards Filter */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                Rewards
              </span>
              <div className="relative inline-flex items-center flex-1 max-w-[210px]">
                <select
                  value={rewardClaim || "all"}
                  onChange={(e) => {
                    setRewardClaim?.(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs font-medium outline-none focus:ring-1 focus:ring-primaryColor cursor-pointer">
                  <option value="all">All Rewards</option>
                  <option value="claimed">Claimed</option>
                  <option value="not_claimed">Not Claimed</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* Reset Filters button if any filter is active */}
            {(searchQuery || userStatus !== "Active" || (rewardClaim && rewardClaim !== "all")) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setUserStatus("Active");
                    setRewardClaim?.("all");
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                  <RotateCcw size={12} />
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Instructor Status Filter */
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              Status
            </span>
            <div className="relative inline-flex items-center flex-1 max-w-[210px]">
              <select
                value={instructorStatus}
                onChange={(e) => {
                  setInstructorStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none w-full py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs font-medium outline-none focus:ring-1 focus:ring-primaryColor cursor-pointer">
                <option value="All">All Instructors</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 underline px-1 py-1">
                <RotateCcw size={11} />
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {selectedOption === "Members List" ? (
        <>
          {/* User Cards List */}
          <div className="space-y-3">
            {loadingUserList ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-full bg-white rounded-2xl p-4 border border-[#E3ECE9] shadow-xs animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-11 w-11 rounded-full bg-gray-200"></div>
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-40 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredUserList.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E3ECE9] shadow-xs flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Users size={20} />
                </div>
                <p className="text-sm font-semibold text-gray-700">No members found</p>
                <p className="text-xs text-gray-500">
                  Try adjusting your search or status filter.
                </p>
              </div>
            ) : (
              filteredUserList.map((user) => {
                if (!user.isArchived) {
                  const graceInfo = getMemberGracePeriodInfo(user);
                  const isUnseen = hasUnseenRewards && hasUnseenRewards(user);
                  return (
                    <div
                      key={user.cognitoId}
                      className={`w-full bg-white rounded-2xl p-4 border shadow-xs transition-all duration-150 ${
                        isUnseen
                          ? "border-amber-400 cursor-pointer"
                          : graceInfo.isGracePeriod
                          ? "border-amber-400"
                          : "border-[#E3ECE9]"
                      }`}
                      style={
                        isUnseen
                          ? {
                              background:
                                "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                              borderLeft: "4px solid #f59e0b",
                            }
                          : graceInfo.isGracePeriod
                          ? {
                              background:
                                "linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)",
                              borderLeft: "4px solid #d97706",
                            }
                          : {}
                      }
                      onClick={() =>
                        isUnseen &&
                        handleRewardIconClick &&
                        handleRewardIconClick(user)
                      }>
                      {/* Top Row: Avatar + Name + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            {user.imgUrl ? (
                              <img
                                src={user.imgUrl}
                                alt={user.userName}
                                className="h-11 w-11 rounded-full object-cover border border-gray-100"
                              />
                            ) : (
                              <div
                                className="h-11 w-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                                style={{
                                  backgroundColor: getColor(user.userName),
                                }}>
                                {getInitials(user.userName)}
                              </div>
                            )}
                            {hasRedeemedRewards && hasRedeemedRewards(user) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRewardIconClick &&
                                    handleRewardIconClick(user);
                                }}
                                className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full p-1.5 shadow-md hover:bg-pink-600 transition-colors animate-pulse z-10"
                                title="View Reward Status">
                                <FaGift size={11} />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-gray-900 truncate">
                                {user.userName}
                              </h4>
                              {isUnseen && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                  <FaGift size={9} />
                                  Reward
                                </span>
                              )}
                            </div>
                            {user.emailId && (
                              <p className="text-xs text-gray-500 truncate">
                                {user.emailId}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {renderStatusBadge(user)}
                        </div>
                      </div>

                      {/* Grace period warning message */}
                      {graceInfo.isGracePeriod && (
                        <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                            <span className="truncate">
                              Grace Period: {graceInfo.remainingDays}{" "}
                              {graceInfo.remainingDays === 1 ? "day" : "days"} left (Ends: {graceInfo.formattedGraceEndDate})
                            </span>
                          </div>
                          <span className="font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap flex-shrink-0">
                            {graceInfo.progressText}
                          </span>
                        </div>
                      )}

                      {/* Info Grid */}
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Phone</span>
                          <span className="font-medium text-gray-800">{user.phoneNumber || "—"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Attended</span>
                          <span className="font-medium text-gray-800">{userAttendance[user.cognitoId] || 0} classes</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Joining Date</span>
                          <span className="font-medium text-gray-800">{formatDate(user.joiningDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Renew Date</span>
                          <span className="font-medium text-gray-800">{formatDate(user.renewDate)}</span>
                        </div>
                      </div>

                      {/* Bottom actions row */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-gray-400 text-[10px] uppercase font-semibold mr-1">Balance:</span>
                          <span className={`font-semibold ${parseFloat(user.balance) < 0 ? "text-rose-600" : "text-gray-800"}`}>
                            {user.balance || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const phoneDialCode = user.phoneNumber
                                ?.toString()
                                .match(/^\+(\d{1,4})/)?.[1];
                              const resolvedCountryCode =
                                getCountryCodeFromName(user.country) ||
                                phoneDialCode ||
                                "91";
                              const cleanedPhone = (user.phoneNumber || "")
                                .toString()
                                .replace(`+${resolvedCountryCode}`, "");

                              setIsModalOpen(true);
                              setCognitoId(user.cognitoId);
                              setName(user.userName);
                              setEmail(user.emailId);
                              setCountryCode(resolvedCountryCode);
                              setPhoneNumber(cleanedPhone);
                              setStatus(user.status);
                              setBalance(user.balance);
                              setAmount(Number(user?.payment?.amount) || 0);
                              setProductType(
                                user?.product ||
                                  user?.productType ||
                                  user?.payment?.productType ||
                                  "",
                              );
                              setSelectedProductAmount("");
                              setInitialProductId(
                                user?.payment?.productId || user?.productId || "",
                              );
                              setPaymentDate(user?.payment?.paymentDate || "");
                              setPaymentStatus(
                                user?.payment?.paymentStatus ||
                                  user?.paymentStatus ||
                                  "paid",
                              );
                            }}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View / Edit Member">
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.institution, user.cognitoId);
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Member">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>

          {/* Pagination */}
          {activeUserList.length > itemsPerPage && (
            <div className="mt-2 flex justify-center">
              <PaginationComponent
                showIcons={true}
                data={activeUserList}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
                hideResultsText={true}
              />
            </div>
          )}
        </>
      ) : (
        /* Instructor List Mobile View */
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-[#E3ECE9] shadow-sm">
          <InstructorListMobile instructorList={filteredInstructorList} />
        </div>
      )}

      {/* Create/Edit User Modal - Only for Members List */}
      {selectedOption === "Members List" && (showUserAdd || isModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            email={email}
            countryCode={countryCode}
            name={name}
            setPhoneNumber={setPhoneNumber}
            setBalance={setBalance}
            setStatus={setStatus}
            setEmail={setEmail}
            setCountryCode={setCountryCode}
            setName={setName}
            setShowUserAdd={setShowUserAdd}
            paymentDate={paymentDate}
            setPaymentDate={setPaymentDate}
            setIsModalOpen={setIsModalOpen}
            amount={amount}
            initialPaymentStatus={paymentStatus}
            initialProductId={initialProductId}
          />
        </div>
      )}

      {/* Delete Confirmation Modal - Only for Members List */}
      {selectedOption === "Members List" && (
        <ConfirmDeleteModal
          showModal={showDeleteModal}
          setShowModal={setShowDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Reward Status Modal - Only for Members List */}
      {selectedOption === "Members List" && selectedUserForReward && (
        <RewardStatusModal
          showModal={showRewardModal}
          setShowModal={handleRewardModalClose}
          user={selectedUserForReward}
          onUpdate={handleRewardUpdate}
          onMarkSeen={() => markRewardUserSeen(selectedUserForReward.cognitoId)}
        />
      )}
    </div>
  );
};

export default UsersListMobile;
