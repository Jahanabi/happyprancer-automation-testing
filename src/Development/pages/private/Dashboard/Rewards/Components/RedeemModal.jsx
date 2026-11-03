import React, { useState, useContext, useEffect } from "react";
import { post } from "aws-amplify/api";
import { toast } from "react-toastify";
import Context from "../../../../../Context/Context";
import InstitutionContext from "../../../../../Context/InstitutionContext";

export default function RedeemModal({ open, onClose, reward, user }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const { userData, setUserData, updateUserProfile } = useContext(Context);

  // Initialize address from userData when modal opens
  useEffect(() => {
    if (open) {
      setAddress(userData?.address || user?.address || "");
    }
  }, [open, userData, user]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Please enter your address");
      return;
    }

    setLoading(true);
    try {
      // Get existing rewards array or create new one
      // Handle case where rewards might be stored as JSON string
      let existingRewards = userData?.rewards || user?.rewards || [];

      // If rewards is a string, try to parse it
      if (typeof existingRewards === 'string') {
        try {
          existingRewards = JSON.parse(existingRewards);
        } catch (e) {
          console.error("Error parsing rewards:", e);
          existingRewards = [];
        }
      }

      // Ensure existingRewards is an array
      if (!Array.isArray(existingRewards)) {
        existingRewards = [];
      }

      // Create redemption object
      const redemptionData = {
        rewardName: reward?.title || "",
        rewardId: reward?.id || "",
        points: reward?.points || 0,
        address: address.trim(),
        username: userData?.userName || user?.userName || "",
        status: "redeemed",
        redeemedAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      // Add new redemption to the array
      const updatedRewards = [...existingRewards, redemptionData];

      // Calculate current referral points and subtract reward points
      let currentReferralPoints = user?.referral_points ?? userData?.referral_points ?? 0;
      let currentZPoints = user?.zPoints ?? userData?.zPoints ?? 0;
      const rewardPoints = reward?.points || 0;
      let updatedReferralPoints = currentReferralPoints;
      let updatedZPoints = currentZPoints;

      if (currentReferralPoints >= rewardPoints) {
        updatedReferralPoints = currentReferralPoints - rewardPoints;
      } else {
        const remaining = rewardPoints - currentReferralPoints;
        updatedReferralPoints = 0;
        updatedZPoints = Math.max(0, currentZPoints - remaining);
      }

      const updatedData = await updateUserProfile(InstitutionData.InstitutionId, {
        emailId: userData?.emailId || user?.emailId || "",
        userName: userData?.userName || user?.userName || "",
        phoneNumber: userData?.phoneNumber || user?.phoneNumber || "",
        country: userData?.country || user?.country || "",
        joiningDate: userData?.joiningDate || user?.joiningDate || "",
        dob: userData?.dob || user?.dob || "",
        address: userData?.address.trim(),
        about: userData?.about || user?.about || "",
        rewards: updatedRewards,
        zPoints: updatedZPoints,
        referral_points: updatedReferralPoints,
      });
      // Notify admins about the reward redemption via SMS and Email
      try {
        const notifyOp = post({
          apiName: "main",
          path: `/user/reward-notify/${InstitutionData.InstitutionId}`,
          options: {
            body: {
              name: userData?.userName || user?.userName || "",
              reward: reward?.title || "",
              time: new Date().toISOString(),
              address: address.trim(),
            },
          },
        });
        await notifyOp.response;
      } catch (notifyError) {
        console.warn("Reward notification failed:", notifyError);
      }
      // Update user data in context
      if (updatedData?.Attributes) {
        setUserData(updatedData.Attributes);
      } else if (updatedData) {
        // Fallback if Attributes is not present
        setUserData({
          ...userData,
          rewards: updatedRewards,
          zPoints: updatedZPoints,
          referral_points: updatedReferralPoints,
        });
      }

      toast.success(`Successfully redeemed: ${reward.title}! Your redemption has been saved.`);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.message || "Failed to redeem reward. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Redeem {reward?.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-2 transition"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Reward Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Reward Details</p>
          <p className="text-lg font-semibold text-gray-900">{reward?.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Cost: {reward?.points} HP Points
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              placeholder="Enter your complete delivery address..."
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Please provide your complete address for reward delivery
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !address.trim()}
              style={{
                backgroundColor: loading
                  ? "#9CA3AF"
                  : InstitutionData?.PrimaryColor || "#10B981",
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Confirm Redeem"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

