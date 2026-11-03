import { FaBell, FaShareAlt, FaYoutube, FaHistory } from "react-icons/fa";
import { MdDiamond } from "react-icons/md";
import { FaUsers, FaGift } from "react-icons/fa6";

export default function HomePage({
  user,
  referralsForReward,
  InstitutionData,
  setPage,
  redeemableRewardsCount,
}) {
  const referrals = user?.referrals || 0;
  const remainingReferrals = Math.max(0, referralsForReward - referrals);
  const progressPercent =
    referralsForReward > 0
      ? Math.min(100, (referrals / referralsForReward) * 100)
      : 0;
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    return initials;
  };
  const getColor = () => {
    return InstitutionData.PrimaryColor;
  };

  return (
    <div className="relative min-h-screen font-poppins bg-gray-50">
      {/* 🌿 Gradient Header */}
      <div
        style={{
          backgroundColor: InstitutionData.PrimaryColor,
        }}
        className=" h-72 rounded-b-[25px] px-4 pt-8 text-white relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 px-5">
            {user.imgUrl ? (
              <img
                src={user.imgUrl}
                alt={user.userName}
                className="h-14 w-14 rounded-full object-cover text-gray-700 font-semibold"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-md font-medium"
                style={{
                  backgroundColor: "#1b7571",
                }}
              >
                {getInitials(user.userName)}
              </div>
            )}
            <div>
              <p className="font-semibold font-poppins text-white text-lg">
                Hello, {user.userName || "User"}
              </p>
              <p className="text-sm font-poppins text-gray-300">
                Ready to earn more points?
              </p>
            </div>
          </div>
          {/* <FaBell size={20} className="text-white opacity-90" /> */}
        </div>

        {/* Frosted Glass Total HP Points Card */}
        <div className="absolute left-1/2 mb-1 -translate-x-1/2 top-[105px] w-[90%] sm:w-[95%] bg-white/15 backdrop-blur-md rounded-3xl py-4 px-14 flex justify-between items-center shadow-lg ">
          <div className="flex flex-col space-y-1">
            <p className="text-sm text-emerald-100">Total zPoints</p>
            <h2 className="text-4xl font-bold text-white">
              {user?.totalPoints || user?.referral_points || 0}
            </h2>
          </div>
          <div className="bg-white/25 p-3 rounded-full">
            <MdDiamond size={28} className="text-white" />
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-16 px-4 pb-10">
        <div className="bg-white rounded-3xl border border-primaryColor px-4 py-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-900 font-bold text-lg">Next Reward</p>
            <FaUsers className="text-purple-500" size={22} />
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-600 text-base">Friends Referred</p>
            <span className="text-gray-900 font-semibold text-sm">
              {referrals}/{referralsForReward || 20}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-emerald-700 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className="text-gray-500 text-base">
            {remainingReferrals > 0
              ? `${remainingReferrals} more referrals to unlock bonus rewards!`
              : "🎉 You've unlocked your next reward!"}
          </p>
        </div>

        {/* Refer & Earn Button */}
        <button
          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl border border-primaryColor hover:opacity-90 transition"
          style={{
            backgroundColor: InstitutionData.PrimaryColor,
          }}
          onClick={() => setPage("refer")}
        >
          <FaShareAlt size={18} />
          Refer & Earn Points
        </button>

        <div className="grid grid-cols-2 gap-4 mt-3">

        </div>
      </div>
    </div>
  );
}
