import React, { useState, useContext, useEffect } from "react";
import { BiSolidHome } from "react-icons/bi";
import { FaShareAlt } from "react-icons/fa";
import { FaGift, FaDumbbell } from "react-icons/fa6";
import { FaMusic, FaShoppingBag } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { useMediaQuery, calculateUserPoints } from "../../../../utils/helpers";
import HomePage from "./Components/HomePage";
import ReferPage from "./Components/ReferPage";
import RewardsPage from "./Components/RewardsPage";
import ProfilePage from "./Components/ProfilePage";
import PointsHistoryPage from "./Components/PointsHistoryPage";
import ProfileDashboard from "./Components/DesktopProfile";
import ReferAndEarnDashboard from "./Components/DesktopRefer";
import RewardsDashboard from "./Components/DesktopReward";
import Context from "../../../../Context/Context";

function Rewards() {
  const { userData, userList, getUserList, getUserProfile } = useContext(Context);
  const [page, setPage] = useState("home");
  const [dpage, setDPage] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const isMobileScreen = useMediaQuery("(max-width: 800px)");
  useEffect(() => {
    if (InstitutionData?.InstitutionId && getUserProfile) {
      getUserProfile(InstitutionData.InstitutionId);
    }
    if (!userList || userList.length === 0) {
      getUserList?.();
    }
  }, [InstitutionData?.InstitutionId]);

  const getCurrentUserReferralCode = () => {
    if (userData?.userType === "instructor") {
      return userData?.referral_code;
    } else if (userData?.userType === "admin") {
      return userData?.referral_code;
    } else {
      return userData?.referral_code || "";
    }
  };

  const referralsCount = userData?.referral_count ?? 0;
  // console.log("referralsCount:", referralsCount);
  const claimedRewardIds = new Set(userData?.rewards?.map((r) => r.rewardId));

  const userPoints =
    Number(userData?.referral_points ?? calculateUserPoints(referralsCount)) +
    Number(userData?.zPoints ?? 0) +
    Number(userData?.rating_points ?? 0);

  const currentPoints = userPoints || 0;
  const rewards = [
    {
      id: 1,
      title: "Yoga T-Shirt (Unisex)",
      points: 500,
      images: [
        "/images/happyprancer.jpg",
        "/images/happyprancer1.jpg",
        "/images/happyprancer2.jpg",
      ],
      unlocked: referralsCount >= 5 && currentPoints >= 500,
      type: "product",
    },
    {
      id: 2,
      title: "Free BWORKZ Membership - 1 Year",
      points: 10000,
      images: ["/images/bworkzmembership.png"],
      unlocked: referralsCount >= 5 && currentPoints >= 10000,
      type: "product",
    },
  ];
  const enrichedRewards = rewards.map((reward) => {
    const isEligible = referralsCount >= 5 && currentPoints >= reward.points;

    const isClaimed = claimedRewardIds.has(reward.id);

    return {
      ...reward,
      isEligible, // user can claim
      isClaimed, // already redeemed
      canClaim: isEligible && !isClaimed,
    };
  });

  const rewardPoints = enrichedRewards.map((r) => r.points).sort((a, b) => a - b);

  let nextRewardPoints = rewardPoints.find(
    (points) => (referralsCount || 0) * 100 < points
  );

  if (!nextRewardPoints && rewardPoints.length > 0) {
    nextRewardPoints = rewardPoints[rewardPoints.length - 1] + 1000;
  } else if (!nextRewardPoints) {
    nextRewardPoints = 1000;
  }

  const referralsForReward = Math.ceil((nextRewardPoints || 1000) / 100);

  // const referralsForReward = Math.ceil(
  //   (Math.min(...enrichedRewards.map((r) => r.points)) - userPoints) / 100
  // );
  // const referralsForReward = 5;
  const nextRewardAt = referralsForReward;

  const enrichedUser = {
    ...(userData || {}),
    referrals: referralsCount,
    totalPoints: userPoints || 0,
    hpPoints: userPoints || 0,
    referralCode: getCurrentUserReferralCode(),
  };

  const [redeemableRewardsCount, setRedeemableRewardsCount] = useState(0);

  useEffect(() => {
    if (enrichedRewards && Array.isArray(enrichedRewards) && referralsCount >= 5) {
      const count = enrichedRewards.filter(
        (reward) => currentPoints >= reward.points
      ).length;
      setRedeemableRewardsCount(count);
    }
  }, [currentPoints, referralsCount, enrichedRewards]);

  console.log("user:", enrichedUser);

  return (
    <>
      <div className="h-[calc(100vh-8rem)] no-scrollbar relative flex flex-col md:flex-row">
        {/* Main content */}
        {isMobileScreen ? (
          <div className="flex-1 mt-0 md:mt-[64px] transition-all duration-300">
            {page === "home" && (
              <HomePage
                user={enrichedUser}
                setPage={setPage}
                referralsForReward={referralsForReward}
                InstitutionData={InstitutionData}
                redeemableRewardsCount={redeemableRewardsCount}
              />
            )}
            {page === "refer" && (
              <ReferPage
                user={enrichedUser}
                totalReferrals={referralsCount}
                nextRewardTarget={nextRewardAt}
                InstitutionData={InstitutionData}
              />
            )}
            {page === "rewards" && (
              <RewardsPage
                user={enrichedUser}
                InstitutionData={InstitutionData}
                rewards={enrichedRewards}
              />
            )}
            {/* {page === "profile" && (
              <ProfilePage
                user={enrichedUser}
                InstitutionData={InstitutionData}
                setPage={setPage}
              />
            )} */}
            {page === "pointsHistory" && (
              <PointsHistoryPage
                user={enrichedUser}
                InstitutionData={InstitutionData}
                setPage={setPage}
              />
            )}
          </div>
        ) : (
          // Desktop unified layout
          <>
            <div className="flex-1 mt-0 no-scrollbar transition-all duration-300">
              {dpage === "profile" && (
                <ProfileDashboard
                  setPage={setDPage}
                  user={enrichedUser}
                  referralsForReward={referralsForReward}
                  InstitutionData={InstitutionData}
                  redeemableRewardsCount={redeemableRewardsCount}
                />
              )}
              {dpage === "refer" && (
                <ReferAndEarnDashboard
                  setPage={setDPage}
                  user={enrichedUser}
                  totalReferrals={referralsCount}
                  rewards={enrichedRewards}
                  nextRewardTarget={nextRewardAt}
                  InstitutionData={InstitutionData}
                />
              )}
              {dpage === "rewards" && (
                <RewardsDashboard
                  setPage={setDPage}
                  user={enrichedUser}
                  rewards={enrichedRewards}
                  InstitutionData={InstitutionData}
                />
              )}
            </div>
          </>
        )}

        <div className="">
          {page !== "pointsHistory" && isMobileScreen && (
            <BottomTabs
              setPage={setPage}
              InstitutionData={InstitutionData}
              activePage={page}
            />
          )}
        </div>
      </div>
    </>
  );
}

function BottomTabs({ setPage, InstitutionData, activePage }) {
  const tabs = [
    { label: "Home", icon: BiSolidHome, key: "home" },
    { label: "Refer", icon: FaShareAlt, key: "refer" },
    { label: "Rewards", icon: FaGift, key: "rewards" },
    // { label: "Profile", icon: FaUser, key: "profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 shadow-sm z-50">
      {tabs.map(({ label, icon: Icon, key }) => (
        <button
          key={key}
          onClick={() => setPage(key)}
          className={`flex flex-col items-center justify-center transition-all ${
            activePage === key ? InstitutionData.PrimaryColor : "text-gray-400"
          }`}
        >
          <Icon
            size={22}
            strokeWidth={activePage === key ? 2.5 : 2}
            className="mb-0.5"
          />
          <span
            className={`text-xs font-medium ${
              activePage === key
                ? InstitutionData.PrimaryColor
                : "text-gray-400"
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

export default Rewards;

// wobaje9366@gyknife.com
