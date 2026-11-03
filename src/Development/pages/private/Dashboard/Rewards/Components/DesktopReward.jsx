import { Lock, ArrowLeft } from "lucide-react";
import { FaGift, FaDumbbell } from "react-icons/fa6";
import { FaMusic, FaShoppingBag } from "react-icons/fa";
import { useState } from "react";
import RedeemModal from "./RedeemModal";

export default function YourRewards({
  user,
  setPage,
  rewards,
  userPoints,
  InstitutionData,
}) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mainImage, setMainImage] = useState(
    rewards.images[0] ? rewards.images[0] : null
  );

  const currentPoints = user?.totalPoints || user?.hpPoints || userPoints || 0;

  const handleRedeem = (reward) => {
    setSelectedReward(reward);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReward(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-poppins">
      {/* Header */}
      <div
        className="w-full text-white py-6 px-8 flex items-center justify-between rounded-b-2xl"
        style={{
          background:
            InstitutionData?.PrimaryColor ||
            "linear-gradient(90deg,#059669,#10b981)",
        }}
      >
        <ArrowLeft
          size={22}
          className="cursor-pointer"
          onClick={() => setPage("profile")}
        />
        <div className="flex items-center gap-3">
          <FaGift size={24} />
          <h2 className="text-2xl font-semibold">Your Rewards</h2>
        </div>
        <div className="flex gap-2"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        <h3 className="font-bold text-lg mb-6">Available Rewards</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            // handle selected image for each reward

            return (
              <div
                key={reward.id}
                className={`p-5 rounded-xl shadow-sm transition flex flex-col items-center text-center
      ${
        reward.unlocked
          ? "bg-white hover:bg-gray-100"
          : "bg-gray-100 opacity-70"
      }`}
              >
                {/* MAIN IMAGE OR ICON */}
                <div className="w-full flex items-center justify-center mb-4">
                  {reward.images ? (
                    <img
                      src={mainImage}
                      alt="main"
                      className="w-full h-60 object-contain rounded-xl bg-white"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 flex items-center justify-center rounded-xl
            ${
              reward.unlocked
                ? "bg-emerald-50 text-emerald-600"
                : "bg-gray-200 text-gray-400"
            }`}
                    >
                      {reward.icon}
                    </div>
                  )}
                </div>

                {/* THUMBNAILS IF MULTIPLE IMAGES */}
                {reward.images && (
                  <div className="flex gap-2 mb-4 w-full justify-center">
                    {reward.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt="main"
                        onClick={() => setMainImage(img)}
                        className={`h-16 w-16 object-contain rounded-lg cursor-pointer border
               ${mainImage === img ? "border-yellow-400" : "border-transparent"}
              `}
                      />
                    ))}
                  </div>
                )}

                {/* TITLE */}
                <p
                  className={`font-bold text-lg ${
                    reward.unlocked ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {reward.title}
                </p>

                {/* POINTS */}
                <p className="text-sm text-gray-500 mb-4">
                  {reward.points} zPoints required
                </p>

                {/* REDEEM BUTTON */}
                {reward.unlocked ? (
                  <button
                    onClick={() => {
                      setSelectedReward(reward);
                      setIsModalOpen(true);
                    }}
                    className="bg-[#FFD93D] hover:bg-yellow-400 text-gray-900 font-semibold text-sm px-4 py-2 rounded-md w-full"
                  >
                    Redeem Now
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-gray-500 bg-gray-200 px-4 py-2 rounded-md w-full text-sm">
                    <Lock size={14} /> Locked
                  </div>
                )}
              </div>
            );
          })}
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
