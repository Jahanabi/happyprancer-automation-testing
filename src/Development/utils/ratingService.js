/**
 * Rating Service Utilities for HappyPrancer Rating System (HP151 / HP153)
 *
 * Implements business validation, payload normalization, authoritative response
 * interpretation, and safe error parsing strictly aligned with backend rating-submit.js contract.
 */

/**
 * Validates rating inputs before sending requests to the backend.
 * Backend contract enforces:
 * - instructorId: required string
 * - classId: required string (HP151 exact attendance verification)
 * - rating: finite number between 1 and 5 (BRD Section 11.5)
 */
export function validateRatingInput(input = {}) {
  const instructorId = input.instructorId ? String(input.instructorId).trim() : "";
  const classId = input.classId ? String(input.classId).trim() : "";
  const rating = Number(input.rating);
  const review = input.review !== undefined && input.review !== null ? String(input.review).trim() : "";

  if (!instructorId) {
    return {
      isValid: false,
      error: "Instructor identifier is required.",
      field: "instructorId",
    };
  }

  if (!classId) {
    return {
      isValid: false,
      error: "Class session identifier is required to verify class attendance.",
      field: "classId",
    };
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return {
      isValid: false,
      error: "Rating must be a whole number between 1 and 5 stars.",
      field: "rating",
    };
  }

  return {
    isValid: true,
    normalized: {
      instructorId,
      classId,
      rating: Math.round(rating),
      review,
    },
  };
}

/**
 * Builds the exact request payload expected by PUT /instructor/rating/{institution}.
 * Never sends stale, unverified, or mismatched state.
 */
export function buildRatingPayload({
  instructorId,
  classId,
  rating,
  review = "",
  instructor = {},
  user = {},
}) {
  const validation = validateRatingInput({ instructorId, classId, rating, review });
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { normalized } = validation;

  return {
    instructorId: normalized.instructorId,
    classId: normalized.classId,
    rating: normalized.rating,
    review: normalized.review,
    instructorEmailId: instructor?.emailId || instructor?.instructorEmailId || "",
    instructorName: instructor?.name || instructor?.instructorName || "",
    userEmailId: user?.emailId || "",
    userName: user?.userName || "",
  };
}

/**
 * Interprets the authoritative response returned by the backend rating endpoint.
 *
 * Backend response types:
 * 1. New Rating Created: { isCreated: true, rating: ..., updatedUser: ... } -> points awarded (+1)
 * 2. Duplicate Submission: { isDuplicate: true, rating: ... } -> points NOT awarded (+0)
 * 3. Rating Edit/Update: { isUpdated: true, rating: ... } -> points NOT awarded (+0)
 */
export function interpretRatingResponse(res = {}) {
  if (res.isDuplicate) {
    return {
      type: "duplicate",
      isDuplicate: true,
      isUpdated: false,
      isCreated: false,
      shouldAwardPoints: false,
      pointsAwarded: 0,
      message: res.message || "Rating already submitted for this instructor/class.",
      rating: res.rating || null,
    };
  }

  if (res.isUpdated) {
    return {
      type: "updated",
      isDuplicate: false,
      isUpdated: true,
      isCreated: false,
      shouldAwardPoints: false,
      pointsAwarded: 0,
      message: res.message || "Rating updated successfully!",
      rating: res.rating || null,
    };
  }

  // Initial valid creation (isCreated: true)
  const ratingPointsAwarded = res.updatedUser?.Attributes?.rating_points !== undefined
    ? Number(res.updatedUser.Attributes.rating_points)
    : null;

  return {
    type: "created",
    isDuplicate: false,
    isUpdated: false,
    isCreated: true,
    shouldAwardPoints: true,
    pointsAwarded: 1,
    authoritativePoints: ratingPointsAwarded,
    message: res.message || "Rating submitted successfully!",
    rating: res.rating || null,
    updatedUser: res.updatedUser || null,
  };
}

/**
 * Parses and classifies API errors from Amplify or fetch operations without
 * exposing raw internals, stack traces, or credentials to users.
 */
export function parseRatingError(error) {
  const statusCode =
    error?.statusCode ||
    error?.response?.statusCode ||
    (error?.status ? Number(error.status) : 500);

  const rawMessage =
    error?.backendMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.errorBody?.error ||
    error?.errorBody?.message ||
    error?.message ||
    "";

  // Check for HP151 Attendance eligibility rejection (HTTP 403)
  if (statusCode === 403 || rawMessage.toLowerCase().includes("attended") || rawMessage.toLowerCase().includes("attendance")) {
    const friendlyMessage = rawMessage && !rawMessage.startsWith("Error:")
      ? rawMessage.replace(/^Rating not allowed:\s*/i, "")
      : "You must attend this class before submitting a rating.";

    return {
      statusCode: 403,
      isAttendanceError: true,
      isAuthError: false,
      isValidationError: false,
      isServerError: false,
      friendlyMessage: `Attendance Required: ${friendlyMessage}`,
      rawMessage,
    };
  }

  // Authentication error (HTTP 401)
  if (statusCode === 401 || rawMessage.toLowerCase().includes("not authorized") || rawMessage.toLowerCase().includes("identity required")) {
    return {
      statusCode: 401,
      isAttendanceError: false,
      isAuthError: true,
      isValidationError: false,
      isServerError: false,
      friendlyMessage: "Your session has expired or is unauthorized. Please sign in again.",
      rawMessage,
    };
  }

  // Validation error (HTTP 400)
  if (statusCode === 400) {
    return {
      statusCode: 400,
      isAttendanceError: false,
      isAuthError: false,
      isValidationError: true,
      isServerError: false,
      friendlyMessage: rawMessage || "Invalid rating details. Please check your submission.",
      rawMessage,
    };
  }

  // Server error (HTTP 500)
  if (statusCode >= 500) {
    return {
      statusCode: 500,
      isAttendanceError: false,
      isAuthError: false,
      isValidationError: false,
      isServerError: true,
      friendlyMessage: "The rating service is temporarily unavailable. Please try again shortly.",
      rawMessage,
    };
  }

  // Network or other unexpected failure
  return {
    statusCode,
    isAttendanceError: false,
    isAuthError: false,
    isValidationError: false,
    isServerError: false,
    friendlyMessage: rawMessage || "Network connection issue. Please check your connection and try again.",
    rawMessage,
  };
}

/**
 * Idempotently reconciles an updated rating into an existing ratings list.
 * Matches exact identity: (instructorId, classId, userId).
 */
export function reconcileRatingList(currentRatings = [], updatedRating = {}) {
  if (!updatedRating || !updatedRating.instructorId) {
    return Array.isArray(currentRatings) ? currentRatings : [];
  }

  const list = Array.isArray(currentRatings) ? [...currentRatings] : [];
  const targetInst = String(updatedRating.instructorId).trim();
  const targetClass = updatedRating.classId ? String(updatedRating.classId).trim() : "";
  const targetUser = updatedRating.userId ? String(updatedRating.userId).trim() : "";

  const idx = list.findIndex((r) => {
    const matchInst = r.instructorId && String(r.instructorId).trim() === targetInst;
    const matchUser = !targetUser || (r.userId && String(r.userId).trim() === targetUser);
    const matchClass = (!targetClass && !r.classId) || (r.classId && String(r.classId).trim() === targetClass);
    return matchInst && matchUser && matchClass;
  });

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updatedRating };
    return list;
  }

  return [updatedRating, ...list];
}

/**
 * Locates an existing rating for a member and exact instructor / class.
 */
export function findExistingRating(ratingsList = [], { instructorId, classId, userId, userEmailId } = {}) {
  if (!Array.isArray(ratingsList) || !instructorId) return null;

  const targetInst = String(instructorId).trim();
  const targetClass = classId ? String(classId).trim() : "";
  const targetUser = userId ? String(userId).trim() : "";
  const targetEmail = userEmailId ? String(userEmailId).toLowerCase().trim() : "";

  return (
    ratingsList.find((r) => {
      const matchInst = r.instructorId && String(r.instructorId).trim() === targetInst;
      const matchClass = !targetClass || (r.classId && String(r.classId).trim() === targetClass);
      const matchUser =
        (targetUser && r.userId && String(r.userId).trim() === targetUser) ||
        (targetEmail && r.userEmailId && String(r.userEmailId).toLowerCase().trim() === targetEmail);
      return matchInst && matchClass && matchUser;
    }) || null
  );
}

/**
 * Extracts a numeric epoch timestamp from a rating object.
 * Supports timestampMs, createdAt, numeric timestamp, and composite DynamoDB
 * sort keys ('${epoch}-${userId}'). Returns 0 if no valid timestamp found.
 */
export function extractRatingTimestamp(ratingOrTimestamp) {
  if (!ratingOrTimestamp) return 0;

  // Direct number passed
  if (typeof ratingOrTimestamp === "number" && !isNaN(ratingOrTimestamp) && ratingOrTimestamp > 0) {
    return ratingOrTimestamp < 1e11 ? ratingOrTimestamp * 1000 : ratingOrTimestamp;
  }

  // Direct string passed (e.g. composite "1729000000000-cognitoId", ISO string, or numeric string)
  if (typeof ratingOrTimestamp === "string") {
    const trimmed = ratingOrTimestamp.trim();
    if (trimmed.includes("-")) {
      const parts = trimmed.split("-");
      const epoch = parseInt(parts[0], 10);
      if (!isNaN(epoch) && epoch > 1e11) {
        return epoch;
      }
      if (!isNaN(epoch) && epoch > 1e9 && parts[0].length === 10) {
        return epoch * 1000;
      }
    }
    const parsedDate = Date.parse(trimmed);
    if (!isNaN(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }
    const num = Number(trimmed);
    if (!isNaN(num) && num > 0) {
      return num < 1e11 ? num * 1000 : num;
    }
    return 0;
  }

  const rating = ratingOrTimestamp;
  if (typeof rating.timestampMs === "number" && !isNaN(rating.timestampMs) && rating.timestampMs > 0) {
    return rating.timestampMs < 1e11 ? rating.timestampMs * 1000 : rating.timestampMs;
  }
  if (typeof rating.createdAt === "number" && !isNaN(rating.createdAt) && rating.createdAt > 0) {
    return rating.createdAt < 1e11 ? rating.createdAt * 1000 : rating.createdAt;
  }
  if (typeof rating.timestamp === "number" && !isNaN(rating.timestamp) && rating.timestamp > 0) {
    return rating.timestamp < 1e11 ? rating.timestamp * 1000 : rating.timestamp;
  }
  if (typeof rating.timestamp === "string") {
    return extractRatingTimestamp(rating.timestamp);
  }
  return 0;
}


/**
 * Deterministically sorts ratings in descending chronological order.
 * Uses extractRatingTimestamp for numerical comparison (avoiding NaN comparisons
 * on composite string sort keys), and breaks ties deterministically.
 */
export function sortRatingsChronologically(ratings = []) {
  if (!Array.isArray(ratings)) return [];

  return [...ratings].sort((a, b) => {
    const tA = extractRatingTimestamp(a);
    const tB = extractRatingTimestamp(b);
    if (tB !== tA) {
      return tB - tA;
    }
    // Deterministic tie-breaker
    const idA = String(a.timestamp || a.classId || a.userId || "");
    const idB = String(b.timestamp || b.classId || b.userId || "");
    return idB.localeCompare(idA);
  });
}

/**
 * Filters ratings based on the current user's role while preserving backend institution boundaries.
 * - Admin: sees all institution ratings.
 * - Instructor: sees ratings for classes/instructors matching their cognitoId or emailId.
 * - Member: sees ratings they submitted.
 */
export function filterRatingsByRole(ratings = [], user = {}) {
  if (!Array.isArray(ratings)) return [];
  if (!user || !user.userType) return [];

  const userType = String(user.userType).toLowerCase().trim();
  const currentCognitoId = user.cognitoId ? String(user.cognitoId).trim() : "";
  const currentEmail = user.emailId ? String(user.emailId).toLowerCase().trim() : "";

  if (userType === "admin") {
    return ratings;
  }

  if (userType === "instructor") {
    return ratings.filter((rating) => {
      const instructorId = String(rating?.instructorId || rating?.instructorCognitoId || "").trim();
      const instructorEmail = String(rating?.instructorEmailId || "").toLowerCase().trim();
      return (
        (instructorId && instructorId === currentCognitoId) ||
        (instructorEmail && instructorEmail === currentEmail)
      );
    });
  }

  if (userType === "member") {
    return ratings.filter((rating) => {
      const ratingEmail = String(rating?.userEmailId || rating?.emailId || "").toLowerCase().trim();
      const ratingUserId = String(rating?.userId || rating?.cognitoId || "").trim();
      return (
        (ratingEmail && ratingEmail === currentEmail) ||
        (ratingUserId && ratingUserId === currentCognitoId)
      );
    });
  }

  return [];
}

/**
 * Groups ratings by date for instructor average ratings table.
 * Uses safe numeric epoch extracted from each rating.
 */
export function groupRatingsByDate(ratings = [], dateLocale = "en-US") {
  if (!Array.isArray(ratings)) return {};

  const ratingsByDate = {};
  for (const rating of ratings) {
    const epoch = extractRatingTimestamp(rating);
    const dateLabel = epoch > 0
      ? new Date(epoch).toLocaleDateString(dateLocale)
      : "Unknown Date";

    if (!ratingsByDate[dateLabel]) {
      ratingsByDate[dateLabel] = [];
    }
    const score = Number(rating.rating);
    if (Number.isFinite(score) && score >= 1 && score <= 5) {
      ratingsByDate[dateLabel].push(score);
    }
  }

  const averageRatings = {};
  for (const date in ratingsByDate) {
    const scores = ratingsByDate[date];
    const total = scores.reduce((sum, val) => sum + val, 0);
    averageRatings[date] = scores.length > 0 ? total / scores.length : 0;
  }

  return averageRatings;
}

/**
 * Safe member display name extractor to prevent runtime TypeErrors
 * when optional user names are missing.
 */
export function formatMemberDisplayName(rating) {
  if (!rating) return "Member";
  if (rating.userName && typeof rating.userName === "string" && rating.userName.trim().length > 0) {
    return rating.userName.trim().split(" ")[0];
  }
  return rating.userId || "Member";
}

/**
 * Safe instructor display name extractor.
 */
export function formatInstructorDisplayName(rating) {
  if (!rating) return "Instructor";
  if (rating.instructorName && typeof rating.instructorName === "string" && rating.instructorName.trim().length > 0) {
    return rating.instructorName.trim();
  }
  return "Instructor";
}

