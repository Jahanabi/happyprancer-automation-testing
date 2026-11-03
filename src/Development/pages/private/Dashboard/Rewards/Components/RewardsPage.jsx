import { Gift, Lock, Dumbbell, Music } from "lucide-react";
import { FaGift, FaDumbbell } from "react-icons/fa6";
import { FaMusic, FaShoppingBag } from "react-icons/fa";
import { useState ,useEffect} from "react";
import RedeemModal from "./RedeemModal";

export default function YourRewards({
  user,
  rewards,
  userPoints,
  InstitutionData,
}) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleRedeem = (reward) => {
    setSelectedReward(reward);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReward(null);
  };

  return (
    <div className="min-h-screen font-poppins bg-white flex flex-col items-center text-gray-800 relative">
      {/* Header */}
      <div
        className="w-full absolute top-0 text-white rounded-b-3xl shadow-md p-3 sm:p-4 pb-5 flex items-center gap-2 justify-center"
        style={{ backgroundColor: InstitutionData?.PrimaryColor }}
      >
        <div className="flex translate-y-4 gap-2 items-center">
          <FaGift size={22} />
          <h2 className="font-semibold text-xl sm:text-2xl">Your Rewards</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-24 sm:mt-28 w-full px-4 sm:px-8 max-w-3xl">
        <p className="font-bold text-lg sm:text-xl text-gray-800 mb-4 text-center sm:text-left">
          Available Rewards
        </p>

        <div className="flex flex-col gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`p-5 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.1)] transition-all
        ${reward.unlocked ? "bg-white" : "bg-gray-100 opacity-80"}
      `}
            >
              {reward.type === "product" && (
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* LEFT: Main Image + Thumbnails */}
                  <div className="w-full sm:w-1/2 flex flex-col items-center">
                    {/* Big Main Image */}
                    <div className="w-full bg-gray-100 rounded-xl p-4">
                      <img
                        src={selectedImages[reward.id] || reward.images[0]}
                        alt="T-shirt"
                        className="w-full h-auto object-contain rounded-xl"
                      />
                    </div>

                    {/* Thumbnails Row */}
                    <div className="flex gap-3 mt-3 overflow-x-auto">
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
                    </div>
                  </div>

                  {/* RIGHT SIDE: Title + Details + Button */}
                  <div className="flex flex-col justify-between w-full sm:w-1/2">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {reward.title}
                      </p>
                      <p className="text-gray-500 mt-1">
                        {reward.points} zPoints required
                      </p>
                    </div>

                    <div className="mt-4">
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
                          className="bg-[#FFD93D] hover:bg-yellow-400 text-gray-900 font-semibold text-xs px-3 py-2 rounded-md w-full"
                        >
                          Redeem Now
                        </button>
                      ) : (
                        // 🔒 LOCKED
                        <div className="flex items-center justify-center gap-1 text-gray-500 bg-gray-200 px-3 py-2 rounded-md w-full text-xs">
                          <Lock size={12} /> Locked
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MEMBERSHIP REWARD */}
              {reward.type === "membership" && (
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Membership Placeholder Icon */}
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-lg font-bold
              ${reward.unlocked ? "bg-indigo-500" : "bg-gray-400"}
            `}
                  >
                    <FaDumbbell size={26} />
                  </div>

                  {/* Details */}
                  <div className="flex flex-col w-full">
                    <p
                      className={`font-bold text-xl ${
                        reward.unlocked ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {reward.title}
                    </p>
                    <p
                      className={`text-sm ${
                        reward.unlocked ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {reward.points} HP Points required
                    </p>

                    <div className="mt-3">
                      {reward.unlocked ? (
                        <button
                          onClick={() => handleRedeem(reward)}
                          className="bg-yellow-400 w-full sm:w-auto text-gray-900 px-4 py-2 rounded-lg shadow hover:bg-yellow-500"
                        >
                          Redeem Now
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-gray-300 w-full sm:w-auto px-3 py-2 rounded-lg text-gray-600">
                          <Lock size={16} /> Locked
                        </div>
                      )}
                    </div>
                  </div>
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
  );
}
