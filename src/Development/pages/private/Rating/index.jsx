import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import NavBar from "../../../components/Header";
import { useLocation, useNavigate } from "react-router-dom";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import { useMediaQuery } from "../../../utils/helpers";

const Rating = () => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);
  const [attendanceError, setAttendanceError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const Ctx = useContext(Context);
  const userCtx = Ctx.userData || {};
  const { submitInstructorRating, fetchRatingsAdmin } = Ctx;
  const UtilCtx = Ctx.util || {};
  const InstitutionData = useContext(InstitutionContext).institutionData || {};
  const isMobileScreen = useMediaQuery("(max-width: 600px)");

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const instructorIdFromUrl = searchParams.get("instructorId");
  const classIdFromUrl = searchParams.get("classId");

  const instructorId = instructorIdFromUrl || location.state?.instructorId || location.state?.existingRating?.instructorId || "";
  const initialClassId = classIdFromUrl || location.state?.classId || location.state?.existingRating?.classId || "";

  // Find instructor from context
  const instructor = useMemo(() => {
    return Ctx.instructorList?.find(
      (i) => instructorId && i?.instructorId?.toString() === instructorId?.toString()
    );
  }, [Ctx.instructorList, instructorId]);

  // Find classes taught by this instructor from previousClasses or upcomingClasses
  const instructorClasses = useMemo(() => {
    const list = Array.isArray(Ctx.previousClasses) ? Ctx.previousClasses : [];
    return list.filter(
      (c) => c && instructorId && (c.instructorId?.toString() === instructorId?.toString() || c.instructorNames === instructor?.name)
    );
  }, [Ctx.previousClasses, instructorId, instructor?.name]);

  // Fetch instructor list if missing
  useEffect(() => {
    const fetchInstructorList = async () => {
      if (!Ctx.instructorList || Ctx.instructorList.length === 0) {
        setIsLoading(true);
        try {
          if (typeof Ctx.getInstructorList === "function") {
            await Ctx.getInstructorList();
          }
        } catch (error) {
          console.error("Error fetching instructor list:", error);
          toast.error("Failed to load instructor information");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchInstructorList();
  }, [Ctx]);

  // Initialize classId from URL, state, or available classes
  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    } else if (instructorClasses.length === 1 && instructorClasses[0]?.classId) {
      setSelectedClassId(instructorClasses[0].classId);
    }
  }, [initialClassId, instructorClasses]);

  // Check for existing rating to populate edit flow (Requirement 4)
  const loadExistingRating = useCallback((activeClassId) => {
    const passedRating = location.state?.existingRating;
    if (passedRating) {
      setSelectedRating(Number(passedRating.rating) || 0);
      setReview(passedRating.review || "");
      setIsEditMode(true);
      setExistingRatingId(passedRating.timestamp || passedRating.classId);
      if (passedRating.classId && !activeClassId) {
        setSelectedClassId(passedRating.classId);
      }
      return;
    }

    const currentCognitoId = userCtx.cognitoId ? String(userCtx.cognitoId).trim() : "";
    const currentEmail = userCtx.emailId ? String(userCtx.emailId).toLowerCase().trim() : "";
    const ratingsList = Array.isArray(Ctx.ratings) ? Ctx.ratings : [];

    const found = ratingsList.find((r) => {
      const matchInst = r.instructorId && String(r.instructorId) === String(instructorId);
      const matchUser =
        (r.userId && currentCognitoId && String(r.userId) === currentCognitoId) ||
        (r.userEmailId && currentEmail && String(r.userEmailId).toLowerCase() === currentEmail);
      const matchClass = activeClassId ? String(r.classId) === String(activeClassId) : true;
      return matchInst && matchUser && matchClass;
    });

    if (found) {
      setSelectedRating(Number(found.rating) || 0);
      setReview(found.review || "");
      setIsEditMode(true);
      setExistingRatingId(found.timestamp || found.classId);
      if (found.classId && !activeClassId) {
        setSelectedClassId(found.classId);
      }
    }
  }, [location.state?.existingRating, userCtx.cognitoId, userCtx.emailId, Ctx.ratings, instructorId]);

  useEffect(() => {
    loadExistingRating(selectedClassId);
  }, [loadExistingRating, selectedClassId]);

  const handleRatingHover = (value) => {
    setHoveredRating(value);
  };

  const handleRatingClick = (value) => {
    setSelectedRating(value);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (selectedRating === 0 || selectedRating < 1 || selectedRating > 5) {
      toast.info("Please select a rating between 1 and 5 stars before submitting.");
      return;
    }

    if (!instructorId) {
      toast.error("Instructor information not found. Please try again.");
      return;
    }

    const activeClassId = selectedClassId || initialClassId;
    if (!activeClassId) {
      toast.error("A class session must be selected to verify attendance.");
      return;
    }

    // Reset previous error state
    setAttendanceError("");
    setIsSubmitting(true);
    if (UtilCtx.setLoader) UtilCtx.setLoader(true);

    const body = {
      instructorId: String(instructorId).trim(),
      classId: String(activeClassId).trim(),
      rating: Number(selectedRating),
      review: review.trim(),
      instructorEmailId: instructor?.emailId || "",
      instructorName: instructor?.name || "",
      userEmailId: userCtx.emailId || "",
      userName: userCtx.userName || "",
    };

    try {
      const res = await submitInstructorRating(InstitutionData.InstitutionId, body);

      // Interpret backend response safely
      if (res?.isDuplicate) {
        toast.info(res.message || "Rating already submitted for this instructor/class.");
      } else if (res?.isUpdated) {
        toast.success(res.message || "Rating updated successfully!");
      } else {
        toast.success(res?.message || "Rating submitted successfully!");
      }

      // Clear form on success and return to dashboard
      setReview("");
      setSelectedRating(0);
      if (typeof Ctx?.fetchRatingsAdmin === "function") {
        Ctx.fetchRatingsAdmin().catch(() => {});
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Rating submission error:", error);
      const statusCode = error.statusCode;
      const backendMsg = error.backendMessage || error.message || "";

      if (statusCode === 403) {
        // Attendance requirement failure (HP151)
        const friendlyMsg = backendMsg.includes("attended")
          ? backendMsg
          : "You must attend this class before submitting a rating.";
        setAttendanceError(friendlyMsg);
        toast.error(friendlyMsg);
      } else if (statusCode === 401) {
        toast.error("Your session has expired. Please sign in again.");
      } else if (statusCode === 400) {
        toast.error(backendMsg || "Invalid rating submission. Please check your input.");
      } else if (statusCode === 500) {
        toast.error("Server error while verifying rating. Please try again later.");
      } else {
        toast.error(backendMsg || "Unable to submit rating. Please try again.");
      }
      // Form values are deliberately preserved on failure so user can retry without data loss
    } finally {
      setIsSubmitting(false);
      if (UtilCtx.setLoader) UtilCtx.setLoader(false);
    }
  };

  const handleReturn = () => {
    navigate("/dashboard");
  };

  const ratingMessages = {
    1: "Poor",
    2: "Bad",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: InstitutionData.PrimaryColor }}
          />
          <p className="text-gray-600">Loading instructor information...</p>
        </div>
      </div>
    );
  }

  const activeClassId = selectedClassId || initialClassId;

  // Mobile layout
  if (isMobileScreen) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center px-3 py-6"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${InstitutionData.PrimaryColor}14, transparent 35%),
            radial-gradient(circle at 80% 10%, ${InstitutionData.PrimaryColor}10, transparent 32%),
            linear-gradient(145deg, #f8fbff, #eef2f6)`,
        }}>
        <div
          className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/40"
          style={{
            boxShadow: `0 18px 45px ${InstitutionData.PrimaryColor}2e`,
          }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                {isEditMode ? "Update your rating" : "Rate your instructor"}
              </p>
              <h3 className="text-lg font-semibold text-gray-800">
                {isEditMode ? "Edit your feedback" : "How was the session?"}
              </h3>
            </div>
            <button
              onClick={handleReturn}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
              &#10005;
            </button>
          </div>

          {attendanceError && (
            <div
              role="alert"
              className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <strong>Attendance Required: </strong>
              {attendanceError}
            </div>
          )}

          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-3 border border-gray-100">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: InstitutionData.PrimaryColor }}>
              {instructor?.name?.[0]?.toUpperCase() || "I"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800">
                {instructor?.name || "Instructor"}
              </span>
              <span className="text-[10px] text-gray-500">
                {instructor?.classType?.join(", ") || "Class"}
              </span>
            </div>
            <span
              className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${InstitutionData.PrimaryColor}1a`,
                color: InstitutionData.PrimaryColor,
              }}>
              {isEditMode ? "Edit Mode" : "Live Class"}
            </span>
          </div>

          {/* Class selector if classId not in URL */}
          {!classIdFromUrl && instructorClasses.length > 1 && (
            <div className="mb-3">
              <label htmlFor="mobile-class-select" className="text-xs text-gray-600 mb-1 block">
                Select Attended Class
              </label>
              <select
                id="mobile-class-select"
                className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}>
                <option value="">-- Choose Class Session --</option>
                {instructorClasses.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.classType} ({new Date(c.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col items-center mb-4">
            <div className="text-xs text-gray-500 mb-1">
              {isEditMode ? "Change your star rating" : "Tap to rate"}
            </div>
            <div className="h-5 mb-1 flex items-center justify-center">
              {(hoveredRating > 0 || selectedRating > 0) && (
                <div className="text-gray-700 font-medium text-sm">
                  {ratingMessages[hoveredRating || selectedRating]}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5" role="group" aria-label="Rating stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} Star${value > 1 ? "s" : ""}`}
                  className={`text-3xl transition-transform duration-150 focus:outline-none ${
                    value <= (hoveredRating || selectedRating)
                      ? "text-yellow-500 scale-105"
                      : "text-gray-300"
                  }`}
                  onMouseEnter={() => handleRatingHover(value)}
                  onMouseLeave={() => handleRatingHover(0)}
                  onClick={() => handleRatingClick(value)}>
                  &#9733;
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="mobile-review-text" className="text-xs text-gray-600 mb-1.5 block">
              Share a quick note (optional)
            </label>
            <textarea
              id="mobile-review-text"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white/70"
              placeholder="Tell us what stood out to you"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
            />
          </div>

          <button
            type="button"
            disabled={isSubmitting || selectedRating === 0 || !activeClassId}
            onClick={handleSubmit}
            className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold shadow-lg transition-transform duration-150 ${
              isSubmitting || selectedRating === 0 || !activeClassId
                ? "opacity-60 cursor-not-allowed"
                : "hover:-translate-y-0.5 active:scale-95"
            }`}
            style={{ backgroundColor: InstitutionData.PrimaryColor }}>
            {isSubmitting
              ? isEditMode
                ? "Updating rating..."
                : "Submitting rating..."
              : isEditMode
              ? "Update rating"
              : "Submit rating"}
          </button>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <>
      <NavBar />
      <div
        className="min-h-[calc(100vh-100px)] flex items-center justify-center px-6 py-8"
        style={{
          background: `radial-gradient(circle at 15% 20%, ${InstitutionData.PrimaryColor}16, transparent 40%),
            radial-gradient(circle at 80% 10%, ${InstitutionData.PrimaryColor}12, transparent 38%),
            linear-gradient(160deg, #f5f7fb, #ecf1f7)`,
        }}>
        <div
          className="relative w-full max-w-2xl bg-white/85 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/40"
          style={{
            boxShadow: `0 26px 70px ${InstitutionData.PrimaryColor}30`,
          }}>
          <button
            onClick={handleReturn}
            aria-label="Close"
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold text-sm">
            &#10005;
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                {isEditMode ? "Update your rating" : "Your feedback matters"}
              </p>
              <h2 className="text-2xl font-semibold text-gray-800">
                {isEditMode ? "Edit your instructor rating" : "Rate your instructor"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditMode
                  ? "Update your review and star rating for this session."
                  : "Help us keep sessions sharp and engaging."}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                {instructor?.name?.[0]?.toUpperCase() || "I"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">
                  {instructor?.name || "Instructor"}
                </span>
                <span className="text-[10px] text-gray-500">
                  {instructor?.classType?.join(", ") || "Class"}
                </span>
              </div>
              <span
                className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${InstitutionData.PrimaryColor}1a`,
                  color: InstitutionData.PrimaryColor,
                }}>
                {isEditMode ? "Edit Mode" : "Recent session"}
              </span>
            </div>
          </div>

          {attendanceError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <strong>Attendance Required: </strong>
              {attendanceError}
            </div>
          )}

          {/* Class selector if classId not in URL */}
          {!classIdFromUrl && instructorClasses.length > 1 && (
            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label htmlFor="desktop-class-select" className="text-xs font-medium text-gray-700 mb-1 block">
                Select Attended Class Session:
              </label>
              <select
                id="desktop-class-select"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}>
                <option value="">-- Choose Class Session --</option>
                {instructorClasses.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.classType} ({new Date(c.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col items-center mb-5">
            <div className="text-xs text-gray-500 mb-2">
              {isEditMode ? "Update your star rating" : "Select a rating"}
            </div>
            <div className="h-6 mb-1.5 flex items-center justify-center">
              {(hoveredRating > 0 || selectedRating > 0) && (
                <div className="text-gray-700 font-medium text-sm">
                  {ratingMessages[hoveredRating || selectedRating]}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Rating stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} Star${value > 1 ? "s" : ""}`}
                  className={`text-4xl transition-transform duration-150 focus:outline-none ${
                    value <= (hoveredRating || selectedRating)
                      ? "text-yellow-500 scale-110"
                      : "text-gray-300"
                  }`}
                  onMouseEnter={() => handleRatingHover(value)}
                  onMouseLeave={() => handleRatingHover(0)}
                  onClick={() => handleRatingClick(value)}>
                  &#9733;
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="desktop-review-text" className="text-xs text-gray-600 mb-1.5 block">
              Add a short note (optional)
            </label>
            <textarea
              id="desktop-review-text"
              className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white/70"
              placeholder="What did you like or what could be better?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <button
              type="button"
              onClick={handleReturn}
              className="w-full md:w-32 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition-transform duration-150">
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || selectedRating === 0 || !activeClassId}
              onClick={handleSubmit}
              className={`w-full md:flex-1 py-2.5 rounded-lg text-white text-sm font-semibold shadow-lg transition-transform duration-150 ${
                isSubmitting || selectedRating === 0 || !activeClassId
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:-translate-y-0.5 active:scale-95"
              }`}
              style={{ backgroundColor: InstitutionData.PrimaryColor }}>
              {isSubmitting
                ? isEditMode
                  ? "Updating rating..."
                  : "Submitting rating..."
                : isEditMode
                ? "Update rating"
                : "Submit rating"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rating;
