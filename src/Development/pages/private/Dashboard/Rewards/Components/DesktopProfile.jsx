import { HelpCircle } from "lucide-react";
import {
  FaShareAlt,
  FaHistory,
} from "react-icons/fa";
import { FaGift, FaStar, FaUsers } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Profile = ({
  setPage,
  user,
  referralsForReward,
  redeemableRewardsCount,
  InstitutionData,
}) => {
  const navigate = useNavigate();
  const referrals = user?.referrals || 0;
  const totalPoints = user?.totalPoints || user?.hpPoints || 0;
  const rewardsCount = Array.isArray(user?.rewards)
    ? user.rewards.length
    : user?.rewards || 0;
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
    <div className="no-scrollbar font-poppins">
      {/* Main Content */}
      <main className="px-3 py-3 no-scrollbar  grid md:grid-cols-2 gap-8">
        {/* Left Column */}
        <section className="bg-white rounded-xl px-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            {user.imgUrl ? (
              <img
                src={user.imgUrl}
                alt={user.userName}
                className="h-14 w-14 rounded-full object-cover text-gray-700 font-semibold"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{
                  backgroundColor: getColor(user.userName),
                }}
              >
                {getInitials(user.userName)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 text-lg font-poppins">
                Hello, {user.userName || "User"}
              </p>
              <p className="text-sm text-gray-500 font-poppins">
                Ready to earn more points?
              </p>
            </div>
          </div>

          {/* Stats Section */}

          <div className="bg-white rounded-xl  border-2 border-primaryColor px-4 py-5">
            {/* TOP POINTS SECTION */}
            {/* <div className="text-center flex justify-between items-center mb-3">
              <h1 className="text-lg font-semibold">
                Referral Points:{" "}
                <span className="">{user?.referral_points || 0}</span>
              </h1>
              <h1 className="text-lg font-semibold mt-1">
                zPoints: <span className="">{user?.zPoints || 0}</span>
              </h1>
            </div> */}

            {/* STATS SECTION */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {[
                {
                  icon: <FaStar className="text-purple-600 text-2xl" />,
                  label: "zPoints",
                  value: totalPoints,
                },
                {
                  icon: <FaUsers className="text-green-600 text-2xl" />,
                  label: "Referrals Made",
                  value: referrals,
                },
                {
                  icon: <FaGift className="text-pink-600 text-2xl" />,
                  label: "Rewards Redeemed",
                  value: rewardsCount,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center flex-1 relative w-full sm:w-auto"
                >
                  <div className="bg-white rounded-full p-3 mb-2 shadow-sm">
                    {item.icon}
                  </div>

                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{item.label}</p>

                  {/* Divider on larger screens */}
                  {idx < 2 && (
                    <div className="hidden sm:block absolute right-0 top-3 bottom-3 w-px bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl  border-2 border-primaryColor px-4 py-4 mb-3">
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

          <button
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl  border border-primaryColor hover:opacity-90 transition"
            style={{
              backgroundColor: InstitutionData.PrimaryColor,
            }}
            onClick={() => setPage("refer")}
          >
            <FaShareAlt size={18} />
            Refer & Earn zPoints
          </button>

        </section>

        {/* Right Column */}
        <section className="space-y-6 pr-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl border-2 border-primaryColor px-6 py-3"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" /> Earn zPoint
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
                  points: "+100 zPoints",
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
        </section>
      </main>
    </div>
  );
};

export default Profile;
