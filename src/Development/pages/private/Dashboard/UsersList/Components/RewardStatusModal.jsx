import React, { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { useContext } from "react";
// import { API } from "../../../../../Context/ContextProvider";
import Context from "../../../../../Context/Context";
import { toast } from "react-toastify";
import { FaGift } from "react-icons/fa";
import InstitutionContext from "../../../../../Context/InstitutionContext";

const RewardStatusModal = ({
  showModal,
  setShowModal,
  user,
  onUpdate,
  onMarkSeen,
}) => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [selectedRewards, setSelectedRewards] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const { updateAdminUserAttribute } = useContext(Context);

  // Parse rewards from user data
  useEffect(() => {
    if (showModal && user) {
      let userRewards = user?.rewards || [];

      // If rewards is a string, try to parse it
      if (typeof userRewards === "string") {
        try {
          userRewards = JSON.parse(userRewards);
        } catch (e) {
          console.error("Error parsing rewards:", e);
          userRewards = [];
        }
      }

      // Ensure it's an array
      if (!Array.isArray(userRewards)) {
        userRewards = [];
      }

      // Ensure each reward has a unique identifier
      userRewards = userRewards.map((reward, index) => {
        // Use timestamp as unique ID if available, otherwise create one
        const uniqueId =
          reward.timestamp ||
          reward.rewardId ||
          `${reward.redeemedAt || Date.now()}_${index}`;
        return {
          ...reward,
          uniqueId: uniqueId,
          // Ensure timestamp exists for identification
          timestamp: reward.timestamp || reward.redeemedAt || Date.now(),
        };
      });
      console.log("user rewards:", userRewards);

      setRewards(userRewards);
      setSelectedRewards(new Set());
      setIsBulkMode(false);
      setBulkStatus("");
    }
  }, [showModal, user]);

  const rewardStatuses = [
    {
      value: "redeemed",
      label: "Redeemed",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "processing",
      label: "Processing",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "shipped",
      label: "Shipped",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  // Get unique identifier for a reward
  const getRewardId = (reward) => {
    // Prefer uniqueId (assigned during initialization), then timestamp, then rewardId, then redeemedAt
    return (
      reward.uniqueId ||
      reward.timestamp ||
      reward.rewardId ||
      reward.redeemedAt
    );
  };

  // Convert reward ID to string for consistent comparison
  const getRewardIdString = (reward) => {
    return String(getRewardId(reward));
  };

  // Handle single reward status change
  const handleStatusChange = async (rewardId, newStatus) => {
    const rewardIdStr = String(rewardId);
    const updatingIds = new Set([rewardIdStr]);
    setUpdatingStatus(updatingIds);
    setLoading(true);

    try {
      // Create updated rewards array - find reward by ID and update
      const updatedRewards = rewards.map((reward) => {
        const id = getRewardIdString(reward);
        if (id === rewardIdStr) {
          return {
            ...reward,
            status: newStatus,
            statusUpdatedAt: new Date().toISOString(),
          };
        }
        return reward;
      });

      // Update rewards attribute for target user
      await updateAdminUserAttribute(InstitutionData.InstitutionId, "rewards", {
        cognitoId: user?.cognitoId,
        value: updatedRewards,
      });

      // Update local state
      setRewards(updatedRewards);
      toast.success("Reward status updated successfully!");

      // If ALL rewards are now delivered, remove the highlight
      const allDelivered = updatedRewards.every(
        (r) => r.status === "delivered",
      );
      if (allDelivered && onMarkSeen) {
        onMarkSeen();
      }

      // Call onUpdate callback to refresh user list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating reward status:", error);
      toast.error(
        error?.message || "Failed to update reward status. Please try again.",
      );
    } finally {
      setLoading(false);
      setUpdatingStatus(new Set());
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedRewards.size === 0) {
      toast.warn("Please select rewards and choose a status");
      return;
    }

    setUpdatingStatus(new Set(selectedRewards));
    setLoading(true);

    try {
      // Create updated rewards array - update all selected rewards
      const updatedRewards = rewards.map((reward) => {
        const id = getRewardIdString(reward);
        if (selectedRewards.has(id)) {
          return {
            ...reward,
            status: bulkStatus,
            statusUpdatedAt: new Date().toISOString(),
          };
        }
        return reward;
      });

      // Update rewards attribute for target user
      await updateAdminUserAttribute(InstitutionData.InstitutionId, "rewards", {
        cognitoId: user?.cognitoId,
        value: updatedRewards,
      });

      // Store count before clearing
      const updatedCount = selectedRewards.size;

      // Update local state
      setRewards(updatedRewards);
      setSelectedRewards(new Set());
      setIsBulkMode(false);
      setBulkStatus("");
      toast.success(`${updatedCount} reward(s) status updated successfully!`);

      // If ALL rewards are now delivered, remove the highlight
      const allDelivered = updatedRewards.every(
        (r) => r.status === "delivered",
      );
      if (allDelivered && onMarkSeen) {
        onMarkSeen();
      }

      // Call onUpdate callback to refresh user list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating reward status:", error);
      toast.error(
        error?.message || "Failed to update reward status. Please try again.",
      );
    } finally {
      setLoading(false);
      setUpdatingStatus(new Set());
    }
  };

  // Toggle reward selection
  const toggleRewardSelection = (rewardId) => {
    const id = String(rewardId);
    const newSelected = new Set(selectedRewards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRewards(newSelected);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedRewards.size === rewards.length) {
      setSelectedRewards(new Set());
    } else {
      const allIds = rewards.map((reward) => getRewardIdString(reward));
      setSelectedRewards(new Set(allIds));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const statusObj = rewardStatuses.find((s) => s.value === status);
    return statusObj?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const statusObj = rewardStatuses.find((s) => s.value === status);
    return statusObj?.label || status;
  };

  const handleClose = () => {
    setShowModal(false);
    // Reset state when closing
    setRewards([]);
    setSelectedRewards(new Set());
    setIsBulkMode(false);
    setBulkStatus("");
    setUpdatingStatus(new Set());
  };

  return (
    <>
      {/* <Modal show={showModal} onClose={handleClose} size="xl">
        <Modal.Header>
          <div className="flex items-center gap-2">
            <FaGift className="text-pink-500" />
            <span>Reward Status - {user?.userName || "User"}</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaGift className="mx-auto text-4xl text-gray-300 mb-3" />
                <p>No rewards redeemed yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        isBulkMode
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {isBulkMode ? "Cancel Bulk Mode" : "Bulk Edit"}
                    </button>
                    {isBulkMode && (
                      <>
                        <button
                          onClick={toggleSelectAll}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        >
                          {selectedRewards.size === rewards.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                        <span className="text-sm text-gray-600">
                          {selectedRewards.size} of {rewards.length} selected
                        </span>
                      </>
                    )}
                  </div>
                  {isBulkMode && selectedRewards.size > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-md text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Status</option>
                        {rewardStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkStatusChange}
                        disabled={loading || !bulkStatus}
                        className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Updating..." : "Apply to Selected"}
                      </button>
                    </div>
                  )}
                </div>

                {rewards.map((reward) => {
                  const rewardId = getRewardIdString(reward);
                  const isSelected = selectedRewards.has(rewardId);
                  const isUpdating = updatingStatus.has(rewardId);

                  return (
                    <div
                      key={rewardId}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isSelected && isBulkMode
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">

                        {isBulkMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRewardSelection(rewardId)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-800">
                                {reward.rewardName || "Reward"}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Points: {reward.points || 0} HP Points
                              </p>
                              {reward.address && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Address: {reward.address}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Redeemed: {formatDate(reward.redeemedAt)}
                              </p>
                              {reward.statusUpdatedAt && (
                                <p className="text-xs text-gray-400">
                                  Status Updated:{" "}
                                  {formatDate(reward.statusUpdatedAt)}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                reward.status
                              )}`}
                            >
                              {getStatusLabel(reward.status)}
                            </span>
                          </div>

                          {!isBulkMode && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Update Status:
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {rewardStatuses.map((status) => (
                                  <button
                                    key={status.value}
                                    onClick={() =>
                                      handleStatusChange(rewardId, status.value)
                                    }
                                    disabled={
                                      loading ||
                                      isUpdating ||
                                      reward.status === status.value
                                    }
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                                      reward.status === status.value
                                        ? `${status.color} cursor-not-allowed opacity-75`
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    } ${
                                      loading || isUpdating
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {isUpdating &&
                                    reward.status === status.value ? (
                                      <span className="flex items-center gap-1">
                                        <svg
                                          className="animate-spin h-4 w-4"
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
                                        Updating...
                                      </span>
                                    ) : (
                                      status.label
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={handleClose} disabled={loading}>
            Close
          </Button>
        </Modal.Footer>
      </Modal> */}
      {/* <Dialog open={showModal} onClose={handleClose} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-5xl rounded-2xl bg-white shadow-lg p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FaGift className="text-pink-500 text-xl" />
                <Dialog.Title className="text-lg font-semibold">
                  Reward Status - {user?.userName || "User"}
                </Dialog.Title>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {rewards.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaGift className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p>No rewards redeemed yet</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsBulkMode(!isBulkMode)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                          isBulkMode
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {isBulkMode ? "Cancel Bulk Mode" : "Bulk Edit"}
                      </button>
                      {isBulkMode && (
                        <>
                          <button
                            onClick={toggleSelectAll}
                            className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                          >
                            {selectedRewards.size === rewards.length
                              ? "Deselect All"
                              : "Select All"}
                          </button>
                          <span className="text-sm text-gray-600">
                            {selectedRewards.size} of {rewards.length} selected
                          </span>
                        </>
                      )}
                    </div>

                    {isBulkMode && selectedRewards.size > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value)}
                          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Status</option>
                          {rewardStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleBulkStatusChange}
                          disabled={loading || !bulkStatus}
                          className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Updating..." : "Apply to Selected"}
                        </button>
                      </div>
                    )}
                  </div>

                  {rewards.map((reward) => {
                    const rewardId = getRewardIdString(reward);
                    const isSelected = selectedRewards.has(rewardId);
                    const isUpdating = updatingStatus.has(rewardId);

                    return (
                      <div
                        key={rewardId}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          isSelected && isBulkMode
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isBulkMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRewardSelection(rewardId)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          )}

                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-lg text-gray-800">
                                  {reward.rewardName || "Reward"}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Points: {reward.points || 0} HP Points
                                </p>
                                {reward.address && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Address: {reward.address}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  Redeemed: {formatDate(reward.redeemedAt)}
                                </p>
                                {reward.statusUpdatedAt && (
                                  <p className="text-xs text-gray-400">
                                    Status Updated:{" "}
                                    {formatDate(reward.statusUpdatedAt)}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  reward.status
                                )}`}
                              >
                                {getStatusLabel(reward.status)}
                              </span>
                            </div>

                            {!isBulkMode && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Update Status:
                                </label>
                                <select
                                  onChange={(e) =>
                                    handleStatusChange(rewardId, e.target.value)
                                  }
                                  value={reward.status}
                                  disabled={loading || isUpdating}
                                  className="px-3 py-1.5 rounded-md text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                >
                                  {rewardStatuses.map((status) => (
                                    <option
                                      key={status.value}
                                      value={status.value}
                                    >
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="flex justify-end mt-6 border-t pt-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog> */}

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Background Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleClose}></div>

        {/* Modal Box */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto border border-gray-100">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaGift className="text-pink-500 text-xl" />
              <h2 className="text-lg font-semibold">
                Reward Status - {user?.userName || "User"}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-semibold">
              &times;
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {rewards.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaGift className="mx-auto text-4xl text-gray-300 mb-3" />
                <p>No rewards redeemed yet</p>
              </div>
            ) : (
              <>
                {/* Bulk Actions Bar */}
                <div className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <button
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        isBulkMode
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}>
                      {isBulkMode ? "Cancel Bulk Mode" : "Bulk Edit"}
                    </button>
                    {isBulkMode && (
                      <>
                        <button
                          onClick={toggleSelectAll}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100">
                          {selectedRewards.size === rewards.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                        <span className="text-sm text-gray-600">
                          {selectedRewards.size} of {rewards.length} selected
                        </span>
                      </>
                    )}
                  </div>

                  {isBulkMode && selectedRewards.size > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-md text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Status</option>
                        {rewardStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkStatusChange}
                        disabled={loading || !bulkStatus}
                        className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? "Updating..." : "Apply"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reward List */}
                {rewards.map((reward) => {
                  const rewardId = getRewardIdString(reward);
                  const isSelected = selectedRewards.has(rewardId);
                  const isUpdating = updatingStatus.has(rewardId);

                  return (
                    <div
                      key={rewardId}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                        isSelected && isBulkMode
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}>
                      <div className="flex items-start gap-3">
                        {isBulkMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRewardSelection(rewardId)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-800">
                                {reward.rewardName || "Reward"}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Points: {reward.points || 0} HP Points
                              </p>
                              {reward.address && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Address: {reward.address}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Redeemed: {formatDate(reward.redeemedAt)}
                              </p>
                              {reward.statusUpdatedAt && (
                                <p className="text-xs text-gray-400">
                                  Status Updated:{" "}
                                  {formatDate(reward.statusUpdatedAt)}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                reward.status,
                              )}`}>
                              {getStatusLabel(reward.status)}
                            </span>
                          </div>

                          {/* Status Dropdown (Replaces Buttons) */}
                          {!isBulkMode && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Update Status:
                              </label>
                              <select
                                onChange={(e) =>
                                  handleStatusChange(rewardId, e.target.value)
                                }
                                value={reward.status}
                                disabled={loading || isUpdating}
                                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                {rewardStatuses.map((status) => (
                                  <option
                                    key={status.value}
                                    value={status.value}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RewardStatusModal;
